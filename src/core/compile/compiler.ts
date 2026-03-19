import path from 'node:path';
import { CONTEXT_FILE, DEFAULT_SCAN_MAX_DEPTH, TASK_PACK_DIR } from '../utils/constants.js';
import { readTextFile, tryReadTextFile, writeJsonFile, writeTextFile } from '../utils/filesystem.js';
import { findRepositoryRoot, normalizeRelativePath, relativeToRoot, resolveFromRoot, slugify } from '../utils/paths.js';
import { clampNumber, dedupeStrings, summarizeText } from '../utils/text.js';
import { nowIso } from '../utils/time.js';
import { scanRepository } from '../scan/scanner.js';
import { RepoContextSchema, TaskPackSchema, type RepoContext, type TaskPack } from '../schema/index.js';
import { createProviderFromEnvironment, type TaskPackProvider } from '../providers/index.js';
import { parseTaskMarkdown } from './parser.js';
import { rankRelevantPaths } from './scorer.js';
import { renderTaskPackMarkdown } from './render.js';

export interface CompileTaskOptions {
  rootDir?: string;
  inputFile: string;
  title?: string;
  clock?: Date;
  provider?: TaskPackProvider | null;
}

async function loadRepoContext(rootDir: string, clock?: Date): Promise<RepoContext> {
  const contextPath = resolveFromRoot(rootDir, CONTEXT_FILE);
  const storedContext = await tryReadTextFile(contextPath);
  if (storedContext) {
    return RepoContextSchema.parse(JSON.parse(storedContext));
  }

  return scanRepository({ rootDir, maxDepth: DEFAULT_SCAN_MAX_DEPTH, clock });
}

async function readAgentsConstraints(rootDir: string): Promise<string[]> {
  const agentsPath = resolveFromRoot(rootDir, 'AGENTS.md');
  const agentsMarkdown = await tryReadTextFile(agentsPath);
  if (!agentsMarkdown) {
    return [];
  }

  return agentsMarkdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace(/^-\s+/, '').trim())
    .filter((line) => line.length > 0)
    .slice(0, 12);
}

function mergeArray(base: string[], enhancement: string[] | undefined): string[] {
  return dedupeStrings([...base, ...(enhancement ?? [])]);
}

function buildHeuristicPlan(title: string, relevantPaths: string[]): string[] {
  const firstPath = relevantPaths[0];

  return dedupeStrings([
    firstPath
      ? `Inspect ${firstPath} and the nearest related configuration before editing.`
      : 'Inspect the highest-signal files before editing.',
    `Implement the smallest change set needed to complete "${title}".`,
    'Add or update tests that cover the requested behavior.',
    'Refresh documentation or generated guidance if the user-facing behavior changes.',
    'Run the listed validation commands before considering the task done.',
  ]);
}

function buildHeuristicDoneWhen(parsedDoneWhen: string[], validationCommands: string[]): string[] {
  if (parsedDoneWhen.length > 0) {
    return parsedDoneWhen;
  }

  return dedupeStrings([
    'The requested behavior is implemented with task-scoped changes.',
    validationCommands.length > 0 ? 'Validation commands pass.' : 'Validation commands are defined.',
    'Documentation is updated if behavior changed.',
  ]);
}

function buildAssumptions(context: RepoContext): string[] {
  const assumptions = [`Repository root is ${context.repo.root}.`];
  if (context.repo.packageManager) {
    assumptions.push(`Package manager is ${context.repo.packageManager}.`);
  }
  if (context.repo.detectedLanguages.length > 0) {
    assumptions.push(`Primary languages include ${context.repo.detectedLanguages.join(', ')}.`);
  }

  return assumptions;
}

