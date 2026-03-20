import path from 'node:path';

export const DEFAULT_REPO_METADATA_PATH = '.github/release/repo-metadata.json';
export const NPM_PUBLISH_VERIFY_MAX_ATTEMPTS = 15;
export const NPM_PUBLISH_VERIFY_DELAY_MS = 20_000;

export function parseRepoMetadataConfig(raw) {
  let parsed = raw;

  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse repo metadata config as JSON: ${detail}`);
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Repo metadata config must be a JSON object.');
  }

  const description = typeof parsed.description === 'string' ? parsed.description.trim() : '';
  const homepage = typeof parsed.homepage === 'string' ? parsed.homepage.trim() : '';
  const topics = Array.isArray(parsed.topics)
    ? parsed.topics
        .map((entry) => (typeof entry === 'string' ? entry.trim().toLowerCase() : ''))
        .filter((entry) => entry.length > 0)
    : [];

  if (description.length === 0) {
    throw new Error('Repo metadata config is missing a non-empty `description`.');
  }

  if (homepage.length === 0) {
    throw new Error('Repo metadata config is missing a non-empty `homepage`.');
  }

  try {
    const homepageUrl = new URL(homepage);
    if (!['http:', 'https:'].includes(homepageUrl.protocol)) {
      throw new Error('invalid protocol');
    }
  } catch {
    throw new Error('Repo metadata config `homepage` must be a valid http(s) URL.');
  }

  if (topics.length === 0) {
    throw new Error('Repo metadata config must include at least one topic.');
  }

  return {
    description,
    homepage,
    topics: [...new Set(topics)],
  };
}

export function ensureReleaseVersionMatchesPackage(packageJson, inputVersion) {
  const version = normalizeRequiredString(inputVersion, 'release version');
  const packageVersion = normalizeRequiredString(packageJson?.version, 'package.json version');

  if (version !== packageVersion) {
    throw new Error(
      `Release input version "${version}" does not match package.json version "${packageVersion}". Update package.json first or dispatch the workflow with the matching version.`,
    );
  }

  return version;
}

export function validateChangelogForVersion(changelog, version) {
  const normalizedVersion = normalizeRequiredString(version, 'release version');
  const section = extractVersionSection(changelog, normalizedVersion);

  if (!section) {
    throw new Error(
      `CHANGELOG.md does not contain a release entry for "${normalizedVersion}". Finalize the changelog in git before running the automated release workflow.`,
    );
  }

  const meaningfulLines = section.lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('## '));

  if (meaningfulLines.length === 0) {
    throw new Error(
      `CHANGELOG.md entry for "${normalizedVersion}" is empty. Add release notes before running the automated release workflow.`,
    );
  }

  return section;
}

export function extractVersionSection(changelog, version) {
  const lines = changelog.split(/\r?\n/);
  const headingPattern = new RegExp(`^##\\s+v?${escapeRegExp(version)}(?:\\s+-\\s+\\d{4}-\\d{2}-\\d{2})?\\s*$`);
  const startIndex = lines.findIndex((line) => headingPattern.test(line.trim()));

  if (startIndex === -1) {
    return null;
  }

  const sectionLines = [];
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (index > startIndex && line.trim().startsWith('## ')) {
      break;
    }
    sectionLines.push(line);
  }

  return {
    heading: lines[startIndex].trim(),
    lines: sectionLines,
  };
}

export function resolveRepoSlug({ explicitRepo, envRepo, remoteUrl }) {
  const candidates = [explicitRepo, envRepo];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return normalizeRepoSlug(candidate);
    }
  }

  if (typeof remoteUrl === 'string' && remoteUrl.trim().length > 0) {
    return parseRepoSlugFromUrl(remoteUrl);
  }

  throw new Error(
    'Unable to determine the GitHub repository slug. Pass `--repo owner/name`, set GITHUB_REPOSITORY, or ensure the git remote points at GitHub.',
  );
}

export function normalizeRepoSlug(value) {
  const trimmed = value.trim().replace(/^https:\/\/github\.com\//i, '').replace(/\.git$/i, '');
  const parts = trimmed.split('/').filter(Boolean);

  if (parts.length !== 2) {
    throw new Error(`Invalid repository slug "${value}". Expected "owner/name".`);
  }

  return `${parts[0]}/${parts[1]}`;
}

export function parseRepoSlugFromUrl(remoteUrl) {
  const trimmed = remoteUrl.trim();
  const httpsMatch = trimmed.match(/github\.com[:/](.+?)\/(.+?)(?:\.git)?$/i);

  if (!httpsMatch) {
    throw new Error(`Unsupported git remote for GitHub repository detection: ${remoteUrl}`);
  }

  return `${httpsMatch[1]}/${httpsMatch[2]}`;
}

export function buildGhRepoEditArgs({ repo, metadata }) {
  return ['repo', 'edit', repo, '--description', metadata.description, '--homepage', metadata.homepage];
}

export function buildGhTopicsArgs({ repo, topics }) {
  const args = ['api', '--method', 'PUT', `repos/${repo}/topics`, '-H', 'Accept: application/vnd.github+json'];

  for (const topic of topics) {
    args.push('-f', `names[]=${topic}`);
  }

  return args;
}

export function buildGhReleaseCreateArgs({ repo, tag, target, notesFile, assets, prerelease }) {
  const args = ['release', 'create', tag, ...assets, '--repo', repo, '--title', tag, '--notes-file', notesFile];

  if (target) {
    args.push('--target', target);
  }

  if (prerelease) {
    args.push('--prerelease');
  }

  return args;
}

export function buildNpmPublishArgs({ tarballPath, npmTag, useTokenAuth }) {
  const args = ['publish', tarballPath, '--tag', npmTag, '--access', 'public'];

  if (!useTokenAuth) {
    args.push('--provenance');
  }

  return args;
}

export function buildReleaseSuccessSummary({
  version,
  packageName,
  releaseUrl,
  metadataSynced,
  npmPublished,
  npmTag,
}) {
  const lines = [
    `Release automation summary for ${packageName}@${version}`,
    `Version: ${version}`,
    `Release URL: ${releaseUrl ?? 'not created'}`,
    `npm package: ${packageName}@${version}`,
    `npm tag: ${npmPublished ? (npmTag ?? 'latest') : 'not published'}`,
    `Metadata sync ran: ${metadataSynced ? 'yes' : 'no'}`,
    `npm publish ran: ${npmPublished ? 'yes' : 'no'}`,
  ];

  return `${lines.join('\n')}\n`;
}

export function parseNpmViewVersion(stdout) {
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

export function isNpmViewNotFound(stdout = '', stderr = '') {
  const message = `${stdout}\n${stderr}`.trim().toLowerCase();
  return message.includes('not found') || message.includes('e404');
}

export function classifyNpmViewVersionResult({ exitCode, stdout = '', stderr = '', expectedVersion }) {
  const actualVersion = exitCode === 0 ? parseNpmViewVersion(stdout) : null;
  const matchesExpectedVersion = actualVersion === expectedVersion;
  const retryable =
    (exitCode !== 0 && isNpmViewNotFound(stdout, stderr)) || (exitCode === 0 && !matchesExpectedVersion);

  return {
    actualVersion,
    matchesExpectedVersion,
    retryable,
  };
}

export function parseBooleanInput(value, defaultValue = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === undefined) {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean value "${value}". Expected true or false.`);
}

export function relativeRepoPath(rootDir, targetPath) {
  return path.relative(rootDir, targetPath).split(path.sep).join('/');
}

function normalizeRequiredString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is missing or empty.`);
  }

  return value.trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
