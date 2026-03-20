# Live release prerequisites

Use this before triggering `.github/workflows/release.yml` for the first real public release.

## External setup required

- GitHub Actions workflow permissions must allow read and write access so `github.token` can create tags and GitHub Releases.
- `REPO_METADATA_TOKEN` is needed if you want the workflow to sync repository description, homepage, and topics.
  - Reason: editing repo metadata usually needs broader repo settings permission than `github.token` provides.
- npm trusted publishing should be configured for this repository if you want tokenless publish from GitHub Actions.
- If npm trusted publishing is not configured, create the repository secret `NPM_TOKEN` as the fallback publish credential.

## First live dispatch values

For the first public release, use:

- `version = 0.1.0`
- `npm_tag = latest`
- `publish_to_npm = true`
- `create_github_release = true`
- `sync_repo_metadata = true`
- `prerelease = false`

## Before dispatch

- `CHANGELOG.md` contains the `0.1.0` entry.
- `package.json` version is `0.1.0`.
- `npm run release:check` passes locally.
- `npm run release:artifacts` has generated the current bundle under `.contextforge/releases/0.1.0/`.
- `.github/release/repo-metadata.json` matches the intended public metadata.

## After the workflow finishes

- verify the GitHub Release exists and includes the tarball plus checksums
- verify the published npm version is `0.1.0`
- verify the npm package page renders the README and links correctly
- verify GitHub About text, homepage, and topics match `.github/release/repo-metadata.json`

