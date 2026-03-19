import { describe, expect, it } from 'vitest';
import { renderCodexPrompt } from '../../src/core/export/codex.js';
import type { TaskPack } from '../../src/core/schema/index.js';
import { readFixtureFile } from '../helpers.js';

describe('Codex exporter', () => {
  it('renders the expected compact prompt format', async () => {
    const taskPack: TaskPack = {
      taskId: 'add-lint-command',
      title: 'Add lint command',
      objective: 'Add a lint command to the fixture CLI and update the docs.',
      userRequestSummary: 'Add and document a lint command.',
      sourceTaskPath: 'task.md',
      relevantPaths: ['src', 'tests'],
      relevantFiles: ['README.md'],
      possiblyRelatedPaths: ['docs'],
      constraints: [
        'Keep the CLI local-first.',
        'Prefer small, reviewable changes.',
        'Run build, test, and lint before finishing.',
        'Update tests if command behavior changes.',
      ],
      assumptions: ['Repository root is .', 'Package manager is npm.', 'Primary languages include json, markdown, typescript.'],
      risks: [],
      validationCommands: ['npm run build', 'npm run test', 'npm run lint'],
      doneWhen: ['The lint command exists.', 'The docs mention the lint command.'],
      implementationPlan: [],
      openQuestions: [],
      confidence: 0.8,
      provider: null,
      generatedAt: '2026-03-19T18:00:00.000Z',
    };

    const rendered = renderCodexPrompt(taskPack);
    const expected = await readFixtureFile('golden', 'export-codex.prompt.md');
    expect(rendered.trim()).toBe(expected.trim());
  });
});
