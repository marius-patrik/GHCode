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

The **Software Factory** is a native Dockview tab, available from the **+** launcher or the command bar (`>Open Software Factory`). It shares GHCode's selected GitHub repository, reference, source tree, working overlays, editor, authentication and theme. It is not another application.

The capability reads the selected repository's `PRD.md` (desired state) and `ARCHITECTURE.md` (reported state), expecting JSON-compatible YAML 1.2 frontmatter. It provides Overview, Specification, Delta and Repository projections and editable, evidence-qualified issue drafts. Editing a specification opens it in the existing Monaco editor. Issue creation requires explicit user confirmation and GitHub write permission.

The current repo includes its actual `PRD.md` and `ARCHITECTURE.md` so the Factory can inspect GHCode itself without bundled demo contracts. It never assumes undocumented code is missing. A full GitHub tree establishes path existence, not behavioral compliance.

This integration is being developed on `feat/software-factory-workspace`; the production branch is unchanged.

