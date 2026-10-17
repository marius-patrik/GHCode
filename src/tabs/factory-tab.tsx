import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  BookOpen, CircleAlert, Diff, Download, ExternalLink, File,
  FileCode2, FileText, FolderTree, GitBranch, LayoutDashboard, Plus,
  RefreshCw, Search, Send, X,
} from "lucide-react";
import { AnimatedIcon } from "@/components/animated-icon";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createGithubIssue } from "@/github/client";
import { useWorkbenchRuntime } from "@/workbench/runtime";
import type { WorkbenchTab } from "@/workbench/model";
import { useWorkspace } from "@/workspace/context";
import { languageForPath } from "@/workspace/languages";
import {
  assembleIssueDrafts, calculateDiscrepancies, compileContract,
  desiredPaths, parseContract, registryRecords, REGISTRIES,
  validateContract, type Contract, type FileEvidence,
} from "@/factory/contracts";
import "@/factory/factory.css";

type Concern = "overview" | "specification" | "delta" | "repository";
type Pane = "files" | "contracts" | "markdown" | "issues";

const CONCERNS: Array<{ id: Concern; label: string; icon: typeof File }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "specification", label: "Specification", icon: BookOpen },
  { id: "delta", label: "Delta", icon: Diff },
  { id: "repository", label: "Repository", icon: GitBranch },
];
const PANES: Array<{ id: Pane; label: string }> = [
  { id: "files", label: "Files" },
  { id: "contracts", label: "Contracts" },
  { id: "markdown", label: "Markdown" },
  { id: "issues", label: "Issues" },
];
const DOCUMENT_LOCATIONS = {
  desired: ["PRD.md", "docs/PRD.md", ".agents/PRD.md"],
  reported: ["ARCHITECTURE.md", "docs/ARCHITECTURE.md", ".agents/ARCHITECTURE.md"],
};

type LoadedDocument = {
  path: string;
  raw: string;
  contract: Contract | null;
  error: string | null;
};

function decodeDocument(path: string, raw: string): LoadedDocument {
  try {
    return { path, raw, contract: parseContract(raw).contract, error: null };
  } catch (error) {
    return { path, raw, contract: null, error: error instanceof Error ? error.message : String(error) };
  }
}