export async function compileTask(options: CompileTaskOptions): Promise<{
  taskPack: TaskPack;
  jsonPath: string;
  markdownPath: string;
}> {
  const rootDir = options.rootDir
    ? await findRepositoryRoot(options.rootDir)
    : await findRepositoryRoot(process.cwd());
  const absoluteInputPath = path.resolve(rootDir, options.inputFile);
  const taskMarkdown = await readTextFile(absoluteInputPath);
  const fallbackTitle =
    options.title ?? slugify(path.basename(options.inputFile, path.extname(options.inputFile))).replace(/-/g, ' ');
  const parsedTask = parseTaskMarkdown(taskMarkdown, fallbackTitle);
  const repoContext = await loadRepoContext(rootDir, options.clock);
  const rankedPaths = rankRelevantPaths(taskMarkdown, parsedTask.referencedPaths, repoContext);
  const repoConstraints = await readAgentsConstraints(rootDir);
  const parsedValidationCommands = parsedTask.sections.validation?.bullets ?? [];
  const validationCommands = dedupeStrings([
    ...parsedValidationCommands,
    ...repoContext.commands.build,
    ...repoContext.commands.test,
    ...repoContext.commands.lint,
  ]).slice(0, 6);

  const heuristicTaskPack: TaskPack = TaskPackSchema.parse({
    taskId: slugify(options.title ?? parsedTask.title),
    title: options.title ?? parsedTask.title,
    objective: parsedTask.sections.objective?.text || summarizeText(parsedTask.summary, 200),
    userRequestSummary: summarizeText(parsedTask.summary || taskMarkdown, 320),
    sourceTaskPath: normalizeRelativePath(relativeToRoot(rootDir, absoluteInputPath)),
    relevantPaths: rankedPaths.relevantPaths,
    relevantFiles: rankedPaths.relevantFiles,
    possiblyRelatedPaths: rankedPaths.possiblyRelatedPaths,
    constraints: mergeArray(parsedTask.sections.constraints?.bullets ?? [], repoConstraints).slice(0, 12),
    assumptions: mergeArray(parsedTask.sections.assumptions?.bullets ?? [], buildAssumptions(repoContext)).slice(0, 8),
    risks: mergeArray(
      parsedTask.sections.risks?.bullets ?? [],
      rankedPaths.confidence < 0.55 ? ['Relevant path selection is heuristic and may need review.'] : [],
    ).slice(0, 8),
    validationCommands,
    doneWhen: buildHeuristicDoneWhen(parsedTask.sections.doneWhen?.bullets ?? [], validationCommands).slice(0, 8),
    implementationPlan: mergeArray(
      parsedTask.sections.implementationPlan?.bullets ?? [],
      buildHeuristicPlan(options.title ?? parsedTask.title, rankedPaths.relevantPaths),
    ).slice(0, 8),
    openQuestions: mergeArray(parsedTask.sections.openQuestions?.bullets ?? [], []).slice(0, 8),
    confidence: rankedPaths.confidence,
    provider: null,
    generatedAt: nowIso(options.clock),
  });

  const provider = options.provider ?? createProviderFromEnvironment();
  let finalTaskPack = heuristicTaskPack;

  if (provider) {
    try {
      const enhancement = await provider.enhance({
        repoContext,
        taskMarkdown,
        parsedTask: {
          title: heuristicTaskPack.title,
          summary: heuristicTaskPack.userRequestSummary,
          objective: heuristicTaskPack.objective,
          constraints: heuristicTaskPack.constraints,
          validationCommands: heuristicTaskPack.validationCommands,
          doneWhen: heuristicTaskPack.doneWhen,
        },
        heuristicTaskPack,
      });

      finalTaskPack = TaskPackSchema.parse({
        ...heuristicTaskPack,
        ...enhancement,
        relevantPaths: mergeArray(heuristicTaskPack.relevantPaths, enhancement.relevantPaths),
        relevantFiles: mergeArray(heuristicTaskPack.relevantFiles, enhancement.relevantFiles),
        possiblyRelatedPaths: mergeArray(
          heuristicTaskPack.possiblyRelatedPaths,
          enhancement.possiblyRelatedPaths,
        ),
        constraints: mergeArray(heuristicTaskPack.constraints, enhancement.constraints),
        assumptions: mergeArray(heuristicTaskPack.assumptions, enhancement.assumptions),
        risks: mergeArray(heuristicTaskPack.risks, enhancement.risks),
        validationCommands: mergeArray(
          heuristicTaskPack.validationCommands,
          enhancement.validationCommands,
        ).slice(0, 6),
        doneWhen: mergeArray(heuristicTaskPack.doneWhen, enhancement.doneWhen).slice(0, 8),
        implementationPlan: mergeArray(
          heuristicTaskPack.implementationPlan,
          enhancement.implementationPlan,
        ).slice(0, 8),
        openQuestions: mergeArray(heuristicTaskPack.openQuestions, enhancement.openQuestions).slice(0, 8),
        confidence: clampNumber(
          enhancement.confidence ?? heuristicTaskPack.confidence + 0.12,
          0,
          0.98,
        ),
        provider: provider.name,
      });
    } catch {
      finalTaskPack = TaskPackSchema.parse({
        ...heuristicTaskPack,
        risks: mergeArray(heuristicTaskPack.risks, [
          'Provider enhancement failed; review heuristic output carefully.',
        ]),
      });
    }
  }

  const baseOutputName = slugify(finalTaskPack.taskId || finalTaskPack.title);
  const jsonPath = resolveFromRoot(rootDir, `${TASK_PACK_DIR}/${baseOutputName}.json`);
  const markdownPath = resolveFromRoot(rootDir, `${TASK_PACK_DIR}/${baseOutputName}.md`);

  await writeJsonFile(jsonPath, finalTaskPack);
  await writeTextFile(markdownPath, `${renderTaskPackMarkdown(finalTaskPack)}\n`);

  return {
    taskPack: finalTaskPack,
    jsonPath,
    markdownPath,
  };
}
