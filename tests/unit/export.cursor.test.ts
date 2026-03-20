import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  exportCursorPrompt,
  renderCursorPrompt,
  renderCursorRuleSuggestion,
} from '../../src/core/export/cursor.js';
import { TaskPackSchema, type TaskPack } from '../../src/core/schema/index.js';
import { normalizeRelativePath } from '../../src/core/utils/paths.js';
import { copyFixture, readFixtureFile } from '../helpers.js';

describe('Cursor exporter', () => {
  it('renders the expected compact task brief format', async () => {
    const taskPack = TaskPackSchema.parse(
      JSON.parse(await readFixtureFile('golden', 'github-issue-task-pack.json')),
    ) as TaskPack;

    const rendered = renderCursorPrompt(taskPack);
    const expected = await readFixtureFile('golden', 'export-cursor.prompt.md');
    expect(rendered.trim()).toBe(expected.trim());
  });

  it('renders the expected task-scoped rule suggestion format', async () => {
    const taskPack = TaskPackSchema.parse(
      JSON.parse(await readFixtureFile('golden', 'github-issue-task-pack.json')),
    ) as TaskPack;

    const rendered = renderCursorRuleSuggestion(taskPack);
    const expected = await readFixtureFile('golden', 'export-cursor.rule.mdc');
    expect(rendered.trim()).toBe(expected.trim());
  });

  it('writes to the default cursor export path and an explicit rule output path', async () => {
    const repoDir = await copyFixture('node-basic');
    const taskPackPath = path.join(
      repoDir,
      '.contextforge',
      'task-packs',
      'support-github-issue-sources-in-compile.json',
    );
    await mkdir(path.dirname(taskPackPath), { recursive: true });
    await writeFile(taskPackPath, await readFixtureFile('golden', 'github-issue-task-pack.json'), 'utf8');

    const result = await exportCursorPrompt({
      rootDir: repoDir,
      input: '.contextforge/task-packs/support-github-issue-sources-in-compile.json',
      ruleOutput: '.cursor/rules/support-github-issue-sources-in-compile.mdc',
    });

    expect(normalizeRelativePath(path.relative(repoDir, result.outputPath))).toBe(
      '.contextforge/exports/cursor/support-github-issue-sources-in-compile.md',
    );
    expect(normalizeRelativePath(path.relative(repoDir, result.ruleOutputPath ?? ''))).toBe(
      '.cursor/rules/support-github-issue-sources-in-compile.mdc',
    );
    expect(await readFile(result.outputPath, 'utf8')).toBe(
      `${(await readFixtureFile('golden', 'export-cursor.prompt.md')).trimEnd()}\n`,
    );
    expect(await readFile(result.ruleOutputPath!, 'utf8')).toBe(
      `${(await readFixtureFile('golden', 'export-cursor.rule.mdc')).trimEnd()}\n`,
    );
  });

  it('rejects non-mdc rule suggestion paths', async () => {
    const repoDir = await copyFixture('node-basic');
    const taskPackPath = path.join(repoDir, '.contextforge', 'task-packs', 'task-pack.json');
    await mkdir(path.dirname(taskPackPath), { recursive: true });
    await writeFile(taskPackPath, await readFixtureFile('golden', 'github-issue-task-pack.json'), 'utf8');

    await expect(
      exportCursorPrompt({
        rootDir: repoDir,
        input: '.contextforge/task-packs/task-pack.json',
        ruleOutput: '.contextforge/exports/cursor/task-pack.txt',
      }),
    ).rejects.toThrow('.mdc');
  });
});
