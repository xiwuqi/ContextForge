import { describe, expect, it } from 'vitest';
import {
  buildGhReleaseCreateArgs,
  buildGhRepoEditArgs,
  buildGhTopicsArgs,
  buildNpmPublishArgs,
  buildReleaseSuccessSummary,
  ensureReleaseVersionMatchesPackage,
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
        tarballPath: '.contextforge/releases/0.1.0/contextforge-0.1.0.tgz',
        npmTag: 'latest',
        useTokenAuth: false,
      }),
    ).toEqual([
      'publish',
      '.contextforge/releases/0.1.0/contextforge-0.1.0.tgz',
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
      packageName: 'contextforge',
      releaseUrl: 'https://github.com/xiwuqi/ContextForge/releases/tag/v0.1.0',
      metadataSynced: true,
      npmPublished: true,
      npmTag: 'latest',
    });

    expect(summary).toContain('Release automation summary for contextforge@0.1.0');
    expect(summary).toContain('Release URL: https://github.com/xiwuqi/ContextForge/releases/tag/v0.1.0');
    expect(summary).toContain('Metadata sync ran: yes');
    expect(summary).toContain('npm publish ran: yes');
  });
});
