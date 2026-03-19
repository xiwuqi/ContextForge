# ContextForge PRD

- Version: v0.1 MVP
- Status: Ready for implementation
- Product type: Open source, local-first developer tool
- Primary surface: CLI
- Primary integration target: Codex
- Secondary compatibility target: Claude Code / Cursor / Aider / generic coding agents

## Product summary

ContextForge compiles repository context plus issue, PRD, or task markdown into a task-scoped context pack that coding agents can use directly.

The MVP stays inside four capabilities:

1. scan a repository
2. compile markdown into a task pack
3. export a Codex-ready prompt
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

## Required task pack fields

- task id
- title
- objective
- user request summary
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
6. the MVP stays within scope.
