# ContextForge PRD

- Version: v0.1 MVP
- Status: Ready for implementation
- Product type: Open source, local-first developer tool
- Primary surface: CLI
- Primary integration target: Codex
- Secondary compatibility target: Claude Code / Cursor / Aider / generic coding agents

---

## 1. Product summary

ContextForge is an open source CLI that compiles **repository context + issue / PRD input** into a **task-scoped context pack** that coding agents can actually use.

It is not another code generator. It is the missing layer between:

1. a real codebase,
2. a fuzzy task description,
3. an autonomous coding agent.

The product helps developers reduce the hidden manual work of:

- choosing which files to show the agent,
- reconstructing project rules from scattered docs,
- figuring out how to build / test / lint the repo,
- defining what “done” means for a task,
- keeping those instructions fresh over time.

The first release focuses on Codex because:

- Codex already uses repository-level `AGENTS.md` files,
- Codex GitHub workflows accept `prompt-file`,
- Codex performs best when work is broken into verifiable steps,
- the repository-first workflow fits an open source CLI very well.

---

## 2. Problem statement

Developers increasingly use coding agents, but quality falls sharply once a repository becomes non-trivial.

The main failure mode is not “the model cannot write code.” The main failure mode is “the agent starts with the wrong or incomplete context.”

In practice, users spend a surprising amount of time doing the following manually:

- deciding which folders and files matter for the task,
- explaining project architecture and boundaries,
- writing or updating task prompts,
- identifying the correct validation commands,
- restating repository conventions,
- preventing the agent from changing unrelated areas,
- checking that rules are not stale.

This work is repetitive, error-prone, and usually invisible. The result is worse agent output, more review overhead, and lower trust.

ContextForge solves this by producing a structured context layer before code generation begins.

---

## 3. Target users

### 3.1 Primary user: solo builder using coding agents

Characteristics:

- uses Codex / Claude Code / Cursor / Aider regularly,
- works in small to medium repositories,
- often writes product requirements in markdown,
- wants AI leverage without hand-holding the agent every time.

Needs:

- faster task setup,
- better first-pass agent performance,
- reusable repository guidance.

### 3.2 Secondary user: open source maintainer

Characteristics:

- maintains a public repo,
- wants contributors and agents to respect project norms,
- has repository knowledge scattered across README, docs, issues, and historical practice.

Needs:

- a stable source of truth for agents,
- lower onboarding cost,
- more reviewable AI-generated contributions.

### 3.3 Tertiary user: small engineering team

Characteristics:

- 3 to 10 people,
- already experimenting with coding agents,
- wants consistent output quality across teammates.

Needs:

- shared repository rules,
- reusable task packaging,
- reduced dependence on each individual’s prompt craftsmanship.

---

## 4. Jobs to be done

### Core JTBD

When I want a coding agent to implement a real task in an existing repository, I want a small, high-signal context pack that tells the agent:

- what the task is,
- where to look,
- what not to touch,
- how to validate the result,
- what “done” means.

### Supporting JTBDs

- As a maintainer, I want a suggested `AGENTS.md` draft for my repo so agents inherit accurate working rules.
- As a user, I want stale instruction linting so I can trust old guidance.
- As a user, I want export formats tailored for Codex instead of hand-building prompts every time.

---

## 5. Product goals

### 5.1 MVP goals

1. Generate a repository summary and machine-readable context from a local repo.
2. Compile a task description markdown file into a task pack.
3. Export a Codex-ready prompt file from the task pack.
4. Detect common stale-instruction failures.
5. Work without a database, background service, or heavy infrastructure.

### 5.2 Success criteria for the first usable release

- A user can run ContextForge on a local repository and produce a task pack in under 60 seconds for small and medium repos.
- The generated task pack reliably includes:
  - objective,
  - relevant files / directories,
  - constraints,
  - validation commands,
  - done criteria.
- The tool is useful even before any IDE plugin or hosted service exists.

---

## 6. Non-goals for MVP

The MVP must **not** become any of the following:

- a general-purpose chat UI,
- a hosted SaaS application,
- a full RAG platform,
- a browser automation agent,
- a visual no-code workflow builder,
- an end-to-end coding agent that writes code automatically without human invocation,
- a team collaboration backend.

The wedge is specific:

> compile repository + task context into Codex-ready task packs.

---

## 7. Core MVP features

## 7.1 `init`

Initialize ContextForge in the current repository.

### Responsibilities

- verify repo root,
- create `.contextforge/` directory if missing,
- scan the repo,
- write `.contextforge/context.json`,
- write `.contextforge/context.md`,
- write `.contextforge/agents.suggested.md`.

### Notes

- Do **not** overwrite top-level `AGENTS.md` by default.
- Provide `--write-agents` if the user explicitly wants to write or update top-level `AGENTS.md`.
- If `AGENTS.md` already exists, generate a suggested diff or a separate suggestion file instead of replacing it silently.

## 7.2 `scan`

Scan the repo and refresh repository context.

