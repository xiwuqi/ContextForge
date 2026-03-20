# Eval corpus

The fixture eval corpus is a deterministic maintainer check for ContextForge's product usefulness. It is meant to catch regressions that would still leave unit tests green but make task packs or agent briefs less useful.

## Run it

```bash
npm run build
npm run eval:fixtures
```

The runner writes a JSON report to:

```text
.contextforge/evals/latest.json
```

## What it checks

Each case compiles a checked-in source against a checked-in fixture repo and scores:

- must-have relevant paths
- must-have key files
- must-have validation commands
- required task-pack field presence
- source metadata for GitHub issue JSON cases
- requested export targets for codex, claude, and cursor

The evals use subset checks and fixed thresholds. They are intentionally semantic, not full-string snapshots.

## Read the report

The console summary shows pass/fail per case plus aggregate coverage ratios. The JSON report contains:

- case-level pass/fail
- per-dimension coverage and missing items
- exporter checks
- aggregate totals across the corpus

## Add a new case

1. Add the smallest possible source fixture under `tests/fixtures/evals/` if an existing source does not already fit.
2. Reuse an existing fixture repo under `tests/fixtures/` unless a new repo is truly needed.
3. Add a case entry to `tests/fixtures/evals/cases.json`.
4. Prefer must-have subsets for paths, files, and commands over exact full-output expectations.
5. Only add export targets that materially increase coverage.

## Adjust thresholds carefully

Thresholds live in `tests/fixtures/evals/cases.json`. Keep them strict unless there is a real deterministic reason to relax one. If a threshold changes, update the case expectations or doc rationale in the same change.

## Evals vs unit tests vs golden tests

- Put parser, schema, and scoring rules in unit tests.
- Put exact renderer format checks in golden tests.
- Put cross-feature usefulness checks in the eval corpus.

If a regression is about exact markdown layout, use a golden test. If it is about whether the produced artifacts still point an agent at the right work, use the eval corpus.
