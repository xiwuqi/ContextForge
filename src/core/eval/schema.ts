import { z } from 'zod';
import { ExportTargetSchema } from './targets.js';

export const EvalSourceTypeSchema = z.enum(['markdown_file', 'github_issue_json']);

export const EvalSourceDefinitionSchema = z.object({
  type: EvalSourceTypeSchema,
  fixturePath: z.string().min(1),
  repoPath: z.string().min(1),
});

export const EvalSourceMetadataExpectationSchema = z.object({
  sourceType: EvalSourceTypeSchema.optional(),
  sourceRef: z.string().optional(),
  sourceTitle: z.string().optional(),
  sourceLabels: z.array(z.string()).optional(),
  sourceUrl: z.string().nullable().optional(),
});

export const EvalExportSpecSchema = z.object({
  target: ExportTargetSchema,
  includeRuleSuggestion: z.boolean().default(false),
});

export const EvalCaseExpectationSchema = z.object({
  relevantPaths: z.array(z.string()),
  relevantFiles: z.array(z.string()),
  validationCommands: z.array(z.string()),
  requiredTaskPackFields: z.array(z.string()),
  sourceMetadata: EvalSourceMetadataExpectationSchema.optional(),
});

export const EvalCaseSchema = z.object({
  id: z.string().min(1),
  fixtureRepo: z.string().min(1),
  source: EvalSourceDefinitionSchema,
  expected: EvalCaseExpectationSchema,
  exports: z.array(EvalExportSpecSchema),
});

export const EvalThresholdsSchema = z.object({
  relevantPaths: z.number().min(0).max(1),
  relevantFiles: z.number().min(0).max(1),
  validationCommands: z.number().min(0).max(1),
  taskPackFields: z.number().min(0).max(1),
  sourceMetadata: z.number().min(0).max(1),
  exports: z.number().min(0).max(1),
});

export const EvalCorpusSchema = z.object({
  version: z.literal(1),
  thresholds: EvalThresholdsSchema,
  cases: z.array(EvalCaseSchema).min(3).max(6),
});

export type EvalCase = z.infer<typeof EvalCaseSchema>;
export type EvalCorpus = z.infer<typeof EvalCorpusSchema>;
export type EvalThresholds = z.infer<typeof EvalThresholdsSchema>;
export type EvalExportSpec = z.infer<typeof EvalExportSpecSchema>;

export function loadEvalCorpus(value: unknown): EvalCorpus {
  return EvalCorpusSchema.parse(value);
}
