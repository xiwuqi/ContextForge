import type { TaskPack } from '../schema/index.js';

function renderList(title: string, items: string[]): string {
  if (items.length === 0) {
    return `## ${title}\n\n- None\n`;
  }

  return `## ${title}\n\n${items.map((item) => `- ${item.startsWith('`') ? item : `\`${item}\``}`).join('\n')}\n`;
}

export function renderTaskPackMarkdown(taskPack: TaskPack): string {
  return [
    `# Task Pack: ${taskPack.title}`,
    '',
    `- Task ID: \`${taskPack.taskId}\``,
    `- Confidence: ${taskPack.confidence.toFixed(2)}`,
    `- Source Task: \`${taskPack.sourceTaskPath}\``,
    `- Provider: ${taskPack.provider ?? 'heuristic'}`,
    `- Generated: ${taskPack.generatedAt}`,
    '',
    '## Objective',
    '',
    taskPack.objective,
    '',
    '## User Request Summary',
    '',
    taskPack.userRequestSummary,
    '',
    renderList('Relevant Paths', taskPack.relevantPaths),
    renderList('Relevant Files', taskPack.relevantFiles),
    renderList('Possibly Related Paths', taskPack.possiblyRelatedPaths),
    renderList('Constraints', taskPack.constraints),
    renderList('Assumptions', taskPack.assumptions),
    renderList('Risks', taskPack.risks),
    renderList('Validation Commands', taskPack.validationCommands),
    renderList('Done When', taskPack.doneWhen),
    renderList('Implementation Plan', taskPack.implementationPlan),
    renderList('Open Questions', taskPack.openQuestions),
  ].join('\n');
}
