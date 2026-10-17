import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  BookOpen, CircleAlert, Download, ExternalLink,
  FileCode2, FileText, FolderTree, Plus,
  RefreshCw, Search, Send, X,
} from "lucide-react";
import { AnimatedIcon } from "@/components/animated-icon";
import { useFactory } from "@/factory/context";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createGithubIssue } from "@/github/client";
import { useWorkbenchRuntime } from "@/workbench/runtime";
import { useWorkspace } from "@/workspace/context";
import { languageForPath } from "@/workspace/languages";
import {
  compileContract, parseContract, registryRecords, REGISTRIES,
} from "@/factory/contracts";
import "@/factory/factory.css";

type Pane = "files" | "contracts" | "markdown" | "issues";

const PANES: Array<{ id: Pane; label: string }> = [
  { id: "files", label: "Files" },
  { id: "contracts", label: "Contracts" },
  { id: "markdown", label: "Markdown" },
  { id: "issues", label: "Issues" },
];

function downloadMarkdown(name: string, contents: string) {
  const blob = new Blob([contents], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function Status({ children, tone }: { children: string; tone?: "good" | "warn" | "bad" }) {
  return <span className={`factory-status ${tone ?? ""}`}>{children}</span>;
}

export function FactoryWorkspaceView() {
  const workspace = useWorkspace();
  const factory = useFactory();
  const runtime = useWorkbenchRuntime();
  const reducedMotion = useReducedMotion();
  const currentRepo = workspace.workspace;
  const { desired, reported, loading: reading, error: readError, desiredFiles: declaredFiles, actualFiles: observedFiles, changes: delta, drafts, validation, selectedPath } = factory;
  const concern = factory.concern;
  const [search, setSearch] = useState("");
  const [registry, setRegistry] = useState("requirements");
  const [selectedRecord, setSelectedRecord] = useState("");
  const [editedIssueBodies, setEditedIssueBodies] = useState<Record<string, string>>({});
  const [published, setPublished] = useState<Record<string, number>>({});
  const [publishing, setPublishing] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState("");
  const [pane, setPane] = useState<Pane>("files");
  const changeConcern = factory.setConcern;
  const changePane = (value: Pane) => setPane(value);

  const previousRepo = useRef<string | null>(null);
  useEffect(() => {
    const id = currentRepo?.id ?? null;
    if (previousRepo.current === id) return;
    previousRepo.current = id;
    setSearch("");
    setSelectedRecord("");
    setPublished({});
    setEditedIssueBodies({});
    setDispatchError("");
  }, [currentRepo]);

  const target = desired?.contract ?? null;
  const selectedDoc = concern === "repository" ? reported : desired;
  const selectedFile = selectedPath ?? "";
  const fileList = concern === "specification" ? declaredFiles : concern === "delta"
    ? delta.filter((item) => item.kind === "file" && item.path).map((item) => ({ path: item.path as string, type: "file" as const }))
    : observedFiles;

  const filteredRecords = registryRecords(selectedDoc?.contract ?? null, registry)
    .filter((record) => JSON.stringify(record).toLowerCase().includes(search.trim().toLowerCase()));
  const record = filteredRecords.find((item) => item.id === selectedRecord) ?? filteredRecords[0];

  const openEditor = (path: string) => runtime.openTab("editor", "main", {
    path,
    language: languageForPath(path),
    renderer: "editor",
  });
  const displayTitle = currentRepo?.repository.fullName ?? "Select a repository";

  const fileDetails = selectedFile
    ? {
        declared: declaredFiles.find((item) => item.path === selectedFile),
        actual: observedFiles.find((item) => item.path === selectedFile),
        changes: delta.filter((item) => item.path === selectedFile),
      }
    : null;

  const publishIssue = async (draft: (typeof drafts)[number]) => {
    if (!currentRepo || !workspace.token || !currentRepo.repository.canPush) return;
    if (!window.confirm(`Create a GitHub issue in ${currentRepo.repository.fullName}?\n\n${draft.title}`)) return;
    setPublishing(draft.id);
    setDispatchError("");
    try {
      const publishedIssue = await createGithubIssue(
        currentRepo.repository.fullName,
        draft.title,
        editedIssueBodies[draft.id] ?? draft.body,
        workspace.token,
      );
      setPublished((previous) => ({ ...previous, [draft.id]: publishedIssue.number }));
    } catch (error) {
      setDispatchError(error instanceof Error ? error.message : String(error));
    } finally {
      setPublishing(null);
    }
  };

  const filesView = (
    <section className="factory-inspector factory-file-inspector" aria-label="Selected file">
      {fileDetails ? (
        <>
          <div className="factory-inspector-head">
            <FileCode2 size={18}/>
            <div className="factory-inspector-title">
              <strong>{selectedFile.split("/").at(-1)}</strong>
              <span>{selectedFile}</span>
            </div>
            {fileDetails.actual?.type === "file" && (
              <Button variant="outline" size="sm" onClick={() => openEditor(selectedFile)}>
                Open in Monaco <ExternalLink size={13}/>
              </Button>
            )}
          </div>
          <dl className="factory-properties">
            <dt>Declared</dt><dd>{fileDetails.declared?.type ?? "Not declared"}</dd>
            <dt>Observed</dt><dd>{fileDetails.actual?.type ?? "Not found in repository tree"}</dd>
            <dt>Finding</dt><dd>{fileDetails.changes.map((change) => change.status).join(", ") || "No confirmed discrepancy"}</dd>
          </dl>
          {fileDetails.changes.map((finding) => (
            <div key={finding.id} className="factory-finding">
              <Status tone={finding.status === "missing" ? "bad" : "warn"}>{finding.status}</Status>
              <p>{finding.explanation}</p>
            </div>
          ))}
          {fileDetails.declared?.content !== undefined && (
            <><h3>Exact desired content</h3><pre className="factory-code">{fileDetails.declared.content}</pre></>
          )}
          {fileDetails.declared?.content !== undefined && fileDetails.actual && (
            <p className="factory-caption">Path presence does not prove source-content or behavioral compliance.</p>
          )}
        </>
      ) : (
        <div className="factory-no-selection">
          <FolderTree size={24}/>
          <strong>{concern === "specification" ? "Desired file tree" : concern === "delta" ? "File differences" : "Repository tree"}</strong>
          <p>Select a file in the shared Explorer to inspect it here. The same Explorer switches data with the workspace perspective.</p>
          <span className="factory-caption">{fileList.length} paths in this view</span>
        </div>
      )}
    </section>
  );

  const contractsView = (
    <div className="factory-split">
      <section className="factory-list-pane" aria-label="Contract registries">
        <header className="factory-pane-heading"><BookOpen size={14} /><strong>{concern === "repository" ? "Reported contracts" : "Target contracts"}</strong></header>
        <div className="factory-registry-list">
          {REGISTRIES.map((name) => (
            <button className={`factory-file-row ${registry === name ? "selected" : ""}`} type="button" key={name}
              onClick={() => { setRegistry(name); setSelectedRecord(""); }}>
              <span>{name}</span><small>{registryRecords(selectedDoc?.contract ?? null, name).length}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="factory-inspector">
        <header className="factory-pane-heading"><strong>{registry}</strong><span>{filteredRecords.length}</span></header>
        <div className="factory-record-list">
          {filteredRecords.map((item) => (
            <button type="button" key={String(item.id ?? JSON.stringify(item))}
              className={`factory-record ${record === item ? "selected" : ""}`}
              onClick={() => setSelectedRecord(String(item.id ?? ""))}>
              <strong>{String(item.title ?? item.id ?? "Untitled")}</strong>
              <small>{String(item.id ?? "Missing ID")}</small>
            </button>
          ))}
        </div>
        {record ? <pre className="factory-code">{JSON.stringify(record, null, 2)}</pre> : <p className="factory-empty">No contracts in this registry.</p>}
        {selectedDoc && <Button variant="outline" size="sm" onClick={() => openEditor(selectedDoc.path)}>Edit {selectedDoc.path} in Monaco <ExternalLink size={13}/></Button>}
      </section>
    </div>
  );

  const markdownView = (
    <div className="factory-markdown">
      <div className="factory-pane-heading"><FileText size={14}/><strong>{selectedDoc?.path ?? "No document"}</strong></div>
      {selectedDoc ? <>
        {selectedDoc.error && <div className="factory-error"><CircleAlert size={14}/>{selectedDoc.error}</div>}
        <div className="factory-actions">
          <Button size="sm" variant="outline" onClick={() => openEditor(selectedDoc.path)}>Open in Monaco</Button>
          <Button size="sm" variant="outline" onClick={() => downloadMarkdown(selectedDoc.path.split("/").at(-1) ?? "specification.md", selectedDoc.raw)}>
            <Download size={14}/> Export Markdown
          </Button>
          {selectedDoc.contract && <Button size="sm" variant="outline" onClick={() => downloadMarkdown("compiled-" + selectedDoc.path.split("/").at(-1), compileContract(selectedDoc.contract!, parseContract(selectedDoc.raw).prose))}>
            Compile frontmatter
          </Button>}
        </div>
        <pre className="factory-code factory-markdown-source">{selectedDoc.raw}</pre>
      </> : <p className="factory-empty">No {concern === "repository" ? "ARCHITECTURE.md" : "PRD.md"} in the selected repository. The factory does not synthesize implementation evidence.</p>}
    </div>
  );

  const issuesView = (
    <div className="factory-issues">
      <div className="factory-pane-heading"><strong>Review & dispatch</strong><span>{drafts.length} drafts</span></div>
      {dispatchError && <div role="alert" className="factory-error">{dispatchError}</div>}
      {drafts.length === 0 && <p className="factory-empty">No actionable discrepancies are supported by the loaded source documents and tree.</p>}
      {drafts.map((draft) => (
        <article className="factory-issue" key={draft.id}>
          <div className="factory-issue-heading">
            <div><strong>{draft.title}</strong><span>{draft.items.length} evidence-backed discrepancies</span></div>
            {published[draft.id] ? <Status tone="good">{`Published #${published[draft.id]}`}</Status> : <Status>Draft</Status>}
          </div>
          <textarea aria-label={`Issue body: ${draft.title}`} value={editedIssueBodies[draft.id] ?? draft.body}
            onChange={(event) => setEditedIssueBodies((current) => ({ ...current, [draft.id]: event.target.value }))} />
          <div className="factory-actions">
            <Button variant="outline" size="sm" onClick={() => downloadMarkdown("issue-" + draft.id.replace(/[^a-z0-9-]/gi, "-") + ".md", editedIssueBodies[draft.id] ?? draft.body)}>
              <Download size={14}/> Export
            </Button>
            <Button size="sm" disabled={publishing !== null || !!published[draft.id] || !currentRepo?.repository.canPush || !workspace.token}
              onClick={() => void publishIssue(draft)}>
              <Send size={14}/>{publishing === draft.id ? "Publishing…" : "Create GitHub issue"}
            </Button>
          </div>
        </article>
      ))}
      {!workspace.token && drafts.length > 0 && <p className="factory-caption">Authenticate with GitHub to publish issues. Export remains available without write access.</p>}
    </div>
  );

  if (!currentRepo) {
    return <div className="factory-start">
      <AnimatedIcon names={["FolderTreeIcon", "FileCode2Icon"]} />
      <h2>Software Factory</h2>
      <p>Open a GitHub workspace to inspect its source, contract and discrepancies. No example repository is substituted.</p>
      <Button onClick={() => workspace.setDialogOpen(true)}><Plus size={14}/> Open repository</Button>
    </div>;
  }

  return (
    <div className="factory-workspace">
      {readError && <div role="alert" className="factory-error"><CircleAlert size={14}/> {readError}</div>}
      {concern === "overview" ? (
        <div className="factory-overview">
          <h2>Project evidence</h2>
          <p>The factory works from this repository's checked-out tree, PRD.md and ARCHITECTURE.md; it does not run code changes.</p>
          <div className="factory-metrics">
            <div><strong>{registryRecords(target, "requirements").length}</strong><span>Requirements</span></div>
            <div><strong>{observedFiles.filter((file) => file.type === "file").length}</strong><span>Observed files</span></div>
            <div><strong>{delta.length}</strong><span>Discrepancies</span></div>
            <div><strong>{validation.length}</strong><span>Contract errors</span></div>
          </div>
          <div className="factory-evidence">
            <div><Status tone={desired?.contract ? "good" : "warn"}>{desired?.contract ? "Parsed" : "Unavailable"}</Status><strong>PRD</strong><span>{desired?.path ?? "No target contract"}</span></div>
            <div><Status tone={reported?.contract ? "good" : "warn"}>{reported?.contract ? "Parsed" : "Unavailable"}</Status><strong>Architecture</strong><span>{reported?.path ?? "No reported architecture"}</span></div>
            <div><Status tone="good">Revision scoped</Status><strong>Repository tree</strong><span>{currentRepo.treeSha.slice(0, 9)}</span></div>
          </div>
          {validation.map((error) => <p className="factory-error" key={error}><CircleAlert size={13}/> {error}</p>)}
          <div className="factory-actions">
            <Button onClick={() => { changeConcern("specification"); changePane("contracts"); }}>Inspect specification</Button>
            <Button variant="outline" onClick={() => { changeConcern("delta"); changePane("files"); }}>Review delta</Button>
          </div>
        </div>
      ) : (
        <>
          <nav className="factory-panes" aria-label="Shared factory panels">
            {PANES.map(({ id, label }) => (
              <button className={pane === id ? "active" : ""} type="button" key={id} onClick={() => changePane(id)}>{label}</button>
            ))}
            {(pane === "files" || pane === "contracts") && <label className="factory-search"><Search size={13}/><input aria-label="Filter" value={search} placeholder="Filter…" onChange={(event) => setSearch(event.target.value)}/>{search && <button type="button" aria-label="Clear filter" onClick={() => setSearch("")}><X size={12}/></button>}</label>}
          </nav>
          <AnimatePresence mode="wait" initial={false}>
            <motion.main key={`${concern}:${pane}`} className="factory-main"
              initial={reducedMotion ? false : { opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.12 }}>
              {pane === "files" ? filesView : pane === "contracts" ? contractsView : pane === "markdown" ? markdownView : issuesView}
            </motion.main>
          </AnimatePresence>
        </>
      )}

    </div>
  );
}
