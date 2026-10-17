---
{
  "kind": "software-factory-prd",
  "schema_version": "1.0.0",
  "product": {
    "name": "GHCode Software Factory",
    "purpose": "Define desired codebase contracts, inspect a GitHub workspace, derive evidence-qualified differences and prepare reviewed implementation issues.",
    "target": "The selected GitHub repository (including GHCode itself).",
    "boundary": "Specification, inspection and issue preparation; implementation is performed by external agents."
  },
  "policy": {
    "file_tree_complete": false,
    "source_of_truth": "PRD.md",
    "architecture_evidence": "ARCHITECTURE.md",
    "project_selection": "GHCode workspace provider"
  },
  "actors": [
    {
      "id": "ACT-001",
      "title": "Product engineer",
      "goal": "Edit contracts and approve gaps before dispatch."
    },
    {
      "id": "ACT-002",
      "title": "Software factory agent",
      "goal": "Consume machine-readable Markdown and implement reviewed issues."
    }
  ],
  "requirements": [
    {
      "id": "REQ-001",
      "title": "Single workspace model",
      "behavior": "The active GHCode workspace provides repository, ref, tree, file overlays and authentication to every factory projection.",
      "acceptance": [
        "No separate repository picker in factory tab",
        "Changing GHCode workspace refreshes factory evidence"
      ]
    },
    {
      "id": "REQ-002",
      "title": "Editable desired contract",
      "behavior": "Read project-owned PRD.md and open it through existing Monaco editor. Accept JSON-compatible YAML 1.2 frontmatter with Markdown narrative."
    },
    {
      "id": "REQ-003",
      "title": "Repository evidence",
      "behavior": "Read ARCHITECTURE.md and selected revision tree. Treat missing architecture statements as unknown, not proof of missing code."
    },
    {
      "id": "REQ-004",
      "title": "Shared projections",
      "behavior": "Overview, Specification, Delta and Repository views share Files, Contracts and Markdown panels and selected project."
    },
    {
      "id": "REQ-005",
      "title": "Path delta",
      "behavior": "Compare declared target files against complete selected-revision tree, accounting for working overlays. Only treat unexpected files as violations if manifest is explicitly exhaustive."
    },
    {
      "id": "REQ-006",
      "title": "Issue dispatch",
      "behavior": "Generate evidence-qualified issue drafts, allow edits, explicit confirmation and authenticated publishing."
    },
    {
      "id": "REQ-007",
      "title": "Native workbench integration",
      "behavior": "Use GHCode Dockview, Radix, Motion, shadcn components and Lucide icons; no second tab, auth, or project subsystem."
    },
    {
      "id": "REQ-008",
      "title": "Source-controlled self-definition",
      "behavior": "GHCode factory itself is described by this actual PRD and ARCHITECTURE.md rather than embedded mock project data."
    }
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
  "interfaces": [
    {
      "id": "INT-001",
      "title": "PRD frontmatter",
      "format": "JSON-compatible YAML 1.2",
      "path": "PRD.md"
    },
    {
      "id": "INT-002",
      "title": "Reported architecture",
      "format": "JSON-compatible YAML 1.2",
      "path": "ARCHITECTURE.md"
    },
    {
      "id": "INT-003",
      "title": "GitHub Issues API",
      "action": "User-reviewed authenticated issue creation",
      "integration": "GHCode GitHub client"
    }
  ],
  "acceptance": [
    {
      "id": "ACC-001",
      "title": "Project switching",
      "for": [
        "REQ-001"
      ],
      "assertion": "Loading a different GitHub workspace changes all projections without a factory-local selector."
    },
    {
      "id": "ACC-002",
      "title": "Discrepancy qualification",
      "for": [
        "REQ-003",
        "REQ-005"
      ],
      "assertion": "Missing path in a complete tree is missing; undocumented component cannot be labeled missing."
    },
    {
      "id": "ACC-003",
      "title": "Reviewed dispatch",
      "for": [
        "REQ-006"
      ],
      "assertion": "Issue publication requires a user action and confirmation."
    }
  ],
  "files": [
    {
      "id": "FIL-001",
      "kind": "file",
      "path": "src/factory/contracts.ts",
      "purpose": "Evidence-qualified contract engine"
    },
    {
      "id": "FIL-002",
      "kind": "file",
      "path": "src/factory/factory.css",
      "purpose": "Native workbench styling, theme tokens"
    },
    {
      "id": "FIL-003",
      "kind": "file",
      "path": "src/tabs/factory-tab.tsx",
      "purpose": "Factory tab presentation"
    },
    {
      "id": "FIL-004",
      "kind": "file",
      "path": "src/workbench/registry.tsx",
      "purpose": "Tab registration"
    },
    {
      "id": "FIL-005",
      "kind": "file",
      "path": "src/workbench/model.ts",
      "purpose": "Workbench tab union"
    },
    {
      "id": "FIL-006",
      "kind": "file",
      "path": "PRD.md",
      "purpose": "Project desired contract"
    },
    {
      "id": "FIL-007",
      "kind": "file",
      "path": "ARCHITECTURE.md",
      "purpose": "Reported implementation architecture"
    }
  ]
}
---

# GHCode Software Factory

This project is maintained within GHCode rather than as a second application. Its contract is intentionally scoped to the Software Factory capability, not to every existing GHCode feature. The `files` registry declares important owned files, **not** a complete tree. The actual tree comes from the selected GitHub workspace.

## Iteration

1. Edit `PRD.md` in the existing Monaco tab.
2. Inspect the selected workspace revision and `ARCHITECTURE.md`.
3. Review evidence-qualified Delta findings.
4. Edit and dispatch GitHub issue drafts with explicit confirmation.
5. After implementation, reconcile the project-owned architecture document.
