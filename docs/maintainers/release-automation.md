# Release automation

ContextForge ships a manual-dispatch release workflow at `.github/workflows/release.yml`.

It does not run on push. A maintainer must dispatch it explicitly with the target version.

For the first live public release, see `docs/maintainers/live-release-prerequisites.md` for the exact dispatch values and required external setup.

## What the workflow does

When configured correctly, the workflow:

1. validates the input version against `package.json`
2. validates that `CHANGELOG.md` already contains a real versioned entry
3. runs `npm run release:check`
4. runs `npm run release:artifacts`
5. optionally syncs GitHub repository metadata from `.github/release/repo-metadata.json`
6. optionally creates the GitHub Release and uploads the tarball plus checksums
7. optionally publishes the generated tarball to npm
8. retries npm visibility checks for a short propagation window after publish
9. verifies the release state and prints a compact summary

## Workflow inputs

- `version`: required exact version string
- `npm_tag`: npm dist-tag, default `latest`
- `publish_to_npm`: default `true`
- `create_github_release`: default `true`
- `sync_repo_metadata`: default `true`
- `prerelease`: default `false`

## Required permissions and settings

Repository settings:

- GitHub Actions workflow permissions should allow read and write access so `github.token` can create tags and releases

Workflow permissions:

- `contents: write` for tags and GitHub Releases
- `id-token: write` for npm trusted publishing when configured

Secrets:

- `REPO_METADATA_TOKEN` if you want automated repo description/homepage/topic sync
  - use a token that can edit repository metadata
  - if this secret is missing or under-scoped, set `sync_repo_metadata` to `false` or expect that step to fail clearly
- `NPM_TOKEN` only if npm trusted publishing is not configured
- the public npm package identifier should match `package.json`, currently `@xiwuqi/contextforge`

## npm verification behavior

After `npm publish`, the workflow retries `npm view` verification for a few minutes before failing.

This is intentional because npm registry propagation can lag behind a successful publish response.

## Source of truth files

- `package.json` for the version
- `CHANGELOG.md` for release readiness
- `.github/release/repo-metadata.json` for public repository metadata
- `.contextforge/releases/<version>/` for release notes, tarball, manifest, and checksums

## Safe usage pattern

1. update `package.json`, `package-lock.json`, and `CHANGELOG.md` in git
2. run `npm run release:check`
3. run `npm run release:artifacts`
4. dispatch the workflow with the matching version
5. review the GitHub Release and npm package page after it finishes

Recommended first live dispatch:

- `version = 0.1.0`
- `npm_tag = latest`
- `publish_to_npm = true`
- `create_github_release = true`
- `sync_repo_metadata = true`
- `prerelease = false`

The first public npm publish target for those inputs is `@xiwuqi/contextforge@0.1.0`.

## What remains outside repo automation

- deciding the version to release
- writing or curating final changelog content
- configuring GitHub workflow permissions
- configuring repo metadata token or npm publishing setup
