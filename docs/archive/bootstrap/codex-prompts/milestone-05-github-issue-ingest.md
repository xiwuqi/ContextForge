You are continuing the ContextForge repository after the v0.1 MVP.

Before making changes, read and follow:
- AGENTS.md
- docs/product/prd.md
- docs/product/milestones.md
- README.md

Work inside the existing product boundaries:
- CLI first
- local first
- open source first
- no database
- no hosted SaaS
- no browser UI
- no heavy RAG stack
- no model training
- no background workers

Do not widen scope beyond this milestone.

# Milestone
GitHub issue ingestion for `contextforge compile` (v0.2 step 1)

# Goal
Make ContextForge usable directly from GitHub issues, without requiring the user to first create a local markdown task file manually.

# Why this matters
The current MVP proves the pipeline, but real developer workflows usually start from GitHub issues, not hand-written local markdown. The next product step is reducing that input friction while preserving the existing local-first architecture.

# Deliverables
Implement support for GitHub issue sources in the `compile` command.

## Required CLI behavior
Extend `contextforge compile` so it accepts exactly one source input from this set:
- `--input <markdown-file>` (existing behavior)
- `--github-issue <url|owner/repo#number>`
- `--github-issue-json <path>`

Rules:
- exactly one of these source flags must be provided
- if more than one is provided, fail with a clear actionable error
- existing `--input` behavior must remain backward compatible

## Required feature behavior
1. Add a source-loading layer for `compile`.
2. Implement GitHub issue ingestion that normalizes issue content into the existing task compilation flow.
3. Support public issue fetching when possible.
4. Support authenticated fetching when `GITHUB_TOKEN` is present.
5. Keep network use optional:
   - offline mode must still work via `--input`
   - offline mode must also work via `--github-issue-json`
6. Add source metadata into the task pack schema and outputs:
   - `source_type`
   - `source_ref`
   - `source_title`
   - `source_labels`
   - `source_url`
7. Preserve current task-pack JSON/Markdown and Codex export behavior unless a change clearly improves correctness.

## Error handling requirements
When GitHub fetching fails, return actionable guidance that suggests:
- setting `GITHUB_TOKEN`
- or exporting issue JSON and using `--github-issue-json`
- or pasting the issue into markdown and using `--input`

## Architecture constraints
- Keep GitHub integration isolated from core compile logic.
- Normalize all source types into one shared intermediate structure before relevance scoring and task-pack generation.
- Prefer a small dependency footprint.
- Prefer GitHub REST API or lightweight HTTP usage over heavier abstractions.
- Do not add GraphQL clients unless absolutely necessary.
- Do not add any hosted component.
- Do not add browser features or team features.

# Testing requirements
Add or update tests for:
- compile source flag validation
- GitHub issue source normalization
- task-pack generation from GitHub issue fixtures
- failure handling and fallback messaging

Important:
- do not make live network calls in tests
- use checked-in fixtures for GitHub issue JSON
- keep tests deterministic

# Documentation requirements
Update all relevant docs in the same PR:
- README.md
- docs/product/prd.md
- docs/product/milestones.md
- examples/ (add at least one example issue source or fixture reference)

Also add:
- at least one checked-in GitHub issue JSON fixture
- at least one expected generated task-pack example for that fixture

# Output quality requirements
Generated output must remain:
- compact
- path-specific
- easy to paste into Codex
- not overly verbose
- stable enough for golden-style assertions

# Definition of done
The task is done only when:
1. `npm run build` passes
2. `npm run test` passes
3. `npm run lint` passes
4. docs reflect the new source flags and usage
5. no existing compile/export workflows are broken
6. the implementation stays inside the current product wedge

# Execution style
- Make this a single coherent PR-sized change.
- Prefer small, reviewable additions over clever abstractions.
- Do not rewrite unrelated parts of the repo.
- Reuse existing schemas and command structure where sensible.
- Document any assumptions briefly in code comments or docs only where needed.

# Final response format
At the end, provide:
1. a short implementation summary
2. a list of changed files
3. exact commands run
4. any remaining risks or limitations