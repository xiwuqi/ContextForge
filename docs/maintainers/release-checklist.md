# Release checklist

ContextForge is not published automatically by this repository. Use this checklist to verify release readiness before any manual npm publish decision.

## Pre-release validation

Run the release-candidate validation set:

```bash
npm ci
npm run release:check
```

`npm run release:check` runs:

- `npm run build`
- `npm run test`
- `npm run lint`
- `npm run smoke:pack`
- `npm run eval:fixtures`
- `npm run publish:dry-run`

## Packaging checks

Confirm the package metadata still matches the actual product:

- CLI package name and `bin` target are correct
- description and keywords match the current Codex, Claude Code, and Cursor support
- `repository`, `homepage`, `bugs`, and MIT license metadata are present
- `files` stays minimal and only ships the compiled CLI payload
- `npm run publish:dry-run` passes and reports a clean publishable file set
- bootstrap-era docs no longer compete with `docs/product/` as a root-level source of truth

## Demo and changelog checks

Before any public release candidate:

- inspect `examples/demo/` and confirm the artifacts still look representative
- refresh the demo assets with `npm run demo:refresh` if the checked-in outputs are stale
- update `CHANGELOG.md` so the release-candidate state is honest and current
- run `npm run release:artifacts` and inspect the generated bundle under `.contextforge/releases/<version>/`
- confirm the GitHub issue templates, pull request template, `CONTRIBUTING.md`, and `SECURITY.md` still match the current workflow

## CI checks

Before any release action, confirm:

- GitHub Actions CI is green on Node 20 and Node 22
- the `package-smoke` job passed
- the `eval-fixtures` job passed
- no workflow in the repository performs automatic npm publish

## Manual public metadata

Before a first public release, review:

- `docs/maintainers/public-metadata-checklist.md`
- `docs/maintainers/manual-release-handoff.md`

## Manual publish boundary

This repository stops at release-candidate readiness. Version choice, git tags, npm publish, and any release notes outside `CHANGELOG.md` remain manual maintainer actions.
