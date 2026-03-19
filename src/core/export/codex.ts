import path from 'node:path';
import { DEFAULT_PROMPTS_DIR } from '../utils/constants.js';
import { readJsonFile, writeTextFile } from '../utils/filesystem.js';
import { findRepositoryRoot, normalizeRelativePath, resolveFromRoot, slugify } from '../utils/paths.js';
import { TaskPackSchema, type TaskPack } from '../schema/index.js';

export interface ExportCodexOptions {
  rootDir?: string;
  input: string;
  output?: string;
}

export function renderCodexPrompt(taskPack: TaskPack): string {
  const readFirst = ['AGENTS.md', ...taskPack.relevantFiles].slice(0, 8);

  return [
    `# ${taskPack.title}`,
    '',
    'Read `AGENTS.md` first. Keep changes minimal, task-scoped, and easy to verify.',
    '',
    '## Objective',
    '',
    taskPack.objective,
    '',
    '## Read First',
    '',
    ...readFirst.map((item) => `- \`${item}\``),
    '',
    '## Relevant Paths',
    '',
    ...(taskPack.relevantPaths.length > 0
      ? taskPack.relevantPaths.map((item) => `- \`${item}\``)
      : ['- Review the repository context to select the working area.']),
    '',
    '## Constraints',
    '',
    ...(taskPack.constraints.length > 0
      ? taskPack.constraints.map((item) => `- ${item}`)
      : ['- Preserve existing repository conventions.']),
    '',
    '## Validation',
    '',
    ...(taskPack.validationCommands.length > 0
      ? taskPack.validationCommands.map((item) => `- \`${item}\``)
      : ['- Define validation commands before implementation.']),
    '',
    '## Done When',
    '',
    ...(taskPack.doneWhen.length > 0 ? taskPack.doneWhen.map((item) => `- ${item}`) : ['- The task pack acceptance criteria are satisfied.']),
    '',
    '## Notes',
    '',
    ...(taskPack.assumptions.length > 0 ? taskPack.assumptions.map((item) => `- ${item}`) : ['- No extra assumptions recorded.']),
  ].join('\n');
}

export async function exportCodexPrompt(options: ExportCodexOptions): Promise<{
  outputPath: string;
  prompt: string;
  taskPack: TaskPack;
}> {
  const rootDir = options.rootDir ? await findRepositoryRoot(options.rootDir) : await findRepositoryRoot(process.cwd());
  const absoluteInputPath = path.resolve(rootDir, options.input);
  const taskPack = TaskPackSchema.parse(await readJsonFile<TaskPack>(absoluteInputPath));
  const outputPath = options.output
    ? path.resolve(rootDir, options.output)
    : resolveFromRoot(rootDir, `${DEFAULT_PROMPTS_DIR}/${slugify(taskPack.taskId || normalizeRelativePath(path.basename(absoluteInputPath, '.json')))}.md`);
  const prompt = renderCodexPrompt(taskPack);

  await writeTextFile(outputPath, `${prompt}\n`);

  return {
    outputPath,
    prompt,
    taskPack,
  };
}
