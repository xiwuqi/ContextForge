import { describe, expect, it } from 'vitest';
import {
  NPM_PUBLISH_VERIFY_DELAY_MS,
  NPM_PUBLISH_VERIFY_MAX_ATTEMPTS,
  buildGhReleaseCreateArgs,
  buildGhRepoEditArgs,
  buildGhTopicsArgs,
  buildNpmPublishArgs,
  buildReleaseSuccessSummary,
  classifyNpmViewVersionResult,
  ensureReleaseVersionMatchesPackage,
  isNpmViewNotFound,
  parseNpmViewVersion,
  parseRepoMetadataConfig,
  resolveRepoSlug,
  validateChangelogForVersion,
} from '../../scripts/lib/release-automation.mjs';

describe('release automation helpers', () => {
  it('parses repo metadata config and normalizes topics', () => {
    const metadata = parseRepoMetadataConfig(
      JSON.stringify({
        description: 'Local-first repository-to-agent context CLI.',
        homepage: 'https://github.com/xiwuqi/ContextForge#readme',
        topics: ['CLI', 'codex', 'cursor', 'codex'],
      }),
    );

    expect(metadata).toEqual({
      description: 'Local-first repository-to-agent context CLI.',
      homepage: 'https://github.com/xiwuqi/ContextForge#readme',
      topics: ['cli', 'codex', 'cursor'],
    });
  });

  it('validates package version and changelog readiness', () => {
    expect(
      ensureReleaseVersionMatchesPackage({ version: '0.1.0' }, '0.1.0'),
    ).toBe('0.1.0');

    const section = validateChangelogForVersion(
      `# Changelog

## Unreleased

## 0.1.0 - 2026-03-20

- First public release.
`,
      '0.1.0',
    );

    expect(section.heading).toBe('## 0.1.0 - 2026-03-20');
    expect(() =>
      validateChangelogForVersion(
        `# Changelog

## Unreleased

- Still drafting release notes.
`,
        '0.1.0',
      ),
    ).toThrow(/does not contain a release entry/);
  });

  it('builds command arguments for metadata sync, release creation, and npm publish', () => {
    expect(
      buildGhRepoEditArgs({
        repo: 'xiwuqi/ContextForge',
        metadata: {
          description: 'Desc',
          homepage: 'https://github.com/xiwuqi/ContextForge#readme',
        },
      }),
    ).toEqual([
      'repo',
      'edit',
      'xiwuqi/ContextForge',
      '--description',
      'Desc',
      '--homepage',
      'https://github.com/xiwuqi/ContextForge#readme',
    ]);

    expect(
      buildGhTopicsArgs({
        repo: 'xiwuqi/ContextForge',
        topics: ['cli', 'cursor'],
      }),
    ).toEqual([
      'api',
      '--method',
      'PUT',
      'repos/xiwuqi/ContextForge/topics',
      '-H',
      'Accept: application/vnd.github+json',
      '-f',
      'names[]=cli',
      '-f',
      'names[]=cursor',
    ]);

    expect(
      buildGhReleaseCreateArgs({
        repo: 'xiwuqi/ContextForge',
        tag: 'v0.1.0',
        target: 'abc123',
        notesFile: '.contextforge/releases/0.1.0/release-notes.md',
        assets: ['bundle.tgz', 'checksums.txt'],
        prerelease: true,
      }),
    ).toEqual([
      'release',
      'create',
      'v0.1.0',
      'bundle.tgz',
      'checksums.txt',
      '--repo',
      'xiwuqi/ContextForge',
      '--title',
      'v0.1.0',
      '--notes-file',
      '.contextforge/releases/0.1.0/release-notes.md',
      '--target',
      'abc123',
      '--prerelease',
    ]);

    expect(
      buildNpmPublishArgs({
        tarballPath: '.contextforge/releases/0.1.0/xiwuqi-contextforge-0.1.0.tgz',
        npmTag: 'latest',
        useTokenAuth: false,
      }),
    ).toEqual([
      'publish',
      '.contextforge/releases/0.1.0/xiwuqi-contextforge-0.1.0.tgz',
      '--tag',
      'latest',
      '--access',
      'public',
      '--provenance',
    ]);
  });

  it('resolves repo slug and builds a compact success summary', () => {
    expect(
      resolveRepoSlug({
        explicitRepo: '',
        envRepo: 'xiwuqi/ContextForge',
        remoteUrl: '',
      }),
    ).toBe('xiwuqi/ContextForge');

    expect(
      resolveRepoSlug({
        explicitRepo: '',
        envRepo: '',
        remoteUrl: 'git+https://github.com/xiwuqi/ContextForge.git',
      }),
    ).toBe('xiwuqi/ContextForge');

    const summary = buildReleaseSuccessSummary({
      version: '0.1.0',
      packageName: '@xiwuqi/contextforge',
      releaseUrl: 'https://github.com/xiwuqi/ContextForge/releases/tag/v0.1.0',
      metadataSynced: true,
      npmPublished: true,
      npmTag: 'latest',
    });

    expect(summary).toContain('Release automation summary for @xiwuqi/contextforge@0.1.0');
    expect(summary).toContain('Release URL: https://github.com/xiwuqi/ContextForge/releases/tag/v0.1.0');
    expect(summary).toContain('Metadata sync ran: yes');
    expect(summary).toContain('npm publish ran: yes');
  });

  it('parses npm view output and classifies propagation-delay retries', () => {
    expect(parseNpmViewVersion('"0.1.0"')).toBe('0.1.0');
    expect(
      classifyNpmViewVersionResult({
        exitCode: 1,
        stdout: '',
        stderr: 'npm ERR! 404 Not Found - GET https://registry.npmjs.org/@xiwuqi%2fcontextforge',
        expectedVersion: '0.1.0',
      }),
    ).toEqual({
      actualVersion: null,
      matchesExpectedVersion: false,
      retryable: true,
    });
    expect(isNpmViewNotFound('', 'npm ERR! code E404')).toBe(true);
    expect(
      classifyNpmViewVersionResult({
        exitCode: 0,
        stdout: '"0.0.9"',
        stderr: '',
        expectedVersion: '0.1.0',
      }),
    ).toEqual({
      actualVersion: '0.0.9',
      matchesExpectedVersion: false,
      retryable: true,
    });
    expect(
      classifyNpmViewVersionResult({
        exitCode: 0,
        stdout: '"0.1.0"',
        stderr: '',
        expectedVersion: '0.1.0',
      }),
    ).toEqual({
      actualVersion: '0.1.0',
      matchesExpectedVersion: true,
      retryable: false,
    });
    expect(NPM_PUBLISH_VERIFY_MAX_ATTEMPTS).toBeGreaterThan(1);
    expect(NPM_PUBLISH_VERIFY_DELAY_MS).toBeGreaterThan(0);
  });
});
