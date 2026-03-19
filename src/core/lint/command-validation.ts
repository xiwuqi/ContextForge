import path from 'node:path';
import { tryReadTextFile } from '../utils/filesystem.js';

interface PackageJsonShape {
  scripts?: Record<string, string>;
}

export interface CommandValidationResult {
  canValidate: boolean;
  valid: boolean;
  reason?: string;
}

async function loadPackageJson(rootDir: string): Promise<PackageJsonShape | null> {
  const raw = await tryReadTextFile(path.join(rootDir, 'package.json'));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PackageJsonShape;
  } catch {
    return null;
  }
}

export async function validateCommand(command: string, rootDir: string): Promise<CommandValidationResult> {
  const normalized = command.trim();
  const npmMatch = normalized.match(/^(npm|pnpm|yarn)\s+run\s+([a-zA-Z0-9:_-]+)$/);
  if (npmMatch) {
    const packageJson = await loadPackageJson(rootDir);
    if (!packageJson) {
      return { canValidate: true, valid: false, reason: 'package.json is missing' };
    }

    const scriptName = npmMatch[2] ?? '';
    if (!packageJson.scripts?.[scriptName]) {
      return { canValidate: true, valid: false, reason: `script "${scriptName}" is not defined` };
    }

    return { canValidate: true, valid: true };
  }

  if (/^(pytest|python\s+-m\s+pytest)\b/.test(normalized)) {
    const pytestConfig = await tryReadTextFile(path.join(rootDir, 'pytest.ini'));
    const pyproject = await tryReadTextFile(path.join(rootDir, 'pyproject.toml'));
    if (!pytestConfig && !pyproject?.includes('pytest')) {
      return {
        canValidate: true,
        valid: false,
        reason: 'pytest configuration or dependency signal is missing',
      };
    }

    return { canValidate: true, valid: true };
  }

  if (/^go\s+(build|test)\b/.test(normalized)) {
    const goMod = await tryReadTextFile(path.join(rootDir, 'go.mod'));
    return goMod
      ? { canValidate: true, valid: true }
      : { canValidate: true, valid: false, reason: 'go.mod is missing' };
  }

  if (/^cargo\s+/.test(normalized)) {
    const cargoToml = await tryReadTextFile(path.join(rootDir, 'Cargo.toml'));
    return cargoToml
      ? { canValidate: true, valid: true }
      : { canValidate: true, valid: false, reason: 'Cargo.toml is missing' };
  }

  if (/^make\b/.test(normalized)) {
    const makefile = await tryReadTextFile(path.join(rootDir, 'Makefile'));
    return makefile
      ? { canValidate: true, valid: true }
      : { canValidate: true, valid: false, reason: 'Makefile is missing' };
  }

  return { canValidate: false, valid: true };
}
