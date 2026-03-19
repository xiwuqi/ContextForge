# Codex Master Prompt: Build ContextForge v0.1 MVP

You are Codex operating at the root of a new or partially initialized repository for **ContextForge**.

Your job is to implement a complete, reviewable **v0.1 MVP** of the project, not a toy demo.

Before coding, read these files if they exist:

- `AGENTS.md`
- `docs/product/prd.md`
- `docs/product/milestones.md`
- `README.md`

	`AGENTS.md` -> 仓库根目录

	`ContextForge_PRD.md` -> `docs/product/prd.md`

	`Codex_Master_Prompt.md` -> `.github/codex/prompts/master-build-contextforge.md`

	`codex-github-action.yml` -> `.github/workflows/codex.yml`

If some of them do not exist yet, create them as part of the bootstrap using the product definition below.

---

## 1. Product goal

Build an open source, local-first CLI that compiles:

1. a repository,
2. a markdown issue / PRD / task description,

into a **task-scoped context pack** and a **Codex-ready prompt file**.

This product is called **ContextForge**.

It is not another code generator. It is the context preparation layer for coding agents.

---

## 2. Core product wedge

The MVP must do exactly these four things well:

1. scan a repository,
2. compile a markdown task into a task pack,
3. export a Codex-ready prompt file,
4. lint stale context and guidance.

Stay disciplined. Do not build SaaS features, UI, databases, browser automation, or heavy RAG infrastructure.

---

## 3. Target stack

Use these defaults unless the repository already strongly dictates otherwise:

- TypeScript
- Node.js 20+
- npm
- vitest
- eslint
- prettier
- zod

Keep dependencies lean.

---

## 4. Deliverables

By the end of this task, the repository should contain:

### Product and docs

- `AGENTS.md`
- `README.md`
- `docs/product/prd.md`
- `docs/product/milestones.md`
- `examples/issue-add-command.md`

### Source code

- a working CLI entrypoint
- `init`, `scan`, `compile`, `export codex`, and `lint` commands
- core modules for scanning, compilation, export, linting, schemas, providers, and utilities

### Tests

- unit tests for core logic
- integration tests using fixture repos
- at least one golden-output style test for generated artifacts

### Build and quality setup

- `package.json`
- `tsconfig.json`
- eslint config
- prettier config
- scripts for build, test, lint, format

### Optional but recommended

- `.github/codex/prompts/` with at least one generated example prompt
- `.github/workflows/` with lightweight CI for build, lint, and test

---

## 5. Required CLI behavior

Implement these commands with clear help text and predictable output locations:

```bash
contextforge init [--write-agents] [--json]
contextforge scan [--json] [--max-depth 6]
contextforge compile --input <file> [--title <title>] [--json]
contextforge export codex --input <task-pack.json> [--output <file>]
contextforge lint [--json] [--strict]
```

### Behavior rules

- non-destructive defaults
- do not overwrite top-level `AGENTS.md` unless `--write-agents` is passed
- keep all generated internal artifacts under `.contextforge/` by default
- write Codex prompt exports to `.github/codex/prompts/` by default
- support readable human output and machine-readable JSON where applicable

---

## 6. Required generated artifacts

### Repository context

`init` and `scan` should generate:

- `.contextforge/context.json`
- `.contextforge/context.md`
- `.contextforge/agents.suggested.md`

### Task pack

`compile` should generate:

- `.contextforge/task-packs/<slug>.json`
- `.contextforge/task-packs/<slug>.md`

Each task pack must contain at least:

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

### Codex export

`export codex` should generate:

- `.github/codex/prompts/<slug>.md`

This file must be compact and directly usable as a Codex task prompt.

---

## 7. Repository scan requirements

The scanner must:

- identify repo root
- avoid scanning `node_modules`, `.git`, build outputs, caches, and similar junk by default
- inspect common config files
- infer likely languages, frameworks, and commands
- preserve relative paths in outputs
- stay reasonably fast on small and medium repos

Minimum config detection targets:

