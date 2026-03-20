#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cp, mkdir, stat } from 'node:fs/promises';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const demoDir = path.join(repoRoot, 'examples', 'demo');
const assetMap = [
  ['tests/fixtures/golden/task-add-lint-command.md', 'examples/demo/task-pack-add-lint.md'],
  ['tests/fixtures/golden/github-issue-task-pack.json', 'examples/demo/task-pack-github-issue.json'],
  ['tests/fixtures/golden/export-codex.prompt.md', 'examples/demo/codex-add-lint.md'],
  ['tests/fixtures/golden/export-claude.prompt.md', 'examples/demo/claude-github-issue.md'],
  ['tests/fixtures/golden/export-cursor.prompt.md', 'examples/demo/cursor-github-issue.md'],
  ['tests/fixtures/golden/export-cursor.rule.mdc', 'examples/demo/cursor-github-issue-rule.mdc'],
];

try {
  await mkdir(demoDir, { recursive: true });

  for (const [sourceRelativePath, targetRelativePath] of assetMap) {
    const sourcePath = path.join(repoRoot, sourceRelativePath);
    const targetPath = path.join(repoRoot, targetRelativePath);
    await stat(sourcePath);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await cp(sourcePath, targetPath, { force: true });
  }

  console.log(`Refreshed ${assetMap.length} demo assets in examples/demo.`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to refresh demo assets: ${message}`);
  console.error('Make sure the golden fixture files exist before refreshing demo assets.');
  process.exitCode = 1;
}
