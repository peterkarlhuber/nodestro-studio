import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, History, Play, Plug, Plus, RotateCcw, Save, Sparkles } from "lucide-react";
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useBlocker, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { api } from "../api/client";
import { type ArchitectStart, ArchitectDialog } from "../architect/ArchitectDialog";
import { DiscussButton } from "../assistant/DiscussButton";
import { useTakeHandover } from "../assistant/handover";
import type { ContextOffer } from "../assistant/store";
import { useContextOffer } from "../assistant/useContextOffer";
import { keys, useWorkflows } from "../api/hooks";
import type { ArchitectJob, Run, Workflow } from "../api/types";
import { toast } from "../components/toast";
import { Button, Callout, DocLink, Hint, Modal, Spinner } from "../components/ui";
import { Canvas, type CanvasIssues } from "../editor/Canvas";
import { DesignAgentDialog } from "../editor/DesignAgentDialog";
import { Inspector } from "../editor/Inspector";
import { useEditorLayout } from "../editor/layout";
import { Palette } from "../editor/Palette";
import { RunDialog } from "../editor/RunDialog";
import { PANEL_VARIABLE, PanelSplitter } from "../editor/PanelSplitter";
import { RunPanel } from "../editor/RunPanel";
import { useEditor } from "../editor/store";
import { useRunStream } from "../editor/useRunStream";
import { VersionsDialog } from "../editor/VersionsDialog";
import { ErrorText, problemText } from "../lib/errors";
import { useDocumentTitle } from "../lib/documentTitle";
import { crumbLink, parseTrail } from "../lib/trail";
import { ApiDialog } from "../publish/ApiDialog";
import { findings } from "../editor/CheckList";

function useDebouncedGraph() {
  const nodes = useEditor((s) => s.nodes);
  const edges = useEditor((s) => s.edges);
  const [graph, setGraph] = useState({ nodes, edges });
  useEffect(() => {
    // A freshly loaded workflow is checked at once; edits are debounced.
    const delay = graph.nodes.length === 0 && nodes.length > 0 ? 0 : 500;
    const timer = window.setTimeout(() => setGraph({ nodes, edges }), delay);
    return () => window.clearTimeout(timer);
  }, [nodes, edges, graph.nodes.length]);
  return graph;
}

