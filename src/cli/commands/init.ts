import path from 'node:path';
import { AGENTS_SUGGESTED_FILE, DEFAULT_SCAN_MAX_DEPTH } from '../../core/utils/constants.js';
import { findRepositoryRoot, resolveFromRoot } from '../../core/utils/paths.js';
import { tryReadTextFile, writeTextFile } from '../../core/utils/filesystem.js';
import { scanRepository } from '../../core/scan/scanner.js';
import { writeContextArtifacts } from '../../core/scan/render.js';
import { printJson, type CliRuntime } from '../io.js';

export interface InitCommandOptions {
  json?: boolean;
  writeAgents?: boolean;
}

export async function runInitCommand(runtime: CliRuntime, options: InitCommandOptions): Promise<void> {
  const rootDir = await findRepositoryRoot(runtime.cwd);
  const context = await scanRepository({ rootDir, maxDepth: DEFAULT_SCAN_MAX_DEPTH });
  const writtenArtifacts = await writeContextArtifacts(rootDir, context);
  let agentsWritten = false;

  if (options.writeAgents) {
    const suggestedAgents = await tryReadTextFile(resolveFromRoot(rootDir, AGENTS_SUGGESTED_FILE));
    if (suggestedAgents) {
      await writeTextFile(path.join(rootDir, 'AGENTS.md'), `${suggestedAgents.trim()}\n`);
      agentsWritten = true;
    }
  }

  if (options.json) {
    printJson(runtime.io, {
      rootDir,
      writtenArtifacts,
      agentsWritten,
    });
    return;
  }

  runtime.io.stdout(`Initialized ContextForge in ${rootDir}`);
  runtime.io.stdout(`Wrote ${writtenArtifacts.join(', ')}`);
  runtime.io.stdout(
    agentsWritten
      ? 'Updated AGENTS.md from the generated suggestion.'
      : 'Preserved top-level AGENTS.md. Use --write-agents to write the generated suggestion.',
  );
}
