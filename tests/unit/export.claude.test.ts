import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { exportClaudePrompt, renderClaudePrompt } from '../../src/core/export/claude.js';
import { TaskPackSchema, type TaskPack } from '../../src/core/schema/index.js';
import { normalizeRelativePath } from '../../src/core/utils/paths.js';
import { copyFixture, readFixtureFile } from '../helpers.js';

describe('Claude exporter', () => {
  it('renders the expected compact task brief format', async () => {
    const taskPack = TaskPackSchema.parse(
      JSON.parse(await readFixtureFile('golden', 'github-issue-task-pack.json')),
    ) as TaskPack;

    const rendered = renderClaudePrompt(taskPack);
    const expected = await readFixtureFile('golden', 'export-claude.prompt.md');
    expect(rendered.trim()).toBe(expected.trim());
  });

  it('writes to the default claude export path when no output is provided', async () => {
    const repoDir = await copyFixture('node-basic');
    const taskPackPath = path.join(
      repoDir,
      '.contextforge',
      'task-packs',
      'support-github-issue-sources-in-compile.json',
    );
    await mkdir(path.dirname(taskPackPath), { recursive: true });
    await writeFile(taskPackPath, await readFixtureFile('golden', 'github-issue-task-pack.json'), 'utf8');

    const result = await exportClaudePrompt({
      rootDir: repoDir,
      input: '.contextforge/task-packs/support-github-issue-sources-in-compile.json',
    });

    expect(normalizeRelativePath(path.relative(repoDir, result.outputPath))).toBe(
      '.contextforge/exports/claude/support-github-issue-sources-in-compile.md',
    );
    expect(await readFile(result.outputPath, 'utf8')).toBe(
      `${(await readFixtureFile('golden', 'export-claude.prompt.md')).trimEnd()}\n`,
    );
  });
});
