import { lintRepository } from '../../core/lint/linter.js';
import { printJson, type CliRuntime } from '../io.js';

export interface LintCommandOptions {
  json?: boolean;
  strict?: boolean;
}

export async function runLintCommand(runtime: CliRuntime, options: LintCommandOptions): Promise<void> {
  const report = await lintRepository({
    rootDir: runtime.cwd,
    strict: options.strict,
  });

  if (options.json) {
    printJson(runtime.io, report);
  } else if (report.issues.length === 0) {
    runtime.io.stdout('No lint issues found.');
  } else {
    for (const issue of report.issues) {
      const location = issue.artifact ?? issue.path ?? 'repository';
      runtime.io.stdout(`[${issue.severity.toUpperCase()}] ${issue.code} ${location}: ${issue.message}`);
    }
    runtime.io.stdout(
      `Summary: ${report.summary.errorCount} error(s), ${report.summary.warningCount} warning(s)`,
    );
  }

  if (report.summary.errorCount > 0 || (options.strict && report.summary.warningCount > 0)) {
    runtime.setExitCode(1);
  }
}
