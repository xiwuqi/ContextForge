import path from 'node:path';
import { compileTask } from '../../core/compile/compiler.js';
import { normalizeRelativePath } from '../../core/utils/paths.js';
import { printJson, type CliRuntime } from '../io.js';

export interface CompileCommandOptions {
  input: string;
  json?: boolean;
  title?: string;
}

export async function runCompileCommand(runtime: CliRuntime, options: CompileCommandOptions): Promise<void> {
  const result = await compileTask({
    rootDir: runtime.cwd,
    inputFile: options.input,
    title: options.title,
  });

  if (options.json) {
    printJson(runtime.io, result.taskPack);
    return;
  }

  runtime.io.stdout(`Compiled task pack ${result.taskPack.taskId}`);
  runtime.io.stdout(`JSON: ${normalizeRelativePath(path.relative(runtime.cwd, result.jsonPath))}`);
  runtime.io.stdout(`Markdown: ${normalizeRelativePath(path.relative(runtime.cwd, result.markdownPath))}`);
}
