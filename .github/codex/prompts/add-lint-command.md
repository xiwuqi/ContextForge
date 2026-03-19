# Add lint command

Read `AGENTS.md` first. Keep changes minimal, task-scoped, and easy to verify.

## Objective

Add a first-class `lint` command to the CLI surface and document it in the repository docs.

## Read First

- `AGENTS.md`
- `src/cli/commands/lint.ts`
- `src/core/lint/command-validation.ts`
- `src/cli/commands/compile.ts`
- `src/cli/commands/export-codex.ts`
- `src/cli/commands/index.ts`
- `src/cli/commands/init.ts`

## Relevant Paths

- `docs`
- `src/cli/commands`
- `src/cli`
- `src/core/lint`
- `docs/product`
- `src`
- `tests`

## Constraints

- Keep the project CLI-first and local-first.
- Do not add hosted services or a browser UI.
- Keep output compact and reviewable.
- CLI first
- local first
- open source first
- no database
- no hosted SaaS
- no browser UI
- no heavy RAG stack
- no model training
- no background worker system

## Validation

- `npm run build`
- `npm run test`
- `npm run lint`

## Done When

- The CLI has a working lint command.
- Generated task packs include validation commands.
- Documentation reflects the command.

## Notes

- Repository root is `.`.
- Package manager is npm.
- Primary languages include javascript, json, markdown, typescript, yaml.
