# First public release

Use this guide when ContextForge is ready for its first public release candidate or first published release.

## What should already be true

- CI is green on the current branch.
- `npm run release:check` passes locally.
- `examples/demo/` still reflects the current product behavior.
- `CHANGELOG.md` is up to date and honest about release state.
- package metadata in `package.json` still matches the current CLI surface.

## Run the release-candidate checks

```bash
npm ci
npm run release:check
```

If a step fails, fix that issue first instead of skipping around it. The release check is meant to be the minimum confidence gate before any public release decision.

## Inspect the demo assets

Review the files in `examples/demo/` before publishing:

- task-pack markdown example
- task-pack JSON example
- Codex export example
- Claude Code export example
- Cursor export example
- Cursor rule suggestion example

If they are stale, refresh them with:

```bash
npm run demo:refresh
```

## Update the changelog

Before cutting a release candidate or first public release:

1. move the relevant notes in `CHANGELOG.md` into a dated or versioned entry when you are ready
2. keep the wording honest about what has and has not been published
3. avoid backfilling fake historical releases

## Choose the version deliberately

The repository currently keeps versioning manual. Before any publish:

- decide whether the next release should be an explicit release candidate such as `0.1.0-rc.1` or the first stable public `0.1.0`
- update `package.json` and `package-lock.json` together if the version changes
- rerun `npm run release:check` after any version change

## Manual publish later, if desired

This repository does not publish automatically. If a maintainer chooses to publish later, treat it as a separate deliberate action from a clean checkout after the checks above.

Typical manual steps later may include:

- `npm pack` one last time and inspect the tarball
- create a git tag only when you are satisfied with the release contents
- run `npm publish` manually when you are authenticated and ready

## What stays manual

- version selection
- changelog curation
- git tags
- npm publish
- any GitHub release notes or announcement copy
