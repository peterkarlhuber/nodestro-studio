import {
  Background,
  BackgroundVariant,
  type Connection,
  type Edge,
  type EdgeChange,
  type FinalConnectionState,
  type IsValidConnection,
  MiniMap,
  type Node,
  type NodeChange,
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
  useReactFlow,
  useViewport,
} from "@xyflow/react";
import { LayoutGrid, Maximize, Minus, Plus, Redo2, Undo2 } from "lucide-react";
import { type DragEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

import type { AgentConfig, NodeType } from "../api/types";
import { IconButton } from "../components/ui";
import { toast } from "../components/toast";
import { formatNumber } from "../lib/format";
import { motionDuration } from "../lib/motion";
import { useAppTheme } from "../lib/theme";
import { childLink, parseTrail } from "../lib/trail";
import { useFlowAriaLabels } from "./flowA11y";
import { useEditorLayout } from "./layout";
import { type FlowNodeData, nodeTypes } from "./nodes";
import { nodeName } from "./NodeConnections";
import { type TeamPreset, connectionProblem, useEditor } from "./store";
import { removeWithUndo } from "./actions";
import { NEW_NODE, openingViewport, registerCanvasView } from "./viewport";
import { branchLabel, isBranchTaken } from "./branches";

export const DRAG_TYPE = "application/x-nodestro-node";

export interface DragPayload {
  type: NodeType;
  agent?: Partial<AgentConfig>;
  team?: TeamPreset;
}

const NODE_TYPES: ReadonlySet<string> = new Set<NodeType>(["start", "agent", "output", "condition", "approval", "subworkflow", "orchestrator"]);

/**
 * Reads what was dropped on the canvas. Anything that is not a building block from the palette
 * (other pages, other applications, broken data) gives ``null`` instead of an exception.
 */
export function parseDragPayload(raw: string): DragPayload | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { type, agent, team } = value as { type?: unknown; agent?: unknown; team?: unknown };
  if (typeof type !== "string" || !NODE_TYPES.has(type)) return null;
  if (agent !== undefined && (agent === null || typeof agent !== "object" || Array.isArray(agent))) return null;
  const preset = team as { workflow_id?: unknown; name?: unknown } | undefined;
  const validTeam =
    type === "subworkflow" &&
    preset !== undefined &&
    preset !== null &&
    typeof preset.workflow_id === "string" &&
    typeof preset.name === "string";
  return {
    type: type as NodeType,
    agent: type === "agent" ? (agent as Partial<AgentConfig> | undefined) : undefined,
    team: validTeam ? { workflow_id: preset.workflow_id as string, name: preset.name as string } : undefined,
  };
}

export interface CanvasIssues {
  /** Number of errors per node. */
  nodes: Record<string, number>;
  /** Number of warnings per node (they do not block the start). */
  warnings?: Record<string, number>;
  /** The workflow cannot start for a reason outside any node (e.g. a provider without a key). */
  blocked?: boolean;
  /** Connections with a problem from the workflow check. */
  edges: Record<string, "error" | "warning">;
}

/** Whether a key press belongs to a text field, an editor or a dialog rather than the canvas. */
export function typingIn(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element || typeof element.closest !== "function") return false;
  return Boolean(
    element.closest("input, textarea, select, .cm-editor, [contenteditable], dialog") || element.isContentEditable,
  );
}

const MULTI_SELECT_KEYS = ["Shift", "Meta", "Control"];

