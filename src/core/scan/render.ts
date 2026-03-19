import path from 'node:path';
import { AGENTS_SUGGESTED_FILE, CONTEXT_FILE, CONTEXT_MARKDOWN_FILE } from '../utils/constants.js';
import type { RepoContext } from '../schema/index.js';
import { writeJsonFile, writeTextFile } from '../utils/filesystem.js';
import { dedupeStrings } from '../utils/text.js';

function renderSection(title: string, items: string[]): string {
  if (items.length === 0) {
    return `## ${title}\n\n- None detected\n`;
  }

  const lines = items.map((item) => `- \`${item}\``).join('\n');
  return `## ${title}\n\n${lines}\n`;
}

export function renderContextMarkdown(context: RepoContext): string {
  const commandSections = [
    { label: 'Install', commands: context.commands.install },
    { label: 'Build', commands: context.commands.build },
    { label: 'Test', commands: context.commands.test },
    { label: 'Lint', commands: context.commands.lint },
    { label: 'Format', commands: context.commands.format },
  ]
    .map(({ label, commands }) => renderSection(label, commands))
    .join('\n');

  return [
    '# Repository Context',
    '',
    `- Repo: \`${context.repo.name}\``,
    `- Root: \`${context.repo.root}\``,
    `- Languages: ${context.repo.detectedLanguages.join(', ') || 'unknown'}`,
    `- Frameworks: ${context.repo.detectedFrameworks.join(', ') || 'none detected'}`,
    `- Package manager: ${context.repo.packageManager ?? 'unknown'}`,
    `- Generated: ${context.generatedAt}`,
    '',
    renderSection('Important Paths', context.structure.importantPaths),
    renderSection('Important Files', context.structure.importantFiles),
    renderSection('Entry Signals', context.structure.entrySignals),
    renderSection(
      'Documentation',
      dedupeStrings([...context.docs.readme, ...context.docs.contributing, ...context.docs.architecture]),
    ),
    renderSection('Config Files', context.configs),
    '## Commands',
    '',
    commandSections.trimEnd(),
  ].join('\n');
}

export function renderSuggestedAgents(context: RepoContext): string {
  const readFirst = dedupeStrings([
    ...context.docs.readme,
    ...context.docs.contributing,
    ...context.docs.architecture,
    ...context.structure.entrySignals,
  ]).slice(0, 8);

  const validationCommands = dedupeStrings([
    ...context.commands.build,
    ...context.commands.test,
    ...context.commands.lint,
  ]);

  return [
    '# Suggested AGENTS.md',
    '',
    '## Mission',
    '',
    `Work inside the existing ${context.repo.name} repository. Keep changes task-scoped, reviewable, and aligned with the repository guidance and validation commands below.`,
    '',
    '## Read First',
    '',
    ...(readFirst.length > 0 ? readFirst.map((item) => `- \`${item}\``) : ['- `README.md`']),
    '',
    '## Working Rules',
    '',
    '- Prefer small, verifiable changes over broad rewrites.',
    '- Keep generated internal artifacts under `.contextforge/` by default.',
    '- Preserve relative repository paths in generated output.',
    '- Update user-facing docs when behavior changes.',
    '',
    '## Important Paths',
    '',
    ...(context.structure.importantPaths.length > 0
      ? context.structure.importantPaths.map((item) => `- \`${item}\``)
      : ['- No high-signal paths detected yet.']),
    '',
    '## Validation',
    '',
    ...(validationCommands.length > 0
      ? validationCommands.map((command) => `- \`${command}\``)
      : ['- Add explicit validation commands once the repository exposes them.']),
  ].join('\n');
}

export async function writeContextArtifacts(rootDir: string, context: RepoContext): Promise<string[]> {
  const contextJsonPath = path.join(rootDir, CONTEXT_FILE);
  const contextMarkdownPath = path.join(rootDir, CONTEXT_MARKDOWN_FILE);
  const suggestedAgentsPath = path.join(rootDir, AGENTS_SUGGESTED_FILE);

  await writeJsonFile(contextJsonPath, context);
  await writeTextFile(contextMarkdownPath, `${renderContextMarkdown(context)}\n`);
  await writeTextFile(suggestedAgentsPath, `${renderSuggestedAgents(context)}\n`);

  return [CONTEXT_FILE, CONTEXT_MARKDOWN_FILE, AGENTS_SUGGESTED_FILE];
}
