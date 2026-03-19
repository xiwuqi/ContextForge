import path from 'node:path';
import type { RepoContext } from '../schema/index.js';
import { clampNumber, dedupeStrings, tokenize } from '../utils/text.js';
import { normalizeRelativePath, pathLooksLikeFile } from '../utils/paths.js';

function collectCandidates(context: RepoContext): string[] {
  return dedupeStrings([
    ...context.structure.importantPaths,
    ...context.structure.importantFiles,
    ...context.structure.scannedDirectories,
    ...context.structure.scannedFiles,
    ...context.docs.readme,
    ...context.docs.contributing,
    ...context.docs.architecture,
  ]);
}

function scoreCandidate(taskTokens: Set<string>, rawTask: string, candidate: string): number {
  const normalizedCandidate = normalizeRelativePath(candidate);
  const lowerCandidate = normalizedCandidate.toLowerCase();
  const candidateTokens = tokenize(normalizedCandidate);
  const lowerTask = rawTask.toLowerCase();
  let score = 0;

  if (lowerTask.includes(lowerCandidate)) {
    score += 6;
  }

  for (const token of candidateTokens) {
    if (taskTokens.has(token)) {
      score += 1.5;
    }
  }

  const baseName = path.posix.basename(normalizedCandidate, path.posix.extname(normalizedCandidate));
  if (taskTokens.has(baseName.toLowerCase())) {
    score += 1;
  }

  if (normalizedCandidate === 'src') {
    score += 2.2;
  } else if (normalizedCandidate.startsWith('src/')) {
    score += 1.3;
  }

  if (normalizedCandidate === 'tests' || normalizedCandidate === 'test') {
    score += lowerTask.includes('test') || lowerTask.includes('validation') ? 1.8 : 0.8;
  } else if (normalizedCandidate.startsWith('tests/') || normalizedCandidate.startsWith('test/')) {
    score += lowerTask.includes('test') || lowerTask.includes('validation') ? 1.2 : 0.6;
  }

  if (normalizedCandidate === 'docs' || normalizedCandidate.startsWith('docs/')) {
    score += lowerTask.includes('doc') ? 0.8 : 0.1;
  }

  if (
    normalizedCandidate.startsWith('tests/fixtures/') ||
    normalizedCandidate.includes('/golden/') ||
    normalizedCandidate.startsWith('tests/helpers')
  ) {
    score -= lowerTask.includes('fixture') || lowerTask.includes('golden') ? 0.5 : 3;
  }

  if (normalizedCandidate.startsWith('.github/codex/prompts/')) {
    score -= lowerTask.includes('codex') || lowerTask.includes('prompt') || lowerTask.includes('export') ? 0.5 : 3;
  }

  return score;
}

export interface RankedPaths {
  relevantPaths: string[];
  relevantFiles: string[];
  possiblyRelatedPaths: string[];
  confidence: number;
}

export function rankRelevantPaths(
  rawTask: string,
  explicitPaths: string[],
  context: RepoContext,
  excludedPaths: string[] = [],
): RankedPaths {
  const excludedPathSet = new Set(excludedPaths.map((candidate) => normalizeRelativePath(candidate)));
  const taskTokens = new Set(tokenize(rawTask));
  const scored = collectCandidates(context)
    .filter((candidate) => !excludedPathSet.has(normalizeRelativePath(candidate)))
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(taskTokens, rawTask, candidate),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.candidate.localeCompare(right.candidate));

  const exactMatches = explicitPaths.filter(
    (candidate) =>
      (context.structure.scannedDirectories.includes(candidate) ||
        context.structure.scannedFiles.includes(candidate)) &&
      !excludedPathSet.has(normalizeRelativePath(candidate)),
  );

  const fileScores = scored.filter((entry) => pathLooksLikeFile(entry.candidate));
  const pathScores = scored.filter((entry) => !pathLooksLikeFile(entry.candidate));

  const relevantFiles = dedupeStrings([
    ...exactMatches.filter(pathLooksLikeFile),
    ...fileScores.filter((entry) => entry.score >= 2.5).slice(0, 6).map((entry) => entry.candidate),
  ]);

  const relevantPaths = dedupeStrings([
    ...exactMatches.filter((candidate) => !pathLooksLikeFile(candidate)),
    ...pathScores.filter((entry) => entry.score >= 1.5).slice(0, 8).map((entry) => entry.candidate),
  ]);

  const possiblyRelatedPaths = dedupeStrings(
    pathScores
      .filter((entry) => !relevantPaths.includes(entry.candidate))
      .slice(0, 6)
      .map((entry) => entry.candidate),
  );

  const strongestScore = scored[0]?.score ?? 0;
  const confidence = clampNumber(0.42 + strongestScore / 12 + exactMatches.length * 0.05, 0.35, 0.92);

  return {
    relevantPaths: relevantPaths.length > 0 ? relevantPaths : context.structure.importantPaths.slice(0, 3),
    relevantFiles,
    possiblyRelatedPaths,
    confidence,
  };
}
