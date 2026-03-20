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
- repo hygiene + manual publish dry-run + public metadata checklist

Before making changes, read and follow:
- AGENTS.md
- README.md
- CHANGELOG.md
- docs/product/prd.md
- docs/product/milestones.md
- docs/maintainers/release-checklist.md
- docs/maintainers/first-public-release.md
- docs/maintainers/public-metadata-checklist.md
- package.json
- .github/workflows/ci.yml
- scripts/release-check.mjs
- scripts/publish-dry-run.mjs
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
Versioned release artifacts + manual release handoff

# Goal
Bring ContextForge to the point where a maintainer can confidently perform the first manual public release with only a small set of external manual steps left.

This milestone is NOT about adding product features.
It is about:
- creating versioned release artifacts from the current package version
- generating a release-candidate handoff bundle
- drafting release notes from the current project state
- making the final manual steps obvious
- reducing last-mile release ambiguity

# Why this matters
The repo already has:
- core functionality
- multiple export targets
- demo assets
- release-check
- publish dry-run
- eval corpus

What is still missing is a concrete, versioned handoff package for a real release.
A maintainer should be able to run one command, inspect the generated outputs, and then manually:
- create a Git tag
- draft a GitHub Release
- publish to npm
- verify the release publicly

# Required deliverables

## 1) Versioned release-artifacts command
Add a maintainer command:

`npm run release:artifacts`

Behavior requirements:
- use the current version from `package.json` as the source of truth
- create a versioned output directory such as:
  `.contextforge/releases/<version>/`
- generate release artifacts into that directory
- fail clearly if required preconditions are not met
- do not publish anything
- do not create tags
- do not require npm credentials
- do not require GitHub credentials

The command may be implemented as:
- a small Node script
- or a minimal wrapper around existing scripts plus artifact generation

Keep it simple and deterministic.

## 2) Release artifact bundle contents
The release artifact bundle should contain a compact, useful set of files.

Required outputs inside `.contextforge/releases/<version>/`:
1. the packed npm tarball
2. `manifest.json`
3. `package-files.json`
4. `release-notes.md`
5. `checksums.txt`
6. `summary.txt`

### manifest.json
Must include at least:
- package name
- package version
- tarball filename
- tarball size if available
- sha256 checksum
- generated timestamp
- Node version used
- whether release-check passed
- whether publish dry-run passed

### package-files.json
A stable JSON file describing which files are in the publishable package.
Use the packed output as the source of truth.

### release-notes.md
A draft suitable for:
- a GitHub Release body
- npm release notes adaptation
- a maintainer review pass

It should be generated from existing source-of-truth material where sensible:
- CHANGELOG.md
- README.md
- current supported export targets
- recent milestone reality

Requirements:
- keep it concise
- honest
- specific
- no fabricated history
- no claims that the release is already published
- no hype language
- mention the current supported exports accurately
- mention local-first CLI framing accurately

### checksums.txt
Include at least:
- sha256 of the tarball
- filenames in a readable format

### summary.txt
A short, human-readable handoff summary that says:
- what version this bundle represents
- what checks were run
- where the tarball is
- where the release notes are
- what manual steps remain

## 3) Release precondition validation
The release-artifacts flow should verify a small set of preconditions before generating outputs.

Required preconditions:
- package version exists
- CHANGELOG.md is present
- release-check passes, or the script clearly tells the maintainer to run/fix it first
- publish:dry-run passes, or the script clearly tells the maintainer to run/fix it first

You may choose one of these approaches:
- `release:artifacts` runs `release:check` and `publish:dry-run` itself
- or it validates that they were run successfully in the current session/worktree context
- or it offers a clear optional `--skip-checks` mode for maintainers

Preferred default:
- safe and explicit
- no magical hidden state assumptions

## 4) Release-notes foundation
Strengthen `CHANGELOG.md` and release-note flow only as much as needed.

Requirements:
- keep CHANGELOG human-readable
- do not fabricate earlier releases
- if the changelog structure is weak for generating a first release draft, improve it minimally
- the generated release notes must map clearly back to current project reality

Do not add bots or automated changelog systems.

## 5) Manual release handoff doc
Add a maintainer-facing doc:

`docs/maintainers/manual-release-handoff.md`

This doc should explain:
- how to run `npm run release:artifacts`
- how to inspect the generated bundle
- how to review `release-notes.md`
- how to do the remaining manual steps:
  - update GitHub About/topics if needed
  - create a version tag manually
  - draft the first GitHub Release manually
  - run `npm publish` manually when ready
  - verify the package page after publish
- what this repo intentionally does NOT automate

Keep it practical and short.

## 6) Optional release-check integration
If it improves clarity and does not overcomplicate the flow, add a small helper command:

`npm run release:prepare`

This command may:
- run `release:check`
- run `publish:dry-run`
- run `release:artifacts`

Only add this if it keeps the repo clearer.
Do not add a large release framework.

## 7) Public wording sync
Review and update wording where needed so release-related text is consistent.

Review:
- README.md
- CHANGELOG.md
- docs/product/prd.md
- docs/product/milestones.md
- docs/maintainers/first-public-release.md
- docs/maintainers/public-metadata-checklist.md

Requirements:
- keep positioning consistent: repository-to-agent context layer
- keep supported exports accurate: codex, claude, cursor
- keep release state honest
- do not imply the package is already publicly published if it is not
- do not over-claim unsupported agents or workflows

# Implementation requirements

## Scope discipline
- this is a release-handoff milestone
- do not add new end-user product features
- do not add new agent exports
- do not add SaaS/cloud features
- do not add telemetry
- do not add dashboards
- do not add browser integrations
- do not add MCP integrations
- do not add plugin systems
- do not add actual npm publish automation
- do not add GitHub Release automation
- do not add semantic-release
- do not add changelog bots

## Artifact discipline
- outputs must be deterministic enough for maintainer review
- do not create a large archive zoo
- use the current package version as the bundle key
- keep the bundle compact and understandable
- do not require network access except whatever npm itself uses for dry-run behavior

## Backward compatibility
- existing compile behavior must not break
- existing export codex behavior must not break
- existing export claude behavior must not break
- existing export cursor behavior must not break
- existing smoke-pack behavior must not break
- existing eval behavior must not break
- existing release-check behavior must not break

# Tests
Add or update tests where practical.

At minimum:
- test any new manifest/checksum helper logic when practical
- existing tests must remain strong
- do not weaken assertions just to get green CI

# Out of scope
Do NOT add any of the following in this milestone:
- actual npm publish
- actual tag creation
- actual GitHub Release creation
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
7. `npm run release:artifacts` passes
8. the versioned release bundle is generated under `.contextforge/releases/<version>/`
9. the bundle includes the required files
10. `docs/maintainers/manual-release-handoff.md` exists and is practical
11. docs reflect the real current release state
12. the implementation stays inside the current product wedge

# Working style
- Make this a single PR-sized change
- Prefer minimal, reviewable changes
- Optimize for release confidence
- Keep scripts obvious and maintainable
- Reuse existing release-check and dry-run logic where sensible
- Leave unrelated prompt files alone unless they directly conflict with this work

# Final response format
At the end, provide:
1. a short implementation summary
2. a list of changed files
3. exact commands run
4. remaining risks or limitations