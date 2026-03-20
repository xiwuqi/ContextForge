# Feedback triage

Use this guide to keep early external feedback actionable without widening ContextForge beyond its local-first CLI scope.

## Suggested early labels

- `bug`
- `workflow-gap`
- `feature-request`
- `docs`
- `examples`
- `release`
- `needs-repro`
- `eval-candidate`
- `out-of-scope`

## Classify the report first

- Use `bug` when the current documented behavior is wrong, broken, or inconsistent.
- Use `workflow-gap` when the product works but still leaves too much manual agent-context work around the core wedge.
- Use `feature-request` when the request proposes net-new product behavior.
- Use `docs`, `examples`, or `release` when the core CLI is fine and the friction is in explanation, demo assets, packaging, or maintainer workflow.

## Route it to the right area

- `compile`: task source loading, source normalization, task-pack generation, path relevance, source metadata.
- `export`: Codex, Claude Code, or Cursor brief rendering and output-path behavior.
- `lint`: stale references, missing paths, weak validation commands.
- `docs`: README, product docs, maintainer docs, issue templates, contribution guidance.
- `examples`: checked-in demo artifacts, example tasks, golden outputs.
- `release/process`: packaging metadata, smoke tests, eval corpus, release-check, release-artifacts, publish dry-run.

## Spot good eval-corpus candidates

Promote a report to `eval-candidate` when:

- it shows a task pack missing an obviously relevant path or file
- it shows validation commands being dropped or degraded
- it shows source metadata regression for GitHub issue inputs
- it shows an export brief losing required task-scoped sections without a formatting-only reason

Prefer adding a small deterministic fixture or subset assertion instead of a large snapshot.

## Handle scope creep politely

Close or redirect requests when they ask for:

- hosted services
- browser UIs
- databases
- multi-user administration
- telemetry by default
- heavy retrieval or training systems unrelated to the current CLI wedge

Suggested response shape:

- acknowledge the workflow need
- explain the current product boundary
- point to the smallest in-scope alternative if one exists

