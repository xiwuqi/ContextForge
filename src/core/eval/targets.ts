import { z } from 'zod';

export const ExportTargetSchema = z.enum(['codex', 'claude', 'cursor']);
export type ExportTarget = z.infer<typeof ExportTargetSchema>;