### Responsibilities

- inspect file tree up to configurable depth,
- detect languages and frameworks,
- detect common config files,
- infer common build / test / lint commands,
- summarize likely app boundaries and important directories.

### Minimum detections

- package.json / tsconfig / eslint / prettier / vitest / jest
- pyproject.toml / requirements.txt / poetry.lock / pytest.ini
- go.mod
- Cargo.toml
- Makefile
- Dockerfile
- README / docs / CONTRIBUTING / architecture docs

## 7.3 `compile`

Compile a markdown task description into a task pack.

### Input

- markdown file path
- optional title override
- optional output path
- optional provider settings for model-enhanced compilation

### Output

- `.contextforge/task-packs/<slug>.json`
- `.contextforge/task-packs/<slug>.md`

### Required task pack fields

- `task_id`
- `title`
- `objective`
- `user_request_summary`
- `relevant_paths`
- `relevant_files`
- `possibly_related_paths`
- `constraints`
- `assumptions`
- `risks`
- `validation_commands`
- `done_when`
- `implementation_plan`
- `open_questions`
- `confidence`

### Behavior

- If an LLM provider is configured, use model assistance for ranking, summarization, and plan drafting.
- If no provider is configured, fall back to deterministic heuristics and clearly mark reduced confidence.

## 7.4 `export codex`

Export a task pack into a Codex-ready prompt file.

### Output

- `.github/codex/prompts/<slug>.md`

### Contents of export

- one-paragraph task objective,
- exact constraints,
- relevant paths and files,
- validation steps,
- done criteria,
- instructions to read repo `AGENTS.md` first,
- instructions to keep changes minimal and verifiable.

## 7.5 `lint`

Lint repository guidance and task packs for staleness.

### Checks

- referenced files no longer exist,
- referenced directories no longer exist,
- commands fail or are missing,
- generated pack references outdated paths,
- top-level AGENTS suggestions drift from current repo reality,
- missing validation commands,
- missing done criteria.

### Output

- human-readable CLI report,
- optional JSON output for CI.

---

## 8. CLI surface

## 8.1 Commands

```bash
contextforge init [--write-agents] [--json]
contextforge scan [--json] [--max-depth 6]
contextforge compile --input <file> [--title <title>] [--json]
contextforge export codex --input <task-pack.json> [--output <file>]
contextforge lint [--json] [--strict]
```

## 8.2 CLI UX principles

- clear defaults,
- low configuration burden,
- readable terminal output,
- JSON output when requested,
- deterministic file locations unless the user overrides them,
- non-destructive behavior by default.

---

## 9. Output contracts

## 9.1 `.contextforge/context.json`

Suggested top-level schema:

```json
{
  "repo": {
    "name": "string",
    "root": "string",
    "detectedLanguages": ["typescript"],
    "detectedFrameworks": ["node"],
    "packageManager": "npm"
  },
  "structure": {
    "importantPaths": ["src", "tests", "docs"],
    "entrySignals": ["package.json", "tsconfig.json"]
  },
  "commands": {
    "build": ["npm run build"],
    "test": ["npm run test"],
    "lint": ["npm run lint"],
    "format": ["npm run format"]
  },
  "docs": {
    "readme": ["README.md"],
    "contributing": [],
    "architecture": []
  },
  "generatedAt": "ISO-8601"
}
```

## 9.2 task pack json

```json
{
  "taskId": "task-add-lint-command",
  "title": "Add lint command support",
  "objective": "Add and document a lint command",
  "userRequestSummary": "...",
  "relevantPaths": ["src/cli", "src/core"],
  "relevantFiles": ["package.json", "src/cli/index.ts"],
  "possiblyRelatedPaths": ["tests"],
  "constraints": ["Do not introduce a database", "Keep CLI-first UX"],
  "assumptions": ["Node 20+"],
  "risks": ["Command inference may be wrong"],
  "validationCommands": ["npm run build", "npm run test"],
  "doneWhen": ["Command exists", "Tests added", "Docs updated"],
  "implementationPlan": ["..."],
  "openQuestions": [],
  "confidence": 0.82,
  "generatedAt": "ISO-8601"
}
```

## 9.3 Codex export markdown

Export format should be concise, structured, and copy-paste friendly. It should not be a giant essay. A strong format is:

1. Objective
2. Read-first files
3. Relevant paths
4. Constraints
5. Validation
6. Done when
7. Notes / assumptions

---

## 10. Functional requirements

### 10.1 Repository analysis

The system must:

- identify repo root reliably,
- avoid scanning ignored or obviously irrelevant directories by default,
- support `.gitignore`-aware traversal where feasible,
- avoid expensive deep traversal of large dependency folders,
- preserve relative paths in outputs.

### 10.2 Task compilation

The system must:

- read plain markdown tasks,
- summarize the request,
- score candidate relevant paths from the repo context,
- generate a bounded implementation plan,
- emit both JSON and Markdown.

### 10.3 Export

The system must:

