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
- versioned release artifacts + manual release handoff

Before making changes, read and follow:
- AGENTS.md
- README.md
- CHANGELOG.md
- docs/product/prd.md
- docs/product/milestones.md
- docs/maintainers/release-checklist.md
- docs/maintainers/first-public-release.md
- docs/maintainers/manual-release-handoff.md
- docs/maintainers/public-metadata-checklist.md
- examples/demo/README.md
- package.json

Also inspect:
- .github/codex/prompts/
- docs/archive/bootstrap/
- examples/demo/
- docs/assets/ if it exists

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
Bilingual README + visual assets + Codex prompt directory hygiene

# Goal
Improve first-visit clarity and public repo hygiene by:
- adding a proper bilingual README experience
- adding lightweight visual assets for explanation
- removing confusion between product-generated Codex prompts and internal milestone prompts
- keeping current product behavior unchanged

This milestone is NOT about adding new product features.

# Why this matters
ContextForge now has enough product surface to be understood and tried by outside users, but the public docs still need two upgrades:
1. better onboarding for both English and Chinese readers
2. cleaner separation between product outputs and internal maintainer prompts

The repository currently uses `.github/codex/prompts/` as the default Codex export output location. Internal milestone prompts should not continue to live there if they are not actual product outputs or active workflow prompt files.

# Required deliverables

## 1) Bilingual README structure
Implement a clean bilingual documentation structure.

Required:
- keep `README.md` as the primary English README
- add `README.zh-CN.md` as the full Simplified Chinese README
- add a language switcher near the top of both files:
  - English | 简体中文
- keep both files aligned in meaning, but do not force line-by-line duplication
- optimize both READMEs for clarity and scannability

Requirements for both README files:
- clear one-sentence value proposition
- who this is for
- what problem it solves
- how it works
- supported export targets
- quickstart
- demo/examples section
- install/package/release-check section
- what ContextForge does not do
- links to maintainer docs only where relevant

Important:
- do not turn the README into an essay
- keep claims honest
- reflect current supported exports accurately: codex, claude, cursor
- keep local-first framing
- do not over-claim unsupported agents or SaaS behavior

## 2) Visual assets
Add lightweight visual assets under:
- `docs/assets/`

Required:
- at least one overview diagram, such as:
  - `docs/assets/contextforge-overview.svg`
- at least one output-layout or workflow diagram, such as:
  - `docs/assets/contextforge-outputs.svg`

The visuals should explain:
- repository scan/init
- compile into task pack
- export into codex/claude/cursor
- where outputs are written

Constraints:
- prefer SVG for maintainability and git diff friendliness
- keep assets lightweight and readable in GitHub
- do not add large binary clutter unless clearly necessary
- if adding an animation is easy and deterministic, it is allowed, but not required
- static visuals are acceptable if they improve understanding

README integration:
- embed the diagrams in both README files
- place them where first-time visitors benefit most

## 3) Prompt directory hygiene
Clean up `.github/codex/prompts/` so it stops mixing product-facing prompts with internal milestone prompts.

Audit the files currently in `.github/codex/prompts/`.

Required outcome:
- keep only files that truly belong there as:
  - active workflow prompt files
  - or intentional product-facing Codex prompt artifacts/examples
- move internal milestone/build-history prompts out of this directory

Preferred destinations:
- `docs/archive/bootstrap/codex-prompts/` for archived build-history prompts
- or `docs/maintainers/codex-prompts/` if they are still useful as maintainer references

Requirements:
- do not silently delete useful maintainer history if it still has value
- but do not leave milestone prompts in the default product output directory
- if you move files, update any links or docs that reference them
- add a small README in the archive/maintainer prompt folder explaining what those files are

Important:
- if a prompt file is not actually used by CI/workflows and is not a product example, it should not remain in `.github/codex/prompts/`
- if `examples/demo/` already covers product-facing prompt examples, prefer that over keeping duplicate examples in `.github/codex/prompts/`

## 4) Documentation sync
Update docs in the same PR:
- README.md
- README.zh-CN.md
- docs/product/prd.md
- docs/product/milestones.md
- docs/maintainers/public-metadata-checklist.md if needed
- any archive/maintainer README added for moved prompt files

If GitHub About text or repo topics still need manual updates, keep them in maintainer docs instead of pretending code changed them.

## 5) Optional small polish
Only if small and clearly useful:
- tighten the repo root structure if prompt moves expose stale links
- normalize demo references
- improve README section ordering
- add compact badges only if they reflect reality and reduce friction

Do not spend this milestone on cosmetic churn.

# Implementation requirements

## Scope discipline
- this is a docs + public repo hygiene milestone
- do not add new end-user product features
- do not add new agent exports
- do not add release automation
- do not add npm publish automation
- do not add telemetry
- do not add SaaS/cloud features
- do not add browser features
- do not add MCP integrations
- do not add plugin systems

## Backward compatibility
- existing compile behavior must not break
- existing export codex behavior must not break
- existing export claude behavior must not break
- existing export cursor behavior must not break
- existing smoke-pack behavior must not break
- existing eval behavior must not break
- existing release-check behavior must not break
- existing release-artifacts behavior must not break

# Tests
Add or update tests only if needed.
At minimum:
- existing tests must remain green
- if any script behavior changes, test it when practical
- do not weaken assertions just to get green CI

# Out of scope
Do NOT add any of the following in this milestone:
- actual npm publish
- GitHub Releases automation
- new agent exports
- browser workflows
- MCP features
- SaaS/cloud features
- databases
- model-judge evals
- telemetry dashboards

# Definition of done
This task is done only when:
1. `npm run build` passes
2. `npm run test` passes
3. `npm run lint` passes
4. `npm run smoke:pack` passes
5. `npm run eval:fixtures` passes
6. `npm run publish:dry-run` passes
7. `npm run release:check` passes
8. `README.md` exists as a strong English README
9. `README.zh-CN.md` exists as a strong Simplified Chinese README
10. both READMEs include visual assets
11. `.github/codex/prompts/` no longer contains internal milestone prompts unless they are clearly active workflow files
12. moved prompt files are archived or documented clearly
13. the implementation stays inside the current product wedge

# Working style
- Make this a single PR-sized change
- Prefer minimal, reviewable changes
- Optimize for first-visit clarity
- Keep visual assets lightweight
- Keep archive choices explicit and documented
- Leave unrelated prompt files alone unless they directly conflict with this work

# Final response format
At the end, provide:
1. a short implementation summary
2. a list of changed files
3. exact commands run
4. remaining risks or limitations