function downloadMarkdown(name: string, contents: string) {
  const blob = new Blob([contents], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function makeObservedFiles(
  tree: Array<{ path: string; type: string }>,
  overlays: Array<{ path: string; status: string }>,
  committed: Array<{ path: string; deleted: boolean }>,
): FileEvidence[] {
  const files = new Map<string, FileEvidence>();
  for (const item of tree) {
    if (item.type === "blob") files.set(item.path, { path: item.path, type: "file" });
    if (item.type === "tree") files.set(item.path, { path: item.path, type: "dir" });
  }
  for (const item of committed) {
    if (item.deleted) files.delete(item.path);
    else files.set(item.path, { path: item.path, type: "file" });
  }
  for (const item of overlays) {
    if (item.status === "deleted") files.delete(item.path);
    else files.set(item.path, { path: item.path, type: "file" });
  }
  return [...files.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function Status({ children, tone }: { children: string; tone?: "good" | "warn" | "bad" }) {
  return <span className={`factory-status ${tone ?? ""}`}>{children}</span>;
}

export function FactoryTab({
  tab,
  updateState,
}: {
  tab: WorkbenchTab;
  updateState: (patch: Record<string, unknown>) => void;
}) {
  const workspace = useWorkspace();
  const runtime = useWorkbenchRuntime();
  const reducedMotion = useReducedMotion();
  const currentRepo = workspace.workspace;
  const [desired, setDesired] = useState<LoadedDocument | null>(null);
  const [reported, setReported] = useState<LoadedDocument | null>(null);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [registry, setRegistry] = useState<string>("requirements");
  const [selectedRecord, setSelectedRecord] = useState<string>("");
  const [editedIssueBodies, setEditedIssueBodies] = useState<Record<string, string>>({});
  const [published, setPublished] = useState<Record<string, number>>({});
  const [publishing, setPublishing] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState("");
  const concern: Concern = CONCERNS.some((item) => item.id === tab.state.concern)
    ? tab.state.concern as Concern : "specification";
  const pane: Pane = PANES.some((item) => item.id === tab.state.pane)
    ? tab.state.pane as Pane : "files";
  const changeConcern = (value: Concern) => updateState({ concern: value });
  const changePane = (value: Pane) => updateState({ pane: value });

  const observedFiles = useMemo(
    () => makeObservedFiles(currentRepo?.tree ?? [], workspace.overlays, workspace.committedFiles),
    [currentRepo, workspace.overlays, workspace.committedFiles],
  );
  const allPaths = useMemo(() => new Set(observedFiles.filter((f) => f.type === "file").map((f) => f.path)), [observedFiles]);

  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    setSelectedFile("");
    setSelectedRecord("");
    setSearch("");
    setPublished({});
    setEditedIssueBodies({});
    setDispatchError("");
  }, [currentRepo?.id]);
  useEffect(() => {
    let active = true;
    setDesired(null);
    setReported(null);
    setReadError("");
    if (!currentRepo) {
      setReading(false);
      return () => { active = false; };
    }
    setReading(true);
    const load = async (candidates: string[]): Promise<LoadedDocument | null> => {
      const path = candidates.find((candidate) => allPaths.has(candidate));
      if (!path) return null;
      const raw = await workspace.readFile(path);
      return decodeDocument(path, raw);
    };
    void Promise.all([load(DOCUMENT_LOCATIONS.desired), load(DOCUMENT_LOCATIONS.reported)])
      .then(([target, actual]) => {
        if (!active) return;
        setDesired(target);
        setReported(actual);
      })
      .catch((error) => {
        if (active) setReadError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (active) setReading(false);
      });
    return () => { active = false; };
  }, [currentRepo?.id, allPaths, workspace.readFile, reloadKey]);

  const target = desired?.contract ?? null;
  const architecture = reported?.contract ?? null;
  const declaredFiles = useMemo(() => desiredPaths(target), [target]);
  const delta = useMemo(() => calculateDiscrepancies(target, architecture, observedFiles, Boolean(currentRepo)), [target, architecture, observedFiles, currentRepo]);
  const drafts = useMemo(() => assembleIssueDrafts(delta), [delta]);
  const validation = useMemo(() => target ? validateContract(target) : [], [target]);
  const selectedDoc = concern === "repository" ? reported : desired;

  const fileList = useMemo(() => {
    if (concern === "specification") return declaredFiles;
    if (concern === "repository") return observedFiles;
    if (concern === "delta") {
      return delta.filter((item) => item.kind === "file" && item.path)
        .map((item) => ({ path: item.path as string, type: "file" as const }));
    }
    return observedFiles;
  }, [concern, declaredFiles, observedFiles, delta]);
  const filteredFiles = useMemo(
    () => fileList.filter((item) => item.path.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 450),
    [fileList, search],
  );
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
    <div className="factory-split">
      <section className="factory-list-pane" aria-label={`${concern} files`}>
        <header className="factory-pane-heading">
          <FolderTree size={14} /> <strong>{concern === "specification" ? "Desired files" : concern === "repository" ? "Repository files" : "Changed paths"}</strong>
          <span>{fileList.length}</span>
        </header>
        <div className="factory-file-list">
          {filteredFiles.length === 0 && <p className="factory-empty">No file paths are available for this projection.</p>}
          {filteredFiles.map((file) => (
            <button
              className={`factory-file-row ${selectedFile === file.path ? "selected" : ""}`}
              type="button"
              key={file.path}
              onClick={() => setSelectedFile(file.path)}
              title={file.path}
            >
              {file.type === "dir" ? <FolderTree size={14} /> : <File size={14} />}
              <span>{file.path}</span>
            </button>
          ))}
          {fileList.length > 450 && <p className="factory-caption">Showing up to 450 paths; filter by name to narrow the list.</p>}
        </div>
      </section>
      <section className="factory-inspector" aria-label="Selected file">
        {fileDetails ? (
          <>
            <div className="factory-inspector-head">
              <FileCode2 size={17} />
              <div className="factory-inspector-title"><strong>{selectedFile.split("/").at(-1)}</strong><span>{selectedFile}</span></div>
              {fileDetails.actual?.type === "file" && (
                <Button size="sm" variant="outline" onClick={() => openEditor(selectedFile)}>
                  Open source <ExternalLink size={13} />
                </Button>
              )}
            </div>
            <dl className="factory-properties">
              <dt>Desired</dt><dd>{fileDetails.declared ? fileDetails.declared.type : "Not declared"}</dd>
              <dt>Observed</dt><dd>{fileDetails.actual ? fileDetails.actual.type : "Not found"}</dd>
              <dt>Evidence</dt><dd>{fileDetails.changes.map((change) => change.status).join(", ") || "No confirmed discrepancy"}</dd>
            </dl>
            {fileDetails.changes.map((item) => (
              <div className="factory-finding" key={item.id}>
                <Status tone={item.status === "missing" ? "bad" : "warn"}>{item.status}</Status>
                <p>{item.explanation}</p>
              </div>
            ))}
            {fileDetails.declared?.content !== undefined && (
              <>
                <h3>Exact desired contents</h3>
                <pre className="factory-code">{fileDetails.declared.content}</pre>
              </>
            )}
            {fileDetails.actual && fileDetails.declared?.content !== undefined && (
              <p className="factory-caption">Content equality remains unverified until the source is fetched. Path presence alone does not prove implementation.</p>
            )}
          </>
        ) : (
          <div className="factory-no-selection"><FileText size={24} /><strong>Select a file</strong><p>Inspect its declared state and its observed repository evidence.</p></div>
        )}
      </section>
    </div>
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
          {selectedDoc.contract && <Button size="sm" variant="outline" onClick={() => downloadMarkdown("compiled-" + selectedDoc.path.split("/").at(-1), compileContract(selectedDoc.contract, parseContract(selectedDoc.raw).prose))}>
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
            {published[draft.id] ? <Status tone="good">Published #{published[draft.id]}</Status> : <Status>Draft</Status>}
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
      <header className="factory-header">
        <div className="factory-project">
          <strong>{displayTitle}</strong>
          <span>{currentRepo.ref} · {currentRepo.baseSha.slice(0, 7)}</span>
        </div>
        <div className="factory-header-actions">
          {reading && <span className="factory-caption">Reading documents…</span>}
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="factory-icon-button" type="button" onClick={() => setReloadKey((key) => key + 1)} aria-label="Reload specification"><RefreshCw size={15}/></button>
            </TooltipTrigger>
            <TooltipContent>Reload project documents</TooltipContent>
          </Tooltip>
        </div>
      </header>
      <nav className="factory-concerns" aria-label="Factory views">
        {CONCERNS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" aria-current={concern === id ? "page" : undefined}
            className={`factory-concern ${concern === id ? "active" : ""}`} onClick={() => changeConcern(id)}>
            <Icon size={15}/> <span>{label}</span>
          </button>
        ))}
      </nav>
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
      <footer className="factory-footer">
        <span>{desired?.error ? "PRD format error" : desired ? "Specification discovered" : "No target specification"}</span>
        <span>{delta.length} discrepancies · {drafts.length} issue drafts</span>
      </footer>
    </div>
  );
}
