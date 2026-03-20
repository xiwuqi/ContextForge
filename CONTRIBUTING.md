# Contributing to ContextForge

ContextForge is a local-first CLI for turning repository context plus a task source into task packs and agent-ready briefs. Contributions should keep that product wedge sharp instead of widening the project into hosted, browser, or multi-user territory.

## Before you open an issue or PR

- Use the GitHub issue templates for bugs, feature requests, and workflow feedback.
- Start feature requests with the workflow pain, not just the proposed implementation.
- Keep changes small and reviewable when possible.

## Local setup

```bash
npm ci
npm run build
```

Run the CLI locally with `node dist/cli/index.js` or `npm link` if you want the `contextforge` command in your shell.

## Core validation commands

Use the narrowest relevant check while working, then run the full set that matches your change.

- `npm run build`
- `npm run test`
- `npm run lint`
- `npm run smoke:pack`
- `npm run eval:fixtures`
- `npm run publish:dry-run`
- `npm run release:check`

Guidance:

- Run `smoke:pack` when CLI packaging or installability may have changed.
- Run `eval:fixtures` when compile, export, or task-pack relevance behavior may have changed.
- Run `publish:dry-run` or `release:check` when package metadata, release docs, or release workflow scripts changed.

## Scope discipline

ContextForge is intentionally:

- CLI first
- local first
- open source first
- repository-to-agent context tooling

Avoid widening the project into:

- hosted SaaS
- databases
- browser UI or browser automation
- heavy RAG infrastructure
- model training
- background worker systems
- generic plugin frameworks without a concrete need

## Bugs, features, and docs

- Bug reports should include the ContextForge version, Node version, OS, exact command run, and expected vs actual behavior.
- If possible, attach a minimal task source or small sanitized fixture that reproduces the issue.
- Feature requests should describe the workflow gap first, then the smallest useful outcome.
- Docs and examples should be updated in the same PR when behavior changes.

## Pull requests

Before opening a PR:

- make sure the relevant validation commands pass
- keep the summary clear about what changed and why
- note whether docs were updated
- call out packaging or release-process changes explicitly

Use `.github/pull_request_template.md` as the default checklist.

