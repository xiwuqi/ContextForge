import { Command } from 'commander';
import { runCompileCommand, runExportCodexCommand, runInitCommand, runLintCommand, runScanCommand } from './commands/index.js';
import { createDefaultIO, type CliIO, type CliRuntime } from './io.js';

export async function runCli(argv: string[], io: CliIO = createDefaultIO(), cwd = process.cwd()): Promise<number> {
  let exitCode = 0;
  const runtime: CliRuntime = {
    cwd,
    io,
    setExitCode: (code) => {
      exitCode = Math.max(exitCode, code);
    },
  };

  const program = new Command();
  program
    .name('contextforge')
    .description('Compile repository context and markdown tasks into Codex-ready task packs.')
    .showHelpAfterError()
    .exitOverride()
    .configureOutput({
      writeOut: (message) => io.stdout(message.trimEnd()),
      writeErr: (message) => io.stderr(message.trimEnd()),
    });

  program
    .command('init')
    .description('Initialize ContextForge artifacts for the current repository.')
    .option('--write-agents', 'Write the generated AGENTS suggestion to the top-level AGENTS.md file.')
    .option('--json', 'Emit machine-readable JSON output.')
    .action(async (options) => runInitCommand(runtime, options));

  program
    .command('scan')
    .description('Scan the repository and refresh ContextForge context artifacts.')
    .option('--json', 'Emit machine-readable JSON output.')
    .option('--max-depth <number>', 'Maximum repository traversal depth.', (value) => Number(value))
    .action(async (options) => runScanCommand(runtime, options));

  program
    .command('compile')
    .description('Compile a markdown task file or GitHub issue into a task pack.')
    .option('--input <file>', 'Path to the markdown issue, PRD, or task file.')
    .option(
      '--github-issue <url-or-ref>',
      'GitHub issue URL or short ref in the form owner/repo#number.',
    )
    .option(
      '--github-issue-json <path>',
      'Path to an exported GitHub issue JSON payload for offline compilation.',
    )
    .option('--title <title>', 'Override the task pack title.')
    .option('--json', 'Emit machine-readable JSON output.')
    .action(async (options) => runCompileCommand(runtime, options));

  const exportCommand = program.command('export').description('Export generated artifacts into agent-ready formats.');

  exportCommand
    .command('codex')
    .description('Export a task pack JSON file into a compact Codex prompt markdown file.')
    .requiredOption('--input <file>', 'Path to the task pack JSON file.')
    .option('--output <file>', 'Optional output path. Defaults to .github/codex/prompts/<slug>.md.')
    .action(async (options) => runExportCodexCommand(runtime, options));

  program
    .command('lint')
    .description('Lint ContextForge artifacts for stale paths, commands, and guidance.')
    .option('--json', 'Emit machine-readable JSON output.')
    .option('--strict', 'Treat warnings as a non-zero exit condition.')
    .action(async (options) => runLintCommand(runtime, options));

  try {
    await program.parseAsync(argv, { from: 'user' });
    return exitCode;
  } catch (error) {
    if (error instanceof Error && 'exitCode' in error) {
      return typeof error.exitCode === 'number' ? error.exitCode : 1;
    }

    io.stderr(error instanceof Error ? error.message : 'Unknown CLI failure');
    return 1;
  }
}
