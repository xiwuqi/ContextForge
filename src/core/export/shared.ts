import path from 'node:path';
import { TaskPackSchema, type TaskPack } from '../schema/index.js';
import { readJsonFile, writeTextFile } from '../utils/filesystem.js';
import { findRepositoryRoot, normalizeRelativePath, resolveFromRoot, slugify } from '../utils/paths.js';

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

export async function exportTaskPackMarkdown(
  options: ExportTaskPackMarkdownOptions,
): Promise<ExportTaskPackMarkdownResult> {
  const rootDir = options.rootDir ? await findRepositoryRoot(options.rootDir) : await findRepositoryRoot(process.cwd());
  const absoluteInputPath = path.resolve(rootDir, options.input);
  const taskPack = TaskPackSchema.parse(await readJsonFile<TaskPack>(absoluteInputPath));
  const outputPath = options.output
    ? path.resolve(rootDir, options.output)
    : resolveFromRoot(rootDir, `${options.defaultOutputDir}/${resolveExportFileName(taskPack, absoluteInputPath)}`);
  const content = options.render(taskPack);

  await writeTextFile(outputPath, `${content}\n`);

  return {
    outputPath,
    content,
    taskPack,
  };
}

function resolveExportFileName(taskPack: TaskPack, absoluteInputPath: string): string {
  const fallbackId = normalizeRelativePath(path.basename(absoluteInputPath, '.json'));
  const slug = slugify(taskPack.taskId || fallbackId) || slugify(fallbackId) || 'task-pack';
  return `${slug}.md`;
}
