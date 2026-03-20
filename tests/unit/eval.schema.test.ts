import { describe, expect, it } from 'vitest';
import { loadEvalCorpus } from '../../src/core/eval/schema.js';
import { readFixtureFile } from '../helpers.js';

describe('eval corpus schema', () => {
  it('loads the checked-in fixture corpus definition', async () => {
    const corpus = loadEvalCorpus(
      JSON.parse(await readFixtureFile('evals', 'cases.json')),
    );

    expect(corpus.version).toBe(1);
    expect(corpus.cases).toHaveLength(3);
    expect(corpus.cases.map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        'node-local-markdown-lint',
        'node-github-issue-json',
        'python-nested-readme-validation',
      ]),
    );
  });
});
