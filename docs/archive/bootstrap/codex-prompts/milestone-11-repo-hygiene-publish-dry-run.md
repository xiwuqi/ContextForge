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
- first public release candidate + onboarding proof

Before making changes, read and follow:
- AGENTS.md
- README.md
- CHANGELOG.md
- docs/product/prd.md
- docs/product/milestones.md
- docs/maintainers/release-checklist.md
- docs/maintainers/first-public-release.md
- package.json
- .github/workflows/ci.yml
- scripts/smoke-pack.mjs
- scripts/eval-fixtures.mjs
- scripts/release-check.mjs

Also inspect the current repository root and identify any stale bootstrap-era files that are no longer the right public-facing source of truth.

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
Repo hygiene + manual publish dry-run + public metadata checklist

# Goal
Make ContextForge feel ready for a first manual public npm release by:
- cleaning up stale or confusing repository-root artifacts
- validating package publish readiness with a dry-run
- checking package contents intentionally
- documenting the small set of manual GitHub/npm steps that code cannot perform
- tightening public-facing consistency

This milestone is NOT about adding new product features.

# Why this matters
ContextForge already has:
- core CLI functionality
- multiple export targets
- smoke-pack coverage
- deterministic evals
- release-check
- demo assets

The next leverage point is reducing confusion and last-mile release risk:
- users should immediately understand which files matter
- maintainers should know exactly what is manual vs automated
- the packaged tarball should be validated at publish-dry-run level
- the repo should not expose stale bootstrap files as if they were primary product artifacts

# Required deliverables

## 1) Repository-root hygiene
Audit the repository root for stale bootstrap-era artifacts and make the repo easier to understand for first-time visitors.

Examples of likely candidates:
- one-off bootstrap planning files
- duplicate PRD/prompt artifacts that are now superseded by docs/ and .github/codex/prompts/
- old workflow examples that are no longer the active path

For each candidate, choose one of:
- remove it
- move it under a clearly non-primary archive/bootstrap location
- keep it but clearly document why it remains

Requirements:
- do not remove anything still actively needed by the current product or maintainer workflow
- do not break links referenced by current docs without updating them
- prefer the cleanest public repo root possible
- if you create an archive/bootstrap folder, keep it small and clearly named
- avoid leaving multiple competing “source of truth” documents at the repo root

## 2) Manual publish dry-run command
Add a maintainer command:

`npm run publish:dry-run`

This command should:
- run `npm publish --dry-run` in a safe, local way
- fail clearly with actionable output
- not require actual publish permissions
- not publish anything
- not create tags
- not require network-dependent release automation

If a small wrapper script improves output clarity, that is acceptable.
Keep it minimal.

## 3) Package content sanity check
Add a deterministic maintainer check for package contents.

This should verify the publishable package includes what it should and excludes what it should.

Requirements:
- inspect the packed/publishable file set
- verify key runtime files are present
- verify obviously non-package bootstrap clutter is not unintentionally shipped
- keep the check readable and maintainable
- do not build a heavyweight release framework

This may be:
- part of `publish:dry-run`
- or a small helper script reused by it
- or a separate small script invoked by `release:check`

Do not over-engineer this.

## 4) Strengthen release:check
Update `npm run release:check` so it reflects the current pre-release reality.

Required:
- keep existing checks
- include `publish:dry-run`
- include any small package-content sanity check added in this milestone
- keep the command understandable
- keep it offline-safe except for whatever npm itself does during dry-run
- do not add actual publishing

## 5) Public metadata and wording sync
Tighten wording and metadata where the codebase can control it.

Review and update if needed:
- README.md
- package.json
- CHANGELOG.md
- docs/product/prd.md
- docs/product/milestones.md
- docs/maintainers/first-public-release.md
- docs/maintainers/release-checklist.md

Requirements:
- keep product positioning consistent: repository-to-agent context layer
- keep current supported exports accurate: codex, claude, cursor
- do not over-claim unsupported agents
- ensure package metadata is aligned with public messaging
- make manual release state explicit and honest

Important:
- if GitHub “About” text or repo topics cannot be updated from code, document them in a maintainer checklist rather than pretending they were changed automatically

## 6) Manual GitHub/npm settings checklist
Add a small maintainer-facing doc, for example:

`docs/maintainers/public-metadata-checklist.md`

This doc should cover manual items that live outside the repository code, such as:
- GitHub About text
- GitHub repo topics
- GitHub website/homepage field if desired
- first GitHub Release drafting steps
- npm package page expectations after first publish

Keep it practical and short.
This is a checklist, not a long tutorial.

## 7) Optional minor polish
Only if clearly justified and small:
- tighten README references if root-file cleanup changes paths
- improve script output wording
- normalize release-related command names if they are confusing

Do not spend this milestone on cosmetic churn.

# Implementation requirements

## Scope discipline
- this is a repo hygiene and manual release-prep milestone
- do not add new end-user product features
- do not add new agent exports
- do not add SaaS/cloud features
- do not add telemetry
- do not add dashboards
- do not add browser integrations
- do not add MCP integrations
- do not add plugin systems
- do not add automatic npm publish
- do not add GitHub Release automation
- do not add semantic-release
- do not add changelog bots

## Backward compatibility
- existing compile behavior must not break
- existing export codex behavior must not break
- existing export claude behavior must not break
- existing export cursor behavior must not break
- existing smoke-pack behavior must not break
- existing eval behavior must not break
- existing release-check behavior should only become stricter in clearly documented ways

# Tests
Add or update tests only where needed.

At minimum:
- if new scripts or package-sanity helpers are added, test them when practical
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
6. `npm run publish:dry-run` passes
7. `npm run release:check` passes with the new dry-run path included
8. stale/confusing repo-root artifacts have been cleaned up, moved, or deliberately documented
9. a maintainer checklist exists for manual GitHub/npm public metadata steps
10. docs reflect the real current release state
11. the implementation stays inside the current product wedge

# Working style
- Make this a single PR-sized change
- Prefer minimal, reviewable changes
- Optimize for clarity and release confidence
- Keep scripts and checks obvious
- Reuse existing release-check structure where sensible
- Leave unrelated prompt files alone unless they directly conflict with this work

# Final response format
At the end, provide:
1. a short implementation summary
2. a list of changed files
3. exact commands run
4. remaining risks or limitations