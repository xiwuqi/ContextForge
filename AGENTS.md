# AGENTS.md

## Mission

Build **ContextForge** as a practical, open source, local-first CLI that turns repository context plus a task source into a task pack and agent-ready briefs for Codex, Claude Code, and Cursor.

The repository should feel like a serious developer tool, not a demo and not a chat wrapper.

## Product boundaries

Stay inside these boundaries unless the user explicitly asks to expand scope:

- CLI first
- local first
- open source first
- no database
- no hosted SaaS
- no browser UI
- no heavy RAG stack
- no model training
- no background worker system
- no browser automation features

The MVP wedge is:

1. scan repository
2. compile task sources into a task pack
3. export compact agent-ready briefs
4. lint stale context and guidance

## Primary audience

Optimize first for:

- solo builders using coding agents
- open source maintainers
- small engineering teams

Do not optimize first for enterprise governance or multi-tenant administration.

## Technical defaults

- Language: TypeScript
- Runtime: Node.js 20+
- Package manager: npm
- Testing: vitest
- Linting: eslint
- Formatting: prettier
- Validation: zod

Prefer a small dependency footprint. Add production dependencies only when they clearly reduce complexity or improve correctness.

## Repository layout target

Use this target structure unless there is a strong reason to change it:

```text
.github/
  workflows/
  codex/
    prompts/
docs/
  product/
examples/
src/
  cli/
    commands/
  core/
    scan/
    compile/
    export/
    lint/
    providers/
    schema/
    utils/
tests/
  fixtures/
  integration/
  unit/
.contextforge/
```

If you change this structure, update the README and product docs in the same change.

## Working style

- Read `docs/product/prd.md` before implementing major features.
- Think in milestones. Keep each change coherent and reviewable.
- Prefer small, verifiable steps over clever but opaque architecture.
- Make reasonable assumptions when details are missing, but document them.
- Avoid TODO-heavy code. If something is out of scope, omit it cleanly instead of leaving half-built scaffolding.

## Build, test, lint, format

By the end of bootstrap, these commands should exist and be kept working:

```bash
npm install
npm run build
npm run test
npm run lint
npm run format
```

When you modify code, run the narrowest relevant checks first, then run the full validation set before considering the task complete.

Minimum expectation before finishing a feature:

```bash
npm run build
npm run test
npm run lint
```

## Definition of done

A task is only done when all of the following are true:

1. The code builds.
2. Relevant tests exist and pass.
3. Lint passes.
4. The user-facing behavior is documented if it changed.
5. Output formats remain stable and readable.
6. The implementation stays inside MVP scope.

## CLI UX rules

When building commands:

- prefer explicit flags over magic behavior,
- choose non-destructive defaults,
- support `--json` where structured output is useful,
- keep terminal copy concise and useful,
- use predictable output locations,
- emit actionable error messages.

Do not silently overwrite important files.

## Output quality rules

This product produces structured context. Output quality matters as much as internal code quality.

Prioritize:

- accuracy over verbosity,
- compactness over essay-like prose,
- clear path references,
- explicit constraints,
- strong done criteria,
- reproducible command lists.

Generated Markdown should be easy to paste into Codex without cleanup.

## Scanning rules

Repository scanning must:

- avoid `node_modules`, `.git`, build artifacts, caches, and obviously irrelevant folders by default,
- preserve relative paths,
- stay fast on small and medium repositories,
- prefer deterministic signals before model inference.

If confidence is low, surface uncertainty instead of pretending precision.

## Provider rules

Model assistance is optional in MVP.

- The system must work in heuristic mode with no API key.
- OpenAI provider support may be added, but keep it isolated behind a provider interface.
- Do not make network calls during tests.
- Do not hard-require a hosted backend.

## Testing rules

Write tests for:

- schema validation
- command inference
- path relevance scoring
- task pack generation
- exporter formatting
- lint drift detection

Use fixture repositories and golden outputs where helpful.

If changing output structure, update tests deliberately rather than weakening assertions.

## Documentation rules

Keep these files current:

- `README.md` for installation and usage
- `docs/product/prd.md` for product intent and scope
- `docs/product/milestones.md` for implementation phases
- example files in `examples/`

When behavior changes, update docs in the same change.

## Review guidelines

When reviewing or self-checking changes, pay special attention to:

- accidental scope creep into SaaS / UI / infra territory
- unsafe file overwrites
- commands that do not actually run
- output files that are too verbose for real agent use
- stale or incorrect path references
- poor cross-platform path handling
- missing tests for parser / generator logic

Treat broken validation commands, destructive defaults, or incorrect output contracts as high-severity issues.

## Forbidden moves without explicit user approval

- introducing a database
- introducing authentication or multi-user features
- adding a frontend app
- adding telemetry by default
- replacing npm with another package manager
- adding heavy framework abstractions without clear payoff
- silently rewriting top-level `AGENTS.md`
- deleting large parts of the repo to simplify implementation

## If blocked

If a requirement is ambiguous, choose the simplest implementation that preserves the product wedge and document the assumption.

If an external credential is needed, keep the integration optional and make the rest of the feature work without it.
