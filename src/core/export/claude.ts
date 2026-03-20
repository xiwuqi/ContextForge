import { DEFAULT_CLAUDE_EXPORTS_DIR } from '../utils/constants.js';
import { type TaskPack } from '../schema/index.js';
import { exportTaskPackMarkdown, renderTaskPackSourceContext } from './shared.js';

export interface ExportClaudeOptions {
  rootDir?: string;
  input: string;
  output?: string;
}

export function renderClaudePrompt(taskPack: TaskPack): string {
  const sourceContext = renderTaskPackSourceContext(taskPack);
  const relevantPaths = taskPack.relevantPaths.length > 0
    ? taskPack.relevantPaths.map((item) => `- \`${item}\``)
    : ['- Review the repository context to choose the working area.'];
  const possiblyRelated = taskPack.possiblyRelatedPaths.slice(0, 4);
  const keyFiles = taskPack.relevantFiles.slice(0, 8);
  const risks = taskPack.risks.length > 0
    ? taskPack.risks.map((item) => `- ${item}`)
    : ['- No major risks were recorded; verify assumptions against the repository before editing.'];
  const implementationOrder = taskPack.implementationPlan.length > 0
    ? taskPack.implementationPlan.map((item) => `- ${item}`)
    : [
        '- Read `AGENTS.md` and inspect the key files above before editing.',
        '- Implement the smallest task-scoped change that satisfies the objective.',
        '- Run the validation commands and confirm the done criteria.',
      ];

  return [
    `# ${taskPack.title}`,
    '',
    '## Objective',
    '',
    taskPack.objective,
    '',
    '## Source Context',
    '',
    ...sourceContext,
    '',
    '## Relevant Paths',
    '',
    ...relevantPaths,
    ...(possiblyRelated.length > 0 ? [`- Possibly related: ${possiblyRelated.map((item) => `\`${item}\``).join(', ')}`] : []),
    '',
    '## Key Files',
    '',
    ...(keyFiles.length > 0
      ? keyFiles.map((item) => `- \`${item}\``)
      : ['- No key files were preselected; start from the relevant paths above.']),
    '',
    '## Constraints',
    '',
    ...(taskPack.constraints.length > 0
      ? taskPack.constraints.map((item) => `- ${item}`)
      : ['- Preserve the existing repository conventions.']),
    '',
    '## Risks / Watchouts',
    '',
    ...risks,
    '',
    '## Validation Commands',
    '',
    ...(taskPack.validationCommands.length > 0
      ? taskPack.validationCommands.map((item) => `- \`${item}\``)
      : ['- Add concrete validation commands before implementation.']),
    '',
    '## Done When',
    '',
    ...(taskPack.doneWhen.length > 0
      ? taskPack.doneWhen.map((item) => `- ${item}`)
      : ['- The task pack acceptance criteria are satisfied.']),
    '',
    '## Suggested Implementation Order',
    '',
    ...implementationOrder,
  ].join('\n');
}

export async function exportClaudePrompt(options: ExportClaudeOptions): Promise<{
  outputPath: string;
  prompt: string;
  taskPack: TaskPack;
}> {
  const result = await exportTaskPackMarkdown({
    rootDir: options.rootDir,
    input: options.input,
    output: options.output,
    defaultOutputDir: DEFAULT_CLAUDE_EXPORTS_DIR,
    render: renderClaudePrompt,
  });

  return {
    outputPath: result.outputPath,
    prompt: result.content,
    taskPack: result.taskPack,
  };
}
