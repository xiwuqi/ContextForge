import os from 'node:os';
import path from 'node:path';
import { cp, mkdtemp, readFile } from 'node:fs/promises';

export const FIXED_CLOCK = new Date('2026-03-19T18:00:00.000Z');

export function fixturePath(...segments: string[]): string {
  return path.resolve('tests', 'fixtures', ...segments);
}

export async function copyFixture(name: string): Promise<string> {
  const targetDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-'));
  await cp(fixturePath(name), targetDir, { recursive: true });
  return targetDir;
}

export async function readFixtureFile(...segments: string[]): Promise<string> {
  return readFile(fixturePath(...segments), 'utf8');
}