export function EditorPage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const workflow = useQuery({ queryKey: keys.workflow(id), queryFn: () => api.workflow(id), refetchOnWindowFocus: false });
  const loadedId = useEditor((s) => s.workflowId);
  const name = useEditor((s) => s.name);
  const dirty = useEditor((s) => s.dirty);
  const run = useEditor((s) => s.run);
  useDocumentTitle(loadedId === id ? name || workflow.data?.name : workflow.data?.name);
  const [runOpen, setRunOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [architectOpen, setArchitectOpen] = useState(false);
  const [architectStart, setArchitectStart] = useState<ArchitectStart | undefined>(undefined);
  const [designInitial, setDesignInitial] = useState("");
  const navigate = useNavigate();
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [apiOpen, setApiOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const layout = useEditorLayout();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const paletteRef = useRef<HTMLElement | null>(null);
  const inspectorRef = useRef<HTMLElement | null>(null);
  const runPanelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (workflow.data && loadedId !== workflow.data.id) useEditor.getState().load(workflow.data);
  }, [workflow.data, loadedId]);

  // Leaving the editor drops everything unsaved, including the undo/redo history, so reopening
  // a workflow always starts from its last saved state.
  useEffect(() => () => useEditor.getState().reset(), []);

  // ?node=<id> (from the global search) selects that node once the workflow is loaded.
  const focusNode = searchParams.get("node");
  // The workflows above this one when it was opened from a team node (outermost first).
  const trail = parseTrail(searchParams.get("trail"), id);
  const workflows = useWorkflows();
  useEffect(() => {
    if (!focusNode || loadedId !== id) return;
    if (useEditor.getState().nodes.some((node) => node.id === focusNode)) useEditor.getState().select(focusNode);
    setSearchParams({}, { replace: true });
  }, [focusNode, loadedId, id, setSearchParams]);

  // The open workflow is only offered to the assistant; the user decides whether it is sent.
  const offer: ContextOffer | null =
    loadedId === id && workflow.data
      ? { kind: "workflow", refId: id, label: name || workflow.data.name, dirty, draft: () => useEditor.getState().toWorkflow() }
      : null;
  useContextOffer("editor", offer);

  // A proposal from the assistant fills in the architect or the agent designer; the user starts it.
  useTakeHandover(
    (handover) =>
      loadedId === id &&
      handover.workflow_id === id &&
      ((handover.target === "workflow_architect" && handover.mode === "revise") || handover.target === "agent_designer"),
    (handover) => {
      if (handover.target === "agent_designer") {
        setDesignInitial(handover.instruction);
        setDesignOpen(true);
      } else {
        setArchitectStart({ mode: "revise", description: handover.instruction });
        setArchitectOpen(true);
      }
    },
  );

  /** Throw away every unsaved change and load the last saved state from the server. */
  const discard = async () => {
    useEditor.getState().reset();
    queryClient.removeQueries({ queryKey: keys.workflow(id) });
    const saved = await queryClient.fetchQuery({ queryKey: keys.workflow(id), queryFn: () => api.workflow(id) });
    useEditor.getState().load(saved);
  };

  const onRestored = (restored: Workflow) => {
    queryClient.setQueryData(keys.workflow(restored.id), restored);
    void queryClient.invalidateQueries({ queryKey: keys.workflows });
    useEditor.getState().load(restored);
  };

  // Show the latest run of this workflow; follow it live if it is still running.
  useEffect(() => {
    if (!workflow.data) return;
    let cancelled = false;
    api
      .runs(workflow.data.id)
      .then(async (runs) => {
        const latest = runs.find((item) => !item.imported_at);
        if (!latest || cancelled) return;
        const full = await api.run(latest.id);
        if (!cancelled && !useEditor.getState().run) useEditor.getState().setRun(full);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [workflow.data]);

  const liveRunId = run && (run.status === "running" || run.status === "queued") ? run.id : null;
  useRunStream(liveRunId);

  const graph = useDebouncedGraph();
  const check = useQuery({
    queryKey: ["check", graph],
    queryFn: () => api.checkWorkflow({ ...useEditor.getState().toWorkflow(), ...graph }, id),
    enabled: loadedId === id && graph.nodes.length > 0,
    staleTime: 30_000,
  });
  const issues = useMemo<CanvasIssues>(() => {
    const result: CanvasIssues = { nodes: {}, edges: {} };
    for (const finding of findings(check.data)) {
      if (finding.edgeId) {
        if (finding.level !== "info" && result.edges[finding.edgeId] !== "error") result.edges[finding.edgeId] = finding.level;
      } else if (finding.nodeId && finding.level === "error") {
        result.nodes[finding.nodeId] = (result.nodes[finding.nodeId] ?? 0) + 1;
      }
    }
    return result;
  }, [check.data]);
  const blocked = Boolean(check.data && !check.data.ok);

  // One save at a time: Ctrl+S during a running save (or a double click) sends no second request.
  const pendingSave = useRef<Promise<string | null> | null>(null);
  const save = useCallback(
    (note?: string): Promise<string | null> => {
      pendingSave.current ??= (async () => {
        const state = useEditor.getState();
        if (!state.workflowId) return null;
        setSaving(true);
        try {
          const sent = state.toWorkflow();
          const saved = await api.saveWorkflow(state.workflowId, sent, note ?? state.pendingNote ?? undefined);
          useEditor.getState().markSaved(saved, sent);
          queryClient.setQueryData(keys.workflow(saved.id), saved);
          void queryClient.invalidateQueries({ queryKey: keys.workflows });
          void queryClient.invalidateQueries({ queryKey: keys.versions(saved.id) });
          return saved.id;
        } catch (error) {
          toast.error(error);
          return null;
        } finally {
          setSaving(false);
        }
      })().finally(() => {
        pendingSave.current = null;
      });
      return pendingSave.current;
    },
    [queryClient],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save().then((saved) => saved && toast.success(t("common.saved")));
      }
    };
    const onUnload = (event: BeforeUnloadEvent) => {
      if (useEditor.getState().dirty) event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [save, t]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);

  const exportWorkflow = async () => {
    // The Python libraries travel with the workflow (exact versions, never the approvals).
    const python = id ? await api.workflowDependencyExport(id).catch(() => null) : null;
    const data = { ...useEditor.getState().toWorkflow(), ...(python ? { python } : {}) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    // Letters of every script stay in the file name (e.g. "Übersicht"), only separators become "_".
    link.download = `${data.name.replace(/[^\p{L}\p{N}_-]+/gu, "_") || "workflow"}.nodestro.json`;
    link.click();
    // Some browsers read the object URL only after the click has returned.
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  /** Take a reviewed revision: optionally save the current state first, then one undoable step. */
  const applyRevision = async (job: ArchitectJob, saveFirst: boolean): Promise<boolean> => {
    if (!job.draft) return false;
    if (saveFirst && useEditor.getState().dirty) {
      const saved = await save(t("architect.apply.beforeNote"));
      if (!saved) return false;
    }
    useEditor.getState().applyDraft(job.draft, t("architect.apply.versionNote", { text: job.description.slice(0, 150) }));
    toast.success(t("architect.apply.done"));
    return true;
  };

  const onStarted = (started: Run) => {
    useEditor.getState().setRun(started);
    toast.info(t("editor.page.started"));
  };

  if (workflow.isLoading) return <Spinner />;
  if (workflow.error)
    return (
      <div className="page">
        <Callout tone="danger">
          <ErrorText error={workflow.error} />
        </Callout>
      </div>
    );

  const panelSizes = {
    [PANEL_VARIABLE.palette]: `${layout.size.palette}px`,
    [PANEL_VARIABLE.inspector]: `${layout.size.inspector}px`,
    [PANEL_VARIABLE.runPanel]: `${layout.size.runPanel}px`,
  } as CSSProperties;
  const panelClasses = [
    "editor",
    layout.open.palette ? "" : "editor--palette-collapsed",
    layout.open.inspector ? "" : "editor--inspector-collapsed",
    layout.open.runPanel ? "" : "editor--run-collapsed",
  ].filter(Boolean);

  return (
    <div className={panelClasses.join(" ")} ref={editorRef} style={panelSizes}>
      <div className="editor__main">
        <header className="titlebar">
          <div className="titlebar__heading">
            <h1 className="titlebar__title">
              {name || t("editor.inspector.workflowTitle")}
              <DocLink to="workflows#editor" label={t("editor.page.docs")} />
            </h1>
            <div className="breadcrumbs">
              <Link to="/">{t("nav.workflows")}</Link> /{" "}
              {trail.map((parent, index) => (
                <span key={parent}>
                  <Link to={crumbLink(trail, index)} data-testid="breadcrumb-parent">
                    {workflows.data?.find((item) => item.id === parent)?.name ?? parent}
                  </Link>{" "}
                  /{" "}
                </span>
              ))}
              <span>{name}</span> / {t("editor.page.breadcrumb")}
            </div>
          </div>
          <div className="title-actions">
            <DiscussButton offer={offer} />
            {dirty ? (
              <Hint id="workflow.discard">
                <Button icon={RotateCcw} variant="ghost" onClick={() => setDiscardOpen(true)}>
                  <span className="title-actions__label">{t("common.discard")}</span>
                </Button>
              </Hint>
            ) : null}
            <Hint id="architect.open">
              <Button
                icon={Sparkles}
                variant="ghost"
                onClick={() => {
                  setArchitectStart(undefined);
                  setArchitectOpen(true);
                }}
                data-testid="open-architect"
              >
                <span className="title-actions__label">{t("architect.button")}</span>
              </Button>
            </Hint>
            <Hint id="workflow.versions">
              <Button icon={History} variant="ghost" onClick={() => setVersionsOpen(true)}>
                <span className="title-actions__label">{t("versions.button")}</span>
              </Button>
            </Hint>
            <Hint id="publish.open">
              <Button icon={Plug} variant="ghost" onClick={() => setApiOpen(true)} data-testid="open-api">
                <span className="title-actions__label">{t("publish.button")}</span>
              </Button>
            </Hint>
            <Hint id="workflow.export">
              <Button icon={Download} variant="ghost" onClick={() => void exportWorkflow()}>
                <span className="title-actions__label">{t("common.export")}</span>
              </Button>
            </Hint>
            <Hint id="workflow.save">
              <Button icon={Save} busy={saving} disabled={!dirty} onClick={() => void save().then((ok) => ok && toast.success(t("common.saved")))}>
                {t("common.save")}
              </Button>
            </Hint>
            <Hint id="workflow.addAgent">
              <Button
                icon={Plus}
                onClick={() => {
                  const nodes = useEditor.getState().nodes;
                  const x = nodes.length ? Math.max(...nodes.map((n) => n.position.x)) + 320 : 0;
                  useEditor.getState().addNode("agent", { x, y: 0 });
                }}
              >
                {t("editor.page.addAgent")}
              </Button>
            </Hint>
            <Button
              variant="primary"
              icon={Play}
              disabled={Boolean(liveRunId) || blocked}
              title={
                blocked
                  ? findings(check.data)
                      .filter((finding) => finding.level === "error")
                      .map((finding) => problemText(t, finding.item))
                      .join("\n")
                  : undefined
              }
              onClick={() => setRunOpen(true)}
            >
              {t("editor.run.title")}
            </Button>
          </div>
        </header>
        <div className="editor__workspace">
          <Palette
            panelRef={paletteRef}
            onDesign={() => {
              setDesignInitial("");
              setDesignOpen(true);
            }}
          />
          {layout.open.palette ? (
            <PanelSplitter
              panel="palette"
              controls="editor-palette"
              label={t("editor.panels.resizePalette")}
              host={editorRef}
              target={paletteRef}
              canvas={canvasRef}
            />
          ) : null}
          <div className="editor__canvas" ref={canvasRef}>
            <Canvas issues={issues} />
          </div>
        </div>
        {/* Before the first run the overview only shows its figures, so there is nothing to resize. */}
        {layout.open.runPanel && run ? (
          <PanelSplitter
            panel="runPanel"
            controls="editor-run-panel"
            label={t("editor.panels.resizeRunPanel")}
            host={editorRef}
            target={runPanelRef}
            canvas={canvasRef}
          />
        ) : null}
        <RunPanel panelRef={runPanelRef} />
      </div>
      {layout.open.inspector ? (
        <PanelSplitter
          panel="inspector"
          controls="editor-inspector"
          label={t("editor.panels.resizeInspector")}
          host={editorRef}
          target={inspectorRef}
          canvas={canvasRef}
        />
      ) : null}
      <Inspector check={check.data} panelRef={inspectorRef} />
      <RunDialog open={runOpen} onClose={() => setRunOpen(false)} onStarted={onStarted} save={save} check={check.data} />
      <ApiDialog open={apiOpen} onClose={() => setApiOpen(false)} workflowId={id} dirty={dirty} save={save} />
      <VersionsDialog open={versionsOpen} onClose={() => setVersionsOpen(false)} save={save} onRestored={onRestored} />
      <Modal
        title={t("editor.page.discardTitle")}
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDiscardOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              icon={RotateCcw}
              onClick={() => {
                setDiscardOpen(false);
                void discard().catch((error) => toast.error(error));
              }}
            >
              {t("common.discard")}
            </Button>
          </>
        }
      >
        <p>{t("editor.page.discardText")}</p>
      </Modal>
      <ArchitectDialog
        open={architectOpen}
        onClose={() => setArchitectOpen(false)}
        modes={["revise", "create"]}
        start={architectStart}
        current={() => {
          const state = useEditor.getState();
          return { workflow: state.toWorkflow(), workflowId: id, dirty: state.dirty };
        }}
        onCreated={(created) => navigate(`/workflows/${created}`)}
        onRevision={applyRevision}
      />
      <DesignAgentDialog
        open={designOpen}
        onClose={() => setDesignOpen(false)}
        initial={designInitial}
        onApply={(config) => {
          const nodes = useEditor.getState().nodes;
          const x = nodes.length ? Math.max(...nodes.map((n) => n.position.x)) + 320 : 0;
          useEditor.getState().addNode("agent", { x, y: 0 }, config);
        }}
      />
      <Modal
        title={t("editor.canvas.unsaved")}
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                useEditor.getState().reset();
                queryClient.removeQueries({ queryKey: keys.workflow(id) });
                blocker.proceed?.();
              }}
            >
              {t("common.discard")}
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                void save().then((saved) => {
                  if (saved) blocker.proceed?.();
                })
              }
            >
              {t("editor.page.saveAndContinue")}
            </Button>
          </>
        }
      >
        <p>{t("editor.page.unsavedText")}</p>
      </Modal>
    </div>
  );
}
