# ContextForge

ContextForge is a local-first CLI for turning a repository plus a markdown task description into a compact task-scoped context pack and a Codex-ready prompt file.

It exists to improve coding-agent setup, not to replace the agent. The tool focuses on four jobs:

1. scan a repository
2. compile markdown tasks into structured task packs
3. export compact Codex prompts
4. lint stale context and guidance

## Why it exists

Coding agents fail early when they start with incomplete repository context, vague constraints, or missing validation steps. ContextForge packages that missing setup into reproducible artifacts that are easy to inspect, commit, and refresh locally.

## Installation

```bash
npm install
npm run build
npm link
```

If you do not want to link the CLI globally, use `node dist/cli/index.js` after building.

## Commands

```bash
contextforge init [--write-agents] [--json]
contextforge scan [--json] [--max-depth 6]
contextforge compile (--input <file> | --github-issue <url|owner/repo#number> | --github-issue-json <path>) [--title <title>] [--json]
contextforge export codex --input <task-pack.json> [--output <file>]
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

## Quickstart

1. Initialize repository context.

```bash
contextforge init
```

2. Compile a task markdown file into a task pack.

```bash
contextforge compile --input examples/issue-add-command.md
```

You can also compile directly from GitHub issues:

```bash
contextforge compile --github-issue https://github.com/owner/repo/issues/123
contextforge compile --github-issue owner/repo#123
contextforge compile --github-issue-json tests/fixtures/github/contextforge-issue-101.json
```

3. Export a Codex prompt from the generated task pack.

```bash
contextforge export codex --input .contextforge/task-packs/add-lint-command.json
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
npm run build
npm run test
npm run lint
npm run format
```
