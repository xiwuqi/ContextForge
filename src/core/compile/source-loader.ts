import path from 'node:path';
import { readTextFile } from '../utils/filesystem.js';
import { normalizeRelativePath, relativeToRoot } from '../utils/paths.js';
import { fetchGitHubIssueSource, loadGitHubIssueJsonSource } from './github-issues.js';
import { parseTaskMarkdown } from './parser.js';
import type { NormalizedTaskSource } from './source-types.js';

export interface CompileSourceSelection {
  inputFile?: string;
  githubIssue?: string;
  githubIssueJson?: string;
}

export interface LoadCompileSourceOptions extends CompileSourceSelection {
  rootDir: string;
  fetchImpl?: typeof fetch;
  githubToken?: string | null;
}

export class CompileSourceLoadError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'CompileSourceLoadError';
  }
}

function formatCompileSourceFlags(): string {
  return [
    'Provide exactly one compile source:',
    '- `--input <markdown-file>`',
    '- `--github-issue <url|owner/repo#number>`',
    '- `--github-issue-json <path>`',
  ].join('\n');
}

export function validateCompileSourceSelection(
  selection: CompileSourceSelection,
): { kind: 'inputFile' | 'githubIssue' | 'githubIssueJson'; value: string } {
  const provided = [
    { kind: 'inputFile' as const, value: selection.inputFile?.trim() },
    { kind: 'githubIssue' as const, value: selection.githubIssue?.trim() },
    { kind: 'githubIssueJson' as const, value: selection.githubIssueJson?.trim() },
  ].filter((entry) => Boolean(entry.value));

  if (provided.length === 0) {
    throw new CompileSourceLoadError(formatCompileSourceFlags());
  }

  if (provided.length > 1) {
    throw new CompileSourceLoadError(
      ['Received multiple compile source flags.', formatCompileSourceFlags()].join('\n'),
    );
  }

  const selectedSource = provided[0];
  if (!selectedSource?.value) {
    throw new CompileSourceLoadError(formatCompileSourceFlags());
  }

  return {
    kind: selectedSource.kind,
    value: selectedSource.value,
  };
}

function inferMarkdownSourceTitle(markdown: string, inputPath: string): string {
  const fallbackTitle = path.basename(inputPath, path.extname(inputPath)).replace(/[-_]+/g, ' ');
  return parseTaskMarkdown(markdown, fallbackTitle).title;
}

async function loadMarkdownFileSource(
  rootDir: string,
  inputFile: string,
): Promise<NormalizedTaskSource> {
  const absoluteInputPath = path.resolve(rootDir, inputFile);
  const taskMarkdown = await readTextFile(absoluteInputPath);
  const sourceTaskPath = normalizeRelativePath(relativeToRoot(rootDir, absoluteInputPath));

  return {
    type: 'markdown_file',
    ref: sourceTaskPath,
    title: inferMarkdownSourceTitle(taskMarkdown, inputFile),
    labels: [],
    url: null,
    taskMarkdown,
    sourceTaskPath,
  };
}

export async function loadCompileSource(
  options: LoadCompileSourceOptions,
): Promise<NormalizedTaskSource> {
  const selection = validateCompileSourceSelection(options);

  try {
    switch (selection.kind) {
      case 'inputFile':
        return await loadMarkdownFileSource(options.rootDir, selection.value);
      case 'githubIssue':
        return await fetchGitHubIssueSource({
          issue: selection.value,
          fetchImpl: options.fetchImpl,
          githubToken: options.githubToken,
        });
      case 'githubIssueJson':
        return await loadGitHubIssueJsonSource(options.rootDir, selection.value);
    }
  } catch (error) {
    if (error instanceof CompileSourceLoadError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown source loading failure';
    throw new CompileSourceLoadError(message);
  }
}
