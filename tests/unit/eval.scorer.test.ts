import { describe, expect, it } from 'vitest';
import { renderClaudePrompt } from '../../src/core/export/claude.js';
import { renderCursorPrompt, renderCursorRuleSuggestion } from '../../src/core/export/cursor.js';
import {
  evaluateExportOutput,
  evaluateTaskPackAgainstCase,
  finalizeCaseEvaluation,
} from '../../src/core/eval/scorer.js';
import { loadEvalCorpus } from '../../src/core/eval/schema.js';
import { TaskPackSchema } from '../../src/core/schema/index.js';
import { readFixtureFile } from '../helpers.js';

describe('eval scoring', () => {
  it('passes a representative GitHub issue case with claude and cursor exports', async () => {
    const corpus = loadEvalCorpus(
      JSON.parse(await readFixtureFile('evals', 'cases.json')),
    );
    const evalCase = corpus.cases.find((entry) => entry.id === 'node-github-issue-json');
    const taskPack = TaskPackSchema.parse(
      JSON.parse(await readFixtureFile('golden', 'github-issue-task-pack.json')),
    );

    expect(evalCase).toBeDefined();
    if (!evalCase) {
      return;
    }

    const base = evaluateTaskPackAgainstCase(taskPack, evalCase, corpus.thresholds);
    const exportChecks = [
      evaluateExportOutput(
        evalCase,
        taskPack,
        { target: 'claude', includeRuleSuggestion: false },
        renderClaudePrompt(taskPack),
        corpus.thresholds,
      ),
      evaluateExportOutput(
        evalCase,
        taskPack,
        { target: 'cursor', includeRuleSuggestion: true },
        renderCursorPrompt(taskPack),
        corpus.thresholds,
        renderCursorRuleSuggestion(taskPack),
      ),
    ];
    const result = finalizeCaseEvaluation(base, exportChecks, corpus.thresholds);

    expect(result.passed).toBe(true);
    expect(result.relevantPathCoverage.ratio).toBe(1);
    expect(result.sourceMetadataCheck?.ratio).toBe(1);
    expect(result.exportChecks.every((entry) => entry.passed)).toBe(true);
  });

  it('fails when a must-have relevant path is missing', async () => {
    const corpus = loadEvalCorpus(
      JSON.parse(await readFixtureFile('evals', 'cases.json')),
    );
    const evalCase = corpus.cases.find((entry) => entry.id === 'node-github-issue-json');
    const taskPack = TaskPackSchema.parse(
      JSON.parse(await readFixtureFile('golden', 'github-issue-task-pack.json')),
    );

    expect(evalCase).toBeDefined();
    if (!evalCase) {
      return;
    }

    const brokenTaskPack = {
      ...taskPack,
      relevantPaths: ['src'],
    };
    const result = evaluateTaskPackAgainstCase(brokenTaskPack, evalCase, corpus.thresholds);

    expect(result.relevantPathCoverage.passed).toBe(false);
    expect(result.relevantPathCoverage.missing).toContain('tests');
  });
});
