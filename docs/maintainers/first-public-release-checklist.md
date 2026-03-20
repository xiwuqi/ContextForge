# First public release checklist

Use this when you want the shortest path to a real first release decision.

## Before dispatch

- `package.json` version is final for the release you want.
- `package-lock.json` matches that version if it changed.
- `CHANGELOG.md` contains a real versioned entry for that release.
- `npm run release:check` passes locally.
- `npm run release:artifacts` generates a clean bundle under `.contextforge/releases/<version>/`.
- `.github/release/repo-metadata.json` matches the public description, homepage, and topics you want.
- GitHub Actions workflow permissions allow write access to contents.
- npm trusted publishing is configured, or `NPM_TOKEN` is available as a repository secret.
- the target npm package name is `@xiwuqi/contextforge`.
- `REPO_METADATA_TOKEN` is available if you want the workflow to sync GitHub repo metadata.

## Dispatch inputs

Recommended defaults for a normal public release:

- `version`: exact `package.json` version
- `npm_tag`: `latest`
- `publish_to_npm`: `true`
- `create_github_release`: `true`
- `sync_repo_metadata`: `true`
- `prerelease`: `false`

For the first live public release, use these exact values:

- `version = 0.1.0`
- `npm_tag = latest`
- `publish_to_npm = true`
- `create_github_release = true`
- `sync_repo_metadata = true`
- `prerelease = false`

## After the workflow finishes

- verify the GitHub Release exists and includes the tarball plus checksums
- verify the npm package page for `@xiwuqi/contextforge` shows the expected version and README
- review GitHub About text, topics, and homepage
- spot-check the install and quickstart flow from the published package
