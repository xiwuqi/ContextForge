import { describe, expect, it } from 'vitest';
import { LintReportSchema, RepoContextSchema, TaskPackSchema } from '../../src/core/schema/index.js';

describe('schemas', () => {
  it('validates repository context objects', () => {
    const parsed = RepoContextSchema.parse({
      repo: {
        name: 'demo',
        root: '.',
        detectedLanguages: ['typescript'],
        detectedFrameworks: ['node'],
        packageManager: 'npm',
      },
      structure: {
        importantPaths: ['src'],
        importantFiles: ['package.json'],
        topLevelDirectories: ['src'],
        entrySignals: ['package.json'],
        scannedDirectories: ['src'],
        scannedFiles: ['package.json', 'src/index.ts'],
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
    });

    expect(parsed.repo.name).toBe('demo');
  });

  it('validates task pack objects', () => {
    const parsed = TaskPackSchema.parse({
      taskId: 'add-lint-command',
      title: 'Add lint command',
      objective: 'Add a lint command.',
      userRequestSummary: 'Add and document a lint command.',
      sourceTaskPath: 'examples/task.md',
      sourceType: 'markdown_file',
      sourceRef: 'examples/task.md',
      sourceTitle: 'Add lint command',
      sourceLabels: [],
      sourceUrl: null,
      relevantPaths: ['src'],
      relevantFiles: ['package.json'],
      possiblyRelatedPaths: ['tests'],
      constraints: ['Keep the CLI local-first.'],
      assumptions: ['Package manager is npm.'],
      risks: ['Command inference may need review.'],
      validationCommands: ['npm run build'],
      doneWhen: ['The lint command exists.'],
      implementationPlan: ['Inspect the CLI before editing.'],
      openQuestions: [],
      confidence: 0.8,
      provider: null,
      generatedAt: '2026-03-19T18:00:00.000Z',
    });

    expect(parsed.confidence).toBe(0.8);
  });

  it('validates lint reports', () => {
    const parsed = LintReportSchema.parse({
      issues: [],
      summary: {
        errorCount: 0,
        warningCount: 0,
      },
      generatedAt: '2026-03-19T18:00:00.000Z',
    });

    expect(parsed.summary.errorCount).toBe(0);
  });
});
