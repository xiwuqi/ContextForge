import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { compileTask } from '../../src/core/compile/compiler.js';
import { copyFixture, FIXED_CLOCK } from '../helpers.js';

describe('task compilation', () => {
  it('generates required task pack fields and artifacts', async () => {
    const repoDir = await copyFixture('node-basic');
    const taskPath = path.join(repoDir, 'task.md');

    await writeFile(
      taskPath,
      `# Add lint command\n\n## Objective\n\nAdd a lint command to the fixture CLI and update the docs.\n\n## Validation\n\n- npm run build\n- npm run test\n- npm run lint\n\n## Done when\n\n- The lint command exists.\n- The docs mention the lint command.\n`,
      'utf8',
    );

    const result = await compileTask({
      rootDir: repoDir,
      inputFile: 'task.md',
      clock: FIXED_CLOCK,
      provider: null,
    });

    expect(result.taskPack.taskId).toBe('add-lint-command');
    expect(result.taskPack.validationCommands).toEqual(
      expect.arrayContaining(['npm run build', 'npm run test', 'npm run lint']),
    );
    expect(result.taskPack.doneWhen).toEqual(
      expect.arrayContaining(['The lint command exists.', 'The docs mention the lint command.']),
    );
    expect(result.taskPack.relevantPaths).toEqual(expect.arrayContaining(['src', 'tests']));
    expect(result.taskPack.provider).toBeNull();

    const markdown = await readFile(result.markdownPath, 'utf8');
    expect(markdown).toContain('# Task Pack: Add lint command');
    expect(markdown).toContain('## Validation Commands');
  });
});
