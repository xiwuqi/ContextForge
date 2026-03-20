# Public metadata checklist

Use this checklist for the manual GitHub and npm details that repository code cannot set by itself.

## GitHub repository

- About text matches the README opening value proposition.
- The README language switcher and linked `README.zh-CN.md` render correctly.
- Topics reflect the real current product, for example: `cli`, `local-first`, `coding-agents`, `codex`, `claude-code`, `cursor`, `typescript`.
- Website/homepage points to the repository README or another deliberate public landing page.
- The pinned repository description does not imply unsupported agents or hosted features.

## First GitHub release draft

- Draft release notes from `CHANGELOG.md`.
- Start from `.contextforge/releases/<version>/release-notes.md` when a fresh handoff bundle exists.
- Make the release title match the chosen version or release-candidate tag.
- Confirm the notes describe the CLI honestly and do not imply automated publish or hosted infrastructure.

## npm package page after first publish

- README renders correctly on the npm package page.
- Homepage, repository, bugs, and license links resolve correctly.
- The package description and keywords match the current product positioning.
- The install and quickstart examples still reflect the actual CLI surface.
- The published version matches the handoff bundle version and tarball filename.
