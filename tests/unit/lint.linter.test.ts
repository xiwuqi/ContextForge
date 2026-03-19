import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { compileTask } from '../../src/core/compile/compiler.js';
import { lintRepository } from '../../src/core/lint/linter.js';
import { writeContextArtifacts } from '../../src/core/scan/render.js';
import { scanRepository } from '../../src/core/scan/scanner.js';
import type { TaskPack } from '../../src/core/schema/index.js';
import { copyFixture, FIXED_CLOCK } from '../helpers.js';

describe('lint drift detection', () => {
  it('reports stale guidance, missing files, and missing validation criteria', async () => {
    const repoDir = await copyFixture('node-basic');
    const context = await scanRepository({ rootDir: repoDir, maxDepth: 6, clock: FIXED_CLOCK });
    await writeContextArtifacts(repoDir, context);

    await writeFile(
      path.join(repoDir, 'task.md'),
      `# Add lint command\n\n## Objective\n\nAdd a lint command to the fixture CLI and update the docs.\n`,
      'utf8',
    );

    const result = await compileTask({
      rootDir: repoDir,
      inputFile: 'task.md',
      clock: FIXED_CLOCK,
      provider: null,
    });

    const brokenTaskPack = JSON.parse(await readFile(result.jsonPath, 'utf8')) as TaskPack;
    brokenTaskPack.relevantFiles = ['src/missing.ts'];
    brokenTaskPack.validationCommands = [];
    brokenTaskPack.doneWhen = [];
    await writeFile(result.jsonPath, JSON.stringify(brokenTaskPack, null, 2), 'utf8');

    await writeFile(path.join(repoDir, '.contextforge', 'context.md'), '# stale\n', 'utf8');

    const report = await lintRepository({ rootDir: repoDir, clock: FIXED_CLOCK });
    const issueCodes = report.issues.map((issue) => issue.code);

    expect(issueCodes).toEqual(
      expect.arrayContaining(['missing-file', 'missing-validation', 'missing-done-when', 'stale-guidance']),
    );
    expect(report.summary.errorCount).toBeGreaterThan(0);
  });
});
