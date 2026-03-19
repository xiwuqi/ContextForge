# Support GitHub issue sources in compile

## Objective

Make `contextforge compile` accept GitHub issues directly.

## Source Context

- GitHub issue JSON: `issues/contextforge-issue-101.json`
- Issue ref: `xiwuqi/ContextForge#101`
- Labels: `enhancement`, `cli`, `github`
- URL: https://github.com/xiwuqi/ContextForge/issues/101

## Relevant Paths

- `src`
- `tests`
- Possibly related: `tests/fixtures`, `docs`

## Key Files

- `tests/index.test.ts`

## Constraints

- Keep the workflow local-first.
- Do not add a hosted backend.
- Keep GitHub fetching optional.

## Risks / Watchouts

- No major risks were recorded; verify assumptions against the repository before editing.

## Validation Commands

- `npm run build`
- `npm run test`
- `npm run lint`

## Done When

- `contextforge compile` accepts a GitHub issue source.
- Task packs include source metadata.
- Documentation explains the new source flags.

## Suggested Implementation Order

- Inspect src and the nearest related configuration before editing.
- Implement the smallest change set needed to complete "Support GitHub issue sources in compile".
- Add or update tests that cover the requested behavior.
- Refresh documentation or generated guidance if the user-facing behavior changes.
- Run the listed validation commands before considering the task done.
