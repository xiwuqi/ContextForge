# ContextForge

ContextForge is a local-first repository-to-agent context layer. It scans a repository, compiles a task source into a scoped task pack, and exports compact briefs for Codex, Claude Code, and Cursor.

It exists to improve agent setup, not to replace the agent.

## Who this is for

- solo builders using coding agents
- open source maintainers
- small engineering teams that want repeatable local context prep

## What problem it solves

Coding agents lose time when they start without the right files, constraints, validation commands, or task framing. ContextForge turns that missing setup into checked-in, refreshable artifacts that stay local to the repository.

## How it works

1. `init` or `scan` inspects the repository and writes context artifacts under `.contextforge/`.
2. `compile` turns a markdown task or GitHub issue source into a task pack.
3. `export` renders that task pack into an agent-specific brief.
4. `lint` checks generated guidance for stale references and weak validation setup.

## Supported export targets

| Target | Command | Default output | Notes |
| --- | --- | --- | --- |
| Codex | `contextforge export codex` | `.github/codex/prompts/<slug>.md` | Compact prompt file for Codex workflows. |
| Claude Code | `contextforge export claude` | `.contextforge/exports/claude/<slug>.md` | Task brief only. No `CLAUDE.md` or `.claude/*` memory files are auto-written. |
| Cursor | `contextforge export cursor` | `.contextforge/exports/cursor/<slug>.md` | Task brief only by default. Optional `.mdc` rule suggestions are only written when `--rule-output` is passed. |

## Try it locally in under 5 minutes

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

If you want to see representative outputs before running anything, open `examples/demo/`.

## Install and package

### Local development install

```bash
npm ci
npm run build
npm link
```

If you do not want to link the CLI globally, use `node dist/cli/index.js`.

### Packaged local tarball smoke test

```bash
npm run smoke:pack
```

This builds a tarball with `npm pack`, installs it into a temporary project without `npm link`, and runs a real `contextforge scan --json` smoke check against a fixture repository.

The repository does not publish to npm automatically. Any future npm publish remains a manual maintainer action.

For a safe publishability check without releasing anything:

```bash
npm run publish:dry-run
```

This runs `npm publish --dry-run`, verifies the publishable file set, and fails if non-runtime clutter leaks into the package.

To generate a versioned release handoff bundle without publishing:

```bash
npm run release:artifacts
```

This writes a versioned bundle under `.contextforge/releases/<version>/` with the tarball, package file list, release-note draft, checksums, and a short handoff summary.

## Quickstart

1. Initialize repository context.

```bash
contextforge init
```

2. Compile exactly one task source into a task pack.

```bash
contextforge compile --input examples/issue-add-command.md
contextforge compile --github-issue owner/repo#123
contextforge compile --github-issue-json tests/fixtures/github/contextforge-issue-101.json
```

3. Export a task brief for the agent you want to use.

```bash
contextforge export codex --input .contextforge/task-packs/add-lint-command.json
contextforge export claude --input .contextforge/task-packs/add-lint-command.json
contextforge export cursor --input .contextforge/task-packs/add-lint-command.json
```

4. Optionally write a task-scoped Cursor rule suggestion.

```bash
contextforge export cursor \
  --input .contextforge/task-packs/add-lint-command.json \
  --rule-output .cursor/rules/add-lint-command.mdc
```

5. Lint generated guidance for drift.

```bash
contextforge lint
```

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

`contextforge compile` requires exactly one source flag:

- `--input <file>` for local markdown tasks
- `--github-issue <url|owner/repo#number>` for live GitHub issue fetching
- `--github-issue-json <path>` for offline issue JSON compilation

## Generated files

ContextForge keeps its generated internal artifacts under `.contextforge/` by default:

- `.contextforge/context.json`
- `.contextforge/context.md`
- `.contextforge/agents.suggested.md`
- `.contextforge/task-packs/<slug>.json`
- `.contextforge/task-packs/<slug>.md`
- `.contextforge/exports/claude/<slug>.md`
- `.contextforge/exports/cursor/<slug>.md`

Codex prompt exports are written to:

- `.github/codex/prompts/<slug>.md`

Task packs may also include source metadata:

- `source_type`
- `source_ref`
- `source_title`
- `source_labels`
- `source_url`

## Demo assets

`examples/demo/` contains a small checked-in set of representative outputs:

- one task-pack markdown example
- one task-pack JSON example
- one Codex export example
- one Claude Code export example
- one Cursor export example
- one Cursor rule suggestion example

Refresh those curated demo assets with:

```bash
npm run demo:refresh
```

The demo files are copied from deterministic golden fixtures so they stay small and reviewable.

## Maintainer workflows

Run the fixture eval corpus:

```bash
npm run build
npm run eval:fixtures
```

Run the release-candidate check set:

```bash
npm run release:check
```

Run a standalone publishability dry-run:

```bash
npm run publish:dry-run
```

Generate the versioned release handoff bundle:

```bash
npm run release:artifacts
```

`npm run release:check` runs build, test, lint, packaged smoke validation, the deterministic eval corpus, and the publish dry-run package sanity check. `npm run release:artifacts` then reruns the safety checks, packs the current version, and writes the handoff bundle under `.contextforge/releases/<version>/`.

## Provider mode

ContextForge works without any provider configuration. If `CONTEXTFORGE_PROVIDER=openai` and `OPENAI_API_KEY` are present, `compile` attempts a model-enhanced pass and falls back to deterministic heuristics if the provider call fails.

## What ContextForge does not do

- generate code for you or replace the coding agent
- run a hosted SaaS or database
- depend on a browser UI or browser automation
- require an API key for the core workflow
- automate npm publish or GitHub release creation
- auto-write `CLAUDE.md`, `.claude/*`, `.cursor/rules/*`, or legacy `.cursorrules`
- replace agent judgment with a heavy RAG stack or model training pipeline

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
