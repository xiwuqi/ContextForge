#!/usr/bin/env node
import crypto from 'node:crypto';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { parsePublishDryRun, validatePublishManifest } from './lib/publish-checks.mjs';
import {
  buildChecksums,
  buildReleaseManifest,
  buildReleaseNotes,
  buildSummary,
  parsePackManifest,
} from './lib/release-artifacts.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJsonPath = path.join(repoRoot, 'package.json');
const changelogPath = path.join(repoRoot, 'CHANGELOG.md');

try {
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  if (typeof packageJson.version !== 'string' || packageJson.version.trim().length === 0) {
    throw new Error('package.json is missing a usable version string.');
  }

  await stat(changelogPath);

  const version = packageJson.version.trim();
  const releaseDir = path.join(repoRoot, '.contextforge', 'releases', version);
  const generatedAt = new Date().toISOString();

  await runCommand('npm', ['run', 'release:check'], repoRoot, 'inherit');
  const publishResult = await runCommand('npm', ['publish', '--dry-run', '--json'], repoRoot, 'pipe');
  const publishManifest = parsePublishDryRun(publishResult.stdout);
  const publishValidation = validatePublishManifest(publishManifest);
  if (!publishValidation.passed) {
    throw new Error(
      [
        ...publishValidation.missingRequiredFiles.map((entry) => `Missing required package file: ${entry}`),
        ...publishValidation.unexpectedNonDistFiles.map((entry) => `Unexpected non-runtime file in package: ${entry}`),
        ...publishValidation.forbiddenMatches.map((entry) => `Forbidden package file leaked into publishable set: ${entry}`),
      ].join('\n'),
    );
  }

  await rm(releaseDir, { recursive: true, force: true });
  await mkdir(releaseDir, { recursive: true });

  const packResult = await runCommand(
    'npm',
    ['pack', '--json', '--silent', '--pack-destination', releaseDir],
    repoRoot,
    'pipe',
  );
  const packManifest = parsePackManifest(packResult.stdout);
  const packValidation = validatePublishManifest(packManifest);
  if (!packValidation.passed) {
    throw new Error(
      [
        ...packValidation.missingRequiredFiles.map((entry) => `Missing required packed file: ${entry}`),
        ...packValidation.unexpectedNonDistFiles.map((entry) => `Unexpected packed non-runtime file: ${entry}`),
        ...packValidation.forbiddenMatches.map((entry) => `Forbidden packed file leaked into tarball: ${entry}`),
      ].join('\n'),
    );
  }

  const tarballPath = path.join(releaseDir, packManifest.filename);
  const tarballBuffer = await readFile(tarballPath);
  const tarballStat = await stat(tarballPath);
  const sha256 = crypto.createHash('sha256').update(tarballBuffer).digest('hex');
  const readme = await readFile(path.join(repoRoot, 'README.md'), 'utf8');
  const changelog = await readFile(changelogPath, 'utf8');

  const manifest = buildReleaseManifest({
    packageName: packageJson.name,
    version,
    tarballFilename: packManifest.filename,
    tarballSizeBytes: tarballStat.size,
    sha256,
    generatedAt,
    nodeVersion: process.version,
    releaseCheckPassed: true,
    publishDryRunPassed: true,
  });
  const packageFiles = {
    packageName: packageJson.name,
    packageVersion: version,
    generatedAt,
    files: packManifest.files,
  };
  const releaseNotes = buildReleaseNotes({
    packageName: packageJson.name,
    version,
    readme,
    changelog,
  });
  const checksums = buildChecksums([{ filename: packManifest.filename, sha256 }]);
  const summary = buildSummary({
    version,
    tarballFilename: relativeFromRepo(tarballPath),
    manifestPath: relativeFromRepo(path.join(releaseDir, 'manifest.json')),
    packageFilesPath: relativeFromRepo(path.join(releaseDir, 'package-files.json')),
    releaseNotesPath: relativeFromRepo(path.join(releaseDir, 'release-notes.md')),
    checksumsPath: relativeFromRepo(path.join(releaseDir, 'checksums.txt')),
  });

  await writeFile(path.join(releaseDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await writeFile(path.join(releaseDir, 'package-files.json'), `${JSON.stringify(packageFiles, null, 2)}\n`, 'utf8');
  await writeFile(path.join(releaseDir, 'release-notes.md'), releaseNotes, 'utf8');
  await writeFile(path.join(releaseDir, 'checksums.txt'), checksums, 'utf8');
  await writeFile(path.join(releaseDir, 'summary.txt'), summary, 'utf8');

  console.log(`Wrote release artifact bundle to ${relativeFromRepo(releaseDir)}`);
  console.log(`Tarball: ${relativeFromRepo(tarballPath)}`);
  console.log(`Release notes: ${relativeFromRepo(path.join(releaseDir, 'release-notes.md'))}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  console.error('Release artifact generation failed. Fix the failing precondition above, then rerun `npm run release:artifacts`.');
  process.exitCode = 1;
}

function relativeFromRepo(targetPath) {
  return path.relative(repoRoot, targetPath).split(path.sep).join('/');
}

function runCommand(command, args, cwd, stdioMode) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      shell: process.platform === 'win32',
      stdio: stdioMode === 'inherit' ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    if (stdioMode !== 'inherit') {
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
    }

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
