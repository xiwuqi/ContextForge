# Manual release handoff

Use this workflow when a maintainer wants a concrete release bundle for the current package version. The bundle is still the source of truth even when the GitHub Actions release workflow performs the tag, GitHub Release, and npm publish steps.

## Generate the bundle

```bash
npm ci
npm run release:artifacts
```

The command uses the current `package.json` version and writes:

```text
.contextforge/releases/<version>/
```

## Inspect the bundle

Review these files before any public release action:

- `manifest.json`
- `package-files.json`
- `release-notes.md`
- `checksums.txt`
- `summary.txt`
- the packed tarball

The bundle is for maintainer review and workflow input. Generating it does not publish anything, create tags, or call GitHub APIs.

## Review the release notes

Start from `.contextforge/releases/<version>/release-notes.md`.

Check that it:

- matches the current changelog and README reality
- accurately names supported exports: Codex, Claude Code, and Cursor
- stays honest about the package not being published yet

## Remaining manual steps

After reviewing the bundle:

1. make sure `.github/release/repo-metadata.json`, `package.json`, and `CHANGELOG.md` are ready in git
2. confirm the release workflow permissions and secrets described in `docs/maintainers/release-automation.md` and `docs/maintainers/live-release-prerequisites.md`
3. trigger the manual-dispatch release workflow
4. if metadata sync or npm publish credentials are not configured, complete only those missing steps manually
5. verify the GitHub Release and npm package page after publish

Use `docs/maintainers/public-metadata-checklist.md` for the GitHub and npm page checks.

## What this repo does not automate

- version selection
- changelog curation beyond the checked-in source files
- secret or permission setup outside the repository
