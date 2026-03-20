# Release checklist

ContextForge is not published automatically by this repository. Use this checklist to verify release readiness before any manual npm publish decision.

## Pre-release validation

Run the full local validation set:

```bash
npm ci
npm run build
npm run test
npm run lint
npm run smoke:pack
```

## Packaging checks

Confirm the package metadata still matches the actual product:

- CLI package name and `bin` target are correct
- description and keywords match the current Codex and Claude Code export support
- `repository`, `homepage`, `bugs`, and MIT license metadata are present
- `files` stays minimal and only ships the compiled CLI payload

## CI checks

Before any release action, confirm:

- GitHub Actions CI is green on Node 20 and Node 22
- the `package-smoke` job passed
- no workflow in the repository performs automatic npm publish

## Manual publish boundary

This milestone stops at pack-and-smoke readiness. If npm publish is considered later, treat it as a separate deliberate step after reviewing the tarball and current docs.
