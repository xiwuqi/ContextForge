You are continuing the ContextForge repository after:
- init / scan
- compile
- GitHub issue ingestion
- export codex
- export claude
- export cursor
- lint
- release hardening / npm pack smoke coverage

Before making changes, read and follow:
- AGENTS.md
- README.md
- docs/product/prd.md
- docs/product/milestones.md
- package.json
- scripts/smoke-pack.mjs
- .github/workflows/ci.yml
- existing compile/export tests and golden fixtures

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
Deterministic eval/regression corpus + instruction sync

# Goal
Make ContextForge's core quality measurable and regression-resistant.

This milestone is NOT about adding more end-user product surface area.
It is about:
- proving that task-pack quality is preserved over time
- preventing silent regressions in compile/export usefulness
- turning "this feels useful" into repeatable maintainer checks
- aligning repo instructions/docs with the current supported export targets

# Why this matters
ContextForge now has a real feature wedge and multiple export targets.
What it still lacks is a repeatable way to answer:
- Are the generated task packs still pointing to the right parts of the repo?
- Are validation commands still preserved?
- Are required sections still present?
- Are agent briefs still complete and task-scoped?
- Did a refactor make outputs worse without breaking unit tests?

Right now the repo has tests and golden fixtures, but it still needs a small, explicit eval layer focused on product quality.

# Required deliverables

## 1) Maintainer-facing eval runner
Add a deterministic maintainer command:

`npm run eval:fixtures`

Implementation constraints:
- this is a maintainer workflow, not a new end-user CLI surface
- do NOT add a public `contextforge eval` command unless there is a very strong reason
- prefer a small Node-based script (for example under `scripts/`) over a complex framework
- keep it offline and deterministic
- do not require API keys
- do not require network access
- do not require a database

The eval runner should:
- load checked-in eval case definitions
- run ContextForge against those cases
- score the resulting task packs and export outputs
- print a compact human-readable summary
- write a machine-readable JSON report to a stable local path such as:
  `.contextforge/evals/latest.json`
- exit non-zero when required checks or thresholds fail

If the build output is required, fail with actionable guidance instead of cryptic errors.

## 2) Checked-in eval corpus
Add a small checked-in eval corpus using deterministic fixtures.

Use existing fixture repos and sources where sensible.
Add only the smallest new fixture surface needed.

Corpus requirements:
- 3 to 6 total eval cases
- include at least:
  1. one local markdown task-source case
  2. one GitHub issue JSON case
  3. one case that exercises nested / path-specific relevance
  4. exporter coverage across codex, claude, and cursor somewhere in the corpus

Each eval case definition should be small and obvious.
Use a simple JSON or JSON-like structure that includes:
- case id
- fixture repo
- source type
- source path/ref
- expected must-have relevant paths
- expected must-have key files
- expected must-have validation commands
- required task-pack sections
- expected source metadata when relevant
- export targets to validate

Prefer "must-have subsets" and explicit thresholds over giant exact-output snapshots.

## 3) Scoring model
Implement a deterministic, easy-to-understand scoring model.

The scoring model must include case-level checks for:
- required relevant path coverage
- required key file coverage
- required validation command coverage
- presence of required task-pack sections
- source metadata correctness for GitHub issue JSON cases
- exporter completeness checks for requested targets

Important:
- do NOT turn compile output evaluation into brittle full-string equality
- do NOT require exact ordering unless it is truly important
- prefer semantic subset checks and stable thresholds
- exact rendering of exporters can continue to be covered by existing golden tests where appropriate

Suggested scoring shape:
- per-case pass/fail
- per-dimension metrics
- aggregate summary across the corpus

The exact metric names are up to you, but they must be readable and maintainable.

## 4) Exporter validation in evals
The eval runner should validate exporter usefulness without duplicating every existing golden test.

For requested export targets in a case:
- ensure export succeeds
- ensure output is non-empty
- ensure required sections are present
- ensure task-specific paths/constraints/validation information are preserved
- keep checks compact and deterministic

Use the existing exact golden tests for render-format regressions where they already exist.
The new eval runner should focus on product usefulness and semantic completeness.

## 5) CI integration
Wire the new eval runner into CI.

Requirements:
- CI must run `npm run eval:fixtures`
- keep the workflow readable and minimal
- keep network-free execution
- do not slow CI down excessively
- do not remove or weaken existing validation steps
- keep `npm run smoke:pack` coverage working

A separate job is acceptable if that keeps the pipeline clear.

## 6) Instruction sync
Update instruction/docs wording where needed so repo guidance reflects the current product truth.

Required files to review and update if needed:
- AGENTS.md
- README.md
- docs/product/prd.md
- docs/product/milestones.md
- package.json

Requirements:
- align product wording with the current supported exports: codex, claude, cursor
- do not over-claim unsupported agents
- keep the product positioned as a repository-to-agent context layer
- keep the local-first CLI framing
- avoid stale wording that implies the product is Codex-only if that is no longer true

Important:
- keep AGENTS.md concise and operational
- do not turn AGENTS.md into a long essay
- preserve existing boundaries and technical defaults

## 7) Maintainer documentation
Add maintainer-facing documentation for the eval system.

Add:
- `docs/maintainers/eval-corpus.md`

This doc should explain:
- what the eval corpus is for
- how to run it
- how to read the report
- how to add a new case
- how to adjust thresholds carefully
- what belongs in evals vs unit tests vs golden tests

Keep it practical and concise.

# Implementation requirements

## Scope discipline
- Make this a single PR-sized change
- prefer small, readable abstractions
- reuse existing fixtures and helpers where sensible
- do not rewrite unrelated compile/export logic
- do not introduce a heavyweight eval framework
- do not add OpenAI Evals API integration
- do not add model-as-judge logic
- do not add telemetry or dashboards
- do not add browser or SaaS features

## Stability requirements
- existing compile behavior must not break
- existing export codex behavior must not break
- existing export claude behavior must not break
- existing export cursor behavior must not break
- existing smoke-pack behavior must not break

# Tests
Add or update tests for any new behavior that needs unit/integration coverage.

At minimum:
- eval case loading is validated
- scoring behavior is validated for at least one representative case
- failure behavior is tested if practical
- existing tests remain strong

Rules:
- no live network calls
- deterministic fixtures only
- do not weaken assertions just to get green CI
- do not delete useful coverage to simplify implementation

# Out of scope
Do NOT add any of the following in this milestone:
- new agent exports
- public `contextforge eval` CLI unless absolutely justified
- OpenAI Evals API integration
- model-judge evaluation
- telemetry
- dashboards
- SaaS/cloud features
- databases
- release automation
- npm publish automation
- browser workflows
- MCP integrations
- plugin systems

# Definition of done
This task is done only when:
1. `npm run build` passes
2. `npm run test` passes
3. `npm run lint` passes
4. `npm run smoke:pack` passes
5. `npm run eval:fixtures` passes
6. CI runs the eval workflow successfully
7. the eval corpus is checked in and documented
8. AGENTS.md / README / product docs are aligned with current supported exports where needed
9. the implementation stays inside the current product wedge

# Working style
- Prefer minimal, reviewable changes
- Keep scoring logic obvious
- Keep corpus size intentionally small
- Optimize for maintainability, not cleverness
- Do not touch unrelated prompt files unless they directly conflict with the implementation

# Final response format
At the end, provide:
1. a short implementation summary
2. a list of changed files
3. exact commands run
4. remaining risks or limitations