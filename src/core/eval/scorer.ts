import { normalizeRelativePath } from '../utils/paths.js';
import { type TaskPack } from '../schema/index.js';
import { type EvalCase, type EvalCorpus, type EvalExportSpec, type EvalThresholds } from './schema.js';
import { type ExportTarget } from './targets.js';

export interface CoverageCheck {
  expected: string[];
  matched: string[];
  missing: string[];
  ratio: number;
  threshold: number;
  passed: boolean;
}

export interface SourceMetadataCheck {
  checked: string[];
  matched: string[];
  missing: string[];
  ratio: number;
  threshold: number;
  passed: boolean;
}

export interface ExportRuleCheck {
  requested: boolean;
  passed: boolean;
  frontmatterPresent: boolean;
  descriptionPresent: boolean;
  alwaysApplyFalse: boolean;
  taskScopePresent: boolean;
}

export interface ExportCheck {
  target: ExportTarget;
  passed: boolean;
  nonEmpty: boolean;
  titlePresent: boolean;
  sectionCoverage: CoverageCheck;
  relevantPathCoverage: CoverageCheck;
  keyFileCoverage?: CoverageCheck;
  validationCoverage: CoverageCheck;
  constraintsPreserved: boolean;
  ruleSuggestion?: ExportRuleCheck;
}

export interface CaseEvaluation {
  id: string;
  passed: boolean;
  score: number;
  relevantPathCoverage: CoverageCheck;
  relevantFileCoverage: CoverageCheck;
  validationCoverage: CoverageCheck;
  taskPackFieldCoverage: CoverageCheck;
  sourceMetadataCheck?: SourceMetadataCheck;
  exportChecks: ExportCheck[];
}

export interface EvalSummary {
  totalCases: number;
  passedCases: number;
  failedCases: number;
  averageScore: number;
  totals: {
    relevantPaths: { matched: number; expected: number; ratio: number };
    relevantFiles: { matched: number; expected: number; ratio: number };
    validationCommands: { matched: number; expected: number; ratio: number };
    taskPackFields: { matched: number; expected: number; ratio: number };
    sourceMetadata: { matched: number; expected: number; ratio: number };
    exports: { passed: number; total: number; ratio: number };
  };
}

const EXPORT_REQUIRED_SECTIONS: Record<ExportTarget, string[]> = {
  codex: ['## Objective', '## Read First', '## Relevant Paths', '## Constraints', '## Validation', '## Done When'],
  claude: [
    '## Objective',
    '## Source Context',
    '## Relevant Paths',
    '## Key Files',
    '## Constraints',
    '## Risks / Watchouts',
    '## Validation Commands',
    '## Done When',
    '## Suggested Implementation Order',
  ],
  cursor: [
    '## Objective',
    '## Source Context',
    '## Relevant Paths',
    '## Key Files',
    '## Constraints',
    '## Risks / Watchouts',
    '## Validation Commands',
    '## Done When',
    '## Suggested Implementation Order',
  ],
};

export function evaluateTaskPackAgainstCase(
  taskPack: TaskPack,
  evalCase: EvalCase,
  thresholds: EvalThresholds,
): Omit<CaseEvaluation, 'exportChecks' | 'score' | 'passed'> {
  const relevantPathCoverage = evaluateStringCoverage(
    evalCase.expected.relevantPaths,
    taskPack.relevantPaths,
    thresholds.relevantPaths,
    normalizeRelativePath,
  );
  const relevantFileCoverage = evaluateStringCoverage(
    evalCase.expected.relevantFiles,
    taskPack.relevantFiles,
    thresholds.relevantFiles,
    normalizeRelativePath,
  );
  const validationCoverage = evaluateStringCoverage(
    evalCase.expected.validationCommands,
    taskPack.validationCommands,
    thresholds.validationCommands,
    normalizeCommand,
  );
  const taskPackFieldCoverage = evaluateTaskPackFieldPresence(
    evalCase.expected.requiredTaskPackFields,
    taskPack,
    thresholds.taskPackFields,
  );
  const sourceMetadataCheck = evalCase.expected.sourceMetadata
    ? evaluateSourceMetadata(taskPack, evalCase.expected.sourceMetadata, thresholds.sourceMetadata)
    : undefined;

  return {
    id: evalCase.id,
    relevantPathCoverage,
    relevantFileCoverage,
    validationCoverage,
    taskPackFieldCoverage,
    sourceMetadataCheck,
  };
}

