# GHCode

GHCode is a standalone browser-based GitHub code workbench built with React, TypeScript, RSBuild, Dockview and Monaco.

## Development

```sh
bun install
bun run dev
```

## Validation

```sh
bun run check
bun run acceptance
```

## Deployment

Every push/merge to `main` runs CI (lint, typechecking, build, browser acceptance). A passing build automatically creates the next patch GitHub Release, attaches `ghcode-site.zip`, and deploys the built application using GitHub Actions Pages artifacts (`upload-pages-artifact` / `deploy-pages`). Deployment does **not** push to `gh-pages`. Set **Settings → Pages → Build and deployment → Source: GitHub Actions** once in repository settings. The GitHub OAuth/PKCE configuration is documented in [AUTH.md](AUTH.md).

This codebase was separated from [`marius-patrik/OdbornaPrace`](https://github.com/marius-patrik/OdbornaPrace); the thesis PDF and its publication pipeline remain in that repository.
