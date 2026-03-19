import path from 'node:path';
import { CONTEXT_FILE, DEFAULT_SCAN_MAX_DEPTH, TASK_PACK_DIR } from '../utils/constants.js';
import { tryReadTextFile, writeJsonFile, writeTextFile } from '../utils/filesystem.js';
import { findRepositoryRoot, resolveFromRoot, slugify } from '../utils/paths.js';
import { clampNumber, dedupeStrings, summarizeText } from '../utils/text.js';
import { nowIso } from '../utils/time.js';
import { scanRepository } from '../scan/scanner.js';
import { RepoContextSchema, TaskPackSchema, type RepoContext, type TaskPack } from '../schema/index.js';
import { createProviderFromEnvironment, type TaskPackProvider } from '../providers/index.js';
import { parseTaskMarkdown } from './parser.js';
import { renderTaskPackMarkdown } from './render.js';
import { rankRelevantPaths } from './scorer.js';
import { loadCompileSource } from './source-loader.js';

export interface CompileTaskOptions {
  rootDir?: string;
  inputFile?: string;
  githubIssue?: string;
  githubIssueJson?: string;
  title?: string;
  clock?: Date;
  provider?: TaskPackProvider | null;
  fetchImpl?: typeof fetch;
  githubToken?: string | null;
}

function normalizeHeading(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
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

  const allowedSections = [
    'product boundaries',
    'cli ux rules',
    'output quality rules',
    'forbidden moves',
    'definition of done',
  ];

  let shouldCollect = false;
  const bullets: string[] = [];

  for (const line of agentsMarkdown.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    const headingMatch = trimmedLine.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      const normalized = normalizeHeading(headingMatch[1] ?? '');
      shouldCollect = allowedSections.some((section) => normalized.includes(section));
      continue;
    }

    if (shouldCollect && trimmedLine.startsWith('- ')) {
      bullets.push(trimmedLine.replace(/^-\s+/, '').trim());
    }
  }

  return bullets.slice(0, 12);
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
  const assumptions = ['Repository root is `.`.'];
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
  const source = await loadCompileSource({
    rootDir,
    inputFile: options.inputFile,
    githubIssue: options.githubIssue,
    githubIssueJson: options.githubIssueJson,
    fetchImpl: options.fetchImpl,
    githubToken: options.githubToken ?? process.env.GITHUB_TOKEN ?? null,
  });
  const parsedTask = parseTaskMarkdown(source.taskMarkdown, options.title ?? source.title);
  const repoContext = await loadRepoContext(rootDir, options.clock);
  const sourceParentPath =
    source.sourceTaskPath.includes('://') || path.posix.dirname(source.sourceTaskPath) === '.'
      ? null
      : path.posix.dirname(source.sourceTaskPath);
  const rankedPaths = rankRelevantPaths(source.taskMarkdown, parsedTask.referencedPaths, repoContext, [
    source.sourceTaskPath,
    ...(sourceParentPath ? [sourceParentPath] : []),
  ]);
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
    userRequestSummary: summarizeText(parsedTask.summary || source.taskMarkdown, 320),
    sourceTaskPath: source.sourceTaskPath,
    sourceType: source.type,
    sourceRef: source.ref,
    sourceTitle: source.title || parsedTask.title,
    sourceLabels: source.labels,
    sourceUrl: source.url,
    relevantPaths: rankedPaths.relevantPaths,
    relevantFiles: rankedPaths.relevantFiles,
    possiblyRelatedPaths: rankedPaths.possiblyRelatedPaths,
    constraints: mergeArray(parsedTask.sections.constraints?.bullets ?? [], repoConstraints).slice(0, 12),
    assumptions: mergeArray(
      parsedTask.sections.assumptions?.bullets ?? [],
      buildAssumptions(repoContext),
    ).slice(0, 8),
    risks: mergeArray(
      parsedTask.sections.risks?.bullets ?? [],
      rankedPaths.confidence < 0.55 ? ['Relevant path selection is heuristic and may need review.'] : [],
    ).slice(0, 8),
    validationCommands,
    doneWhen: buildHeuristicDoneWhen(
      parsedTask.sections.doneWhen?.bullets ?? [],
      validationCommands,
    ).slice(0, 8),
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
        taskMarkdown: source.taskMarkdown,
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
        confidence: clampNumber(enhancement.confidence ?? heuristicTaskPack.confidence + 0.12, 0, 0.98),
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
