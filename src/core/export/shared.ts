import path from 'node:path';
import { TaskPackSchema, type TaskPack } from '../schema/index.js';
import { readJsonFile, writeTextFile } from '../utils/filesystem.js';
import { findRepositoryRoot, normalizeRelativePath, resolveFromRoot, slugify } from '../utils/paths.js';

export interface TaskPackExportContext {
  rootDir: string;
  absoluteInputPath: string;
  taskPack: TaskPack;
}

export interface ExportTaskPackMarkdownOptions {
  rootDir?: string;
  input: string;
  output?: string;
  defaultOutputDir: string;
  render: (taskPack: TaskPack) => string;
}

export interface ExportTaskPackMarkdownResult {
  outputPath: string;
  content: string;
  taskPack: TaskPack;
}

export async function loadTaskPackExportContext(
  options: Pick<ExportTaskPackMarkdownOptions, 'rootDir' | 'input'>,
): Promise<TaskPackExportContext> {
  const rootDir = options.rootDir ? await findRepositoryRoot(options.rootDir) : await findRepositoryRoot(process.cwd());
  const absoluteInputPath = path.resolve(rootDir, options.input);
  const taskPack = TaskPackSchema.parse(await readJsonFile<TaskPack>(absoluteInputPath));

  return {
    rootDir,
    absoluteInputPath,
    taskPack,
  };
}

export function resolveTaskPackOutputPath(
  context: TaskPackExportContext,
  options: {
    output?: string;
    defaultOutputDir: string;
    extension?: string;
  },
): string {
  return options.output
    ? path.resolve(context.rootDir, options.output)
    : resolveFromRoot(
      context.rootDir,
      `${options.defaultOutputDir}/${resolveExportFileName(
        context.taskPack,
        context.absoluteInputPath,
        options.extension ?? '.md',
      )}`,
    );
}

export function renderTaskPackSourceContext(taskPack: TaskPack): string[] {
  const lines: string[] = [];

  if (taskPack.sourceType === 'markdown_file') {
    lines.push(`- Markdown task file: \`${taskPack.sourceTaskPath}\``);
  } else if (taskPack.sourceType === 'github_issue') {
    lines.push(`- GitHub issue: \`${taskPack.sourceRef}\``);
  } else {
    lines.push(`- GitHub issue JSON: \`${taskPack.sourceTaskPath}\``);
    if (taskPack.sourceRef !== taskPack.sourceTaskPath) {
      lines.push(`- Issue ref: \`${taskPack.sourceRef}\``);
    }
  }

  if (taskPack.sourceTitle && taskPack.sourceTitle !== taskPack.title) {
    lines.push(`- Source title: ${taskPack.sourceTitle}`);
  }

  if (taskPack.sourceLabels.length > 0) {
    lines.push(`- Labels: ${taskPack.sourceLabels.map((item) => `\`${item}\``).join(', ')}`);
  }

  if (taskPack.sourceUrl) {
    lines.push(`- URL: ${taskPack.sourceUrl}`);
  }

  return lines;
}

export async function exportTaskPackMarkdown(
  options: ExportTaskPackMarkdownOptions,
): Promise<ExportTaskPackMarkdownResult> {
  const context = await loadTaskPackExportContext(options);
  const outputPath = resolveTaskPackOutputPath(context, {
    output: options.output,
    defaultOutputDir: options.defaultOutputDir,
  });
  const content = options.render(context.taskPack);

  await writeTextFile(outputPath, `${content}\n`);

  return {
    outputPath,
    content,
    taskPack: context.taskPack,
  };
}

function resolveExportFileName(taskPack: TaskPack, absoluteInputPath: string, extension: string): string {
  const fallbackId = normalizeRelativePath(path.basename(absoluteInputPath, '.json'));
  const slug = slugify(taskPack.taskId || fallbackId) || slugify(fallbackId) || 'task-pack';
  return `${slug}${extension}`;
}
