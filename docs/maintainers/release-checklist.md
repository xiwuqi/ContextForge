# Release checklist

ContextForge does not release on push automatically. Use this checklist before any manual-dispatch release workflow or equivalent manual release decision.

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

## Release automation prerequisites

Before using `.github/workflows/release.yml`, confirm:

- `package.json` version matches the intended release version
- `CHANGELOG.md` contains a real versioned entry for that release instead of only `Unreleased`
- GitHub Actions workflow permissions allow write access to contents
- npm trusted publishing is configured, or an `NPM_TOKEN` secret is available for fallback publishing
- `REPO_METADATA_TOKEN` is configured if you want the workflow to sync description, homepage, and topics

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

Before a public release, review:

- `docs/maintainers/public-metadata-checklist.md`
- `docs/maintainers/manual-release-handoff.md`
- `docs/maintainers/release-automation.md`
- `docs/maintainers/live-release-prerequisites.md`
- `docs/maintainers/npm-publish-guide.md`

## Manual publish boundary

Version choice and changelog readiness remain manual maintainer actions. The repository can automate the rest only when the required workflow permissions, GitHub token scope, and npm publishing setup are configured correctly.
