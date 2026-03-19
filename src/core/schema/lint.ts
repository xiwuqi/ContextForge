import { z } from 'zod';

export const LintIssueSchema = z.object({
  code: z.string(),
  severity: z.enum(['error', 'warning']),
  message: z.string(),
  artifact: z.string().nullable(),
  path: z.string().nullable(),
  command: z.string().nullable(),
});

export const LintReportSchema = z.object({
  issues: z.array(LintIssueSchema),
  summary: z.object({
    errorCount: z.number().int().nonnegative(),
    warningCount: z.number().int().nonnegative(),
  }),
  generatedAt: z.string().datetime(),
});

export type LintIssue = z.infer<typeof LintIssueSchema>;
export type LintReport = z.infer<typeof LintReportSchema>;
