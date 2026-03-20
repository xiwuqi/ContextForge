export function parsePackManifest(stdout) {
  let parsed;

  try {
    parsed = JSON.parse(stdout.trim());
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse npm pack output as JSON: ${detail}`);
  }

  const manifest = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!manifest || typeof manifest !== 'object' || typeof manifest.filename !== 'string' || !Array.isArray(manifest.files)) {
    throw new Error('npm pack did not return the expected pack manifest.');
  }

  return manifest;
}

export function extractSupportedExports(readme) {
  return readme
    .split(/\r?\n/)
    .filter((line) => line.startsWith('| ') && !line.includes('---'))
    .map((line) => line.split('|')[1]?.trim())
    .filter((value) => Boolean(value) && value !== 'Target');
}

export function extractSectionBullets(markdown, sectionHeading) {
  const lines = markdown.split(/\r?\n/);
  const sectionStart = lines.findIndex((line) => line.trim() === sectionHeading);
  if (sectionStart === -1) {
    return [];
  }

  const bullets = [];
  for (let index = sectionStart + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (line.startsWith('## ') || line.startsWith('### ')) {
      break;
    }
    if (line.startsWith('- ')) {
      bullets.push(line.slice(2).trim());
    }
  }

  return bullets;
}

export function extractIntroParagraph(readme) {
  const lines = readme.split(/\r?\n/);
  const bodyLines = lines.slice(1);
  const paragraph = [];

  for (const line of bodyLines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      if (paragraph.length > 0) {
        break;
      }
      continue;
    }
    if (trimmed.startsWith('## ')) {
      break;
    }
    paragraph.push(trimmed);
  }

  return paragraph.join(' ');
}

export function extractTitle(readme) {
  const line = readme.split(/\r?\n/).find((entry) => entry.startsWith('# '));
  return line ? line.slice(2).trim() : null;
}

export function buildReleaseNotes({ packageName, version, readme, changelog }) {
  const title = extractTitle(readme) ?? packageName;
  const summary = extractIntroParagraph(readme);
  const highlights = extractSectionBullets(changelog, '### Release-candidate scope');
  const exports = extractSupportedExports(readme);

  const sections = [
    `# ${title} v${version}`,
    '',
    'Draft release notes for manual maintainer review. This version has not been published yet.',
    '',
    '## Summary',
    '',
    summary || `${packageName} is a local-first repository-to-agent CLI.`,
    '',
    '## Included in this draft release',
    '',
    ...(highlights.length > 0
      ? highlights.map((entry) => `- ${entry}`)
      : ['- Local-first CLI release candidate with repository scan, task-pack compile, and agent brief export workflows.']),
    '',
    '## Supported exports',
    '',
    ...exports.map((entry) => `- ${entry}`),
    '',
    '## Validation completed before bundle generation',
    '',
    '- `npm run release:check`',
    '- `npm run publish:dry-run`',
    '',
    '## Manual steps remaining',
    '',
    '- Review this draft and `CHANGELOG.md`.',
    '- Update GitHub About text, topics, and homepage if needed.',
    '- Create the git tag manually.',
    '- Draft the GitHub Release manually.',
    '- Run `npm publish` manually when ready.',
    '- Verify the npm package page after publish.',
  ];

  return `${sections.join('\n')}\n`;
}

export function buildReleaseManifest({
  packageName,
  version,
  tarballFilename,
  tarballSizeBytes,
  sha256,
  generatedAt,
  nodeVersion,
  releaseCheckPassed,
  publishDryRunPassed,
}) {
  return {
    packageName,
    packageVersion: version,
    tarballFilename,
    tarballSizeBytes,
    sha256,
    generatedAt,
    nodeVersion,
    releaseCheckPassed,
    publishDryRunPassed,
  };
}

export function buildChecksums(entries) {
  return `${entries.map((entry) => `${entry.sha256}  ${entry.filename}`).join('\n')}\n`;
}

export function buildSummary({
  version,
  tarballFilename,
  manifestPath,
  packageFilesPath,
  releaseNotesPath,
  checksumsPath,
}) {
  const lines = [
    `ContextForge release bundle for v${version}`,
    '',
    'Checks run:',
    '- release:check passed',
    '- publish:dry-run passed',
    '',
    `Tarball: ${tarballFilename}`,
    `Manifest: ${manifestPath}`,
    `Package files: ${packageFilesPath}`,
    `Release notes: ${releaseNotesPath}`,
    `Checksums: ${checksumsPath}`,
    '',
    'Manual steps remaining:',
    '- Review release-notes.md and CHANGELOG.md',
    '- Update GitHub About text, topics, and homepage if needed',
    '- Create the version tag manually',
    '- Draft the GitHub Release manually',
    '- Run npm publish manually when ready',
    '- Verify the npm package page after publish',
  ];

  return `${lines.join('\n')}\n`;
}
