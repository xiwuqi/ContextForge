export const REQUIRED_PACKAGE_FILES = [
  'LICENSE',
  'README.md',
  'package.json',
  'dist/cli/index.js',
  'dist/cli/app.js',
  'dist/core/compile/compiler.js',
  'dist/core/export/codex.js',
  'dist/core/export/claude.js',
  'dist/core/export/cursor.js',
  'dist/core/lint/linter.js',
  'dist/core/scan/scanner.js',
];

export const ALLOWED_NON_DIST_FILES = new Set([
  'CHANGELOG.md',
  'LICENSE',
  'README.md',
  'package.json',
]);

export const FORBIDDEN_PACKAGE_PATH_PREFIXES = [
  '.contextforge/',
  '.github/',
  'docs/',
  'examples/',
  'scripts/',
  'src/',
  'tests/',
];

export const FORBIDDEN_PACKAGE_FILES = [
  '.editorconfig',
  '.prettierrc.json',
  'AGENTS.md',
  'ContextForge_PRD.md',
  'eslint.config.js',
  'tsconfig.build.json',
  'tsconfig.json',
  'vitest.config.mjs',
];

export function parsePublishDryRun(stdout) {
  let parsed;

  try {
    parsed = JSON.parse(stdout.trim());
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse npm publish --dry-run output as JSON: ${detail}`);
  }

  const manifest = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!manifest || typeof manifest !== 'object' || !Array.isArray(manifest.files)) {
    throw new Error('npm publish --dry-run did not return the expected package manifest.');
  }

  return manifest;
}

export function validatePublishManifest(manifest) {
  const publishedPaths = manifest.files.map((entry) => entry.path);
  const missingRequiredFiles = REQUIRED_PACKAGE_FILES.filter((entry) => !publishedPaths.includes(entry));
  const unexpectedNonDistFiles = publishedPaths.filter(
    (entry) => !entry.startsWith('dist/') && !ALLOWED_NON_DIST_FILES.has(entry),
  );
  const forbiddenMatches = [
    ...FORBIDDEN_PACKAGE_FILES.filter((entry) => publishedPaths.includes(entry)),
    ...publishedPaths.filter((entry) =>
      FORBIDDEN_PACKAGE_PATH_PREFIXES.some((prefix) => entry.startsWith(prefix)),
    ),
  ];

  return {
    publishedPaths,
    missingRequiredFiles,
    unexpectedNonDistFiles,
    forbiddenMatches,
    passed:
      missingRequiredFiles.length === 0 &&
      unexpectedNonDistFiles.length === 0 &&
      forbiddenMatches.length === 0,
  };
}
