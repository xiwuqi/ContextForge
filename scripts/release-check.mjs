#!/usr/bin/env node
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const steps = [
  ['build', ['npm', 'run', 'build']],
  ['test', ['npm', 'run', 'test']],
  ['lint', ['npm', 'run', 'lint']],
  ['smoke:pack', ['npm', 'run', 'smoke:pack']],
  ['eval:fixtures', ['npm', 'run', 'eval:fixtures']],
  ['publish:dry-run', ['npm', 'run', 'publish:dry-run']],
];

try {
  for (const [index, step] of steps.entries()) {
    const [label, command] = step;
    console.log(`[${index + 1}/${steps.length}] ${command.join(' ')}`);
    await runCommand(command[0], command.slice(1), repoRoot);
    console.log(`Completed ${label}.`);
  }

  console.log('Release candidate checks passed.');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  console.error('Release candidate validation stopped. Fix the failing step above, then rerun `npm run release:check`.');
  process.exitCode = 1;
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      shell: process.platform === 'win32',
      stdio: 'inherit',
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to start command "${command}": ${error.message}`));
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed with exit code ${code}: ${command} ${args.join(' ')}`));
    });
  });
}
