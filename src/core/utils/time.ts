export function nowIso(clock: Date = new Date()): string {
  return clock.toISOString();
}

export function stripGeneratedAtLines(markdown: string): string {
  return markdown
    .split(/\r?\n/)
    .filter((line) => !line.startsWith('- Generated: ') && !line.startsWith('Generated: '))
    .join('\n')
    .trim();
}
