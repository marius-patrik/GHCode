import { useState } from "react";
import { useWorkspace } from "@/workspace/context";
import { FactoryTab } from "@/tabs/factory-tab";
import { LAUNCHER_ENTRIES, launcherEntryDisabled, runLauncherEntry } from "./launcher";
import { createWorkbenchTab } from "./registry";
import { useWorkbenchRuntime } from "./runtime";

export function EmptyWorkbench() {
  const workspace = useWorkspace();
  const runtime = useWorkbenchRuntime();
  const [pane, setPane] = useState("files");

  if (workspace.workspace) {
    const tab = createWorkbenchTab("factory", { id: "factory-home", state: { pane } });
    return (
      <section className="factory-home" aria-label="Workspace perspective">
        <FactoryTab tab={tab} updateState={(patch) => {
          if (typeof patch.pane === "string") setPane(patch.pane);
        }} />
      </section>
    );
  }

  const open = (label: string) => {
    const entry = LAUNCHER_ENTRIES.find((candidate) => candidate.label === label);
    if (!entry) return;
    void runLauncherEntry(entry, "main", runtime, workspace).catch((reason) => {
      window.alert(reason instanceof Error ? reason.message : String(reason));
    });
  };

  const tabs = LAUNCHER_ENTRIES.filter((entry) => entry.type);
  return (
    <div className="empty-workbench">
      <div className="empty-workbench-card">
        <section>
          <h2>Workspace</h2>
          <button type="button" onClick={() => workspace.setDialogOpen(true)}>Open GitHub Repository</button>
          <button type="button" onClick={() => workspace.setDialogOpen(true)}>Open Repository URL</button>
          <button type="button" disabled={workspace.recent.length === 0} onClick={() => open("Recent Workspaces")}>
            Recent Workspaces
          </button>
        </section>
        <section>
          <h2>Tabs</h2>
          <div className="empty-tab-grid">
            {tabs.map((entry) => (
              <button
                key={entry.label}
                type="button"
                disabled={launcherEntryDisabled(entry, workspace)}
                onClick={() => open(entry.label)}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
