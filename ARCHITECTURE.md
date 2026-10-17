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
      "title": "Factory workbench tab",
      "path": "src/tabs/factory-tab.tsx",
      "responsibility": "Native GHCode tab projecting selected workspace as target, observed and delta."
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
    }
  ],
  "confidence": {
    "tree": "GitHub revision manifest",
    "contracts": "Declared wiring and reviewed source; not behaviorally verified until CI/browser tests"
  }
}
---

# GHCode Architecture

GHCode is the host IDE/workbench. The Software Factory is registered as a native Dockview tab, using the existing global GitHub repository workspace. No second project selector, Dockview root, authentication system or editor implementation is introduced.

## Evidence boundaries

The PRD is the target state. This file reports selected implementation contracts. Source presence, document statements and behavioral verification are distinct evidence levels. An absent statement in this document does not imply missing code.

## Browser distribution

GHCode uses RSBuild with a deployment from GitHub Actions on main. Changes on the isolated branch remain separate from the production release path.
