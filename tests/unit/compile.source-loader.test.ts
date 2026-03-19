import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  loadCompileSource,
  validateCompileSourceSelection,
} from '../../src/core/compile/source-loader.js';
import { copyFixture, readFixtureFile } from '../helpers.js';

describe('compile source loading', () => {
  it('validates that exactly one compile source flag is provided', () => {
    expect(() => validateCompileSourceSelection({})).toThrow(/Provide exactly one compile source/);
    expect(() =>
      validateCompileSourceSelection({
        inputFile: 'task.md',
        githubIssueJson: 'issue.json',
      }),
    ).toThrow(/Received multiple compile source flags/);
  });

  it('normalizes GitHub issue JSON sources into task markdown and metadata', async () => {
    const repoDir = await copyFixture('node-basic');
    await mkdir(path.join(repoDir, 'issues'), { recursive: true });
    await writeFile(
      path.join(repoDir, 'issues', 'contextforge-issue-101.json'),
      await readFixtureFile('github', 'contextforge-issue-101.json'),
      'utf8',
    );

    const source = await loadCompileSource({
      rootDir: repoDir,
      githubIssueJson: 'issues/contextforge-issue-101.json',
    });

    expect(source.type).toBe('github_issue_json');
    expect(source.ref).toBe('xiwuqi/ContextForge#101');
    expect(source.title).toBe('Support GitHub issue sources in compile');
    expect(source.labels).toEqual(['enhancement', 'cli', 'github']);
    expect(source.sourceTaskPath).toBe('issues/contextforge-issue-101.json');
    expect(source.taskMarkdown).toContain('## Context');
    expect(source.taskMarkdown).toContain('## Source');
  });

  it('fetches GitHub issues with optional authentication and normalizes the result', async () => {
    const repoDir = await copyFixture('node-basic');
    const payload = JSON.parse(await readFixtureFile('github', 'contextforge-issue-101.json'));
    let capturedUrl = '';
    let authorizationHeader = '';

    const source = await loadCompileSource({
      rootDir: repoDir,
      githubIssue: 'https://github.com/xiwuqi/ContextForge/issues/101',
      githubToken: 'secret-token',
      fetchImpl: async (input, init) => {
        capturedUrl = String(input);
        authorizationHeader =
          init?.headers instanceof Headers
            ? init.headers.get('Authorization') ?? ''
            : '';

        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      },
    });

    expect(capturedUrl).toBe('https://api.github.com/repos/xiwuqi/ContextForge/issues/101');
    expect(authorizationHeader).toBe('Bearer secret-token');
    expect(source.type).toBe('github_issue');
    expect(source.sourceTaskPath).toBe('github://xiwuqi/ContextForge#101');
  });

  it('returns actionable fallback guidance when GitHub fetching fails', async () => {
    const repoDir = await copyFixture('node-basic');

    await expect(
      loadCompileSource({
        rootDir: repoDir,
        githubIssue: 'xiwuqi/ContextForge#101',
        fetchImpl: async () =>
          new Response('{}', {
            status: 404,
            statusText: 'Not Found',
          }),
      }),
    ).rejects.toThrow(/GITHUB_TOKEN/);

    await expect(
      loadCompileSource({
        rootDir: repoDir,
        githubIssue: 'xiwuqi/ContextForge#101',
        fetchImpl: async () =>
          new Response('{}', {
            status: 404,
            statusText: 'Not Found',
          }),
      }),
    ).rejects.toThrow(/--github-issue-json/);
  });
});
