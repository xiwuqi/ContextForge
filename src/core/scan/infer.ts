import path from 'node:path';
import { CONFIG_FILE_PATTERNS, IMPORTANT_DIRECTORY_NAMES } from '../utils/constants.js';
import type { RepoContext } from '../schema/index.js';
import { readJsonFile, tryReadTextFile } from '../utils/filesystem.js';
import { dedupeStrings } from '../utils/text.js';

interface PackageJsonShape {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export function isConfigFile(relativePath: string): boolean {
  const baseName = path.posix.basename(relativePath);

  if (CONFIG_FILE_PATTERNS.includes(baseName as (typeof CONFIG_FILE_PATTERNS)[number])) {
    return true;
  }

  return (
    baseName.startsWith('.eslintrc') ||
    baseName === 'eslint.config.js' ||
    baseName === 'eslint.config.cjs' ||
    baseName === 'eslint.config.mjs' ||
    baseName === 'eslint.config.ts' ||
    baseName.startsWith('.prettierrc') ||
    baseName === 'prettier.config.js' ||
    baseName === 'prettier.config.cjs' ||
    baseName === 'prettier.config.mjs' ||
    baseName === 'prettier.config.ts' ||
    baseName.startsWith('vitest.config.') ||
    baseName.startsWith('jest.config.')
  );
}

export function isContributingFile(relativePath: string): boolean {
  return path.posix.basename(relativePath).toUpperCase().startsWith('CONTRIBUTING');
}

export function isArchitectureDoc(relativePath: string): boolean {
  const normalized = relativePath.toLowerCase();
  return (
    normalized.startsWith('docs/') &&
    (normalized.includes('architecture') || normalized.includes('design') || normalized.includes('/adr'))
  );
}

export async function loadPackageJson(
  rootDir: string,
  discoveredFiles: string[],
): Promise<PackageJsonShape | null> {
  if (!discoveredFiles.includes('package.json')) {
    return null;
  }

  try {
    return await readJsonFile<PackageJsonShape>(path.join(rootDir, 'package.json'));
  } catch {
    return null;
  }
}

export async function loadPyproject(rootDir: string, discoveredFiles: string[]): Promise<string | null> {
  if (!discoveredFiles.includes('pyproject.toml')) {
    return null;
  }

  return tryReadTextFile(path.join(rootDir, 'pyproject.toml'));
}

export function inferLanguages(discoveredFiles: string[], packageJson: PackageJsonShape | null): string[] {
  const languages = new Set<string>();

  for (const filePath of discoveredFiles) {
    const extension = path.posix.extname(filePath).toLowerCase();
    if (extension === '.ts' || extension === '.tsx') {
      languages.add('typescript');
    }
    if (extension === '.js' || extension === '.jsx' || extension === '.mjs' || extension === '.cjs') {
      languages.add('javascript');
    }
    if (extension === '.py') {
      languages.add('python');
    }
    if (extension === '.go') {
      languages.add('go');
    }
    if (extension === '.rs') {
      languages.add('rust');
    }
    if (extension === '.md') {
      languages.add('markdown');
    }
    if (extension === '.json') {
      languages.add('json');
    }
    if (extension === '.toml') {
      languages.add('toml');
    }
    if (extension === '.yml' || extension === '.yaml') {
      languages.add('yaml');
    }
  }

  if (packageJson) {
    languages.add('json');
  }

  return [...languages].sort();
}

export function inferFrameworks(
  discoveredFiles: string[],
  packageJson: PackageJsonShape | null,
  pyprojectContent: string | null,
): string[] {
  const frameworks = new Set<string>();
  const dependencies = {
    ...(packageJson?.dependencies ?? {}),
    ...(packageJson?.devDependencies ?? {}),
  };

  if (packageJson) {
    frameworks.add('node');
  }

  if ('react' in dependencies) {
    frameworks.add('react');
  }
  if ('next' in dependencies) {
    frameworks.add('next');
  }
  if ('vitest' in dependencies || discoveredFiles.some((file) => file.startsWith('vitest.config.'))) {
    frameworks.add('vitest');
  }
  if ('jest' in dependencies || discoveredFiles.some((file) => file.startsWith('jest.config.'))) {
    frameworks.add('jest');
  }
  if (
    discoveredFiles.includes('pyproject.toml') ||
    discoveredFiles.includes('requirements.txt') ||
    discoveredFiles.includes('pytest.ini')
  ) {
    frameworks.add('python');
  }
  if (pyprojectContent?.includes('pytest')) {
    frameworks.add('pytest');
  }
  if (discoveredFiles.includes('go.mod')) {
    frameworks.add('go');
  }
  if (discoveredFiles.includes('Cargo.toml')) {
    frameworks.add('rust');
  }
  if (discoveredFiles.includes('Dockerfile')) {
    frameworks.add('docker');
  }

  return [...frameworks].sort();
}

export function inferPackageManager(discoveredFiles: string[]): string | null {
  if (discoveredFiles.includes('package-lock.json')) {
    return 'npm';
  }
  if (discoveredFiles.includes('pnpm-lock.yaml')) {
    return 'pnpm';
  }
  if (discoveredFiles.includes('yarn.lock')) {
    return 'yarn';
  }
  if (discoveredFiles.includes('bun.lockb') || discoveredFiles.includes('bun.lock')) {
    return 'bun';
  }

  return discoveredFiles.includes('package.json') ? 'npm' : null;
}

export function inferCommands(
  discoveredFiles: string[],
  packageJson: PackageJsonShape | null,
  pyprojectContent: string | null,
): RepoContext['commands'] {
  const scripts = packageJson?.scripts ?? {};
  const hasScript = (name: string): boolean => Boolean(scripts[name]);

  const install = discoveredFiles.includes('package.json') ? ['npm install'] : [];
  const build = hasScript('build')
    ? ['npm run build']
    : discoveredFiles.includes('Cargo.toml')
      ? ['cargo build']
      : discoveredFiles.includes('go.mod')
        ? ['go build ./...']
        : pyprojectContent?.includes('[build-system]')
          ? ['python -m build']
          : discoveredFiles.includes('Makefile')
            ? ['make build']
            : [];

  const test = hasScript('test')
    ? ['npm run test']
    : discoveredFiles.includes('pytest.ini') || pyprojectContent?.includes('pytest')
      ? ['pytest']
      : discoveredFiles.includes('go.mod')
        ? ['go test ./...']
        : discoveredFiles.includes('Cargo.toml')
          ? ['cargo test']
          : discoveredFiles.includes('Makefile')
            ? ['make test']
            : [];

  const lint = hasScript('lint')
    ? ['npm run lint']
    : discoveredFiles.includes('Cargo.toml')
      ? ['cargo clippy --all-targets --all-features']
      : pyprojectContent?.includes('ruff')
        ? ['ruff check .']
        : pyprojectContent?.includes('flake8')
          ? ['flake8 .']
          : discoveredFiles.includes('Makefile')
            ? ['make lint']
            : [];

  const format = hasScript('format')
    ? ['npm run format']
    : discoveredFiles.includes('Cargo.toml')
      ? ['cargo fmt --check']
      : pyprojectContent?.includes('black')
        ? ['black --check .']
        : pyprojectContent?.includes('ruff')
          ? ['ruff format --check .']
          : discoveredFiles.includes('go.mod')
            ? ['gofmt -w .']
            : discoveredFiles.includes('Makefile')
              ? ['make format']
              : [];

  return {
    install,
    build,
    test,
    lint,
    format,
  };
}

export function inferDocs(discoveredFiles: string[]): RepoContext['docs'] {
  return {
    readme: discoveredFiles.filter((file) => path.posix.basename(file).toLowerCase() === 'readme.md'),
    contributing: discoveredFiles.filter(isContributingFile),
    architecture: discoveredFiles.filter(isArchitectureDoc),
  };
}

export function inferConfigs(discoveredFiles: string[]): string[] {
  return discoveredFiles.filter(isConfigFile).sort();
}

export function inferImportantPaths(discoveredDirectories: string[], docs: RepoContext['docs']): string[] {
  const topPriority = discoveredDirectories.filter((candidate) => IMPORTANT_DIRECTORY_NAMES.includes(candidate));
  const docDirs = docs.architecture
    .map((filePath) => path.posix.dirname(filePath))
    .filter((directoryPath) => directoryPath !== '.');

  return dedupeStrings([...topPriority, ...docDirs]).sort();
}

export function inferImportantFiles(
  configs: string[],
  docs: RepoContext['docs'],
  entrySignals: string[],
): string[] {
  return dedupeStrings([...entrySignals, ...configs, ...docs.readme, ...docs.contributing, ...docs.architecture]).sort();
}

export function inferEntrySignals(discoveredFiles: string[]): string[] {
  return discoveredFiles
    .filter((filePath) => {
      const baseName = path.posix.basename(filePath);
      return (
        baseName === 'package.json' ||
        baseName === 'tsconfig.json' ||
        baseName === 'pyproject.toml' ||
        baseName === 'go.mod' ||
        baseName === 'Cargo.toml' ||
        baseName === 'README.md'
      );
    })
    .sort();
}
