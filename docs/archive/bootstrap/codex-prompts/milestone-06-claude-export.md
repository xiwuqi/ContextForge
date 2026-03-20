You are continuing the ContextForge repository after v0.2 step 1 (GitHub issue ingestion).

Before making changes, read and follow:
- AGENTS.md
- README.md
- docs/product/prd.md
- docs/product/milestones.md

Also inspect the existing export implementation and tests before changing anything.

Stay inside the existing product boundaries:
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

Do not widen scope beyond this milestone.

# Milestone
Claude Code export + lightweight exporter architecture (v0.2 step 2)

# Goal
Make ContextForge meaningfully useful beyond Codex by adding a second agent export target: Claude Code.

The purpose of this milestone is not to support every agent. It is to prove that ContextForge is becoming a repository-to-agent context layer, not just a Codex-specific helper.

# Product intent
ContextForge already has:
- repository scan / init
- task compilation
- Codex export
- lint
- GitHub issue ingestion

The next product step is:
- preserve the current task-pack core
- add one more high-value export target
- keep the implementation small, predictable, and non-destructive

# Required deliverables

## 1) New CLI command
Add:

`contextforge export claude --input <task-pack.json> [--output <file>]`

Behavior requirements:
- `--input` is required
- `--output` is optional
- if `--output` is omitted, write to:
  `.contextforge/exports/claude/<slug>.md`
- create parent directories as needed
- keep `export codex` fully backward compatible

## 2) Claude export format
Implement a Claude-specific markdown export that is optimized for:
- pasting into Claude Code directly
- or referencing from Claude Code with `@file`
- or piping into CLI workflows if needed

The generated markdown must be:
- compact
- task-scoped
- path-specific
- easy to read
- easy to paste
- less verbose than a PRD
- more actionable than a generic summary

Required sections in the exported markdown:
1. Task title
2. Objective
3. Source context (when available)
4. Relevant paths
5. Key files
6. Constraints
7. Risks / watchouts
8. Validation commands
9. Done when
10. Suggested implementation order

Guidance:
- include source metadata only when useful
- do not dump the full raw task pack
- do not repeat the same information in multiple sections
- do not turn this into a long essay
- prefer bullets and compact phrasing

## 3) Non-destructive Claude integration
This milestone must NOT automatically write or modify:
- `CLAUDE.md`
- `.claude/CLAUDE.md`
- `.claude/rules/*`
- `.claude/settings.json`
- `.claude/settings.local.json`

Important:
- this repo explicitly prefers non-destructive defaults
- exporting a Claude task brief is in scope
- mutating persistent Claude project memory is out of scope for this milestone

## 4) Lightweight exporter architecture
Refactor export wiring only as much as needed so that:
- `codex` and `claude` exporters are cleanly separated
- shared export helpers can be reused
- future exporters remain possible without large rewrites

Constraints:
- do not over-engineer a plugin system
- do not introduce dynamic loading
- do not add a registry framework unless a very small local map or switch is enough
- keep the architecture obvious

# Implementation requirements

## CLI / UX
- `contextforge export codex` must continue to work unchanged
- `contextforge export claude` should mirror the existing codex export UX where sensible
- terminal output should clearly show where the file was written
- errors must remain actionable

## Output path policy
- Codex exports stay where they are today
- Claude exports default to `.contextforge/exports/claude/<slug>.md`
- do not invent a fake official Claude directory convention for task prompts
- do not auto-place task prompts into always-loaded memory locations

## Rendering quality
The Claude export should feel like a serious operator brief:
- concise
- grounded in repo paths
- explicit about boundaries
- explicit about verification
- useful on the first read

## Backward compatibility
- existing task pack schema should remain stable unless a very small change is clearly justified
- existing compile behavior should not break
- existing codex export output contract should not regress

# Tests
Add or update tests for:
- CLI command wiring for `export claude`
- default output path behavior
- renderer output structure
- deterministic golden output for at least one Claude export
- regression coverage for existing codex export behavior if shared code changes

Testing rules:
- no live network calls
- deterministic fixtures only
- do not weaken existing assertions just to make the new code pass

# Documentation
Update docs in the same PR:
- README.md
- docs/product/prd.md
- docs/product/milestones.md

Also add:
- one example usage doc, e.g. `examples/claude-export-usage.md`
- one checked-in golden Claude export example fixture

README updates must include:
- the new command
- default output path
- a short explanation of how to use the generated file with Claude Code
- a clear statement that this milestone does not auto-write `CLAUDE.md`

# Out of scope
Do NOT add any of the following in this change:
- Cursor export
- Aider export
- generic “all agents” export
- automatic CLAUDE.md generation
- `.claude/rules/` generation
- hooks
- MCP integrations
- release automation
- npm publishing
- browser workflows
- SaaS/cloud features

# Definition of done
This task is done only when:
1. `npm run build` passes
2. `npm run test` passes
3. `npm run lint` passes
4. `contextforge export codex` still works
5. `contextforge export claude` works with a stable default output path
6. docs reflect the new command and behavior
7. the implementation stays inside the current product wedge
8. no persistent Claude memory files are auto-written

# Working style
- Make this a single PR-sized change
- Keep refactors minimal and justified
- Prefer small, readable abstractions
- Do not rewrite unrelated files
- Leave unrelated top-level bootstrap artifacts alone unless they break the implementation

# Final response format
At the end, provide:
1. a short implementation summary
2. a list of changed files
3. exact commands run
4. remaining risks or limitations