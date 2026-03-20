import path from 'node:path';
import { type TaskPack } from '../schema/index.js';
import { DEFAULT_CURSOR_EXPORTS_DIR } from '../utils/constants.js';
import { writeTextFile } from '../utils/filesystem.js';
import { normalizeRelativePath, pathLooksLikeFile } from '../utils/paths.js';
import {
  loadTaskPackExportContext,
  renderTaskPackSourceContext,
  resolveTaskPackOutputPath,
} from './shared.js';

export interface ExportCursorOptions {
  rootDir?: string;
  input: string;
  output?: string;
  ruleOutput?: string;
}

export interface ExportCursorResult {
  outputPath: string;
  prompt: string;
  taskPack: TaskPack;
  ruleOutputPath?: string;
  ruleSuggestion?: string;
}

export function renderCursorPrompt(taskPack: TaskPack): string {
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
        '- Keep the change set small and task-scoped.',
        '- Run the validation commands and confirm the done criteria before stopping.',
      ];

  return [
    `# ${taskPack.title}`,
    '',
    'Use this brief with Cursor Agent. Keep edits scoped, path-specific, and easy to verify.',
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

export function renderCursorRuleSuggestion(taskPack: TaskPack): string {
  const globs = inferCursorRuleGlobs(taskPack.relevantPaths);
  const body = [
    `Keep work scoped to "${taskPack.title}".`,
    '',
    `Objective: ${taskPack.objective}`,
    '',
    ...(taskPack.relevantPaths.length > 0
      ? [
        'Prefer edits in:',
        ...taskPack.relevantPaths.slice(0, 4).map((item) => `- \`${item}\``),
        '',
      ]
      : []),
    ...(taskPack.constraints.length > 0
      ? [
        'Respect these constraints:',
        ...taskPack.constraints.slice(0, 4).map((item) => `- ${item}`),
        '',
      ]
      : []),
    ...(taskPack.validationCommands.length > 0
      ? [
        'Validate with:',
        ...taskPack.validationCommands.map((item) => `- \`${item}\``),
        '',
      ]
      : []),
    ...(taskPack.doneWhen.length > 0
      ? [
        'Stop when:',
        ...taskPack.doneWhen.slice(0, 4).map((item) => `- ${item}`),
      ]
      : ['Stop when the task pack acceptance criteria are satisfied.']),
  ];

  return [
    '---',
    `description: ${JSON.stringify(`Task-scoped Cursor rule suggestion for ${taskPack.title}`)}`,
    'alwaysApply: false',
    ...(globs.length > 0 ? ['globs:', ...globs.map((glob) => `  - ${JSON.stringify(glob)}`)] : []),
    '---',
    '',
    ...body,
  ].join('\n');
}

export async function exportCursorPrompt(options: ExportCursorOptions): Promise<ExportCursorResult> {
  const context = await loadTaskPackExportContext(options);
  const outputPath = resolveTaskPackOutputPath(context, {
    output: options.output,
    defaultOutputDir: DEFAULT_CURSOR_EXPORTS_DIR,
  });
  const prompt = renderCursorPrompt(context.taskPack);
  const ruleOutputPath = options.ruleOutput ? path.resolve(context.rootDir, options.ruleOutput) : undefined;

  if (ruleOutputPath && path.extname(ruleOutputPath).toLowerCase() !== '.mdc') {
    throw new Error('Cursor rule suggestions must be written to a .mdc file. Pass --rule-output <file>.mdc.');
  }

  await writeTextFile(outputPath, `${prompt}\n`);

  let ruleSuggestion: string | undefined;

  if (ruleOutputPath) {
    ruleSuggestion = renderCursorRuleSuggestion(context.taskPack);
    await writeTextFile(ruleOutputPath, `${ruleSuggestion}\n`);
  }

  return {
    outputPath,
    prompt,
    taskPack: context.taskPack,
    ruleOutputPath,
    ruleSuggestion,
  };
}

function inferCursorRuleGlobs(relevantPaths: string[]): string[] {
  const normalized = relevantPaths
    .map((item) => normalizeRelativePath(item))
    .filter((item) => item !== '.' && item !== '' && !item.startsWith('..') && !item.includes('*'));

  if (normalized.length === 0 || normalized.length > 3) {
    return [];
  }

  return normalized.map((item) => (pathLooksLikeFile(item) ? item : `${item}/**`));
}
