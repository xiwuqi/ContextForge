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
