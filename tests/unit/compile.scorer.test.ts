import { describe, expect, it } from 'vitest';
import { rankRelevantPaths } from '../../src/core/compile/scorer.js';
import { scanRepository } from '../../src/core/scan/scanner.js';
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
});
