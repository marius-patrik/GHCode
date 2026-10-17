---
{
  "kind": "software-factory-architecture",
  "schema_version": "1.0.0",
  "project": {
    "name": "GHCode",
    "ref": "feat/software-factory-workspace",
    "evidence": "Project-owned source on the isolated integration branch",
    "runtime": "React 19 / TypeScript / RSBuild / Dockview"
  },
  "scope": [
    "components"
  ],
  "components": [
    {
      "id": "CMP-001",
      "title": "Contract engine",
      "path": "src/factory/contracts.ts",
      "responsibility": "Frontmatter parsing, contract validation, file and contract evidence comparison, issue draft assembly."
    },
    {
      "id": "CMP-002",
      "title": "Workspace perspective inspector",
      "path": "src/tabs/factory-tab.tsx",
      "responsibility": "Renders workspace information from global factory provider; file tree belongs to GHCode Explorer."
    },
    {
      "id": "CMP-003",
      "title": "GHCode workspace",
      "path": "src/workspace/context.tsx",
      "responsibility": "Single global project, source overlays, repository tree, authentication."
    },
    {
      "id": "CMP-004",
      "title": "Workbench registry",
      "path": "src/workbench/registry.tsx",
      "responsibility": "Dockview tab registration and reusable workbench shell."
    },
    {
      "id": "CMP-005",
      "title": "Global factory perspective model",
      "path": "src/factory/context.tsx",
      "responsibility": "Sources desired, reported, delta, selected path, and active concern from existing GitHub workspace."
    }
  ],
  "runtimes": [
    {
      "id": "RUN-001",
      "title": "Browser",
      "framework": "React",
      "workbench": "Dockview",
      "build": "RSBuild"
    }
  ],
  "observations": [
    {
      "path": "src/app.tsx",
      "role": "Application composition: workspace provider, auth controller, workbench shell and repository dialog."
    },
    {
      "path": "src/workspace/context.tsx",
      "role": "Workspace selection, repository tree, overlays, read/write access, and active authentication."
    },
    {
      "path": "src/workbench/registry.tsx",
      "role": "Workbench tab definition dispatch and Dockview tab content rendering."
    },
    {
      "path": "src/tabs/factory-tab.tsx",
      "role": "New factory projection controls; no separate app shell."
    },
    {
      "path": "src/factory/contracts.ts",
      "role": "Pure contract parser and evidence comparison."
    },
    {
      "path": "src/tabs/explorer-tab.tsx",
      "role": "One actual/desired/delta file tree controlled by global concern."
    },
    {
      "path": "src/workbench/shell.tsx",
      "role": "Native workbench chrome with global activity rail for Overview/Specification/Delta/Repository."
    },
    {
      "path": "rsbuild.config.ts",
      "role": "Dual-mode production/site build and standalone inlined HTML preview."
    }
  ],
  "confidence": {
    "tree": "GitHub revision manifest",
    "contracts": "Declared wiring and reviewed source; not behaviorally verified until CI/browser tests",
    "browser": "Pending CI compilation and acceptance evidence"
  }
}
---

# GHCode Architecture

GHCode has one `WorkspaceProvider` and one Dockview workbench. `FactoryProvider` consumes that workspace, loads PRD and ARCHITECTURE Markdown, derives paths and discrepancies, and exposes a global concern. The shell's activity rail chooses the concern, the existing Explorer displays the corresponding file projection, and the normal Monaco, GitHub and Dockview tabs continue to work. The main workspace inspector is one view of the same model, not a second application or project owner.

## Source authority

GitHub revision tree proves path presence. PRD provides the desired state. ARCHITECTURE records reported system contracts. Tests and source inspection determine actual behavioral compliance. Lack of a claim in ARCHITECTURE is not evidence that code is missing.

## Build

The regular RSBuild output is used for production GitHub Pages. A separate `build:standalone` inlines HTML scripts/styles/assets for a reviewable single HTML document from the same source code. The draft PR workflow publishes the standalone artifact only after checks.
