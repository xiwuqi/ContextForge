import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { AGENTS_SUGGESTED_FILE, CONTEXT_FILE, CONTEXT_MARKDOWN_FILE, DEFAULT_SCAN_MAX_DEPTH, TASK_PACK_DIR } from '../utils/constants.js';
import { isDirectory, isFile, pathExists, readJsonFile, tryReadTextFile } from '../utils/filesystem.js';
import { findRepositoryRoot, normalizeRelativePath, resolveFromRoot } from '../utils/paths.js';
import { stripGeneratedAtLines, nowIso } from '../utils/time.js';
import {
  LintReportSchema,
  RepoContextSchema,
  TaskPackSchema,
  type LintIssue,
  type LintReport,
  type RepoContext,
  type TaskPack,
} from '../schema/index.js';
import { scanRepository } from '../scan/scanner.js';
import { renderContextMarkdown, renderSuggestedAgents } from '../scan/render.js';
import { validateCommand } from './command-validation.js';

export interface LintOptions {
  rootDir?: string;
  strict?: boolean;
  clock?: Date;
}

function pushIssue(issues: LintIssue[], issue: LintIssue): void {
  issues.push(issue);
}

function normalizedContext(context: RepoContext): Omit<RepoContext, 'generatedAt'> & { generatedAt: string } {
  return {
    ...context,
    generatedAt: '',
  };
}

async function lintReferencedPaths(issues: LintIssue[], rootDir: string, taskPack: TaskPack, artifact: string): Promise<void> {
  for (const relativePath of taskPack.relevantFiles) {
    const absolutePath = resolveFromRoot(rootDir, relativePath);
    if (!(await isFile(absolutePath))) {
      pushIssue(issues, {
        code: 'missing-file',
        severity: 'error',
        message: `Referenced file does not exist: ${relativePath}`,
        artifact,
        path: normalizeRelativePath(relativePath),
        command: null,
      });
    }
  }

  for (const relativePath of [...taskPack.relevantPaths, ...taskPack.possiblyRelatedPaths]) {
    const absolutePath = resolveFromRoot(rootDir, relativePath);
    if (!(await pathExists(absolutePath))) {
      pushIssue(issues, {
        code: 'missing-path',
        severity: 'warning',
        message: `Referenced path does not exist: ${relativePath}`,
        artifact,
        path: normalizeRelativePath(relativePath),
        command: null,
      });
    }
  }
}

async function lintTaskPack(issues: LintIssue[], rootDir: string, artifact: string): Promise<void> {
  let taskPack: TaskPack;
  try {
    taskPack = TaskPackSchema.parse(await readJsonFile<TaskPack>(artifact));
  } catch (error) {
    pushIssue(issues, {
      code: 'invalid-task-pack',
      severity: 'error',
      message: `Task pack could not be parsed: ${error instanceof Error ? error.message : 'unknown error'}`,
      artifact: normalizeRelativePath(path.relative(rootDir, artifact)),
      path: null,
      command: null,
    });
    return;
  }

  const relativeArtifactPath = normalizeRelativePath(path.relative(rootDir, artifact));
  await lintReferencedPaths(issues, rootDir, taskPack, relativeArtifactPath);

  if (taskPack.validationCommands.length === 0) {
    pushIssue(issues, {
      code: 'missing-validation',
      severity: 'error',
      message: 'Task pack is missing validation commands.',
      artifact: relativeArtifactPath,
      path: null,
      command: null,
    });
  }

  if (taskPack.doneWhen.length === 0) {
    pushIssue(issues, {
      code: 'missing-done-when',
      severity: 'error',
      message: 'Task pack is missing done criteria.',
      artifact: relativeArtifactPath,
      path: null,
      command: null,
    });
  }

  for (const command of taskPack.validationCommands) {
    const validation = await validateCommand(command, rootDir);
    if (validation.canValidate && !validation.valid) {
      pushIssue(issues, {
        code: 'invalid-command',
        severity: 'error',
        message: `Validation command could not be validated: ${command}${validation.reason ? ` (${validation.reason})` : ''}`,
        artifact: relativeArtifactPath,
        path: null,
        command,
      });
    }
  }
}

