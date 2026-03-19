import { writeContextArtifacts } from '../../core/scan/render.js';
import { scanRepository } from '../../core/scan/scanner.js';
import { DEFAULT_SCAN_MAX_DEPTH } from '../../core/utils/constants.js';
import { findRepositoryRoot } from '../../core/utils/paths.js';
import { printJson, type CliRuntime } from '../io.js';

export interface ScanCommandOptions {
  json?: boolean;
  maxDepth?: number;
}

export async function runScanCommand(runtime: CliRuntime, options: ScanCommandOptions): Promise<void> {
  const rootDir = await findRepositoryRoot(runtime.cwd);
  const context = await scanRepository({
    rootDir,
    maxDepth: options.maxDepth ?? DEFAULT_SCAN_MAX_DEPTH,
  });
  const writtenArtifacts = await writeContextArtifacts(rootDir, context);

  if (options.json) {
    printJson(runtime.io, {
      rootDir,
      context,
      writtenArtifacts,
    });
    return;
  }

  runtime.io.stdout(`Scanned ${context.repo.name}`);
  runtime.io.stdout(`Languages: ${context.repo.detectedLanguages.join(', ') || 'unknown'}`);
  runtime.io.stdout(`Frameworks: ${context.repo.detectedFrameworks.join(', ') || 'none detected'}`);
  runtime.io.stdout(`Wrote ${writtenArtifacts.join(', ')}`);
}
