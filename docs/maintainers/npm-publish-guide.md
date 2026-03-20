# npm publish guide

ContextForge keeps `npm run publish:dry-run` for local validation and uses the release workflow for real publish when configured.

The intended public package identifier is `@xiwuqi/contextforge`. The CLI command remains `contextforge`.

## Preferred path: npm trusted publishing

Use npm trusted publishing from GitHub Actions when possible.

Requirements:

- the npm package is linked to this GitHub repository for trusted publishing
- the release workflow has `id-token: write`
- the workflow runs on GitHub-hosted runners

Behavior:

- the workflow publishes the generated tarball from `.contextforge/releases/<version>/`
- the publish step uses `--provenance`
- no long-lived npm token needs to live in the repository secrets

## Fallback path: `NPM_TOKEN`

If trusted publishing is not available yet:

- create an npm automation token with publish access for `@xiwuqi/contextforge`
- store it as the repository secret `NPM_TOKEN`
- keep `publish_to_npm` enabled in the workflow dispatch inputs

The workflow will then publish using token auth instead of trusted publishing.

After a successful publish response, the workflow also retries npm visibility checks for a short window so normal registry propagation delays do not immediately mark the release as failed.

For the initial `0.1.0` public release, these workflow inputs were used:

- `version = 0.1.0`
- `npm_tag = latest`
- `publish_to_npm = true`

## Safety notes

- never print or commit npm tokens
- never hardcode tokens in workflow files or scripts
- keep `publish_to_npm` set to `false` when you only want to test metadata sync or GitHub Release creation
- rerun `npm run publish:dry-run` locally before dispatch if package metadata changed

## Post-publish check

After the workflow publishes:

- confirm `npm view @xiwuqi/contextforge@<version> version` returns the expected version
- verify the npm package page renders `README.md` correctly
- verify homepage, repository, bugs, and license links
