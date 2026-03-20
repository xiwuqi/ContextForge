import { describe, expect, it } from 'vitest';
import { parsePublishDryRun, validatePublishManifest } from '../../scripts/lib/publish-checks.mjs';

describe('publish dry-run checks', () => {
  it('accepts a publish manifest with required runtime files and no clutter', () => {
    const manifest = parsePublishDryRun(
      JSON.stringify({
        name: 'contextforge',
        version: '0.1.0',
        filename: 'contextforge-0.1.0.tgz',
        files: [
          { path: 'LICENSE' },
          { path: 'README.md' },
          { path: 'README.zh-CN.md' },
          { path: 'package.json' },
          { path: 'dist/cli/index.js' },
          { path: 'dist/cli/app.js' },
          { path: 'dist/core/compile/compiler.js' },
          { path: 'dist/core/export/codex.js' },
          { path: 'dist/core/export/claude.js' },
          { path: 'dist/core/export/cursor.js' },
          { path: 'dist/core/lint/linter.js' },
          { path: 'dist/core/scan/scanner.js' },
        ],
      }),
    );

    const result = validatePublishManifest(manifest);

    expect(result.passed).toBe(true);
    expect(result.missingRequiredFiles).toEqual([]);
    expect(result.unexpectedNonDistFiles).toEqual([]);
    expect(result.forbiddenMatches).toEqual([]);
  });

  it('flags missing runtime files and leaked bootstrap clutter', () => {
    const manifest = parsePublishDryRun(
      JSON.stringify({
        name: 'contextforge',
        version: '0.1.0',
        filename: 'contextforge-0.1.0.tgz',
        files: [
          { path: 'README.md' },
          { path: 'package.json' },
          { path: 'dist/cli/index.js' },
          { path: 'docs/product/prd.md' },
          { path: 'ContextForge_PRD.md' },
        ],
      }),
    );

    const result = validatePublishManifest(manifest);

    expect(result.passed).toBe(false);
    expect(result.missingRequiredFiles).toContain('LICENSE');
    expect(result.missingRequiredFiles).toContain('dist/core/export/cursor.js');
    expect(result.unexpectedNonDistFiles).toContain('docs/product/prd.md');
    expect(result.forbiddenMatches).toEqual(
      expect.arrayContaining(['docs/product/prd.md', 'ContextForge_PRD.md']),
    );
  });
});
