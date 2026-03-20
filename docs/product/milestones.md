# ContextForge Milestones

## Milestone 0: Bootstrap

Deliver:

- TypeScript CLI scaffold
- npm scripts for build, test, lint, format
- README, PRD, milestones, and example task docs
- lightweight CI configuration

Exit criteria:

- `npm install`
- `npm run build`
- `npm run test`
- `npm run lint`

## Milestone 1: Scan and Init

Deliver:

- repository scanner
- context artifact generation
- suggested `AGENTS.md` generation

Exit criteria:

- fixture repositories produce stable context outputs

## Milestone 2: Compile

Deliver:

- markdown task parsing
- heuristic path relevance scoring
- optional provider enhancement hook
- task pack JSON and Markdown generation

Exit criteria:

- example task compiles into the required fields and readable markdown

## Milestone 3: Export Codex

Deliver:

- compact Codex prompt exporter
- default output under `.github/codex/prompts/`
- committed example prompt

Exit criteria:

- exported prompt is directly usable without cleanup

## Milestone 4: Lint

Deliver:

- missing path detection
- command validation where safe and possible
- drift detection for generated guidance

Exit criteria:

- integration tests cover missing-path and stale-guidance scenarios

## Milestone 5: GitHub Issue Ingestion

Deliver:

- `compile` support for `--github-issue` and `--github-issue-json`
- normalized source loading before task compilation
- task-pack source metadata for GitHub-backed tasks
- deterministic fixtures for issue JSON and generated task packs

Exit criteria:

- `compile` accepts exactly one source flag
- public and authenticated issue fetching share the same normalized path
- offline issue JSON compilation works without network access

## Milestone 6: Export Claude Code

Deliver:

- `export claude` command
- compact Claude Code task brief renderer
- shared export helper that preserves Codex behavior
- deterministic fixture coverage for Claude export output

Exit criteria:

- `export codex` remains backward compatible
- `export claude` writes to `.contextforge/exports/claude/<slug>.md` by default
- no `CLAUDE.md` or `.claude/*` memory files are auto-written

## Milestone 7: Release Hardening

Deliver:

- hardened package metadata for a public CLI
- `prepack` and a deterministic packaged smoke script
- CI validation on Node 20 and Node 22
- package smoke verification from a local tarball install

Exit criteria:

- `npm pack` succeeds without manual cleanup steps
- the packed tarball installs into a temporary project and runs a real CLI command
- CI covers build, test, lint, and packaged smoke validation
- docs explain the local install and release-readiness story without implying automatic publish

## Milestone 8: Export Cursor

Deliver:

- `export cursor` command
- compact Cursor task brief renderer
- optional task-scoped Cursor `.mdc` rule suggestion export
- deterministic golden coverage for Cursor brief and rule suggestion output

Exit criteria:

- `export codex` and `export claude` remain backward compatible
- `export cursor` writes to `.contextforge/exports/cursor/<slug>.md` by default
- Cursor rule suggestions are only written when `--rule-output` is explicitly provided
- no automatic writes to `.cursor/rules/*` or legacy `.cursorrules`

## Milestone 9: Eval Corpus and Instruction Sync

Deliver:

- maintainer-facing `npm run eval:fixtures` workflow
- small deterministic eval corpus for compile and export usefulness
- machine-readable eval report under `.contextforge/evals/latest.json`
- instruction and doc wording aligned with current export targets

Exit criteria:

- eval cases cover local markdown, GitHub issue JSON, and nested path relevance
- eval scoring is deterministic and readable
- CI runs the eval corpus without network access
- repo guidance no longer implies the product is Codex-only

## Milestone 10: First Public Release Candidate

Deliver:

- README upgrade for first-visit clarity
- small checked-in demo output set under `examples/demo/`
- maintainer-facing `npm run release:check`
- `CHANGELOG.md` plus first-release maintainer guidance

Exit criteria:

- first-time readers can understand the product, target users, and export targets quickly
- demo assets show representative task-pack and export outputs without requiring a run first
- `npm run release:check` passes offline and covers build, test, lint, smoke, and eval checks
- release docs stay explicit about what is still manual and not yet automated

## Milestone 11: Repo Hygiene and Publish Dry-Run

Deliver:

- repository-root cleanup for stale bootstrap artifacts
- maintainer-facing `npm run publish:dry-run`
- package-content sanity checking for publishable artifacts
- manual GitHub and npm metadata checklist

Exit criteria:

- stale bootstrap-era root artifacts are removed, archived, or clearly documented
- `npm run publish:dry-run` validates publishable package contents without publishing
- `npm run release:check` includes the publish dry-run path
- maintainers have a short checklist for manual GitHub and npm metadata steps

## Milestone 12: Versioned Release Artifacts

Deliver:

- maintainer-facing `npm run release:artifacts`
- versioned release bundle under `.contextforge/releases/<version>/`
- generated draft release notes and handoff summary
- manual release handoff documentation

Exit criteria:

- the current package version is used as the release bundle key
- the bundle includes tarball, manifest, package file list, checksums, release notes, and summary
- maintainers can inspect the bundle and complete only the remaining external manual steps
- release docs stay honest about what is and is not automated

## Milestone 13: Bilingual README and Prompt Hygiene

Deliver:

- English `README.md` and Simplified Chinese `README.zh-CN.md`
- lightweight SVG onboarding diagrams under `docs/assets/`
- archived milestone Codex prompts outside the default product output directory
- explicit archive notes for moved prompt history

Exit criteria:

- both READMEs stay aligned in meaning and embed the visual assets
- first-time readers can understand the workflow and output layout quickly
- `.github/codex/prompts/` keeps only active workflow or intentional product-facing files
- milestone build-history prompts are archived and documented clearly
