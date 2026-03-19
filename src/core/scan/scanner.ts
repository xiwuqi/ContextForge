import path from 'node:path';
import ignore from 'ignore';
import { readdir } from 'node:fs/promises';
import { RepoContextSchema, type RepoContext } from '../schema/index.js';
import { DEFAULT_IGNORED_DIRECTORIES } from '../utils/constants.js';
import { tryReadTextFile } from '../utils/filesystem.js';
import { normalizeRelativePath, relativeToRoot } from '../utils/paths.js';
import { nowIso } from '../utils/time.js';
import {
  inferCommands,
  inferConfigs,
  inferDocs,
  inferEntrySignals,
  inferFrameworks,
  inferImportantFiles,
  inferImportantPaths,
  inferLanguages,
  inferPackageManager,
  loadPackageJson,
  loadPyproject,
} from './infer.js';

export interface ScanOptions {
  rootDir: string;
  maxDepth?: number;
  clock?: Date;
}

interface WalkResult {
  directories: string[];
  files: string[];
}

async function createIgnoreMatcher(rootDir: string) {
  const matcher = ignore();
  const gitignoreContent = await tryReadTextFile(path.join(rootDir, '.gitignore'));
  if (gitignoreContent) {
    matcher.add(gitignoreContent);
  }

  return matcher;
}

async function walkRepository(
  rootDir: string,
  maxDepth: number,
  matcher: ReturnType<typeof ignore>,
): Promise<WalkResult> {
  const directories: string[] = [];
  const files: string[] = [];

  async function visit(currentDir: string, depth: number): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      const relativePath = normalizeRelativePath(relativeToRoot(rootDir, absolutePath));

      if (entry.isDirectory()) {
        if (DEFAULT_IGNORED_DIRECTORIES.has(entry.name) || matcher.ignores(`${relativePath}/`)) {
          continue;
        }

        directories.push(relativePath);
        if (depth < maxDepth) {
          await visit(absolutePath, depth + 1);
        }
        continue;
      }

      if (entry.isFile()) {
        if (matcher.ignores(relativePath)) {
          continue;
        }

        files.push(relativePath);
      }
    }
  }

  await visit(rootDir, 0);
  return {
    directories,
    files,
  };
}

export async function scanRepository(options: ScanOptions): Promise<RepoContext> {
  const maxDepth = options.maxDepth ?? 6;
  const matcher = await createIgnoreMatcher(options.rootDir);
  const walkResult = await walkRepository(options.rootDir, maxDepth, matcher);
  const packageJson = await loadPackageJson(options.rootDir, walkResult.files);
  const pyprojectContent = await loadPyproject(options.rootDir, walkResult.files);
  const docs = inferDocs(walkResult.files);
  const configs = inferConfigs(walkResult.files);
  const entrySignals = inferEntrySignals(walkResult.files);
  const repoContext: RepoContext = {
    repo: {
      name: path.basename(options.rootDir),
      root: '.',
      detectedLanguages: inferLanguages(walkResult.files, packageJson),
      detectedFrameworks: inferFrameworks(walkResult.files, packageJson, pyprojectContent),
      packageManager: inferPackageManager(walkResult.files),
    },
    structure: {
      importantPaths: inferImportantPaths(walkResult.directories, docs),
      importantFiles: inferImportantFiles(configs, docs, entrySignals),
      topLevelDirectories: walkResult.directories.filter((directoryPath) => !directoryPath.includes('/')),
      entrySignals,
      scannedDirectories: walkResult.directories,
      scannedFiles: walkResult.files,
    },
    commands: inferCommands(walkResult.files, packageJson, pyprojectContent),
    docs,
    configs,
    generatedAt: nowIso(options.clock),
  };

  return RepoContextSchema.parse(repoContext);
}
