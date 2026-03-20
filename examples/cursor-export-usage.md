# Cursor export usage

Use the Cursor exporter after you already have a task pack:

```bash
contextforge compile --input examples/issue-add-command.md
contextforge export cursor --input .contextforge/task-packs/add-lint-command.json
```

The generated task brief lands at:

```text
.contextforge/exports/cursor/add-lint-command.md
```

You can paste that brief into Cursor Agent chat or keep it in the workspace for reference.

To generate an optional task-scoped rule suggestion:

```bash
contextforge export cursor \
  --input .contextforge/task-packs/add-lint-command.json \
  --rule-output .cursor/rules/add-lint-command.mdc
```

The rule suggestion is only written when you explicitly pass `--rule-output`. This milestone does not auto-write `.cursor/rules/*` or add legacy `.cursorrules` support.
