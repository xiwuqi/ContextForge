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

export function extractVersionHighlights(changelog, version) {
  const lines = changelog.split(/\r?\n/);
  const headingPattern = new RegExp(`^##\\s+v?${escapeRegExp(version)}(?:\\s+-\\s+\\d{4}-\\d{2}-\\d{2})?\\s*$`);
  const startIndex = lines.findIndex((line) => headingPattern.test(line.trim()));

  if (startIndex === -1) {
    return [];
  }

  const highlights = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (line.startsWith('## ')) {
      break;
    }
    if (line.length === 0 || line.startsWith('### ')) {
      continue;
    }
    if (line.startsWith('- ')) {
      highlights.push(line.slice(2).trim());
      continue;
    }
    highlights.push(line);
  }

  return highlights;
}

export function extractIntroParagraph(readme) {
  const lines = readme.split(/\r?\n/);
  let seenTitle = false;
  const paragraph = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!seenTitle) {
      if (trimmed.startsWith('# ')) {
        seenTitle = true;
      }
      continue;
    }

    if (trimmed.length === 0) {
      if (paragraph.length > 0) {
        break;
      }
      continue;
    }
    if (trimmed.startsWith('#')) {
      break;
    }
    if (trimmed.startsWith('![') || trimmed.startsWith('<img')) {
      if (paragraph.length > 0) {
        break;
      }
      continue;
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
  const highlights = extractVersionHighlights(changelog, version);
  const fallbackHighlights = extractSectionBullets(changelog, '### Release-candidate scope');
  const exports = extractSupportedExports(readme);
  const releaseHighlights =
    (highlights.length > 0 ? highlights : fallbackHighlights).length > 0
      ? (highlights.length > 0 ? highlights : fallbackHighlights).map((entry) => `- ${entry}`)
      : ['- Local-first CLI release with repository scan, task-pack compile, and agent brief export workflows.'];

  const sections = [
    `# ${title} v${version}`,
    '',
    summary || `${title} is a local-first repository-to-agent context CLI.`,
    '',
    '## Highlights',
    '',
    ...releaseHighlights,
    '',
    '## Supported exports',
    '',
    ...exports.map((entry) => `- ${entry}`),
    '',
    '## Install',
    '',
    '```bash',
    `npm i ${packageName}`,
    '```',
    '',
    '## Validation',
    '',
    '- `npm run release:check`',
    '- `npm run publish:dry-run`',
    '',
    '## Notes',
    '',
    `- Package: \`${packageName}\``,
    '- CLI command: `contextforge`',
    '- Local-first core workflow with no required hosted service.',
  ];

  return `${sections.join('\n')}\n`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    'Next steps:',
    '- Review release-notes.md and CHANGELOG.md',
    '- Confirm release workflow permissions, metadata sync token, and npm publishing setup',
    '- Trigger the manual GitHub Actions release workflow when ready',
    '- If the workflow cannot perform a step, complete only that remaining step manually',
  ];

  return `${lines.join('\n')}\n`;
}
