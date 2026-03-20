[English](README.md) | [简体中文](README.zh-CN.md)

# ContextForge

ContextForge is a local-first repository-to-agent context layer that scans a repository, compiles a task source into a task pack, and exports compact briefs for Codex, Claude Code, and Cursor.

![ContextForge overview](docs/assets/contextforge-overview.svg)

## Who this is for

- solo builders using coding agents
- open source maintainers
- small engineering teams that want repeatable local context prep

## What problem it solves

Coding agents waste time when they start without the right files, constraints, validation commands, or task framing. ContextForge turns that missing setup into local, reviewable artifacts that can be regenerated and checked into the repo.

## How it works

1. `init` or `scan` inspects the repository and writes context artifacts under `.contextforge/`.
2. `compile` turns a markdown task or GitHub issue source into a structured task pack.
3. `export` renders that task pack into an agent-specific brief.
4. `lint` checks generated guidance for stale references and weak validation setup.

![ContextForge outputs](docs/assets/contextforge-outputs.svg)

## Supported export targets

| Target | Command | Default output | Notes |
| --- | --- | --- | --- |
| Codex | `contextforge export codex` | `.github/codex/prompts/<slug>.md` | Compact prompt file for Codex workflows. |
| Claude Code | `contextforge export claude` | `.contextforge/exports/claude/<slug>.md` | Task brief only. No `CLAUDE.md` or `.claude/*` memory files are auto-written. |
| Cursor | `contextforge export cursor` | `.contextforge/exports/cursor/<slug>.md` | Task brief only by default. Optional `.mdc` rule suggestions are only written when `--rule-output` is passed. |

## Quickstart

ContextForge targets Node.js 20 and newer. CI validates the CLI on Node 20 and Node 22.

```bash
npm ci
npm run build
node dist/cli/index.js init
node dist/cli/index.js compile --input examples/issue-add-command.md
node dist/cli/index.js export codex --input .contextforge/task-packs/add-lint-command.json
```

That gives you:

- repository context under `.contextforge/`
- a compiled task pack under `.contextforge/task-packs/`
- a Codex prompt under `.github/codex/prompts/`

## Demo and examples

- Open `examples/demo/` for small checked-in task-pack and export examples.
- Use `examples/issue-add-command.md` for the local markdown compile flow.
- Use `examples/github-issue-sources.md` for GitHub issue input examples.
- Use `examples/claude-export-usage.md` and `examples/cursor-export-usage.md` for agent-specific export examples.
- Internal milestone Codex prompts are archived under `docs/archive/bootstrap/codex-prompts/`. `.github/codex/prompts/` is kept for the active workflow prompt and real generated Codex outputs.

Refresh curated demo assets with:

```bash
npm run demo:refresh
```

## Install, package, and release checks

Local development install:

```bash
npm ci
npm run build
npm link
```

If you do not want to link the CLI globally, use `node dist/cli/index.js`.

Packaged local tarball smoke test:

```bash
npm run smoke:pack
```

Publishability dry-run without publishing:

```bash
npm run publish:dry-run
```

Full release-candidate validation:

```bash
npm run release:check
```

Versioned release handoff bundle:

```bash
npm run release:artifacts
```

This writes a versioned bundle under `.contextforge/releases/<version>/` with the tarball, package file list, release-note draft, checksums, and a short summary for manual release handoff.

## CLI surface

```bash
contextforge init [--write-agents] [--json]
contextforge scan [--json] [--max-depth 6]
contextforge compile (--input <file> | --github-issue <url|owner/repo#number> | --github-issue-json <path>) [--title <title>] [--json]
contextforge export codex --input <task-pack.json> [--output <file>]
contextforge export claude --input <task-pack.json> [--output <file>]
contextforge export cursor --input <task-pack.json> [--output <file>] [--rule-output <file>]
contextforge lint [--json] [--strict]
```

`contextforge compile` requires exactly one source flag:

- `--input <file>` for local markdown tasks
- `--github-issue <url|owner/repo#number>` for live GitHub issue fetching
- `--github-issue-json <path>` for offline issue JSON compilation

## What ContextForge does not do

- generate code for you or replace the coding agent
- run a hosted SaaS or database
- depend on a browser UI or browser automation
- require an API key for the core workflow
- automate npm publish or GitHub release creation
- auto-write `CLAUDE.md`, `.claude/*`, `.cursor/rules/*`, or legacy `.cursorrules`
- replace agent judgment with a heavy RAG stack or model training pipeline

## Maintainer docs

- `docs/maintainers/release-checklist.md`
- `docs/maintainers/first-public-release.md`
- `docs/maintainers/manual-release-handoff.md`
- `docs/maintainers/public-metadata-checklist.md`
- `docs/maintainers/feedback-triage.md`

## Feedback and contributing

- Open a GitHub issue with the built-in bug report, feature request, or workflow feedback template.
- Use `CONTRIBUTING.md` for local setup, validation expectations, and scope discipline before opening a pull request.
- Use `SECURITY.md` for security-sensitive reports. Do not post exploit details in a public issue.

## Development

```bash
npm ci
npm run build
npm run test
npm run lint
npm run smoke:pack
npm run eval:fixtures
npm run publish:dry-run
npm run release:check
npm run release:artifacts
npm run demo:refresh
npm run format
```