function CanvasInner({ issues }: { issues: CanvasIssues }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nodes = useEditor((s) => s.nodes);
  const edges = useEditor((s) => s.edges);
  const selectedId = useEditor((s) => s.selectedId);
  const selectedIds = useEditor((s) => s.selectedIds);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const workflowId = useEditor((s) => s.workflowId);
  const selectedEdgeId = useEditor((s) => s.selectedEdgeId);
  const run = useEditor((s) => s.run);
  const dirty = useEditor((s) => s.dirty);
  const { moveNodes, removeEdges, connect, select, setSelection, selectEdge, addNode, undo, redo, autoLayout, duplicateNodes } =
    useEditor.getState();
  const flow = useReactFlow();
  const { zoom } = useViewport();
  /** When the last node selection came in (see onEdgesChange). */
  const nodeSelection = useRef(0);
  const theme = useAppTheme();
  const ariaLabelConfig = useFlowAriaLabels();
  // Measured node sizes: the store keeps the workflow, React Flow needs the sizes (minimap, fit view).
  const [sizes, setSizes] = useState<Record<string, { width: number; height: number }>>({});

  const flowNodes: Node[] = useMemo(
    () =>
      nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        selected: selectedIds.includes(node.id),
        measured: sizes[node.id],
        // Screen readers announce the step by name and kind ("Writer (Agent)"), with its run status if any.
        ariaLabel: [nodeName(node, t), run?.nodes[node.id] ? t(`status.${run.nodes[node.id].status}.label`) : ""]
          .filter(Boolean)
          .join(", "),
        data: {
          node,
          state: run?.nodes[node.id],
          issues: issues.nodes[node.id] ?? 0,
          warnings: issues.warnings?.[node.id] ?? 0,
          blocked: issues.blocked ?? false,
        } satisfies FlowNodeData,
      })),
    [nodes, selectedIds, run, issues, sizes, t],
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      edges.map((edge) => {
        const source = run?.nodes[edge.source]?.status;
        const target = run?.nodes[edge.target]?.status;
        const from = nodes.find((node) => node.id === edge.source);
        // A branch that was not taken carries nothing, even though its decision node succeeded.
        const taken = !edge.source_handle || isBranchTaken(run?.nodes[edge.source], edge.source_handle);
        const flowing = taken && source === "succeeded" && (target === "running" || target === "succeeded");
        const touchesSelection = selectedId !== null && (edge.source === selectedId || edge.target === selectedId);
        const selected = edge.id === selectedEdgeId;
        const problem = issues.edges[edge.id];
        const classes = [
          flowing || touchesSelection ? "edge--active" : "",
          selected ? "edge--selected" : "",
          problem ? `edge--${problem}` : "",
          edge.loop ? "edge--loop" : "",
        ].filter(Boolean);
        const branch = from && edge.source_handle ? branchLabel(from, edge.source_handle, t) : undefined;
        const loop = edge.loop ? t("editor.loop.edgeLabel", { max: edge.loop.max_iterations }) : undefined;
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.source_handle ?? undefined,
          label: [branch, loop].filter(Boolean).join(" · ") || undefined,
          selected,
          className: classes.join(" ") || undefined,
          animated: target === "running" && source === "succeeded",
          interactionWidth: 24,
          // Out of the Tab order, so Tab reaches the steps first (React Flow renders connections before them);
          // the inspector of a step lists its connections and selects them from the keyboard.
          domAttributes: { tabIndex: -1 },
          ariaLabel: t("editor.canvas.edgeLabel", {
            source: nodes.find((node) => node.id === edge.source)?.label ?? "",
            target: nodes.find((node) => node.id === edge.target)?.label ?? "",
          }),
        };
      }),
    [edges, nodes, run, selectedId, selectedEdgeId, issues, t],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const positions: Record<string, { x: number; y: number }> = {};
      let finished = false;
      const removed: string[] = [];
      const measured: Record<string, { width: number; height: number }> = {};
      // Selection changes (click, Shift/Ctrl click, selection box) apply to the current set of selected nodes.
      const picked = new Set(useEditor.getState().selectedIds);
      let selecting = false;
      for (const change of changes) {
        if (change.type === "dimensions" && change.dimensions) measured[change.id] = change.dimensions;
        if (change.type === "position" && change.position) {
          positions[change.id] = change.position;
          if (change.dragging === false) finished = true;
        } else if (change.type === "position" && change.dragging === false) {
          finished = true;
        } else if (change.type === "select") {
          selecting = true;
          if (change.selected) picked.add(change.id);
          else picked.delete(change.id);
        } else if (change.type === "remove") {
          removed.push(change.id);
        }
      }
      if (Object.keys(positions).length || finished) moveNodes(positions, finished);
      if (removed.length) removeWithUndo(removed);
      if (selecting) {
        setSelection([...picked]);
        nodeSelection.current = performance.now();
      }
      if (Object.keys(measured).length) setSizes((current) => ({ ...current, ...measured }));
    },
    [moveNodes, setSelection],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const removed = changes.filter((change) => change.type === "remove").map((change) => change.id);
      if (removed.length) removeEdges(removed);
      // A selection box also selects the connections between the boxed nodes; the nodes stay the selection then.
      const boxed = performance.now() - nodeSelection.current < 100;
      const picked = changes.find((change) => change.type === "select" && change.selected);
      if (picked && picked.type === "select" && !boxed) selectEdge(picked.id);
    },
    [removeEdges, selectEdge],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const problem = connect(connection.source, connection.target, connection.sourceHandle);
      if (problem) toast.info(t(problem));
    },
    [connect, t],
  );

  // While a connection is dragged, only targets it can really connect to light up (the same rules as connect()).
  const isValidConnection = useCallback<IsValidConnection>((connection) => {
    if (!connection.source || !connection.target) return false;
    const { nodes: current, edges: links } = useEditor.getState();
    return connectionProblem(current, links, connection.source, connection.target, connection.sourceHandle ?? null) === null;
  }, []);

  // Dropped on a node it cannot connect to: say why, instead of silently doing nothing.
  const onConnectEnd = useCallback(
    (_event: MouseEvent | TouchEvent, state: FinalConnectionState) => {
      if (state.isValid !== false || !state.fromNode || !state.toNode) return;
      const { nodes: current, edges: links } = useEditor.getState();
      const outgoing = state.fromHandle?.type !== "target";
      const source = outgoing ? state.fromNode.id : state.toNode.id;
      const target = outgoing ? state.toNode.id : state.fromNode.id;
      const handle = outgoing ? state.fromHandle?.id : state.toHandle?.id;
      const problem = connectionProblem(current, links, source, target, handle ?? null);
      if (problem) toast.info(t(problem));
    },
    [t],
  );

  // A large workflow opens readable: fitted when that stays readable, otherwise at a readable zoom from the start.
  const initialized = useNodesInitialized();
  const opened = useRef<string | null>(null);
  const paneRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!initialized || !workflowId || opened.current === workflowId) return;
    opened.current = workflowId;
    void Promise.resolve(flow.fitView({ padding: 0.12, maxZoom: 1.1 })).then(() => {
      const pane = paneRef.current?.getBoundingClientRect();
      if (!pane) return;
      const placed = flow.getNodes().map((node) => ({ type: node.type ?? "", position: node.position, height: node.measured?.height }));
      const next = openingViewport(flow.getViewport(), placed, pane);
      if (next !== flow.getViewport()) void flow.setViewport(next);
    });
  }, [initialized, workflowId, flow]);

  // The palette and the title actions add nodes where the user looks (see viewport.ts).
  useEffect(() => {
    registerCanvasView({
      visible: () => {
        const pane = paneRef.current?.getBoundingClientRect();
        if (!pane || !pane.width) return null;
        const topLeft = flow.screenToFlowPosition({ x: pane.left, y: pane.top });
        const bottomRight = flow.screenToFlowPosition({ x: pane.right, y: pane.bottom });
        return { x: topLeft.x, y: topLeft.y, width: bottomRight.x - topLeft.x, height: bottomRight.y - topLeft.y };
      },
      reveal: (_id, position) =>
        void flow.setCenter(position.x + NEW_NODE.width / 2, position.y + NEW_NODE.height / 2, {
          zoom: flow.getZoom(),
          duration: motionDuration(200),
        }),
    });
    return () => registerCanvasView(null);
  }, [flow]);

  const onDragOver = useCallback((event: DragEvent) => {
    // Always prevent the default: a file dropped by mistake would otherwise replace the page
    // (and lose unsaved changes). Only building blocks from the palette show a drop cursor.
    event.preventDefault();
    event.dataTransfer.dropEffect = event.dataTransfer.types.includes(DRAG_TYPE) ? "move" : "none";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      if (!event.dataTransfer.types.includes(DRAG_TYPE)) return;
      const payload = parseDragPayload(event.dataTransfer.getData(DRAG_TYPE));
      if (!payload) {
        toast.info(t("editor.canvas.dropInvalid"));
        return;
      }
      // The pointer in canvas coordinates, then half a node back: correct at every zoom level,
      // pan position and panel size, because the conversion happens before the offset.
      const point = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNode(
        payload.type,
        { x: Math.round(point.x - NEW_NODE.width / 2), y: Math.round(point.y - NEW_NODE.height / 2) },
        payload.agent,
        payload.team,
      );
    },
    [flow, addNode, t],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // Keys in text fields, code editors and dialogs belong to them, never to the canvas.
      if (typingIn(event.target) || typingIn(document.activeElement)) return;
      const mod = event.metaKey || event.ctrlKey;
      if ((event.key === "Delete" || event.key === "Backspace") && !mod && !event.altKey) {
        const { selectedEdgeId: edgeId, selectedId: nodeId } = useEditor.getState();
        const nodeIds = useEditor.getState().selectedIds;
        if (edgeId) {
          event.preventDefault();
          removeEdges([edgeId]);
        } else if (nodeIds.length || nodeId) {
          event.preventDefault();
          removeWithUndo(nodeIds.length ? nodeIds : [nodeId as string]);
        }
        return;
      }
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      } else if (mod && event.key.toLowerCase() === "d") {
        const ids = useEditor.getState().selectedIds;
        if (ids.length) {
          event.preventDefault();
          duplicateNodes(ids);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, duplicateNodes, removeEdges]);

  const agents = nodes.filter((node) => node.type === "agent").length;

  return (
    <div className="canvas nd-workflow-canvas" onDragOver={onDragOver} onDrop={onDrop} ref={paneRef}>
      <div className="canvas-status" data-dirty={dirty || undefined}>
        {dirty ? t("editor.canvas.unsaved") : t("common.saved")} · {t("editor.canvas.agents", { count: agents })} ·{" "}
        {t("editor.canvas.connections", { count: edges.length })}
      </div>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onConnectEnd={onConnectEnd}
        // Shift or Ctrl/Cmd click adds a node to the selection; Shift-drag on the background draws a selection box.
        multiSelectionKeyCode={MULTI_SELECT_KEYS}
        onEdgeClick={(_event, edge) => selectEdge(edge.id)}
        // A double-click on a node shows its properties, also when the inspector is collapsed.
        // On a sub-workflow (a team) it opens that workflow, with the way back in the breadcrumbs.
        onNodeDoubleClick={(_event, node) => {
          const state = useEditor.getState();
          const target = state.nodes.find((item) => item.id === node.id)?.subworkflow?.workflow_id;
          if (target && state.workflowId && target !== state.workflowId) {
            navigate(childLink(parseTrail(searchParams.get("trail"), state.workflowId), state.workflowId, target));
            return;
          }
          select(node.id);
          useEditorLayout.getState().setOpen("inspector", true);
        }}
        zoomOnDoubleClick={false}
        onPaneClick={() => select(null)}
        // Deleting is handled above, so it never fires while a text field has the focus.
        deleteKeyCode={null}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        colorMode={theme}
        ariaLabelConfig={ariaLabelConfig}
        defaultEdgeOptions={{ type: "default" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--nd-grid)" />
        <MiniMap
          pannable
          zoomable
          className="minimap"
          position="top-right"
          nodeColor="var(--nd-surface-raised)"
          nodeStrokeColor="var(--nd-border-strong)"
          nodeBorderRadius={6}
          maskColor="color-mix(in srgb, var(--nd-bg) 55%, transparent)"
          ariaLabel={t("editor.canvas.minimap")}
        />
      </ReactFlow>
      <div className="floortools">
        <div className="floatbox floatbox--group">
          <IconButton icon={Minus} label={t("editor.canvas.zoomOut")} onClick={() => flow.zoomOut()} />
          <span className="zoom-label">{formatNumber(zoom, { style: "percent", maximumFractionDigits: 0 })}</span>
          <IconButton icon={Plus} label={t("editor.canvas.zoomIn")} onClick={() => flow.zoomIn()} />
        </div>
        <div className="floatbox floatbox--group">
          <IconButton icon={Maximize} label={t("editor.canvas.fitView")} onClick={() => flow.fitView({ padding: 0.25, duration: motionDuration(200) })} />
          <IconButton
            icon={LayoutGrid}
            label={t("editor.canvas.autoLayout")}
            onClick={() => {
              autoLayout();
              window.setTimeout(() => flow.fitView({ padding: 0.25, duration: motionDuration(200) }), 30);
            }}
          />
        </div>
        <div className="floatbox floatbox--group">
          <IconButton icon={Undo2} label={t("editor.canvas.undo")} onClick={undo} disabled={!canUndo} />
          <IconButton icon={Redo2} label={t("editor.canvas.redo")} onClick={redo} disabled={!canRedo} />
        </div>
      </div>
    </div>
  );
}

export function Canvas({ issues }: { issues: CanvasIssues }) {
  return (
    <ReactFlowProvider>
      <CanvasInner issues={issues} />
    </ReactFlowProvider>
  );
}