- `package.json`
- `tsconfig.json`
- `eslint*`
- `prettier*`
- `vitest.config.*`
- `jest.config.*`
- `pyproject.toml`
- `requirements.txt`
- `pytest.ini`
- `go.mod`
- `Cargo.toml`
- `Makefile`
- `Dockerfile`
- `README.md`
- `CONTRIBUTING*`
- architecture docs under `docs/`

---

## 8. Task compilation requirements

Task compilation must work in two modes:

### Mode A: heuristic-only

If no provider is configured, compile a useful task pack using deterministic logic only.

### Mode B: model-enhanced

If provider configuration is present, use it for summarization, ranking, and plan drafting.

Implementation rules:

- provider usage must be isolated behind an interface
- tests must not require network access
- the product must remain useful without any API key
- confidence should reflect uncertainty honestly

---

## 9. Lint requirements

The linter must detect at least:

- missing referenced files
- missing referenced directories
- invalid or failing commands where validation is possible
- task packs missing validation commands
- task packs missing done criteria
- stale references in generated guidance

Emit readable CLI output. Support JSON output for automation.

---

## 10. Architecture constraints

Make the codebase boring in a good way:

- clear module boundaries
- no unnecessary abstraction layers
- no speculative plugin system beyond what MVP needs
- simple provider interface
- schemas centralized and tested
- utilities small and focused

Prefer straightforward code over cleverness.

---

## 11. Milestone execution order

Execute in this order. Complete each milestone fully enough that the repo stays runnable.

### Milestone 0: bootstrap

Create project scaffolding, toolchain, scripts, and docs skeleton.

Required outcome:

- installable project
- build, test, lint scripts exist
- initial README and docs present

### Milestone 1: `scan` and `init`

Implement repo scanning, context artifact generation, and suggested AGENTS generation.

Required outcome:

- fixture repos can produce stable context outputs

### Milestone 2: `compile`

Implement task markdown parsing and task pack generation.

Required outcome:

- example issue compiles into JSON + Markdown task packs

### Milestone 3: `export codex`

Implement Codex prompt export.

Required outcome:

- generated prompt file is compact and ready to use

### Milestone 4: `lint`

Implement stale context linting.

Required outcome:

- drift scenarios are covered by integration tests

---

## 12. Testing expectations

You must add meaningful tests, not placeholder tests.

At minimum include:

- schema tests
- command inference tests
- path selection tests
- task pack generation tests
- exporter tests
- lint drift tests
- integration tests using fixture repositories

If outputs are intentionally structured, use snapshot or golden tests where appropriate.

---

## 13. Documentation expectations

The README must clearly explain:

- what ContextForge is
- why it exists
- installation
- command usage
- generated file locations
- a full quickstart example

The docs must match the actual code. Do not leave aspirational docs that the implementation does not satisfy.

---

## 14. Quality bar

Before finishing, verify all of the following:

```bash
npm run build
npm run test
npm run lint
```

If a command fails because it does not exist yet, create or fix it as part of the task.

Also ensure:

- generated Markdown is readable
- paths in outputs are relative and valid
- defaults are non-destructive
- no hidden network dependency exists in tests
- the project stays inside MVP scope

---

## 15. Working style

- Do not wait for approval between milestones unless blocked by missing external credentials or a truly dangerous action.
- Make reasonable assumptions and continue.
- Keep changes coherent and repository-friendly.
- Update docs as behavior stabilizes.
- If you create optional provider support, make sure the project still works with no provider configured.
- If a design choice is ambiguous, choose the simplest path that preserves the product wedge.

---

## 16. Final output requirements

When finished, provide a concise final report that includes:

1. what was implemented
2. notable design decisions
3. commands run for validation
4. any remaining limitations or follow-up suggestions

Do not claim features that are not actually implemented.

---

## 17. Product reference summary

Use this summary if docs are missing:

- Name: ContextForge
- Type: open source CLI
- Users: solo builders, OSS maintainers, small teams
- Value: convert repo + task markdown into agent-ready context
- MVP commands: `init`, `scan`, `compile`, `export codex`, `lint`
- Default internal folder: `.contextforge/`
- Default Codex prompt folder: `.github/codex/prompts/`
- Default behavior: local-first, no SaaS, no DB, no heavy infra, optional provider integration only

Now implement the full v0.1 MVP.
