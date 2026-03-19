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
  isAuxiliaryFixturePath,
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
  const analysisDirectories = walkResult.directories.filter((entry) => !isAuxiliaryFixturePath(entry));
  const analysisFiles = walkResult.files.filter((entry) => !isAuxiliaryFixturePath(entry));
  const packageJson = await loadPackageJson(options.rootDir, analysisFiles);
  const pyprojectContent = await loadPyproject(options.rootDir, analysisFiles);
  const docs = inferDocs(analysisFiles);
  const configs = inferConfigs(analysisFiles);
  const entrySignals = inferEntrySignals(analysisFiles);
  const repoContext: RepoContext = {
    repo: {
      name: path.basename(options.rootDir),
      root: '.',
      detectedLanguages: inferLanguages(analysisFiles, packageJson),
      detectedFrameworks: inferFrameworks(analysisFiles, packageJson, pyprojectContent),
      packageManager: inferPackageManager(analysisFiles),
    },
    structure: {
      importantPaths: inferImportantPaths(analysisDirectories, docs),
      importantFiles: inferImportantFiles(configs, docs, entrySignals),
      topLevelDirectories: analysisDirectories.filter((directoryPath) => !directoryPath.includes('/')),
      entrySignals,
      scannedDirectories: walkResult.directories,
      scannedFiles: walkResult.files,
    },
    commands: inferCommands(analysisFiles, packageJson, pyprojectContent),
    docs,
    configs,
    generatedAt: nowIso(options.clock),
  };

  return RepoContextSchema.parse(repoContext);
}
