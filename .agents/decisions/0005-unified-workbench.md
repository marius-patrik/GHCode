---
status: accepted
---
# Unified workspace and GitHub Pages publication

## Decision

One WorkspaceProvider and workbench shell own GitHub identity, file tree, source changes, Dockview tabs and status. FactoryProvider derives contract/architecture views and discrepancies; the native Explorer projects desired, observed or changed paths. The perspective is rendered directly in the main empty/editor area and is not a tab type.

PR builds are staged under gh-pages/pr-N and published together with the last passing main artifact using GitHub Pages Actions, following the BoardGamesWithQuests deployment architecture.

## Machine-readable architecture

```json
{
  "kind": "ghcode-architecture",
  "schema_version": "1.0.0",
  "scope": [
    "components"
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
  "policy": {
    "file_tree_complete": false
  }
}
```

## Consequences

No redundant project selectors, tab implementations, status bars or implementation runtime. The contract parser consumes the generated .agents docs, which compile from approved source records. Missing documentation is not evidence of missing code.
