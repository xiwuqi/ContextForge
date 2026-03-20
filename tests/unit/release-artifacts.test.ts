import { describe, expect, it } from 'vitest';
import {
  buildChecksums,
  buildReleaseManifest,
  buildReleaseNotes,
  extractTitle,
  extractSupportedExports,
  parsePackManifest,
} from '../../scripts/lib/release-artifacts.mjs';

describe('release artifact helpers', () => {
  it('parses npm pack JSON output', () => {
    const manifest = parsePackManifest(
      JSON.stringify([
        {
          filename: 'contextforge-0.1.0.tgz',
          files: [{ path: 'package.json' }, { path: 'dist/cli/index.js' }],
        },
      ]),
    );

    expect(manifest.filename).toBe('contextforge-0.1.0.tgz');
    expect(manifest.files).toHaveLength(2);
  });

  it('builds release manifest and checksum output', () => {
    const manifest = buildReleaseManifest({
      packageName: 'contextforge',
      version: '0.1.0',
      tarballFilename: 'contextforge-0.1.0.tgz',
      tarballSizeBytes: 12345,
      sha256: 'abc123',
      generatedAt: '2026-03-19T18:00:00.000Z',
      nodeVersion: 'v20.19.0',
      releaseCheckPassed: true,
      publishDryRunPassed: true,
    });
    const checksums = buildChecksums([{ filename: 'contextforge-0.1.0.tgz', sha256: 'abc123' }]);

    expect(manifest).toEqual({
      packageName: 'contextforge',
      packageVersion: '0.1.0',
      tarballFilename: 'contextforge-0.1.0.tgz',
      tarballSizeBytes: 12345,
      sha256: 'abc123',
      generatedAt: '2026-03-19T18:00:00.000Z',
      nodeVersion: 'v20.19.0',
      releaseCheckPassed: true,
      publishDryRunPassed: true,
    });
    expect(checksums).toBe('abc123  contextforge-0.1.0.tgz\n');
  });

  it('builds release notes from README and changelog content', () => {
    const readme = `# ContextForge

ContextForge is a local-first repository-to-agent context layer.

## Supported export targets

| Target | Command | Default output | Notes |
| --- | --- | --- | --- |
| Codex | \`contextforge export codex\` | x | y |
| Claude Code | \`contextforge export claude\` | x | y |
| Cursor | \`contextforge export cursor\` | x | y |
`;
    const changelog = `# Changelog

## Unreleased

### Release-candidate scope

- Local-first CLI release candidate.
- Checked-in demo artifacts.
`;

    expect(extractSupportedExports(readme)).toEqual(['Codex', 'Claude Code', 'Cursor']);
    expect(extractTitle(readme)).toBe('ContextForge');

    const notes = buildReleaseNotes({
      packageName: 'contextforge',
      version: '0.1.0',
      readme,
      changelog,
    });

    expect(notes).toContain('# ContextForge v0.1.0');
    expect(notes).toContain('ContextForge is a local-first repository-to-agent context layer.');
    expect(notes).toContain('- Local-first CLI release candidate.');
    expect(notes).toContain('- Codex');
    expect(notes).toContain('- Cursor');
  });
});
