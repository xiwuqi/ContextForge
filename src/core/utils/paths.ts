import path from 'node:path';
import { isDirectory, pathExists } from './filesystem.js';

const REPO_ROOT_MARKERS = ['.git', 'package.json', 'README.md', 'AGENTS.md'];

export function toPosixPath(value: string): string {
  return value.split(path.sep).join('/');
}

export function normalizeRelativePath(value: string): string {
  const normalized = toPosixPath(value);
  if (normalized === '.') {
    return normalized;
  }

  return normalized.replace(/^\.\//, '').replace(/^\//, '');
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function relativeToRoot(rootDir: string, targetPath: string): string {
  return normalizeRelativePath(path.relative(rootDir, targetPath) || '.');
}

export function resolveFromRoot(rootDir: string, relativePath: string): string {
  return path.resolve(rootDir, relativePath);
}

export async function findRepositoryRoot(startDir: string): Promise<string> {
  let currentDir = path.resolve(startDir);

  while (true) {
    for (const marker of REPO_ROOT_MARKERS) {
      if (await pathExists(path.join(currentDir, marker))) {
        return currentDir;
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return path.resolve(startDir);
    }

    currentDir = parentDir;
  }
}

export async function existingRelativePaths(
  rootDir: string,
  paths: string[],
): Promise<string[]> {
  const matches = await Promise.all(
    paths.map(async (candidate) => {
      const fullPath = resolveFromRoot(rootDir, candidate);
      return (await pathExists(fullPath)) ? normalizeRelativePath(candidate) : null;
    }),
  );

  return matches.filter((value): value is string => value !== null);
}

export async function existingDirectories(
  rootDir: string,
  paths: string[],
): Promise<string[]> {
  const matches = await Promise.all(
    paths.map(async (candidate) => {
      const fullPath = resolveFromRoot(rootDir, candidate);
      return (await isDirectory(fullPath)) ? normalizeRelativePath(candidate) : null;
    }),
  );

  return matches.filter((value): value is string => value !== null);
}

export function pathLooksLikeFile(relativePath: string): boolean {
  const baseName = path.posix.basename(normalizeRelativePath(relativePath));
  return baseName.includes('.') && !baseName.startsWith('.');
}
