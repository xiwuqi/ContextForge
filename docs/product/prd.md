# ContextForge PRD

- Version: v0.2 step 5
- Status: Ready for implementation
- Product type: Open source, local-first developer tool
- Primary surface: CLI
- Primary integration targets: Codex, Claude Code, and Cursor
- Secondary compatibility target: Aider / generic coding agents

## Product summary

ContextForge is a repository-to-agent context layer that compiles repository context plus issue, PRD, or task markdown into a task-scoped context pack that coding agents can use directly.

The MVP stays inside four capabilities:

1. scan a repository
2. compile markdown or GitHub issue sources into a task pack
3. export a Codex-ready prompt, Claude Code task brief, or Cursor task brief
4. lint stale context and guidance

## Product boundaries

- CLI first
- local first
- open source first
- no database
- no hosted SaaS
- no browser UI
- no heavy RAG stack
- no model training
- no background workers
- no browser automation

## Target users

- solo builders using coding agents
- open source maintainers
- small engineering teams

## Required outputs

Repository context:

- `.contextforge/context.json`
- `.contextforge/context.md`
- `.contextforge/agents.suggested.md`

Task pack:

- `.contextforge/task-packs/<slug>.json`
- `.contextforge/task-packs/<slug>.md`

Codex export:

- `.github/codex/prompts/<slug>.md`

Claude export:

- `.contextforge/exports/claude/<slug>.md`

Cursor export:

- `.contextforge/exports/cursor/<slug>.md`
- optional task-scoped Cursor rule suggestion file only when explicitly requested with `--rule-output`

Distribution readiness:

- `npm pack` produces a usable CLI tarball
- the tarball installs into a temporary project without publish automation
- CI validates build, test, lint, and packaged smoke execution

Maintainer evaluation:

- `npm run eval:fixtures` runs a deterministic offline regression corpus
- the latest report is written to `.contextforge/evals/latest.json`
- CI runs the eval corpus so task-pack and export usefulness regressions stay visible

## Required task pack fields

- task id
- title
- objective
- user request summary
- source type
- source ref
- source title
- source labels
- source url
- relevant paths
- relevant files
- possibly related paths
- constraints
- assumptions
- risks
- validation commands
- done when
- implementation plan
- open questions
- confidence
- generated timestamp

## Quality bar

The implementation is done only when:

1. the CLI builds,
2. relevant tests exist and pass,
3. lint passes,
4. docs reflect actual behavior,
5. generated markdown is compact and readable,
6. the packaged CLI installs and runs from a packed tarball,
7. CI covers validation and smoke packaging,
8. deterministic evals cover task-pack and export usefulness,
9. the MVP stays within scope.
