You are continuing the ContextForge repository after:
- init / scan
- compile
- GitHub issue ingestion
- export codex
- export claude
- lint
- release hardening / npm pack smoke coverage

Before making changes, read and follow:
- AGENTS.md
- README.md
- docs/product/prd.md
- docs/product/milestones.md
- package.json
- the existing export implementation and export tests

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
Cursor export + non-destructive Cursor rule suggestion

# Goal
Add Cursor as the next supported agent target in a way that is:
- useful immediately
- compact
- task-scoped
- non-destructive by default
- compatible with the existing export architecture

This milestone is not about building a general plugin system.
It is about proving that ContextForge is becoming a practical repository-to-agent context layer for multiple real coding agents.

# Product intent
ContextForge already supports:
- repository scan / init
- task compilation
- Codex export
- Claude export
- lint
- GitHub issue ingestion
- release-ready packaging and smoke tests

The next step is:
- preserve the task-pack core
- add Cursor-specific export value
- keep the implementation small and reviewable
- avoid mutating persistent Cursor project files unless the user explicitly asks for a file path

# Required deliverables

## 1) New CLI command
Add:

`contextforge export cursor --input <task-pack.json> [--output <file>] [--rule-output <file>]`

Behavior requirements:
- `--input` is required
- `--output` is optional
- `--rule-output` is optional
- if `--output` is omitted, write the Cursor task brief to:
  `.contextforge/exports/cursor/<slug>.md`
- create parent directories as needed
- keep `export codex` and `export claude` fully backward compatible

## 2) Cursor task brief export
Implement a Cursor-specific markdown export optimized for:
- pasting into Cursor Agent chat
- referencing from the workspace as a task brief
- using alongside existing AGENTS.md / CLAUDE.md guidance without replacing them

The generated markdown must be:
- compact
- task-scoped
- path-specific
- easy to paste
- easy to scan
- more actionable than a generic summary
- less verbose than a PRD

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
- do not dump the raw task pack
- do not repeat the same information across sections
- prefer compact bullets and direct phrasing

## 3) Optional Cursor rule suggestion export
If `--rule-output <file>` is provided, also write a Cursor rule suggestion file.

Requirements:
- generate a `.mdc` markdown file with YAML frontmatter
- use a conservative, non-destructive default rule shape
- prefer a task-scoped suggestion, not a global project rule
- default to `alwaysApply: false`
- include `description`
- include `globs` only when there is a clear, narrow, deterministic mapping from relevant paths; otherwise omit `globs`

The rule body should:
- be concise
- reinforce task boundaries
- reference relevant paths when useful
- avoid duplicating the entire task brief
- avoid pretending to be a permanent project policy when it is only task-scoped

Important:
- the generated rule file is only a suggestion artifact
- do not auto-install it into `.cursor/rules/`
- do not auto-modify any existing Cursor rules

## 4) Non-destructive Cursor integration
This milestone must NOT automatically write or modify:
- `.cursor/rules/*`
- `.cursorrules`
- `AGENTS.md`
- `CLAUDE.md`
- `.claude/CLAUDE.md`
- `.claude/rules/*`

Rules:
- exporting a Cursor task brief is in scope
- exporting an optional rule suggestion file is in scope
- auto-writing or auto-merging persistent Cursor project rules is out of scope
- if the user explicitly passes a `--rule-output` path under `.cursor/rules/`, writing that file is allowed because it is an explicit destination

## 5) Lightweight exporter architecture
Refactor export wiring only as much as needed so that:
- `codex`, `claude`, and `cursor` exporters are clearly separated
- shared export helpers remain reusable
- future exporters remain possible without large rewrites

Constraints:
- do not build a plugin system
- do not add dynamic loading
- do not add a registry framework unless a very small local map or switch is enough
- keep the architecture obvious

# Implementation requirements

## CLI / UX
- `contextforge export codex` must continue to work unchanged
- `contextforge export claude` must continue to work unchanged
- `contextforge export cursor` should mirror existing export UX where sensible
- terminal output should clearly show the written file paths
- errors must remain actionable

## Output path policy
- Codex exports stay where they are today
- Claude exports stay where they are today
- Cursor task briefs default to:
  `.contextforge/exports/cursor/<slug>.md`
- Cursor rule suggestions are only written when `--rule-output` is explicitly provided
- do not invent a fake always-loaded Cursor task directory
- do not silently create `.cursor/rules/` unless the user explicitly targeted that location

## Rendering quality
The Cursor task brief should feel like a serious operator brief:
- concise
- grounded in repo paths
- explicit about boundaries
- explicit about verification
- useful on first read

The Cursor rule suggestion should feel like a careful helper artifact:
- compact
- scoped
- not overly opinionated
- not pretending to be a full project-rules system

## Backward compatibility
- existing task pack schema should remain stable unless a very small change is clearly justified
- existing compile behavior should not break
- existing codex export output contract should not regress
- existing claude export output contract should not regress

# Tests
Add or update tests for:
- CLI command wiring for `export cursor`
- default output path behavior
- Cursor brief renderer output structure
- deterministic golden output for at least one Cursor task brief
- deterministic golden output for at least one Cursor `.mdc` rule suggestion
- regression coverage for existing codex/claude export behavior if shared code changes

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
- `examples/cursor-export-usage.md`
- one checked-in golden Cursor brief example
- one checked-in golden Cursor rule suggestion example

README updates must include:
- the new command
- the default task-brief output path
- how to use the generated brief with Cursor Agent
- how to use the optional rule suggestion file manually
- a clear statement that this milestone does not auto-write `.cursor/rules/`
- a clear statement that legacy `.cursorrules` support is not added in this milestone

# Out of scope
Do NOT add any of the following in this change:
- Aider export
- generic “all agents” export
- automatic `.cursor/rules/` installation
- automatic project-rule merging
- legacy `.cursorrules` support
- alternate folder-based Cursor rule layouts
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
4. `npm run smoke:pack` still passes
5. `contextforge export codex` still works
6. `contextforge export claude` still works
7. `contextforge export cursor` works with a stable default output path
8. optional `--rule-output` works and remains non-destructive by default
9. docs reflect the new command and behavior
10. the implementation stays inside the current product wedge

# Working style
- Make this a single PR-sized change
- Keep refactors minimal and justified
- Prefer small, readable abstractions
- Do not rewrite unrelated files
- Reuse existing fixtures where sensible
- Leave unrelated prompt files alone unless they directly conflict with the implementation

# Final response format
At the end, provide:
1. a short implementation summary
2. a list of changed files
3. exact commands run
4. remaining risks or limitations