---
status: approved
---
# GHCode product requirements

## Product

Provide a reliable GitHub development environment in which desired product intent, observed repository structure and evidence-qualified differences are different projections of one project state.

## Machine-readable contract

```json
{
  "kind": "ghcode-prd",
  "schema_version": "1.0.0",
  "policy": {
    "file_tree_complete": false
  },
  "product": {
    "name": "GHCode",
    "purpose": "Unified GitHub workbench and specification environment"
  },
  "requirements": [
    {
      "id": "REQ-001",
      "title": "Unified workbench",
      "behavior": "Overview, Specification, Delta and Repository are global views of one project; not standalone or nested Dockview tabs."
    },
    {
      "id": "REQ-002",
      "title": "Single source",
      "behavior": "Read project-owned .agents/PRD.md and .agents/ARCHITECTURE.md compiled from canonical records; no bundled mock specification."
    },
    {
      "id": "REQ-003",
      "title": "Reliable layout",
      "behavior": "Sidebar collapse, restore and resize preserve the central editor and active perspective on desktop and mobile."
    },
    {
      "id": "REQ-004",
      "title": "Consistent appearance",
      "behavior": "Only one workbench status bar, one global header, a consistent neutral theme and proper dialog/tooltip stacking."
    },
    {
      "id": "REQ-005",
      "title": "Delta integrity",
      "behavior": "Distinguish actual missing path from undocumented contract; never assert implementation missing based on absent document statements."
    },
    {
      "id": "REQ-006",
      "title": "Issue dispatch",
      "behavior": "Issue drafts are editable; authenticated publishing requires explicit consent; application does not execute generated tasks."
    },
    {
      "id": "REQ-007",
      "title": "Pages previews",
      "behavior": "Build PR head, stage independently and publish through GitHub Pages Actions without overwriting production."
    },
    {
      "id": "REQ-008",
      "title": "Governed delivery",
      "behavior": "Development is the integration branch; only development can target main; immutable tag-only releases; central test directory."
    }
  ],
  "components": [
    {
      "id": "CMP-001",
      "title": "Native workbench shell",
      "path": "src/workbench/shell.tsx"
    },
    {
      "id": "CMP-002",
      "title": "Project source state",
      "path": "src/workspace/context.tsx"
    },
    {
      "id": "CMP-003",
      "title": "Global desired/observed/delta state",
      "path": "src/factory/context.tsx"
    },
    {
      "id": "CMP-004",
      "title": "Central perspective",
      "path": "src/factory/workspace-view.tsx"
    },
    {
      "id": "CMP-005",
      "title": "Native Explorer",
      "path": "src/tabs/explorer-tab.tsx"
    },
    {
      "id": "CMP-006",
      "title": "Contract engine",
      "path": "src/factory/contracts.ts"
    }
  ],
  "files": [
    {
      "id": "FIL-1",
      "path": "src/workbench/shell.tsx",
      "kind": "file"
    },
    {
      "id": "FIL-2",
      "path": "src/workbench/root-layout.css",
      "kind": "file"
    },
    {
      "id": "FIL-3",
      "path": "src/factory/context.tsx",
      "kind": "file"
    },
    {
      "id": "FIL-4",
      "path": "src/factory/workspace-view.tsx",
      "kind": "file"
    },
    {
      "id": "FIL-5",
      "path": "src/factory/contracts.ts",
      "kind": "file"
    },
    {
      "id": "FIL-6",
      "path": "src/tabs/explorer-tab.tsx",
      "kind": "file"
    },
    {
      "id": "FIL-7",
      "path": ".agents/PRD.md",
      "kind": "file"
    },
    {
      "id": "FIL-8",
      "path": ".agents/ARCHITECTURE.md",
      "kind": "file"
    }
  ],
  "acceptance": [
    {
      "id": "ACC-001",
      "title": "Collapsed sidebars do not hide main viewport"
    },
    {
      "id": "ACC-002",
      "title": "Factory absent from native tab registry"
    },
    {
      "id": "ACC-003",
      "title": "Exactly one global status bar"
    },
    {
      "id": "ACC-004",
      "title": "Source records deterministically generate human-facing docs"
    },
    {
      "id": "ACC-005",
      "title": "GitHub Pages previews verify HTTP and all entry JS/CSS assets"
    }
  ]
}
```

## Workflow

The user chooses one GitHub repository/ref. Specification reads the project-owned canonical PRD; Repository inspects the working tree; Delta derives verified discrepancies and prepares issue drafts; Overview summarizes. Documents remain editable via existing Monaco tabs. A global activity rail selects perspectives; it must not open another nested tab.

## Verification

Cross-view switching, sidebar collapse, z-index interactions, source editing, browser layout, PR preview deploy and test discovery need behavior-driven tests. No fake success states or unverified live integration claims.
