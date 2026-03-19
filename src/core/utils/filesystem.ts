import path from 'node:path';
import { access, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function isDirectory(targetPath: string): Promise<boolean> {
  try {
    return (await stat(targetPath)).isDirectory();
  } catch {
    return false;
  }
}

export async function isFile(targetPath: string): Promise<boolean> {
  try {
    return (await stat(targetPath)).isFile();
  } catch {
    return false;
  }
}

export async function ensureDirectory(targetPath: string): Promise<void> {
  await mkdir(targetPath, { recursive: true });
}

export async function readTextFile(targetPath: string): Promise<string> {
  return readFile(targetPath, 'utf8');
}

export async function tryReadTextFile(targetPath: string): Promise<string | null> {
  try {
    return await readFile(targetPath, 'utf8');
  } catch {
    return null;
  }
}

export async function writeTextFile(targetPath: string, content: string): Promise<void> {
  await ensureDirectory(path.dirname(targetPath));
  await writeFile(targetPath, content, 'utf8');
}

export async function readJsonFile<T>(targetPath: string): Promise<T> {
  const raw = await readTextFile(targetPath);
  return JSON.parse(raw) as T;
}

export async function writeJsonFile(targetPath: string, value: unknown): Promise<void> {
  await writeTextFile(targetPath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function listFiles(targetPath: string): Promise<string[]> {
  return readdir(targetPath);
}
