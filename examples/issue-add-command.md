# Add lint command

## Objective

Add a first-class `lint` command to the CLI surface and document it in the repository docs.

## Context

The MVP requires `npm run lint` to stay working. The CLI and generated task packs should include lint validation where appropriate.

## Constraints

- Keep the project CLI-first and local-first.
- Do not add hosted services or a browser UI.
- Keep output compact and reviewable.

## Validation

- npm run build
- npm run test
- npm run lint

## Done when

- The CLI has a working lint command.
- Generated task packs include validation commands.
- Documentation reflects the command.
