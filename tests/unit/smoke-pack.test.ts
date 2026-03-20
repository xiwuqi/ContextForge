import { describe, expect, it } from 'vitest';
import {
  buildInstallArgs,
  parseBooleanEnv,
  shouldRetryOnlineInstall,
} from '../../scripts/lib/smoke-pack.mjs';

describe('smoke-pack helpers', () => {
  it('builds offline and online install arguments explicitly', () => {
    expect(
      buildInstallArgs({
        tarballPath: '/tmp/xiwuqi-contextforge-0.1.0.tgz',
        offline: true,
      }),
    ).toEqual([
      'install',
      '--offline',
      '--no-audit',
      '--no-fund',
      '/tmp/xiwuqi-contextforge-0.1.0.tgz',
    ]);

    expect(
      buildInstallArgs({
        tarballPath: '/tmp/xiwuqi-contextforge-0.1.0.tgz',
        offline: false,
      }),
    ).toEqual([
      'install',
      '--no-audit',
      '--no-fund',
      '/tmp/xiwuqi-contextforge-0.1.0.tgz',
    ]);
  });

  it('only retries online install for cache-miss failures when explicitly enabled', () => {
    const cachedError = "npm error code ENOTCACHED\nnpm error request failed: cache mode is 'only-if-cached' but no cached response is available.";

    expect(shouldRetryOnlineInstall(cachedError, true)).toBe(true);
    expect(shouldRetryOnlineInstall(cachedError, false)).toBe(false);
    expect(shouldRetryOnlineInstall('npm error code E401', true)).toBe(false);
  });

  it('parses the fallback env flag conservatively', () => {
    expect(parseBooleanEnv('true')).toBe(true);
    expect(parseBooleanEnv('1')).toBe(true);
    expect(parseBooleanEnv('false')).toBe(false);
    expect(parseBooleanEnv(undefined)).toBe(false);
  });
});
