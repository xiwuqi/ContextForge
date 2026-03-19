import path from 'node:path';
import { exportClaudePrompt } from '../../core/export/claude.js';
import { normalizeRelativePath } from '../../core/utils/paths.js';
import { type CliRuntime } from '../io.js';

export interface ExportClaudeCommandOptions {
  input: string;
  output?: string;
}

export async function runExportClaudeCommand(
  runtime: CliRuntime,
  options: ExportClaudeCommandOptions,
): Promise<void> {
  const result = await exportClaudePrompt({
    rootDir: runtime.cwd,
    input: options.input,
    output: options.output,
  });

  runtime.io.stdout(`Wrote Claude brief to ${normalizeRelativePath(path.relative(runtime.cwd, result.outputPath))}`);
}
