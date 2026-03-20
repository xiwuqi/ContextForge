#!/usr/bin/env node
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'contextforge-pack-'));
const packDir = path.join(tempRoot, 'pack');
const installDir = path.join(tempRoot, 'install');
const fixtureDir = path.join(tempRoot, 'fixture');

try {
  await mkdir(packDir, { recursive: true });
  await mkdir(installDir, { recursive: true });

  const packResult = await runCommand(resolveCommand('npm'), [
    'pack',
    '--json',
    '--silent',
    '--pack-destination',
    packDir,
  ], {
    cwd: repoRoot,
  });
  const tarballPath = path.join(packDir, parsePackFilename(packResult.stdout));

  await stat(tarballPath);

  await writeFile(
    path.join(installDir, 'package.json'),
    `${JSON.stringify({ name: 'contextforge-pack-smoke', private: true }, null, 2)}\n`,
    'utf8',
  );

  await runCommand(resolveCommand('npm'), [
    'install',
    '--offline',
    '--no-audit',
    '--no-fund',
    tarballPath,
  ], {
    cwd: installDir,
  });

  const versionResult = await runCommand(resolveCommand('npm'), [
    'exec',
    '--prefix',
    installDir,
    '--',
    'contextforge',
    '--version',
  ], {
    cwd: installDir,
  });
  assertEqual(
    versionResult.stdout.trim(),
    packageJson.version,
    `Installed CLI reported version "${versionResult.stdout.trim()}" instead of "${packageJson.version}".`,
  );

  await cp(path.join(repoRoot, 'tests', 'fixtures', 'node-basic'), fixtureDir, { recursive: true });
  const scanResult = await runCommand(resolveCommand('npm'), [
    'exec',
    '--prefix',
    installDir,
    '--',
    'contextforge',
    'scan',
    '--json',
  ], {
    cwd: fixtureDir,
  });
  const scanJson = parseJson(scanResult.stdout, 'scan --json output');

  if (!Array.isArray(scanJson.context?.repo?.detectedLanguages) || !scanJson.context.repo.detectedLanguages.includes('typescript')) {
    throw new Error('Packaged CLI smoke test expected scan output to include the fixture TypeScript signal.');
  }

  if (!Array.isArray(scanJson.writtenArtifacts) || !scanJson.writtenArtifacts.includes('.contextforge/context.json')) {
    throw new Error('Packaged CLI smoke test expected scan output to report `.contextforge/context.json` as a written artifact.');
  }

  await stat(path.join(fixtureDir, '.contextforge', 'context.json'));
  console.log(`Package smoke test passed with ${path.basename(tarballPath)}.`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  console.error('If offline tarball installation failed locally, run `npm ci` first so npm can reuse the local dependency cache.');
  process.exitCode = 1;
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

function resolveCommand(name) {
  return name;
}

function parsePackFilename(stdout) {
  const parsed = parseJson(stdout, 'npm pack output');
  if (!Array.isArray(parsed) || parsed.length === 0 || typeof parsed[0]?.filename !== 'string') {
    throw new Error('npm pack did not return the expected tarball metadata.');
  }

  return parsed[0].filename;
}

function parseJson(raw, label) {
  try {
    return JSON.parse(raw.trim());
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse ${label} as JSON: ${detail}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message);
  }
}

function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(command, args, {
        cwd: options.cwd,
        env: options.env ?? process.env,
        shell: process.platform === 'win32',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      reject(new Error(`Failed to start command "${command}": ${detail}`));
      return;
    }

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      reject(new Error(`Failed to start command "${command}": ${error.message}`));
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
            `Working directory: ${options.cwd}`,
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
