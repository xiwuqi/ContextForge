import path from 'node:path';
import { bulletizeLines, dedupeStrings, normalizeWhitespace } from '../utils/text.js';
import { normalizeRelativePath } from '../utils/paths.js';

export interface ParsedSection {
  title: string;
  text: string;
  bullets: string[];
}

export interface ParsedTaskDocument {
  title: string;
  body: string;
  summary: string;
  sections: Record<string, ParsedSection>;
  referencedPaths: string[];
}

function normalizeHeading(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function inferSectionKey(heading: string): string {
  const normalized = normalizeHeading(heading);
  if (normalized.includes('objective') || normalized.includes('goal')) {
    return 'objective';
  }
  if (normalized.includes('constraint') || normalized.includes('guardrail')) {
    return 'constraints';
  }
  if (normalized.includes('validation') || normalized.includes('test')) {
    return 'validation';
  }
  if (
    normalized.includes('done when') ||
    normalized.includes('acceptance') ||
    normalized.includes('definition of done')
  ) {
    return 'doneWhen';
  }
  if (normalized.includes('risk')) {
    return 'risks';
  }
  if (normalized.includes('assumption')) {
    return 'assumptions';
  }
  if (normalized.includes('question')) {
    return 'openQuestions';
  }
  if (normalized.includes('plan') || normalized.includes('approach')) {
    return 'implementationPlan';
  }
  if (normalized.includes('context') || normalized.includes('background')) {
    return 'context';
  }
  if (normalized.includes('summary') || normalized.includes('request')) {
    return 'summary';
  }

  return normalized || 'notes';
}

function extractReferencedPaths(markdown: string): string[] {
  const matches =
    markdown.match(/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+|[A-Za-z0-9_.-]+\.[A-Za-z0-9_.-]+/g) ?? [];
  return dedupeStrings(
    matches
      .map((match) => normalizeRelativePath(match))
      .filter((match) => !match.startsWith('http') && !path.posix.basename(match).startsWith('#')),
  );
}

export function parseTaskMarkdown(markdown: string, fallbackTitle: string): ParsedTaskDocument {
  const lines = markdown.split(/\r?\n/);
  const sections: Record<string, { title: string; lines: string[] }> = {};
  let currentKey = 'notes';
  let title = fallbackTitle;
  const bodyLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const headingText = headingMatch[2]?.trim() ?? '';
      if (headingMatch[1] === '#' && title === fallbackTitle) {
        title = headingText;
      }
      currentKey = inferSectionKey(headingText);
      const currentSection = sections[currentKey] ?? { title: headingText, lines: [] };
      sections[currentKey] = currentSection;
      continue;
    }

    bodyLines.push(line);
    const currentSection = sections[currentKey] ?? { title: currentKey, lines: [] };
    currentSection.lines.push(line);
    sections[currentKey] = currentSection;
  }

  const parsedSections = Object.fromEntries(
    Object.entries(sections).map(([key, value]) => [
      key,
      {
        title: value.title,
        text: normalizeWhitespace(value.lines.join('\n')),
        bullets: bulletizeLines(value.lines.join('\n')),
      },
    ]),
  ) as Record<string, ParsedSection>;

  const body = normalizeWhitespace(bodyLines.join('\n'));
  const summarySection = parsedSections.summary?.text || parsedSections.context?.text || body;

  return {
    title,
    body,
    summary: summarySection,
    sections: parsedSections,
    referencedPaths: extractReferencedPaths(markdown),
  };
}
