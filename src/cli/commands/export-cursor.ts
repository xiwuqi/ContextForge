import path from 'node:path';
import { exportCursorPrompt } from '../../core/export/cursor.js';
import { normalizeRelativePath } from '../../core/utils/paths.js';
import { type CliRuntime } from '../io.js';

export interface ExportCursorCommandOptions {
  input: string;
  output?: string;
  ruleOutput?: string;
}

export async function runExportCursorCommand(
  runtime: CliRuntime,
  options: ExportCursorCommandOptions,
): Promise<void> {
  const result = await exportCursorPrompt({
    rootDir: runtime.cwd,
    input: options.input,
    output: options.output,
    ruleOutput: options.ruleOutput,
  });

  runtime.io.stdout(`Wrote Cursor brief to ${normalizeRelativePath(path.relative(runtime.cwd, result.outputPath))}`);

  if (result.ruleOutputPath) {
    runtime.io.stdout(
      `Wrote Cursor rule suggestion to ${normalizeRelativePath(path.relative(runtime.cwd, result.ruleOutputPath))}`,
    );
  }
}
