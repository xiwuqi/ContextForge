# GitHub Issue Sources

ContextForge can compile tasks from GitHub issues without requiring a hand-written local markdown file first.

## Direct GitHub fetch

```bash
contextforge compile --github-issue https://github.com/owner/repo/issues/123
contextforge compile --github-issue owner/repo#123
```

If the issue requires authentication, set `GITHUB_TOKEN` first:

```bash
export GITHUB_TOKEN=your_token_here
contextforge compile --github-issue owner/repo#123
```

## Offline issue JSON

```bash
contextforge compile --github-issue-json tests/fixtures/github/contextforge-issue-101.json
```

This path is useful for deterministic testing, offline workflows, or private issues that you export locally first.