- support Codex export in MVP,
- generate a prompt file at a predictable location,
- keep prompt size compact and focused.

### 10.4 Linting

The system must:

- validate referenced paths,
- validate command existence and executable status where possible,
- produce machine-readable lint results.

---

## 11. Non-functional requirements

- **Local-first:** all core actions run locally.
- **Fast enough for interactive use:** small and medium repos should finish in tens of seconds, not minutes.
- **Cross-platform aware:** support macOS, Linux, and Windows paths where practical.
- **Safe by default:** never overwrite important repo files without explicit opt-in.
- **Deterministic outputs:** repeated runs on unchanged input should be stable.
- **Good failure messages:** if the tool cannot infer commands or paths confidently, it should say so directly.

---

## 12. Technical design principles

### 12.1 Stack

- Language: TypeScript
- Runtime: Node.js 20+
- Package manager: npm
- CLI framework: lightweight (`commander` or equivalent)
- Validation: `zod`
- Testing: `vitest`
- Linting: `eslint`
- Formatting: `prettier`

### 12.2 Architecture modules

```text
src/
  cli/
    commands/
  core/
    scan/
    compile/
    export/
    lint/
    schema/
    providers/
    utils/
```

### 12.3 Provider model

Use an adapter interface so compilation can work with:

- no provider (heuristic mode),
- OpenAI provider (first-class),
- future providers later.

The provider interface should be isolated so the rest of the system remains testable without external APIs.

---

## 13. Repository structure for implementation

```text
contextforge/
  AGENTS.md
  README.md
  package.json
  tsconfig.json
  .gitignore
  .editorconfig
  .github/
    workflows/
    codex/
      prompts/
  docs/
    product/
      prd.md
      milestones.md
  src/
    cli/
    core/
  tests/
    unit/
    integration/
    fixtures/
  examples/
    issue-add-command.md
```

---

## 14. Testing strategy

### 14.1 Unit tests

Cover:

- schema validation,
- path scoring,
- command inference,
- markdown parsing,
- export formatting,
- lint checks.

### 14.2 Integration tests

Use small fixture repos to test:

- Node / TypeScript repo fixture,
- Python repo fixture,
- mixed docs-heavy repo fixture.

### 14.3 Golden tests

Maintain example expected outputs for:

- `context.json`,
- task pack markdown,
- task pack json,
- Codex export markdown.

Golden tests are important because product quality depends heavily on output structure and readability.

---

## 15. Milestones

## Milestone 0: project bootstrap

Deliver:

- TypeScript CLI scaffold
- build, lint, format, test commands
- README skeleton
- initial docs and examples

Definition of done:

- `npm install`
- `npm run build`
- `npm run test`
- `npm run lint`
all work on a clean checkout.

## Milestone 1: repo scan + init

Deliver:

- repo scan engine
- context outputs
- suggested AGENTS draft generation

Definition of done:

- fixture repos produce stable context output.

## Milestone 2: compile task pack

Deliver:

- markdown task parser
- relevance scoring
- task-pack JSON + Markdown generation

Definition of done:

- example issue compiles successfully and includes all required fields.

## Milestone 3: export Codex prompt

Deliver:

- Codex exporter
- prompt file generation
- example prompt committed to repo

Definition of done:

- exported prompt is concise and usable without manual cleanup.

## Milestone 4: lint

Deliver:

- stale path checks
- command validation
- missing criteria detection

Definition of done:

- integration tests cover typical drift scenarios.

---

## 16. Risks and mitigations

### Risk 1: relevance selection is noisy

Mitigation:

- use deterministic heuristics first,
- keep “possibly related” separate from “relevant”,
- expose confidence,
- keep outputs reviewable.

### Risk 2: generated prompts become too long

Mitigation:

- keep exports bounded,
- separate repository context from task context,
- favor path lists and explicit constraints over essay-style summaries.

### Risk 3: command inference is wrong

Mitigation:

- validate commands where possible,
- provide confidence and warnings,
- allow manual overrides later.

### Risk 4: product scope creep

Mitigation:

- lock MVP to CLI + Codex export + lint,
- reject SaaS / IDE / hosted features in the first implementation cycle.

---

## 17. Release criteria for v0.1 MVP

The MVP is ready when all of the following are true:

1. A new user can clone the repo, install dependencies, and run the tool locally.
2. `contextforge init` works on at least one realistic fixture repo.
3. `contextforge compile --input <markdown>` generates structured task packs.
4. `contextforge export codex` writes a usable prompt file.
5. `contextforge lint` catches the most obvious stale context errors.
6. README explains the value proposition, installation, commands, and examples.
7. The codebase has tests and clear contribution-friendly structure.

---

## 18. Post-MVP expansion paths (not for current implementation)

Potential next steps after MVP:

- deeper Codex / Claude Code / Cursor exporters,
- richer repository rules merging,
- issue URL ingestion,
- PR template generation,
- CI mode for linting context drift,
- shared team memory / paid cloud features.

These are intentionally outside the MVP build.
