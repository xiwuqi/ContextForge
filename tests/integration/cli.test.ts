import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { runCli } from '../../src/cli/app.js';
import { copyFixture, readFixtureFile } from '../helpers.js';

function createMemoryIo() {
  const stdout: string[] = [];
  const stderr: string[] = [];

  return {
    io: {
      stdout: (message: string) => stdout.push(message),
      stderr: (message: string) => stderr.push(message),
    },
    stdout,
    stderr,
  };
}

describe('CLI integration', () => {
  it('runs init, compile, export codex, and lint on a fixture repo', async () => {
    const repoDir = await copyFixture('node-basic');
    const taskPath = path.join(repoDir, 'task.md');
    await writeFile(
      taskPath,
      `# Add lint command\n\n## Objective\n\nAdd a lint command to the fixture CLI and update the docs.\n\n## Validation\n\n- npm run build\n- npm run test\n- npm run lint\n`,
      'utf8',
    );

    const initIo = createMemoryIo();
    expect(await runCli(['init'], initIo.io, repoDir)).toBe(0);

    const compileIo = createMemoryIo();
    expect(await runCli(['compile', '--input', 'task.md'], compileIo.io, repoDir)).toBe(0);

    const exportIo = createMemoryIo();
    expect(
      await runCli(
        ['export', 'codex', '--input', '.contextforge/task-packs/add-lint-command.json'],
        exportIo.io,
        repoDir,
      ),
    ).toBe(0);

    const lintIo = createMemoryIo();
    expect(await runCli(['lint'], lintIo.io, repoDir)).toBe(0);

    const prompt = await readFile(
      path.join(repoDir, '.github', 'codex', 'prompts', 'add-lint-command.md'),
      'utf8',
    );

    expect(prompt).toContain('# Add lint command');
    expect(initIo.stdout.join('\n')).toContain('Initialized ContextForge');
  });

  it('supports JSON scan output for a python fixture', async () => {
    const repoDir = await copyFixture('python-basic');
    const scanIo = createMemoryIo();
    const exitCode = await runCli(['scan', '--json'], scanIo.io, repoDir);

    expect(exitCode).toBe(0);
    expect(JSON.parse(scanIo.stdout.join('\n')).context.repo.detectedLanguages).toEqual(
      expect.arrayContaining(['python']),
    );
  });

  it('validates compile source flags and supports GitHub issue JSON input', async () => {
    const repoDir = await copyFixture('node-basic');
    const noSourceIo = createMemoryIo();
    expect(await runCli(['compile'], noSourceIo.io, repoDir)).toBe(1);
    expect(noSourceIo.stderr.join('\n')).toContain('Provide exactly one compile source');

    await writeFile(
      path.join(repoDir, 'task.md'),
      '# Add lint command\n',
      'utf8',
    );
    await mkdir(path.join(repoDir, 'issues'), { recursive: true });
    await writeFile(
      path.join(repoDir, 'issues', 'contextforge-issue-101.json'),
      await readFixtureFile('github', 'contextforge-issue-101.json'),
      'utf8',
    );

    const multipleSourceIo = createMemoryIo();
    expect(
      await runCli(
        ['compile', '--input', 'task.md', '--github-issue-json', 'issues/contextforge-issue-101.json'],
        multipleSourceIo.io,
        repoDir,
      ),
    ).toBe(1);
    expect(multipleSourceIo.stderr.join('\n')).toContain('Received multiple compile source flags');

    const githubJsonIo = createMemoryIo();
    expect(
      await runCli(
        ['compile', '--github-issue-json', 'issues/contextforge-issue-101.json'],
        githubJsonIo.io,
        repoDir,
      ),
    ).toBe(0);
    expect(githubJsonIo.stdout.join('\n')).toContain('Compiled task pack support-github-issue-sources-in-compile');
  });
});
