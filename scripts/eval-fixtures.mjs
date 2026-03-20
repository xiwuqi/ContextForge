#!/usr/bin/env node
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportPath = path.join(repoRoot, '.contextforge', 'evals', 'latest.json');
const requiredBuildFiles = [
  path.join(repoRoot, 'dist', 'core', 'compile', 'compiler.js'),
  path.join(repoRoot, 'dist', 'core', 'eval', 'index.js'),
];

if (!(await Promise.all(requiredBuildFiles.map((entry) => pathExists(entry)))).every(Boolean)) {
  console.error('Build output is missing. Run `npm run build` before `npm run eval:fixtures`.');
  process.exit(1);
}

const [
  { compileTask },
  { exportCodexPrompt, exportClaudePrompt, exportCursorPrompt },
  {
    loadEvalCorpus,
    evaluateTaskPackAgainstCase,
    evaluateExportOutput,
    finalizeCaseEvaluation,
    summarizeEvaluations,
  },
] = await Promise.all([
  import(pathToFileURL(path.join(repoRoot, 'dist', 'core', 'compile', 'compiler.js')).href),
  import(pathToFileURL(path.join(repoRoot, 'dist', 'core', 'export', 'index.js')).href),
  import(pathToFileURL(path.join(repoRoot, 'dist', 'core', 'eval', 'index.js')).href),
]);

const FIXED_CLOCK = new Date('2026-03-19T18:00:00.000Z');
const corpus = loadEvalCorpus(
  JSON.parse(await readFile(path.join(repoRoot, 'tests', 'fixtures', 'evals', 'cases.json'), 'utf8')),
);
const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'contextforge-evals-'));

try {
  const caseResults = [];

  for (const evalCase of corpus.cases) {
    const repoDir = path.join(tempRoot, evalCase.id);
    await cp(path.join(repoRoot, 'tests', 'fixtures', evalCase.fixtureRepo), repoDir, { recursive: true });

    const sourceFixturePath = path.join(repoRoot, 'tests', 'fixtures', evalCase.source.fixturePath);
    const sourceRepoPath = path.join(repoDir, evalCase.source.repoPath);
    await mkdir(path.dirname(sourceRepoPath), { recursive: true });
    await cp(sourceFixturePath, sourceRepoPath);

    const compileOptions = {
      rootDir: repoDir,
      clock: FIXED_CLOCK,
      provider: null,
      ...(evalCase.source.type === 'markdown_file'
        ? { inputFile: evalCase.source.repoPath }
        : { githubIssueJson: evalCase.source.repoPath }),
    };

    const compileResult = await compileTask(compileOptions);
    const baseEvaluation = evaluateTaskPackAgainstCase(
      compileResult.taskPack,
      evalCase,
      corpus.thresholds,
    );
    const exportChecks = [];

    for (const exportSpec of evalCase.exports) {
      const relativeTaskPackPath = normalizePath(path.relative(repoDir, compileResult.jsonPath));

      if (exportSpec.target === 'codex') {
        const exported = await exportCodexPrompt({
          rootDir: repoDir,
          input: relativeTaskPackPath,
        });
        exportChecks.push(
          evaluateExportOutput(
            evalCase,
            compileResult.taskPack,
            exportSpec,
            exported.prompt,
            corpus.thresholds,
          ),
        );
        continue;
      }

      if (exportSpec.target === 'claude') {
        const exported = await exportClaudePrompt({
          rootDir: repoDir,
          input: relativeTaskPackPath,
        });
        exportChecks.push(
          evaluateExportOutput(
            evalCase,
            compileResult.taskPack,
            exportSpec,
            exported.prompt,
            corpus.thresholds,
          ),
        );
        continue;
      }

      const exported = await exportCursorPrompt({
        rootDir: repoDir,
        input: relativeTaskPackPath,
        ...(exportSpec.includeRuleSuggestion
          ? { ruleOutput: `.contextforge/evals/rules/${evalCase.id}.mdc` }
          : {}),
      });
      exportChecks.push(
        evaluateExportOutput(
          evalCase,
          compileResult.taskPack,
          exportSpec,
          exported.prompt,
          corpus.thresholds,
          exported.ruleSuggestion,
        ),
      );
    }

    caseResults.push(
      finalizeCaseEvaluation(
        baseEvaluation,
        exportChecks,
        corpus.thresholds,
      ),
    );
  }

  const summary = summarizeEvaluations(corpus, caseResults);
  const report = {
    generatedAt: FIXED_CLOCK.toISOString(),
    thresholds: corpus.thresholds,
    summary,
    cases: caseResults,
  };

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  printSummary(summary, caseResults, normalizePath(path.relative(repoRoot, reportPath)));

  if (summary.failedCases > 0) {
    process.exitCode = 1;
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    `${JSON.stringify({ generatedAt: FIXED_CLOCK.toISOString(), error: message }, null, 2)}\n`,
    'utf8',
  );
  console.error(message);
  console.error(`Wrote failure report to ${normalizePath(path.relative(repoRoot, reportPath))}`);
  process.exitCode = 1;
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

function printSummary(summary, caseResults, relativeReportPath) {
  console.log(`Fixture evals: ${summary.passedCases}/${summary.totalCases} passed`);
  console.log(`Average score: ${summary.averageScore.toFixed(3)}`);
  console.log(
    `Coverage: paths ${formatRatio(summary.totals.relevantPaths)} | files ${formatRatio(summary.totals.relevantFiles)} | validations ${formatRatio(summary.totals.validationCommands)} | fields ${formatRatio(summary.totals.taskPackFields)} | source ${formatRatio(summary.totals.sourceMetadata)} | exports ${summary.totals.exports.passed}/${summary.totals.exports.total} (${summary.totals.exports.ratio.toFixed(2)})`,
  );

  for (const caseResult of caseResults) {
    console.log(
      `${caseResult.passed ? 'PASS' : 'FAIL'} ${caseResult.id} | paths ${formatCoverage(caseResult.relevantPathCoverage)} | files ${formatCoverage(caseResult.relevantFileCoverage)} | validations ${formatCoverage(caseResult.validationCoverage)} | exports ${caseResult.exportChecks.filter((entry) => entry.passed).length}/${caseResult.exportChecks.length}`,
    );

    const failures = [
      ...caseResult.relevantPathCoverage.missing.map((item) => `missing path ${item}`),
      ...caseResult.relevantFileCoverage.missing.map((item) => `missing file ${item}`),
      ...caseResult.validationCoverage.missing.map((item) => `missing validation ${item}`),
      ...caseResult.taskPackFieldCoverage.missing.map((item) => `missing field ${item}`),
      ...(caseResult.sourceMetadataCheck?.missing ?? []),
      ...caseResult.exportChecks
        .filter((entry) => !entry.passed)
        .map((entry) => `export ${entry.target} failed`),
    ];

    if (failures.length > 0) {
      console.log(`  ${failures.join(' | ')}`);
    }
  }

  console.log(`Report: ${relativeReportPath}`);
}

function formatCoverage(coverage) {
  return `${coverage.matched.length}/${coverage.expected.length}`;
}

function formatRatio(total) {
  return `${total.matched}/${total.expected} (${total.ratio.toFixed(2)})`;
}

function normalizePath(value) {
  return value.split(path.sep).join('/');
}

async function pathExists(targetPath) {
  try {
    await access(targetPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}
