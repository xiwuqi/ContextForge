# Codex Master Prompt: Build ContextForge v0.1 MVP

Read `AGENTS.md`, `README.md`, `docs/product/prd.md`, and `docs/product/milestones.md` first.

Build ContextForge as a serious local-first CLI that:

1. scans a repository
2. compiles markdown tasks into task packs
3. exports Codex-ready prompt files
4. lints stale context and guidance

Keep the implementation inside MVP scope:

- no SaaS
- no database
- no browser UI
- no browser automation
- no heavy RAG stack

Deliver a reviewable TypeScript codebase with:

- `init`, `scan`, `compile`, `export codex`, and `lint`
- generated artifacts under `.contextforge/`
- default Codex exports under `.github/codex/prompts/`
- tests for schema validation, inference, scoring, exporting, and lint drift
- docs that match the shipped behavior

Before finishing, run:

```bash
npm run build
npm run test
npm run lint
```
