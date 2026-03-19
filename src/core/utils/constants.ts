export const CONTEXTFORGE_DIR = '.contextforge';
export const CONTEXT_FILE = `${CONTEXTFORGE_DIR}/context.json`;
export const CONTEXT_MARKDOWN_FILE = `${CONTEXTFORGE_DIR}/context.md`;
export const AGENTS_SUGGESTED_FILE = `${CONTEXTFORGE_DIR}/agents.suggested.md`;
export const TASK_PACK_DIR = `${CONTEXTFORGE_DIR}/task-packs`;
export const DEFAULT_PROMPTS_DIR = '.github/codex/prompts';
export const DEFAULT_SCAN_MAX_DEPTH = 6;

export const DEFAULT_IGNORED_DIRECTORIES = new Set([
  '.git',
  '.hg',
  '.svn',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  '.turbo',
  '.cache',
  '.parcel-cache',
  '.venv',
  'venv',
  '__pycache__',
  '.pytest_cache',
  'target',
  'out',
  '.idea',
  '.vscode',
  CONTEXTFORGE_DIR,
]);

export const IMPORTANT_DIRECTORY_NAMES = [
  'src',
  'app',
  'lib',
  'tests',
  'test',
  'docs',
  'examples',
  'scripts',
  'packages',
  'cmd',
  'pkg',
  '.github',
];

export const CONFIG_FILE_PATTERNS = [
  'package.json',
  'tsconfig.json',
  'pyproject.toml',
  'requirements.txt',
  'pytest.ini',
  'go.mod',
  'Cargo.toml',
  'Makefile',
  'Dockerfile',
  'README.md',
] as const;
