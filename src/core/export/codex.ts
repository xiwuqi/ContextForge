import { DEFAULT_PROMPTS_DIR } from '../utils/constants.js';
import { type TaskPack } from '../schema/index.js';
import { exportTaskPackMarkdown } from './shared.js';

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
  const result = await exportTaskPackMarkdown({
    rootDir: options.rootDir,
    input: options.input,
    output: options.output,
    defaultOutputDir: DEFAULT_PROMPTS_DIR,
    render: renderCodexPrompt,
  });

  return {
    outputPath: result.outputPath,
    prompt: result.content,
    taskPack: result.taskPack,
  };
}
