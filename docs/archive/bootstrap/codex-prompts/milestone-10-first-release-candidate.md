You are continuing the ContextForge repository after:
- init / scan
- compile
- GitHub issue ingestion
- export codex
- export claude
- export cursor
- lint
- release hardening / npm pack smoke coverage
- deterministic eval/regression corpus

Before making changes, read and follow:
- AGENTS.md
- README.md
- docs/product/prd.md
- docs/product/milestones.md
- docs/maintainers/release-checklist.md
- docs/maintainers/eval-corpus.md
- package.json
- .github/workflows/ci.yml
- scripts/smoke-pack.mjs
- scripts/eval-fixtures.mjs

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
First public release candidate + onboarding proof

# Goal
Make ContextForge feel ready for its first real external users.

This milestone is NOT about adding more product features.
It is about:
- making the project easier to understand at a glance
- making the install/try path clearer
- making the repository feel ready for a first public release
- making release preparation repeatable
- creating a small amount of proof-oriented demo material

# Why this matters
ContextForge now has enough core functionality and quality gates to support early outside use.
The next leverage point is reducing external friction:
- people should understand what the tool does in under 30 seconds
- they should see real example outputs
- maintainers should have a repeatable release-candidate checklist
- the repo should look like a serious CLI project, not just an internal prototype

# Required deliverables

## 1) Public positioning and README upgrade
Upgrade the README so it matches the real current product and helps first-time visitors quickly understand value.

Required README improvements:
- tighten the opening value proposition
- position ContextForge as a repository-to-agent context layer, not just a Codex helper
- mention current supported exports accurately: codex, claude, cursor
- keep all claims honest and local-first
- add a short “who this is for” section
- add a short “what problem it solves” section
- add a compact “how it works” section
- add a small supported export targets table or compact matrix
- add a clearer quickstart that reflects the current CLI surface
- add a “try it locally in under 5 minutes” section using existing fixtures when possible
- add a “what ContextForge does not do” section to reinforce scope discipline

Do not turn the README into a long essay.
Optimize for first-visit clarity and credibility.

## 2) Example output / demo assets
Add checked-in demo artifacts so users can understand outputs without running the tool first.

Add a small, deterministic demo directory, for example:
- `examples/demo/`

It should include a compact, checked-in set of representative outputs generated from existing fixtures, such as:
- one task-pack markdown example
- one task-pack JSON example
- one codex export example
- one claude export example
- one cursor export example
- optionally one cursor rule suggestion example if already available and useful

Requirements:
- reuse existing fixtures where sensible
- do not add huge generated files
- keep these demo assets intentionally small and curated
- document where they came from
- add a tiny maintainer note on how to refresh them

Important:
- do not create a giant snapshot zoo
- choose one or two representative fixture tasks only
- optimize for explanation, not exhaustiveness

## 3) Release-candidate maintainer workflow
Add a deterministic maintainer command for release-candidate validation.

Add:
- `npm run release:check`

This command should run the minimal set of checks needed before cutting a first public release candidate.

It should include:
- build
- test
- lint
- smoke:pack
- eval:fixtures

It may also include a small package-content sanity check if useful.

Constraints:
- keep it simple
- prefer a small script or npm script composition
- do not add heavy release frameworks
- do not publish anything
- do not create tags
- do not require network access
- do not require npm credentials

If a script is added, it should fail clearly and print actionable guidance.

## 4) Versioning + changelog foundation
Set up minimal, maintainable release-note foundations.

Add:
- `CHANGELOG.md`

Requirements:
- keep it human-readable
- start with a clear initial entry structure
- document the current unreleased/release-candidate state honestly
- do not fabricate prior release history
- do not claim a version has been published if it has not
- keep it simple and maintainable

Also review package versioning and docs wording so the repo can cleanly move to a first public release when the maintainer decides to publish.

Do not add automated changelog bots.

## 5) Maintainer doc for first public release
Add:
- `docs/maintainers/first-public-release.md`

This doc should explain:
- what should be true before the first public release
- how to run `npm run release:check`
- how to inspect demo assets
- how to update the changelog
- how to choose/version the first release
- how to do a manual publish later if desired
- what is intentionally still manual

Keep it practical, short, and honest.

## 6) Optional lightweight repo polish
Only if clearly justified and small:
- add badges that reflect reality (for example CI or package type), but do not add vanity clutter
- improve help examples if README and CLI wording diverge
- tighten package description/keywords if they are stale

Do not spend this milestone on cosmetic churn.

# Implementation requirements

## Scope discipline
- this is a productization/documentation/release-readiness milestone
- do not add new end-user product features unless they are absolutely required to support the deliverables above
- do not add new agent exports
- do not add SaaS/cloud features
- do not add telemetry
- do not add dashboards
- do not add browser integrations
- do not add MCP integrations
- do not add plugin systems
- do not add automatic npm publish or GitHub Release automation

## Demo asset discipline
- prefer existing fixtures and outputs
- do not introduce brittle demo generation logic unless necessary
- if you add a refresh script, keep it tiny and deterministic
- do not force demo refresh on every build/test run

## Backward compatibility
- existing compile behavior must not break
- existing export codex behavior must not break
- existing export claude behavior must not break
- existing export cursor behavior must not break
- existing smoke-pack behavior must not break
- existing eval behavior must not break

# Tests
Add or update tests only where needed.

At minimum:
- if new scripts or output-generation helpers are added, test them when practical
- existing tests must remain strong
- do not weaken assertions just to get green CI

# Out of scope
Do NOT add any of the following in this milestone:
- actual npm publish
- release tag creation
- GitHub Releases automation
- semantic-release
- changelog bots
- telemetry
- dashboards
- new agent exports
- model-judge evals
- OpenAI Evals API integration
- browser workflows
- MCP features
- SaaS/cloud features
- databases

# Definition of done
This task is done only when:
1. `npm run build` passes
2. `npm run test` passes
3. `npm run lint` passes
4. `npm run smoke:pack` passes
5. `npm run eval:fixtures` passes
6. `npm run release:check` passes
7. README better reflects the current product and supported exports
8. checked-in demo assets exist and are documented
9. CHANGELOG.md exists and is honest about release state
10. `docs/maintainers/first-public-release.md` exists and is practical
11. the implementation stays inside the current product wedge

# Working style
- Make this a single PR-sized change
- Prefer minimal, reviewable changes
- Optimize for first-user clarity, not feature expansion
- Keep docs concise and operational
- Reuse existing fixtures and outputs where sensible
- Leave unrelated prompt files alone unless they directly conflict with this work

# Final response format
At the end, provide:
1. a short implementation summary
2. a list of changed files
3. exact commands run
4. remaining risks or limitations