---
status: published
---
# GHCode

GHCode is a browser-native GitHub development workbench integrating desired-state specification, repository inspection, qualified delta and reviewed issue dispatch.

Its UI uses React/TypeScript, Dockview, Monaco, Radix, Motion and Lucide Animated. The main Dockview always displays its tab strip: Overview, Specification, Delta, Repository, editors and other tools are peers. The activity rail activates native tabs while keeping a single project/ref selection, Explorer, editor system and status bar. The monochrome palette is retained.

## Open a project

Use the repository control in the global header. Files in the selected GitHub revision and local overlays inform all perspectives. PR previews are published as independent GitHub Pages snapshots at `/GHCode/pr-N/` with the last successful main release preserved.
