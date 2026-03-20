#!/usr/bin/env node
import path from 'node:path';
import { spawn } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import {
  DEFAULT_REPO_METADATA_PATH,
  buildGhReleaseCreateArgs,
  buildGhRepoEditArgs,
  buildGhTopicsArgs,
  buildNpmPublishArgs,
  buildReleaseSuccessSummary,
  ensureReleaseVersionMatchesPackage,
  parseBooleanInput,
  parseRepoMetadataConfig,
  relativeRepoPath,
  resolveRepoSlug,
  validateChangelogForVersion,
} from './lib/release-automation.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJsonPath = path.join(repoRoot, 'package.json');
const changelogPath = path.join(repoRoot, 'CHANGELOG.md');

const { positionals, values } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: {
    version: { type: 'string' },
    repo: { type: 'string' },
    metadata: { type: 'string' },
    target: { type: 'string' },
    prerelease: { type: 'string' },
    'npm-tag': { type: 'string' },
    'metadata-synced': { type: 'string' },
    'npm-published': { type: 'string' },
    'release-created': { type: 'string' },
  },
});

const command = positionals[0];

try {
  switch (command) {
    case 'preflight':
      await runPreflight(values);
      break;
    case 'sync-metadata':
      await runSyncMetadata(values);
      break;
    case 'github-release':
      await runGithubRelease(values);
      break;
    case 'npm-publish':
      await runNpmPublish(values);
      break;
    case 'verify':
      await runVerify(values);
      break;
    default:
      throw new Error(
        'Unknown release automation command. Use one of: preflight, sync-metadata, github-release, npm-publish, verify.',
      );
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
}

async function runPreflight(options) {
  const packageJson = await readPackageJson();
  const version = ensureReleaseVersionMatchesPackage(packageJson, options.version);
  const changelog = await readFile(changelogPath, 'utf8');
  validateChangelogForVersion(changelog, version);
  const metadata = await readRepoMetadata(options.metadata);

  console.log(`Release preflight passed for ${packageJson.name}@${version}.`);
  console.log(`Repo metadata topics: ${metadata.topics.join(', ')}`);
  console.log(
    'Next steps: run `npm run release:check`, `npm run release:artifacts`, then trigger metadata sync, GitHub Release creation, and npm publish as configured.',
  );
}

async function runSyncMetadata(options) {
  const metadata = await readRepoMetadata(options.metadata);
  const repo = await resolveRepo(options.repo);

  await runCommand('gh', buildGhRepoEditArgs({ repo, metadata }), { cwd: repoRoot, stdio: 'pipe' });
  await runCommand('gh', buildGhTopicsArgs({ repo, topics: metadata.topics }), { cwd: repoRoot, stdio: 'pipe' });

  const repoState = JSON.parse(
    (
      await runCommand('gh', ['api', `repos/${repo}`], {
        cwd: repoRoot,
        stdio: 'pipe',
      })
    ).stdout.trim(),
  );
  const topicsState = JSON.parse(
    (
      await runCommand('gh', ['api', `repos/${repo}/topics`, '-H', 'Accept: application/vnd.github+json'], {
        cwd: repoRoot,
        stdio: 'pipe',
      })
    ).stdout.trim(),
  );

  if (repoState.description !== metadata.description) {
    throw new Error(
      `Repository description did not update cleanly. Expected "${metadata.description}" but found "${repoState.description ?? ''}".`,
    );
  }
  if ((repoState.homepage ?? '') !== metadata.homepage) {
    throw new Error(
      `Repository homepage did not update cleanly. Expected "${metadata.homepage}" but found "${repoState.homepage ?? ''}".`,
    );
  }

  const actualTopics = Array.isArray(topicsState.names) ? [...topicsState.names].sort() : [];
  const expectedTopics = [...metadata.topics].sort();
  if (JSON.stringify(actualTopics) !== JSON.stringify(expectedTopics)) {
    throw new Error(
      `Repository topics did not update cleanly. Expected "${expectedTopics.join(', ')}" but found "${actualTopics.join(', ')}".`,
    );
  }

  console.log(`Repository metadata synced for ${repo}.`);
}

async function runGithubRelease(options) {
  const packageJson = await readPackageJson();
  const version = ensureReleaseVersionMatchesPackage(packageJson, options.version);
  const repo = await resolveRepo(options.repo);
  const prerelease = parseBooleanInput(options.prerelease, false);
  const bundle = await readReleaseBundle(version);
  const tag = `v${version}`;

  const existingRelease = await runOptionalCommand('gh', ['release', 'view', tag, '--repo', repo, '--json', 'url'], {
    cwd: repoRoot,
    stdio: 'pipe',
  });
  if (existingRelease.code === 0) {
    throw new Error(`GitHub Release ${tag} already exists for ${repo}. Refusing to overwrite it.`);
  }
  if (!isGhNotFound(existingRelease.stderr)) {
    throw new Error(existingRelease.stderr.trim() || `Failed to check whether GitHub Release ${tag} exists.`);
  }

  const createArgs = buildGhReleaseCreateArgs({
    repo,
    tag,
    target: options.target,
    notesFile: bundle.releaseNotesPath,
    assets: [bundle.tarballPath, bundle.checksumsPath],
    prerelease,
  });
  await runCommand('gh', createArgs, { cwd: repoRoot, stdio: 'inherit' });

  const release = await verifyGithubRelease(repo, tag, bundle, prerelease);
  console.log(`GitHub Release created: ${release.url}`);
}

async function runNpmPublish(options) {
  const packageJson = await readPackageJson();
  const version = ensureReleaseVersionMatchesPackage(packageJson, options.version);
  const npmTag = normalizeRequiredString(options['npm-tag'], 'npm tag');
  const bundle = await readReleaseBundle(version);
  const packageIdentifier = `${packageJson.name}@${version}`;
  const existingVersion = await runOptionalCommand(
    'npm',
    ['view', packageIdentifier, 'version', '--json'],
    { cwd: repoRoot, stdio: 'pipe' },
  );

  if (existingVersion.code === 0) {
    const publishedVersion = parseNpmViewVersion(existingVersion.stdout);
    if (publishedVersion === version) {
      throw new Error(`${packageIdentifier} is already published on npm. Refusing to publish it again.`);
    }
  }

  const useTokenAuth = Boolean(process.env.NODE_AUTH_TOKEN || process.env.NPM_TOKEN);
  const publishArgs = buildNpmPublishArgs({
    tarballPath: bundle.tarballPath,
    npmTag,
    useTokenAuth,
  });
  await runCommand('npm', publishArgs, { cwd: repoRoot, stdio: 'inherit' });

  const verified = await runCommand('npm', ['view', packageIdentifier, 'version', '--json'], {
    cwd: repoRoot,
    stdio: 'pipe',
  });
  const publishedVersion = parseNpmViewVersion(verified.stdout);
  if (publishedVersion !== version) {
    throw new Error(`npm publish verification failed. Expected version "${version}" but found "${publishedVersion}".`);
  }

  console.log(`npm publish verification passed for ${packageIdentifier} on tag "${npmTag}".`);
}

async function runVerify(options) {
  const packageJson = await readPackageJson();
  const version = ensureReleaseVersionMatchesPackage(packageJson, options.version);
  const repo = await resolveRepo(options.repo);
  const metadataSynced = parseBooleanInput(options['metadata-synced'], false);
  const releaseCreated = parseBooleanInput(options['release-created'], false);
  const npmPublished = parseBooleanInput(options['npm-published'], false);
  const npmTag = options['npm-tag'] ? String(options['npm-tag']).trim() : null;
  let releaseUrl = null;

  if (metadataSynced) {
    const metadata = await readRepoMetadata(options.metadata);
    const repoState = JSON.parse(
      (
        await runCommand('gh', ['api', `repos/${repo}`], {
          cwd: repoRoot,
          stdio: 'pipe',
        })
      ).stdout.trim(),
    );
    if (repoState.description !== metadata.description || (repoState.homepage ?? '') !== metadata.homepage) {
      throw new Error('Repository metadata verification failed after sync.');
    }
  }

  if (releaseCreated) {
    const bundle = await readReleaseBundle(version);
    const release = await verifyGithubRelease(
      repo,
      `v${version}`,
      bundle,
      parseBooleanInput(options.prerelease, false),
    );
    releaseUrl = release.url;
  }

  if (npmPublished) {
    const packageIdentifier = `${packageJson.name}@${version}`;
    const published = await runCommand('npm', ['view', packageIdentifier, 'version', '--json'], {
      cwd: repoRoot,
      stdio: 'pipe',
    });
    const publishedVersion = parseNpmViewVersion(published.stdout);
    if (publishedVersion !== version) {
      throw new Error(`Post-release npm verification failed. Expected "${version}" but found "${publishedVersion}".`);
    }
  }

  const summary = buildReleaseSuccessSummary({
    version,
    packageName: packageJson.name,
    releaseUrl,
    metadataSynced,
    npmPublished,
    npmTag,
  });

  console.log(summary.trimEnd());
}

async function verifyGithubRelease(repo, tag, bundle, expectedPrerelease) {
  const result = await runCommand(
    'gh',
    ['release', 'view', tag, '--repo', repo, '--json', 'url,assets,isPrerelease'],
    { cwd: repoRoot, stdio: 'pipe' },
  );
  const release = JSON.parse(result.stdout.trim());
  const assetNames = Array.isArray(release.assets) ? release.assets.map((entry) => entry.name) : [];

  if (!assetNames.includes(path.basename(bundle.tarballPath))) {
    throw new Error(`GitHub Release ${tag} is missing asset ${path.basename(bundle.tarballPath)}.`);
  }
  if (!assetNames.includes(path.basename(bundle.checksumsPath))) {
    throw new Error(`GitHub Release ${tag} is missing asset ${path.basename(bundle.checksumsPath)}.`);
  }
  if (Boolean(release.isPrerelease) !== Boolean(expectedPrerelease)) {
    throw new Error(`GitHub Release ${tag} prerelease state did not match the requested value.`);
  }

  return release;
}

async function readReleaseBundle(version) {
  const releaseDir = path.join(repoRoot, '.contextforge', 'releases', version);
  const manifestPath = path.join(releaseDir, 'manifest.json');
  const checksumsPath = path.join(releaseDir, 'checksums.txt');
  const releaseNotesPath = path.join(releaseDir, 'release-notes.md');

  await ensureFileExists(manifestPath, 'release manifest');
  await ensureFileExists(checksumsPath, 'release checksums');
  await ensureFileExists(releaseNotesPath, 'release notes');

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (typeof manifest.tarballFilename !== 'string' || manifest.tarballFilename.trim().length === 0) {
    throw new Error(`Release manifest at ${relativeRepoPath(repoRoot, manifestPath)} is missing tarballFilename.`);
  }

  const tarballPath = path.join(releaseDir, manifest.tarballFilename);
  await ensureFileExists(tarballPath, 'release tarball');

  return {
    releaseDir,
    manifestPath,
    checksumsPath,
    releaseNotesPath,
    tarballPath,
  };
}

async function ensureFileExists(targetPath, label) {
  try {
    await access(targetPath, fsConstants.F_OK);
  } catch {
    throw new Error(
      `Missing ${label} at ${relativeRepoPath(repoRoot, targetPath)}. Run \`npm run release:artifacts\` first.`,
    );
  }
}

async function readRepoMetadata(inputPath) {
  const metadataPath = path.join(repoRoot, inputPath ?? DEFAULT_REPO_METADATA_PATH);
  const raw = await readFile(metadataPath, 'utf8');
  return parseRepoMetadataConfig(raw);
}

async function resolveRepo(explicitRepo) {
  const remoteUrl = await getGitOriginUrl();
  return resolveRepoSlug({
    explicitRepo,
    envRepo: process.env.GITHUB_REPOSITORY,
    remoteUrl,
  });
}

async function getGitOriginUrl() {
  const result = await runOptionalCommand('git', ['remote', 'get-url', 'origin'], {
    cwd: repoRoot,
    stdio: 'pipe',
  });

  if (result.code !== 0) {
    return null;
  }

  return result.stdout.trim();
}

async function readPackageJson() {
  return JSON.parse(await readFile(packageJsonPath, 'utf8'));
}

function parseNpmViewVersion(stdout) {
  const trimmed = stdout.trim();
  if (trimmed.length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed === 'string' ? parsed : null;
  } catch {
    return trimmed.replace(/^"|"$/g, '');
  }
}

function isGhNotFound(stderr) {
  const message = stderr.trim().toLowerCase();
  return message.includes('not found') || message.includes('404');
}

function normalizeRequiredString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}

function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      shell: process.platform === 'win32',
      stdio: options.stdio === 'inherit' ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    if (options.stdio !== 'inherit') {
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
    }

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
            options.cwd ? `Working directory: ${options.cwd}` : '',
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

function runOptionalCommand(command, args, options) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
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
    child.on('error', (error) => {
      resolve({
        code: 1,
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
      });
    });
    child.on('close', (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}
