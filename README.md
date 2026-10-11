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

The `Deploy Pages` GitHub Actions workflow builds the static web application and publishes it to the `gh-pages` branch. The GitHub OAuth/PKCE configuration is documented in [AUTH.md](AUTH.md).

This codebase was separated from [`marius-patrik/OdbornaPrace`](https://github.com/marius-patrik/OdbornaPrace); the thesis PDF and its publication pipeline remain in that repository.
