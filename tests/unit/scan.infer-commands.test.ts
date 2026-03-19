import { describe, expect, it } from 'vitest';
import { scanRepository } from '../../src/core/scan/scanner.js';
import { FIXED_CLOCK, fixturePath } from '../helpers.js';

describe('command inference', () => {
  it('infers npm commands from a TypeScript repository fixture', async () => {
    const context = await scanRepository({
      rootDir: fixturePath('node-basic'),
      maxDepth: 6,
      clock: FIXED_CLOCK,
    });

    expect(context.repo.packageManager).toBe('npm');
    expect(context.commands.build).toEqual(['npm run build']);
    expect(context.commands.test).toEqual(['npm run test']);
    expect(context.commands.lint).toEqual(['npm run lint']);
    expect(context.structure.importantPaths).toEqual(expect.arrayContaining(['src', 'tests', 'docs']));
  });

  it('infers python commands from a Python repository fixture', async () => {
    const context = await scanRepository({
      rootDir: fixturePath('python-basic'),
      maxDepth: 6,
      clock: FIXED_CLOCK,
    });

    expect(context.repo.detectedLanguages).toEqual(expect.arrayContaining(['python', 'toml']));
    expect(context.commands.test).toEqual(['pytest']);
    expect(context.commands.lint).toEqual(['ruff check .']);
  });
});
