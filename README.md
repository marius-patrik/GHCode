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

## Software Factory (isolated branch)

The factory is integrated into the GHCode workbench, not an independent application. The global activity rail selects **Overview**, **Specification**, **Delta**, and **Repository**. These perspectives share the selected GitHub repository, revision, file explorer, Monaco editor, Dockview layout, authentication, and source-control state.

Source-owned `PRD.md` defines the desired contract, while `ARCHITECTURE.md` describes reported implementation. The GitHub tree supplies actual file-path evidence; absence from the architecture document is not treated as proof that code is missing. Discrepancies can become reviewed GitHub issue drafts.

### Pull-request previews — GitHub Pages

The PR workflow uses the same staged-snapshot pattern as BoardGamesWithQuests. Each PR builds from its own head, stages its site under `gh-pages/pr-N/`, and uses **GitHub Pages Actions** to deploy a complete artifact assembled from the validated production snapshot and all open PR previews. A deployment is marked successful only after the Pages URL serves HTML. The full site is not rebuilt from `main` when a PR changes.

A PR preview is available at `https://marius-patrik.github.io/GHCode/pr-N/`. The workflow publishes the URL as a GitHub deployment and in the PR conversation. Closing a PR removes its snapshot and deactivates its deployment.

Production continues to be built from validated `main` and staged separately. The main CI workflow uses the same assembler to avoid replacing existing PR previews. Both publishers use shared serialization; previews do not replace production files. No third-party preview mirror or Vercel project is involved.

Authentication is disabled within PR preview paths. Sign in on the first-party production root only. Compiled files are stored on the dedicated `gh-pages` staging branch; feature branches contain source code only.
