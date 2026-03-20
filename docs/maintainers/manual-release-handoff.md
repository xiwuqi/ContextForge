# Manual release handoff

Use this workflow when a maintainer wants a concrete release bundle for the current package version without automating tags, GitHub Releases, or npm publish.

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

The bundle is for maintainer review. It does not publish anything, create tags, or call GitHub APIs.

## Review the release notes

Start from `.contextforge/releases/<version>/release-notes.md`.

Check that it:

- matches the current changelog and README reality
- accurately names supported exports: Codex, Claude Code, and Cursor
- stays honest about the package not being published yet

## Remaining manual steps

After reviewing the bundle:

1. update GitHub About text, topics, and homepage if needed
2. create the version tag manually
3. draft the GitHub Release manually
4. run `npm publish` manually when ready
5. verify the npm package page and links after publish

Use `docs/maintainers/public-metadata-checklist.md` for the GitHub and npm page checks.

## What this repo does not automate

- git tag creation
- GitHub Release creation
- npm publish
- changelog curation beyond the checked-in source files
