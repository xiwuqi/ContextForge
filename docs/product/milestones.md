# ContextForge Milestones

## Milestone 0: Bootstrap

Deliver:

- TypeScript CLI scaffold
- npm scripts for build, test, lint, format
- README, PRD, milestones, and example task docs
- lightweight CI configuration

Exit criteria:

- `npm install`
- `npm run build`
- `npm run test`
- `npm run lint`

## Milestone 1: Scan and Init

Deliver:

- repository scanner
- context artifact generation
- suggested `AGENTS.md` generation

Exit criteria:

- fixture repositories produce stable context outputs

## Milestone 2: Compile

Deliver:

- markdown task parsing
- heuristic path relevance scoring
- optional provider enhancement hook
- task pack JSON and Markdown generation

Exit criteria:

- example task compiles into the required fields and readable markdown

## Milestone 3: Export Codex

Deliver:

- compact Codex prompt exporter
- default output under `.github/codex/prompts/`
- committed example prompt

Exit criteria:

- exported prompt is directly usable without cleanup

## Milestone 4: Lint

Deliver:

- missing path detection
- command validation where safe and possible
- drift detection for generated guidance

Exit criteria:

- integration tests cover missing-path and stale-guidance scenarios

## Milestone 5: GitHub Issue Ingestion

Deliver:

- `compile` support for `--github-issue` and `--github-issue-json`
- normalized source loading before task compilation
- task-pack source metadata for GitHub-backed tasks
- deterministic fixtures for issue JSON and generated task packs

Exit criteria:

- `compile` accepts exactly one source flag
- public and authenticated issue fetching share the same normalized path
- offline issue JSON compilation works without network access

## Milestone 6: Export Claude Code

Deliver:

- `export claude` command
- compact Claude Code task brief renderer
- shared export helper that preserves Codex behavior
- deterministic fixture coverage for Claude export output

Exit criteria:

- `export codex` remains backward compatible
- `export claude` writes to `.contextforge/exports/claude/<slug>.md` by default
- no `CLAUDE.md` or `.claude/*` memory files are auto-written

## Milestone 7: Release Hardening

Deliver:

- hardened package metadata for a public CLI
- `prepack` and a deterministic packaged smoke script
- CI validation on Node 20 and Node 22
- package smoke verification from a local tarball install

Exit criteria:

- `npm pack` succeeds without manual cleanup steps
- the packed tarball installs into a temporary project and runs a real CLI command
- CI covers build, test, lint, and packaged smoke validation
- docs explain the local install and release-readiness story without implying automatic publish

## Milestone 8: Export Cursor

Deliver:

- `export cursor` command
- compact Cursor task brief renderer
- optional task-scoped Cursor `.mdc` rule suggestion export
- deterministic golden coverage for Cursor brief and rule suggestion output

Exit criteria:

- `export codex` and `export claude` remain backward compatible
- `export cursor` writes to `.contextforge/exports/cursor/<slug>.md` by default
- Cursor rule suggestions are only written when `--rule-output` is explicitly provided
- no automatic writes to `.cursor/rules/*` or legacy `.cursorrules`