export function evaluateExportOutput(
  evalCase: EvalCase,
  taskPack: TaskPack,
  exportSpec: EvalExportSpec,
  output: string,
  thresholds: EvalThresholds,
  ruleSuggestion?: string,
): ExportCheck {
  const requiredSections = EXPORT_REQUIRED_SECTIONS[exportSpec.target];
  const sectionCoverage = evaluateStringCoverage(requiredSections, requiredSections.filter((section) => output.includes(section)), 1);
  const relevantPathCoverage = evaluateStringCoverage(
    evalCase.expected.relevantPaths,
    evalCase.expected.relevantPaths.filter((candidate) => output.includes(`\`${normalizeRelativePath(candidate)}\``)),
    thresholds.relevantPaths,
    normalizeRelativePath,
  );
  const validationCoverage = evaluateStringCoverage(
    evalCase.expected.validationCommands,
    evalCase.expected.validationCommands.filter((candidate) => output.includes(`\`${normalizeCommand(candidate)}\``)),
    thresholds.validationCommands,
    normalizeCommand,
  );
  const keyFileCoverage = exportSpec.target === 'codex'
    ? undefined
    : evaluateStringCoverage(
      evalCase.expected.relevantFiles,
      evalCase.expected.relevantFiles.filter((candidate) => output.includes(`\`${normalizeRelativePath(candidate)}\``)),
      thresholds.relevantFiles,
      normalizeRelativePath,
    );
  const constraintsPreserved = taskPack.constraints.length === 0
    ? true
    : taskPack.constraints.some((constraint) => output.includes(constraint));
  const titlePresent = output.includes(`# ${taskPack.title}`);
  const nonEmpty = output.trim().length > 0;
  const evaluatedRuleSuggestion = exportSpec.target === 'cursor'
    ? evaluateCursorRuleSuggestion(exportSpec.includeRuleSuggestion, taskPack, ruleSuggestion)
    : undefined;

  const passed =
    nonEmpty &&
    titlePresent &&
    sectionCoverage.passed &&
    relevantPathCoverage.passed &&
    validationCoverage.passed &&
    (keyFileCoverage?.passed ?? true) &&
    constraintsPreserved &&
    (evaluatedRuleSuggestion?.passed ?? true);

  return {
    target: exportSpec.target,
    passed,
    nonEmpty,
    titlePresent,
    sectionCoverage,
    relevantPathCoverage,
    keyFileCoverage,
    validationCoverage,
    constraintsPreserved,
    ruleSuggestion: evaluatedRuleSuggestion,
  };
}

export function finalizeCaseEvaluation(
  base: Omit<CaseEvaluation, 'exportChecks' | 'score' | 'passed'>,
  exportChecks: ExportCheck[],
  thresholds: EvalThresholds,
): CaseEvaluation {
  const exporterRatio = exportChecks.length === 0
    ? 1
    : exportChecks.filter((check) => check.passed).length / exportChecks.length;
  const sourceMetadataRatio = base.sourceMetadataCheck?.ratio ?? 1;
  const score = average([
    base.relevantPathCoverage.ratio,
    base.relevantFileCoverage.ratio,
    base.validationCoverage.ratio,
    base.taskPackFieldCoverage.ratio,
    sourceMetadataRatio,
    exporterRatio,
  ]);
  const passed =
    base.relevantPathCoverage.passed &&
    base.relevantFileCoverage.passed &&
    base.validationCoverage.passed &&
    base.taskPackFieldCoverage.passed &&
    (base.sourceMetadataCheck?.passed ?? true) &&
    exporterRatio >= thresholds.exports;

  return {
    ...base,
    exportChecks,
    score,
    passed,
  };
}

export function summarizeEvaluations(
  corpus: EvalCorpus,
  cases: CaseEvaluation[],
): EvalSummary {
  const relevantPaths = sumCoverage(cases.map((entry) => entry.relevantPathCoverage));
  const relevantFiles = sumCoverage(cases.map((entry) => entry.relevantFileCoverage));
  const validationCommands = sumCoverage(cases.map((entry) => entry.validationCoverage));
  const taskPackFields = sumCoverage(cases.map((entry) => entry.taskPackFieldCoverage));
  const sourceMetadata = sumCoverage(cases.map((entry) => entry.sourceMetadataCheck).filter((entry): entry is SourceMetadataCheck => Boolean(entry)));
  const exportCount = cases.flatMap((entry) => entry.exportChecks);
  const exports = {
    passed: exportCount.filter((entry) => entry.passed).length,
    total: exportCount.length,
    ratio: exportCount.length === 0 ? 1 : exportCount.filter((entry) => entry.passed).length / exportCount.length,
  };
  const passedCases = cases.filter((entry) => entry.passed).length;

  return {
    totalCases: corpus.cases.length,
    passedCases,
    failedCases: corpus.cases.length - passedCases,
    averageScore: average(cases.map((entry) => entry.score)),
    totals: {
      relevantPaths,
      relevantFiles,
      validationCommands,
      taskPackFields,
      sourceMetadata,
      exports,
    },
  };
}

