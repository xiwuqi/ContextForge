# Demo assets

This directory contains a small checked-in set of representative ContextForge outputs for first-time readers.

It is intentionally curated, not exhaustive.

## Included artifacts

- `task-pack-add-lint.md`
- `task-pack-github-issue.json`
- `codex-add-lint.md`
- `claude-github-issue.md`
- `cursor-github-issue.md`
- `cursor-github-issue-rule.mdc`

## Where they came from

- `task-pack-add-lint.md` and `codex-add-lint.md` come from the local markdown task fixture for "Add lint command".
- `task-pack-github-issue.json`, `claude-github-issue.md`, `cursor-github-issue.md`, and `cursor-github-issue-rule.mdc` come from the checked-in GitHub issue JSON fixture at `tests/fixtures/github/contextforge-issue-101.json`.
- The demo files are copied from deterministic golden fixtures under `tests/fixtures/golden/`.
- Product-facing prompt examples belong here. `.github/codex/prompts/` is kept for the active workflow prompt and real generated Codex outputs.

## Refresh

Refresh the curated demo assets with:

```bash
npm run demo:refresh
```

Review the copied files before committing them so the demo stays small and representative.
