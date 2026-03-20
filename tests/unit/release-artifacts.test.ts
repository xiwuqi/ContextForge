import { describe, expect, it } from 'vitest';
import {
  buildChecksums,
  buildReleaseManifest,
  buildReleaseNotes,
  extractIntroParagraph,
  extractVersionHighlights,
  extractTitle,
  extractSupportedExports,
  parsePackManifest,
} from '../../scripts/lib/release-artifacts.mjs';

describe('release artifact helpers', () => {
  it('parses npm pack JSON output', () => {
    const manifest = parsePackManifest(
      JSON.stringify([
        {
          filename: 'xiwuqi-contextforge-0.1.0.tgz',
          files: [{ path: 'package.json' }, { path: 'dist/cli/index.js' }],
        },
      ]),
    );

    expect(manifest.filename).toBe('xiwuqi-contextforge-0.1.0.tgz');
    expect(manifest.files).toHaveLength(2);
  });

  it('builds release manifest and checksum output', () => {
    const manifest = buildReleaseManifest({
      packageName: '@xiwuqi/contextforge',
      version: '0.1.0',
      tarballFilename: 'xiwuqi-contextforge-0.1.0.tgz',
      tarballSizeBytes: 12345,
      sha256: 'abc123',
      generatedAt: '2026-03-19T18:00:00.000Z',
      nodeVersion: 'v20.19.0',
      releaseCheckPassed: true,
      publishDryRunPassed: true,
    });
    const checksums = buildChecksums([{ filename: 'xiwuqi-contextforge-0.1.0.tgz', sha256: 'abc123' }]);

    expect(manifest).toEqual({
      packageName: '@xiwuqi/contextforge',
      packageVersion: '0.1.0',
      tarballFilename: 'xiwuqi-contextforge-0.1.0.tgz',
      tarballSizeBytes: 12345,
      sha256: 'abc123',
      generatedAt: '2026-03-19T18:00:00.000Z',
      nodeVersion: 'v20.19.0',
      releaseCheckPassed: true,
      publishDryRunPassed: true,
    });
    expect(checksums).toBe('abc123  xiwuqi-contextforge-0.1.0.tgz\n');
  });

  it('builds release notes from README and changelog content', () => {
    const readme = `[English](README.md) | [简体中文](README.zh-CN.md)

# ContextForge

ContextForge is a local-first repository-to-agent context layer.

![ContextForge overview](docs/assets/contextforge-overview.svg)

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

## 0.1.0 - 2026-03-20

- Stable packaged CLI.
- Manual-dispatch release workflow.
`;

    expect(extractSupportedExports(readme)).toEqual(['Codex', 'Claude Code', 'Cursor']);
    expect(extractTitle(readme)).toBe('ContextForge');
    expect(extractIntroParagraph(readme)).toBe('ContextForge is a local-first repository-to-agent context layer.');
    expect(extractVersionHighlights(changelog, '0.1.0')).toEqual([
      'Stable packaged CLI.',
      'Manual-dispatch release workflow.',
    ]);

    const notes = buildReleaseNotes({
      packageName: '@xiwuqi/contextforge',
      version: '0.1.0',
      readme,
      changelog,
    });

    expect(notes).toContain('# ContextForge v0.1.0');
    expect(notes).toContain('ContextForge is a local-first repository-to-agent context layer.');
    expect(notes).toContain('## Install');
    expect(notes).toContain('npm i @xiwuqi/contextforge');
    expect(notes).toContain('- Stable packaged CLI.');
    expect(notes).toContain('- Manual-dispatch release workflow.');
    expect(notes).toContain('- Codex');
    expect(notes).toContain('- Cursor');
    expect(notes).toContain('- CLI command: `contextforge`');
    expect(notes).not.toContain('Draft release notes for manual maintainer review.');
    expect(notes).not.toContain('## Manual steps remaining');
  });
});
