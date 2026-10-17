---
{
  "kind": "software-factory-prd",
  "schema_version": "1.0.0",
  "product": {
    "name": "GHCode Software Factory",
    "purpose": "Define a complete desired codebase, inspect the actual selected GitHub project, show trustworthy differences and prepare dispatchable issues within the GHCode workbench.",
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
      "title": "Unified GHCode workbench",
      "behavior": "All factory concerns are global GHCode workspace perspectives. The existing primary Explorer, Monaco, Dockview layout, project/ref selector, issue client and source control are reused; no secondary tab container or repository state machine."
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
      "title": "Workspace perspective inspector",
      "path": "src/tabs/factory-tab.tsx",
      "responsibility": "Main workbench inspector shares global concern and selection with the native Explorer; no independent project loading or file tree."
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
      "title": "Global perspective state",
      "path": "src/factory/context.tsx",
      "responsibility": "Derive desired PRD, reported architecture and delta from the GHCode workspace; share current concern and selected path."
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
    },
    {
      "id": "FIL-008",
      "kind": "file",
      "path": "src/factory/context.tsx",
      "purpose": "Global source-derived perspective model"
    },
    {
      "id": "FIL-009",
      "kind": "file",
      "path": "src/tabs/explorer-tab.tsx",
      "purpose": "Shared file tree of desired, actual and delta projections"
    },
    {
      "id": "FIL-010",
      "kind": "file",
      "path": "src/workbench/shell.tsx",
      "purpose": "Global navigation rail and Dockview workbench"
    },
    {
      "id": "FIL-011",
      "kind": "file",
      "path": "rsbuild.config.ts",
      "purpose": "Production and standalone HTML compilation"
    }
  ]
}
---

# GHCode Software Factory

The factory is a first-class GHCode workbench capability. Repository, Specification, Delta and Overview are **global perspectives** selected through the existing activity rail. The same Explorer changes projection, existing editor tabs remain available, and the main workspace inspector reacts to project state. No parallel Dockview implementation or hardcoded project snapshot is maintained.

## Contract and evidence

- Target contracts reside in `PRD.md`.
- Reported architecture resides in `ARCHITECTURE.md`.
- The selected repository ref, full Git tree and working overlays are read through GHCode's existing workspace provider.
- Unreported requirements are not automatically classified as unimplemented.
- Issue drafts remain reviewable and need explicit approval before publishing.
- A standalone single-file HTML is built from the same source tree for review.
