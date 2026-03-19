import { describe, expect, it } from 'vitest';
import { rankRelevantPaths } from '../../src/core/compile/scorer.js';
import { scanRepository } from '../../src/core/scan/scanner.js';
import type { RepoContext } from '../../src/core/schema/index.js';
import { FIXED_CLOCK, fixturePath } from '../helpers.js';

describe('path scoring', () => {
  it('prioritizes src and tests for implementation tasks', async () => {
    const context = await scanRepository({
      rootDir: fixturePath('node-basic'),
      maxDepth: 6,
      clock: FIXED_CLOCK,
    });

    const ranked = rankRelevantPaths(
      'Add a lint command to the CLI and update tests and docs.',
      [],
      context,
    );

    expect(ranked.relevantPaths).toEqual(expect.arrayContaining(['src', 'tests']));
    expect(ranked.confidence).toBeGreaterThan(0.5);
  });

  it('penalizes fixture, golden, and generated prompt paths when the task does not mention them', () => {
    const context: RepoContext = {
      repo: {
        name: 'demo',
        root: '.',
        detectedLanguages: ['typescript'],
        detectedFrameworks: ['node'],
        packageManager: 'npm',
      },
      structure: {
        importantPaths: ['src', 'tests', 'tests/fixtures', 'docs'],
        importantFiles: [
          'src/cli/commands/lint.ts',
          'tests/fixtures/golden/task-add-lint-command.md',
          '.github/codex/prompts/add-lint-command.md',
        ],
        topLevelDirectories: ['src', 'tests', 'docs'],
        entrySignals: ['package.json'],
        scannedDirectories: ['src', 'src/cli', 'src/cli/commands', 'tests', 'tests/fixtures', 'docs'],
        scannedFiles: [
          'package.json',
          'src/cli/commands/lint.ts',
          'tests/fixtures/golden/task-add-lint-command.md',
          '.github/codex/prompts/add-lint-command.md',
        ],
      },
      commands: {
        install: ['npm install'],
        build: ['npm run build'],
        test: ['npm run test'],
        lint: ['npm run lint'],
        format: ['npm run format'],
      },
      docs: {
        readme: ['README.md'],
        contributing: [],
        architecture: [],
      },
      configs: ['package.json'],
      generatedAt: '2026-03-19T18:00:00.000Z',
    };

    const ranked = rankRelevantPaths('Add a lint command and update the CLI docs.', [], context);

    expect(ranked.relevantFiles).toContain('src/cli/commands/lint.ts');
    expect(ranked.relevantFiles).not.toContain('tests/fixtures/golden/task-add-lint-command.md');
    expect(ranked.relevantFiles).not.toContain('.github/codex/prompts/add-lint-command.md');
  });
});
