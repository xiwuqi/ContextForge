export function buildInstallArgs({ tarballPath, offline }) {
  const args = ['install'];

  if (offline) {
    args.push('--offline');
  }

  args.push('--no-audit', '--no-fund', tarballPath);
  return args;
}

export function shouldRetryOnlineInstall(errorMessage, allowNetworkFallback) {
  if (!allowNetworkFallback) {
    return false;
  }

  const normalized = errorMessage.toLowerCase();
  return (
    normalized.includes('enotcached') ||
    normalized.includes('only-if-cached') ||
    normalized.includes('no cached response is available')
  );
}

export function parseBooleanEnv(value) {
  if (typeof value !== 'string') {
    return false;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

