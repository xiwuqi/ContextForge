You are continuing the ContextForge repository after:
- scan / init
- compile
- export codex
- lint
- GitHub issue ingestion
- export claude

Before making changes, read and follow:
- AGENTS.md
- README.md
- docs/product/prd.md
- docs/product/milestones.md
- package.json
- .github/workflows/ci.yml
- .github/workflows/codex.yml

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
Release hardening + npm publish readiness

# Goal
Make ContextForge credible and easy to try as a packaged CLI.

This milestone is NOT about adding more product surface area.
It is about:
- packaging correctness
- installability
- smoke-tested distribution
- release readiness
- public-facing metadata and docs quality

# Why this matters
The core product wedge already exists. The next highest-leverage step is reducing trust and installation friction for first external users.

A strong result for this milestone means:
- the package can be packed cleanly
- the packaged CLI can be installed into a temp project
- the installed CLI actually runs
- CI verifies this automatically
- docs explain the install and release story clearly
- no actual publish is performed

# Required deliverables

## 1) Package metadata hardening
Review and improve package metadata for a serious CLI release.

Required:
- keep the package as a CLI package
- keep `bin` correct
- keep `files` minimal and intentional
- keep `engines` accurate
- preserve MIT license unless there is a compelling documented reason not to

Add or improve package metadata where missing or weak:
- description
- keywords
- repository
- homepage
- bugs

Important:
- public wording should no longer imply this is only a Codex helper if the product now supports both Codex and Claude exports
- do not invent capabilities the tool does not actually have

Also ensure packaging behavior is robust:
- add `prepack` or an equivalent minimal solution if needed so `npm pack` produces a usable tarball
- do not add heavy release tooling
- do not introduce semantic-release or similar systems in this milestone

## 2) Packaged CLI smoke test
Add a deterministic, repo-local smoke test for the packaged CLI.

The smoke test must:
1. create a temp working directory
2. run `npm pack`
3. install the generated tarball into the temp directory
4. verify the packaged `contextforge` binary runs
5. run at least one real command against a tiny deterministic fixture repository
6. fail with clear errors if packaging or runtime behavior is broken

Constraints:
- do not require global `npm link`
- do not require network access
- do not depend on the user already having published to npm
- prefer a Node-based smoke script over brittle shell-only logic when cross-platform behavior matters
- keep the smoke test deterministic and reasonably fast

The smoke test should verify more than `--help`.
Prefer one of:
- `contextforge scan --json`
- `contextforge init --json`
- or another small, deterministic command on a checked-in fixture repo

If practical without making the test fragile, also verify one compile/export path using an existing fixture.

## 3) CI hardening
Upgrade CI so release readiness is checked automatically.

Required:
- use `npm ci` instead of `npm install` in CI unless there is a strong documented reason not to
- run validation on Node 20 and Node 22
- add a package smoke job that exercises the packed tarball
- keep CI readable and minimal
- keep the existing Codex workflow working

Do NOT add:
- actual npm publish steps
- release tagging automation
- secrets-dependent publish jobs
- semantic-release
- changelog bots

If a separate job is cleaner than folding packaging into the main validate job, that is acceptable.

## 4) Documentation updates
Update docs in the same PR so the public install story matches reality.

Required files to update:
- README.md
- docs/product/prd.md
- docs/product/milestones.md

Add one maintainer-facing doc:
- `docs/maintainers/release-checklist.md`

README must include:
- local development install flow
- packaged local tarball smoke-test flow
- supported Node version expectation
- command examples that still reflect the real current CLI
- an explicit note that npm publish is not yet performed by the repo automatically
- if you mention future npm usage, phrase it conditionally (for example: "once published")

The docs should also align public positioning with the actual product:
- repository-to-agent context layer
- CLI tool
- local-first
- current supported exports only
- no SaaS claims

## 5) Small UX polish if needed
Only if missing and easy to justify within scope:
- ensure CLI help output is clean
- ensure version output is available and correct
- ensure packaging-related errors are actionable

Do not start broader CLI redesign work.

# Testing requirements
Add or update tests for any changed behavior.

At minimum:
- package smoke validation must be automated
- existing tests must continue to pass
- any changed help text or metadata-sensitive output should be asserted deliberately if needed

Testing rules:
- deterministic only
- no live network calls
- do not weaken assertions just to get green CI
- do not delete useful coverage to simplify the implementation

# Out of scope
Do NOT add any of the following in this milestone:
- actual npm publish
- release tags
- GitHub Releases automation
- semantic-release
- telemetry
- Cursor export
- Aider export
- generic plugin systems
- MCP integrations
- hooks
- browser features
- SaaS/cloud features
- databases
- multi-user features

# Definition of done
This task is done only when:
1. `npm run build` passes
2. `npm run test` passes
3. `npm run lint` passes
4. the package can be packed successfully with `npm pack`
5. the packed tarball can be installed into a temp project
6. the installed CLI can run a real deterministic smoke command
7. CI covers the validation and package smoke path
8. docs reflect the real install/release story
9. the implementation stays inside the current product wedge

# Working style
- Make this a single PR-sized change
- Prefer minimal, reviewable improvements
- Keep packaging logic obvious
- Avoid clever release abstractions
- Reuse existing fixtures where sensible
- Add only the smallest new fixture surface needed
- Leave unrelated Codex prompt files alone unless they directly conflict with the implementation

# Final response format
At the end, provide:
1. a short implementation summary
2. a list of changed files
3. exact commands run
4. remaining risks or limitations