async function lintGeneratedGuidance(issues: LintIssue[], rootDir: string, clock?: Date): Promise<void> {
  const currentContext = await scanRepository({ rootDir, maxDepth: DEFAULT_SCAN_MAX_DEPTH, clock });
  const storedContextRaw = await tryReadTextFile(resolveFromRoot(rootDir, CONTEXT_FILE));
  if (storedContextRaw) {
    try {
      const storedContext = RepoContextSchema.parse(JSON.parse(storedContextRaw));
      if (JSON.stringify(normalizedContext(storedContext)) !== JSON.stringify(normalizedContext(currentContext))) {
        pushIssue(issues, {
          code: 'stale-context',
          severity: 'warning',
          message: 'Stored .contextforge/context.json no longer matches the current repository scan.',
          artifact: CONTEXT_FILE,
          path: null,
          command: null,
        });
      }
    } catch (error) {
      pushIssue(issues, {
        code: 'invalid-context',
        severity: 'error',
        message: `Stored context.json could not be parsed: ${error instanceof Error ? error.message : 'unknown error'}`,
        artifact: CONTEXT_FILE,
        path: null,
        command: null,
      });
    }
  }

  const storedContextMarkdown = await tryReadTextFile(resolveFromRoot(rootDir, CONTEXT_MARKDOWN_FILE));
  if (storedContextMarkdown) {
    const expectedMarkdown = renderContextMarkdown(currentContext);
    if (stripGeneratedAtLines(storedContextMarkdown) !== stripGeneratedAtLines(expectedMarkdown)) {
      pushIssue(issues, {
        code: 'stale-guidance',
        severity: 'warning',
        message: 'Stored .contextforge/context.md no longer matches the current repository scan.',
        artifact: CONTEXT_MARKDOWN_FILE,
        path: null,
        command: null,
      });
    }
  }

  const storedAgentsSuggestion = await tryReadTextFile(resolveFromRoot(rootDir, AGENTS_SUGGESTED_FILE));
  if (storedAgentsSuggestion) {
    const expectedAgentsSuggestion = renderSuggestedAgents(currentContext);
    if (storedAgentsSuggestion.trim() !== expectedAgentsSuggestion.trim()) {
      pushIssue(issues, {
        code: 'stale-guidance',
        severity: 'warning',
        message: 'Stored .contextforge/agents.suggested.md no longer matches the current repository scan.',
        artifact: AGENTS_SUGGESTED_FILE,
        path: null,
        command: null,
      });
    }
  }
}

export async function lintRepository(options: LintOptions = {}): Promise<LintReport> {
  const rootDir = options.rootDir ? await findRepositoryRoot(options.rootDir) : await findRepositoryRoot(process.cwd());
  const issues: LintIssue[] = [];

  await lintGeneratedGuidance(issues, rootDir, options.clock);

  const taskPackDirectory = resolveFromRoot(rootDir, TASK_PACK_DIR);
  if (await isDirectory(taskPackDirectory)) {
    const taskPackFiles = (await readdir(taskPackDirectory))
      .filter((fileName) => fileName.endsWith('.json'))
      .map((fileName) => path.join(taskPackDirectory, fileName));

    for (const taskPackFile of taskPackFiles) {
      await lintTaskPack(issues, rootDir, taskPackFile);
    }
  }

  const report: LintReport = {
    issues,
    summary: {
      errorCount: issues.filter((issue) => issue.severity === 'error').length,
      warningCount: issues.filter((issue) => issue.severity === 'warning').length,
    },
    generatedAt: nowIso(options.clock),
  };

  return LintReportSchema.parse(report);
}
