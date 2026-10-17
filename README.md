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

### Pull-request previews

Opening or updating a same-repository PR triggers `.github/workflows/pr-preview.yml`. A successful build publishes a dedicated **read-only** review page to the isolated `pr-previews` branch, exposes its URL as a GitHub deployment environment, and updates a sticky PR comment. Preview data is served by raw.githack.com, a third-party caching proxy, because GitHub Pages' native PR previews are not publicly available with the repository's existing Actions-based production deployment. This does not change the production Pages site or require Vercel credentials.

**Never sign into GitHub on the preview origin.** The preview build prohibits GitHub credentials because raw.githack.com is a shared origin. Authenticate only on an approved first-party GHCode deployment. Each preview is removed when its PR closes, without affecting the production site or other PRs.

The preview URL for PR #N is `https://raw.githack.com/marius-patrik/GHCode/pr-previews/pr-N/index.html`. The review host may show an initial confirmation page. Use the stable URL in the PR's deployment/status section or its conversation comment. The canonical source remains the PR branch; do not commit compiled HTML to source branches.
