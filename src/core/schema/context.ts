import { z } from 'zod';

export const RepoContextSchema = z.object({
  repo: z.object({
    name: z.string(),
    root: z.string(),
    detectedLanguages: z.array(z.string()),
    detectedFrameworks: z.array(z.string()),
    packageManager: z.string().nullable(),
  }),
  structure: z.object({
    importantPaths: z.array(z.string()),
    importantFiles: z.array(z.string()),
    topLevelDirectories: z.array(z.string()),
    entrySignals: z.array(z.string()),
    scannedDirectories: z.array(z.string()),
    scannedFiles: z.array(z.string()),
  }),
  commands: z.object({
    install: z.array(z.string()),
    build: z.array(z.string()),
    test: z.array(z.string()),
    lint: z.array(z.string()),
    format: z.array(z.string()),
  }),
  docs: z.object({
    readme: z.array(z.string()),
    contributing: z.array(z.string()),
    architecture: z.array(z.string()),
  }),
  configs: z.array(z.string()),
  generatedAt: z.string().datetime(),
});

export type RepoContext = z.infer<typeof RepoContextSchema>;