function evaluateStringCoverage(
  expected: string[],
  actual: string[],
  threshold: number,
  normalize: (value: string) => string = (value) => value,
): CoverageCheck {
  const normalizedExpected = expected.map(normalize);
  const actualSet = new Set(actual.map(normalize));
  const matched = normalizedExpected.filter((candidate) => actualSet.has(candidate));
  const missing = normalizedExpected.filter((candidate) => !actualSet.has(candidate));
  const ratio = normalizedExpected.length === 0 ? 1 : matched.length / normalizedExpected.length;

  return {
    expected: normalizedExpected,
    matched,
    missing,
    ratio,
    threshold,
    passed: ratio >= threshold,
  };
}

function evaluateTaskPackFieldPresence(
  fields: string[],
  taskPack: TaskPack,
  threshold: number,
): CoverageCheck {
  const matched = fields.filter((field) => hasValue(taskPack[field as keyof TaskPack]));
  const missing = fields.filter((field) => !hasValue(taskPack[field as keyof TaskPack]));
  const ratio = fields.length === 0 ? 1 : matched.length / fields.length;

  return {
    expected: fields,
    matched,
    missing,
    ratio,
    threshold,
    passed: ratio >= threshold,
  };
}

function evaluateSourceMetadata(
  taskPack: TaskPack,
  expected: NonNullable<EvalCase['expected']['sourceMetadata']>,
  threshold: number,
): SourceMetadataCheck {
  const checks: Array<[string, boolean]> = [];

  if (expected.sourceType !== undefined) {
    checks.push([`sourceType:${expected.sourceType}`, taskPack.sourceType === expected.sourceType]);
  }
  if (expected.sourceRef !== undefined) {
    checks.push([`sourceRef:${expected.sourceRef}`, taskPack.sourceRef === expected.sourceRef]);
  }
  if (expected.sourceTitle !== undefined) {
    checks.push([`sourceTitle:${expected.sourceTitle}`, taskPack.sourceTitle === expected.sourceTitle]);
  }
  if (expected.sourceUrl !== undefined) {
    checks.push([`sourceUrl:${expected.sourceUrl ?? 'null'}`, taskPack.sourceUrl === expected.sourceUrl]);
  }
  if (expected.sourceLabels !== undefined) {
    const actualLabels = new Set(taskPack.sourceLabels);
    const labelsMatch = expected.sourceLabels.every((label) => actualLabels.has(label));
    checks.push([`sourceLabels:${expected.sourceLabels.join(',')}`, labelsMatch]);
  }

  const matched = checks.filter(([, passed]) => passed).map(([label]) => label);
  const missing = checks.filter(([, passed]) => !passed).map(([label]) => label);
  const ratio = checks.length === 0 ? 1 : matched.length / checks.length;

  return {
    checked: checks.map(([label]) => label),
    matched,
    missing,
    ratio,
    threshold,
    passed: ratio >= threshold,
  };
}

function evaluateCursorRuleSuggestion(
  requested: boolean,
  taskPack: TaskPack,
  ruleSuggestion?: string,
): ExportRuleCheck {
  if (!requested) {
    return {
      requested: false,
      passed: true,
      frontmatterPresent: true,
      descriptionPresent: true,
      alwaysApplyFalse: true,
      taskScopePresent: true,
    };
  }

  const content = ruleSuggestion ?? '';
  const frontmatterPresent = content.startsWith('---\n') || content.startsWith('---\r\n');
  const descriptionPresent = content.includes('description:');
  const alwaysApplyFalse = content.includes('alwaysApply: false');
  const taskScopePresent =
    content.includes(taskPack.title) &&
    (taskPack.relevantPaths.some((candidate) => content.includes(normalizeRelativePath(candidate))) ||
      taskPack.validationCommands.some((candidate) => content.includes(normalizeCommand(candidate))));

  return {
    requested: true,
    passed: frontmatterPresent && descriptionPresent && alwaysApplyFalse && taskScopePresent,
    frontmatterPresent,
    descriptionPresent,
    alwaysApplyFalse,
    taskScopePresent,
  };
}

function sumCoverage(checks: Array<CoverageCheck | SourceMetadataCheck>) {
  const matched = checks.reduce((sum, entry) => sum + entry.matched.length, 0);
  const expected = checks.reduce(
    (sum, entry) => sum + ('expected' in entry ? entry.expected.length : entry.checked.length),
    0,
  );

  return {
    matched,
    expected,
    ratio: expected === 0 ? 1 : matched / expected,
  };
}

function hasValue(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  return value !== null && value !== undefined;
}

function normalizeCommand(value: string): string {
  return value.trim();
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
