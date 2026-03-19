import path from 'node:path';
import { exportCodexPrompt } from '../../core/export/codex.js';
import { normalizeRelativePath } from '../../core/utils/paths.js';
import { type CliRuntime } from '../io.js';

export interface ExportCodexCommandOptions {
  input: string;
  output?: string;
}

export async function runExportCodexCommand(
  runtime: CliRuntime,
  options: ExportCodexCommandOptions,
): Promise<void> {
  const result = await exportCodexPrompt({
    rootDir: runtime.cwd,
    input: options.input,
    output: options.output,
  });

  runtime.io.stdout(`Wrote Codex prompt to ${normalizeRelativePath(path.relative(runtime.cwd, result.outputPath))}`);
}
