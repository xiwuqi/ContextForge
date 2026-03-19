# Claude Code export usage

Use the Claude exporter after you already have a task pack:

```bash
contextforge compile --input examples/issue-add-command.md
contextforge export claude --input .contextforge/task-packs/add-lint-command.json
```

The generated file lands at:

```text
.contextforge/exports/claude/add-lint-command.md
```

Typical Claude Code workflows:

- paste the markdown directly into a Claude Code session
- reference it from Claude Code with `@.contextforge/exports/claude/add-lint-command.md`

This export is intentionally non-destructive. It does not write:

- `CLAUDE.md`
- `.claude/CLAUDE.md`
- `.claude/rules/*`
- `.claude/settings.json`
- `.claude/settings.local.json`
