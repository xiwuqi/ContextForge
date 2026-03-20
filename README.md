# ContextForge

ContextForge is a local-first CLI and repository-to-agent context layer for turning a repository plus a task source into a compact task-scoped context pack and agent-ready export files for Codex, Claude Code, and Cursor.

It exists to improve coding-agent setup, not to replace the agent. The tool focuses on four jobs:

1. scan a repository
2. compile task sources into structured task packs
3. export compact Codex, Claude Code, and Cursor prompts
4. lint stale context and guidance

## Why it exists

Coding agents fail early when they start with incomplete repository context, vague constraints, or missing validation steps. ContextForge packages that missing setup into reproducible artifacts that are easy to inspect, commit, and refresh locally.

## Installation

ContextForge targets Node.js 20 and newer. CI validates the CLI on Node 20 and Node 22.

### Local development install

```bash
npm ci
npm run build
npm link
```

If you do not want to link the CLI globally, use `node dist/cli/index.js` after building.

### Packaged local tarball smoke test

```bash
npm run smoke:pack
```

This command builds a tarball with `npm pack`, installs it into a temporary project without using `npm link`, and runs a real `contextforge scan --json` smoke check against a fixture repository.

The repository does not publish to npm automatically today. Once published, the intended install flow can be documented as a standard npm install path, but this repo currently stops at local pack-and-smoke validation.

### Maintainer eval corpus

```bash
npm run build
npm run eval:fixtures
```

The eval runner is a deterministic maintainer check. It compiles checked-in cases, validates task-pack usefulness, validates requested exports, and writes a JSON report to `.contextforge/evals/latest.json`.

## Commands

```bash
contextforge init [--write-agents] [--json]
contextforge scan [--json] [--max-depth 6]
contextforge compile (--input <file> | --github-issue <url|owner/repo#number> | --github-issue-json <path>) [--title <title>] [--json]
contextforge export codex --input <task-pack.json> [--output <file>]
contextforge export claude --input <task-pack.json> [--output <file>]
contextforge export cursor --input <task-pack.json> [--output <file>] [--rule-output <file>]
contextforge lint [--json] [--strict]
```

`contextforge compile` requires exactly one source flag. Use:

- `--input <file>` for the existing local markdown workflow
- `--github-issue <url|owner/repo#number>` to fetch a GitHub issue directly
- `--github-issue-json <path>` for offline compilation from an exported issue payload

## Generated files

ContextForge keeps its internal generated artifacts under `.contextforge/` by default:

- `.contextforge/context.json`
- `.contextforge/context.md`
- `.contextforge/agents.suggested.md`
- `.contextforge/task-packs/<slug>.json`
- `.contextforge/task-packs/<slug>.md`

Codex prompt exports are written to `.github/codex/prompts/` by default:

- `.github/codex/prompts/<slug>.md`

Claude Code task brief exports are written to `.contextforge/exports/claude/` by default:

- `.contextforge/exports/claude/<slug>.md`

Cursor task brief exports are written to `.contextforge/exports/cursor/` by default:

- `.contextforge/exports/cursor/<slug>.md`

## Quickstart

1. Initialize repository context.

```bash
contextforge init
```

2. Compile a task source into a task pack.

```bash
contextforge compile --input examples/issue-add-command.md
```

You can also compile directly from GitHub issues:

```bash
contextforge compile --github-issue https://github.com/owner/repo/issues/123
contextforge compile --github-issue owner/repo#123
contextforge compile --github-issue-json tests/fixtures/github/contextforge-issue-101.json
```

3. Export an agent brief from the generated task pack.

```bash
contextforge export codex --input .contextforge/task-packs/add-lint-command.json
contextforge export claude --input .contextforge/task-packs/add-lint-command.json
contextforge export cursor --input .contextforge/task-packs/add-lint-command.json
```

4. Lint the generated guidance for drift.

```bash
contextforge lint
```

## Provider mode

ContextForge works without any provider configuration. If `CONTEXTFORGE_PROVIDER=openai` and `OPENAI_API_KEY` are present, `compile` attempts a model-enhanced pass and falls back to deterministic heuristics if the provider call fails.

## GitHub issue sources

GitHub issue fetching stays optional:

- Public issues can be fetched directly with `--github-issue`.
- If `GITHUB_TOKEN` is set, ContextForge sends it as a bearer token for authenticated issue access.
- Offline mode still works with `--input` and `--github-issue-json`.

Task packs now include source metadata so downstream tooling can tell where the task came from:

- `source_type`
- `source_ref`
- `source_title`
- `source_labels`
- `source_url`

## Claude Code exports

`contextforge export claude` writes a compact markdown task brief that is meant for Claude Code workflows:

- paste the generated markdown directly into Claude Code
- reference it with `@.contextforge/exports/claude/<slug>.md`
- keep it alongside the task pack without writing to persistent Claude memory

Example:

```bash
contextforge export claude --input .contextforge/task-packs/add-lint-command.json
```

This milestone does not auto-write any Claude project memory files, including:

- `CLAUDE.md`
- `.claude/CLAUDE.md`
- `.claude/rules/*`
- `.claude/settings.json`
- `.claude/settings.local.json`

## Cursor exports

`contextforge export cursor` writes a compact markdown brief for Cursor Agent and can optionally write a task-scoped `.mdc` rule suggestion file.

Example brief export:

```bash
contextforge export cursor --input .contextforge/task-packs/add-lint-command.json
```

Optional manual rule suggestion export:

```bash
contextforge export cursor \
  --input .contextforge/task-packs/add-lint-command.json \
  --rule-output .cursor/rules/add-lint-command.mdc
```

Use the generated brief by pasting it into Cursor Agent chat or keeping it in the workspace as a task brief. The optional `.mdc` file is only a suggestion artifact for manual use.

This milestone does not auto-write:

- `.cursor/rules/*`
- `.cursorrules`

Legacy `.cursorrules` support is not added in this milestone.

## Repository layout

```text
.github/
  workflows/
  codex/
    prompts/
docs/
  product/
examples/
src/
tests/
.contextforge/
```

## Development

```bash
npm ci
npm run build
npm run test
npm run lint
npm run smoke:pack
npm run eval:fixtures
npm run format
```
