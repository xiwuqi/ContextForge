#!/usr/bin/env node
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parsePublishDryRun, validatePublishManifest } from './lib/publish-checks.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

try {
  const result = await runCommand('npm', ['publish', '--dry-run', '--json'], repoRoot);
  const manifest = parsePublishDryRun(result.stdout);
  const validation = validatePublishManifest(manifest);

  if (!validation.passed) {
    const problems = [
      ...validation.missingRequiredFiles.map((entry) => `Missing required package file: ${entry}`),
      ...validation.unexpectedNonDistFiles.map((entry) => `Unexpected non-runtime file in package: ${entry}`),
      ...validation.forbiddenMatches.map((entry) => `Forbidden package file leaked into publishable set: ${entry}`),
    ];
    throw new Error(problems.join('\n'));
  }

  console.log(`npm publish --dry-run succeeded for ${manifest.name}@${manifest.version}.`);
  console.log(`Publishable tarball: ${manifest.filename}`);
  console.log(`Published file count: ${validation.publishedPaths.length}`);
  console.log('Package content sanity check passed.');

  if (result.stderr.trim()) {
    console.log('npm notices:');
    console.log(result.stderr.trim());
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  console.error('Manual publish dry-run failed. Inspect the output above, confirm package metadata, and rerun `npm run publish:dry-run`.');
  process.exitCode = 1;
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (runError) => {
      reject(new Error(`Failed to start command "${command}": ${runError.message}`));
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          [
            `Command failed: ${command} ${args.join(' ')}`,
            stdout.trim() ? `Stdout:\n${stdout.trim()}` : '',
            stderr.trim() ? `Stderr:\n${stderr.trim()}` : '',
          ]
            .filter(Boolean)
            .join('\n\n'),
        ),
      );
    });
  });
}
