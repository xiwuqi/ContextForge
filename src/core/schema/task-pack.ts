import { z } from 'zod';

export const TaskPackSourceTypeSchema = z.enum([
  'markdown_file',
  'github_issue',
  'github_issue_json',
]);

export const TaskPackSchema = z.object({
  taskId: z.string(),
  title: z.string(),
  objective: z.string(),
  userRequestSummary: z.string(),
  sourceTaskPath: z.string(),
  sourceType: TaskPackSourceTypeSchema,
  sourceRef: z.string(),
  sourceTitle: z.string(),
  sourceLabels: z.array(z.string()),
  sourceUrl: z.string().nullable(),
  relevantPaths: z.array(z.string()),
  relevantFiles: z.array(z.string()),
  possiblyRelatedPaths: z.array(z.string()),
  constraints: z.array(z.string()),
  assumptions: z.array(z.string()),
  risks: z.array(z.string()),
  validationCommands: z.array(z.string()),
  doneWhen: z.array(z.string()),
  implementationPlan: z.array(z.string()),
  openQuestions: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  provider: z.string().nullable(),
  generatedAt: z.string().datetime(),
});

export type TaskPack = z.infer<typeof TaskPackSchema>;
