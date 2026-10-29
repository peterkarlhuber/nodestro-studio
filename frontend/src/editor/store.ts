// The editor's state: the open workflow, the selection, undo history and the live run.

import { create } from "zustand";

import type {
  AgentConfig,
  NodeRun,
  NodeType,
  Run,
  RunEvent,
  ToolCallRecord,
  Usage,
  Workflow,
  WorkflowEdge,
  WorkflowIn,
  WorkflowNode,
} from "../api/types";
import i18n from "../i18n";
import { newId, newNode } from "../lib/defaults";

interface Snapshot {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  /** The version note that belongs to this state (from a taken architect draft). */
  pendingNote: string | null;
}

const HISTORY_LIMIT = 80;

export interface EditorState {
  workflowId: string | null;
  name: string;
  description: string;
  budget: number | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedId: string | null;
  /** The selected connection (clicked on the canvas); Delete/Backspace removes it. */
  selectedEdgeId: string | null;
  dirty: boolean;
  past: Snapshot[];
  future: Snapshot[];
  run: Run | null;
  /** The version note of the next save, e.g. after taking a revision of the Workflow Architect. */
  pendingNote: string | null;

  load: (workflow: Workflow) => void;
  /** Forget the open workflow, its unsaved changes and its undo history (leaving with "Discard"). */
  reset: () => void;
  toWorkflow: () => WorkflowIn;
  markSaved: (workflow: Workflow) => void;
  setMeta: (patch: Partial<Pick<EditorState, "name" | "description" | "budget">>) => void;

  addNode: (type: NodeType, position: { x: number; y: number }, agent?: Partial<AgentConfig>) => WorkflowNode;
  updateNode: (id: string, patch: Partial<WorkflowNode>, options?: { record?: boolean }) => void;
  updateAgent: (id: string, patch: Partial<AgentConfig>) => void;
  replaceAgent: (id: string, agent: AgentConfig) => void;
  moveNodes: (positions: Record<string, { x: number; y: number }>, record: boolean) => void;
  /** Take the agents and connections of a reviewed draft as one undoable step (not saved yet). */
  applyDraft: (draft: Pick<WorkflowIn, "nodes" | "edges">, note: string) => void;
  removeNodes: (ids: string[]) => void;
  duplicateNode: (id: string) => void;
  /** Connects two nodes; returns the translation key of the reason if that is not possible. */
  connect: (source: string, target: string, handle?: string | null) => string | null;
  removeEdges: (ids: string[]) => void;
  select: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  autoLayout: () => void;
  undo: () => void;
  redo: () => void;

  setRun: (run: Run | null) => void;
  applyEvent: (event: RunEvent) => void;
}

/** The output ports of a node that has branches; ``null`` for a node with a single output. */
export function branchHandles(node: WorkflowNode): string[] | null {
  if (node.type === "condition") return [...(node.condition?.rules ?? []).map((rule) => rule.id), "default"];
  if (node.type === "approval") return ["approved", "rejected"];
  return null;
}

/** Connections that leave from a branch the node no longer has (e.g. after deleting a rule). */
function withoutStaleBranches(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowEdge[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return edges.filter((edge) => {
    const source = byId.get(edge.source);
    const handles = source ? branchHandles(source) : null;
    return !handles || !edge.source_handle || handles.includes(edge.source_handle);
  });
}

function wouldCycle(edges: WorkflowEdge[], source: string, target: string): boolean {
  // A new edge source -> target closes a cycle if source is reachable from target.
  const stack = [target];
  const seen = new Set<string>();
  while (stack.length) {
    const current = stack.pop()!;
    if (current === source) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const edge of edges) if (edge.source === current) stack.push(edge.target);
  }
  return false;
}

export const useEditor = create<EditorState>((set, get) => {
  /** Record the current graph for undo, then apply ``change``. */
  const commit = (change: Partial<EditorState>) => {
    const { nodes, edges, past, pendingNote } = get();
    set({ past: [...past.slice(-HISTORY_LIMIT), { nodes, edges, pendingNote }], future: [], dirty: true, ...change });
  };

  return {
    workflowId: null,
    name: "",
    description: "",
    budget: null,
    nodes: [],
    edges: [],
    selectedId: null,
    selectedEdgeId: null,
    dirty: false,
    past: [],
    future: [],
    run: null,
    pendingNote: null,

    load: (workflow) =>
      set({
        workflowId: workflow.id,
        name: workflow.name,
        description: workflow.description,
        budget: workflow.budget_usd,
        nodes: workflow.nodes,
        edges: workflow.edges,
        selectedId: null,
        selectedEdgeId: null,
        dirty: false,
        past: [],
        future: [],
        run: null,
        pendingNote: null,
      }),

    reset: () =>
      set({
        workflowId: null,
        name: "",
        description: "",
        budget: null,
        nodes: [],
        edges: [],
        selectedId: null,
        selectedEdgeId: null,
        dirty: false,
        past: [],
        future: [],
        run: null,
        pendingNote: null,
      }),

    toWorkflow: () => {
      const { name, description, budget, nodes, edges } = get();
      return { name, description, budget_usd: budget, nodes, edges };
    },

    markSaved: (workflow) => set({ dirty: false, workflowId: workflow.id, name: workflow.name, pendingNote: null }),

    setMeta: (patch) => set({ ...patch, dirty: true }),

    addNode: (type, position, agent) => {
      const node = newNode(type, position, agent);
      if (type === "agent") {
        const names = new Set(get().nodes.map((item) => item.label));
        let label = node.label;
        for (let index = 2; names.has(label); index += 1) label = `${node.label} ${index}`;
        node.label = label;
        if (node.agent) node.agent.name = label;
      }
      commit({ nodes: [...get().nodes, node], selectedId: node.id });
      return node;
    },

    updateNode: (id, patch, options = { record: true }) => {
      const nodes = get().nodes.map((node) => (node.id === id ? { ...node, ...patch } : node));
      const edges = patch.condition ? withoutStaleBranches(nodes, get().edges) : get().edges;
      if (options.record) commit({ nodes, edges });
      else set({ nodes, edges, dirty: true });
    },

    updateAgent: (id, patch) => {
      const nodes = get().nodes.map((node) => {
        if (node.id !== id || !node.agent) return node;
        const agent = { ...node.agent, ...patch };
        return { ...node, agent, label: patch.name !== undefined ? patch.name : node.label };
      });
      // Typing in the inspector should not create one undo step per key.
      set({ nodes, dirty: true });
    },

    replaceAgent: (id, agent) => {
      commit({
        nodes: get().nodes.map((node) => (node.id === id ? { ...node, agent, label: agent.name } : node)),
      });
    },

    moveNodes: (positions, record) => {
      const nodes = get().nodes.map((node) => (positions[node.id] ? { ...node, position: positions[node.id] } : node));
      if (record) commit({ nodes });
      else set({ nodes });
    },

    applyDraft: (draft, note) => {
      commit({
        nodes: structuredClone(draft.nodes),
        edges: structuredClone(draft.edges),
        selectedId: null,
        selectedEdgeId: null,
        pendingNote: note,
      });
    },

    removeNodes: (ids) => {
      const remove = new Set(ids);
      const { nodes, edges, selectedId } = get();
      commit({
        nodes: nodes.filter((node) => !remove.has(node.id)),
        edges: edges.filter((edge) => !remove.has(edge.source) && !remove.has(edge.target)),
        selectedId: selectedId && remove.has(selectedId) ? null : selectedId,
        selectedEdgeId: null,
      });
    },

    duplicateNode: (id) => {
      const node = get().nodes.find((item) => item.id === id);
      if (!node) return;
      const copy: WorkflowNode = structuredClone(node);
      copy.id = newId("node");
      copy.position = { x: node.position.x + 40, y: node.position.y + 140 };
      copy.label = i18n.t("editor.copyName", { name: node.label });
      if (copy.agent) copy.agent.name = copy.label;
      commit({ nodes: [...get().nodes, copy], selectedId: copy.id });
    },

    connect: (source, target, handle = null) => {
      const { nodes, edges } = get();
      const from = nodes.find((node) => node.id === source);
      const to = nodes.find((node) => node.id === target);
      if (!from || !to) return "editor.connect.notFound";
      if (source === target) return "editor.connect.self";
      if (from.type === "output") return "editor.connect.fromOutput";
      if (to.type === "start") return "editor.connect.toStart";
      const handles = branchHandles(from);
      // A node with branches connects from one of them; any other node from its single output.
      const sourceHandle = handles ? (handle && handles.includes(handle) ? handle : null) : null;
      if (handles && !sourceHandle) return "editor.connect.pickBranch";
      if (edges.some((edge) => edge.source === source && edge.target === target)) return "editor.connect.exists";
      if (wouldCycle(edges, source, target)) return "editor.connect.cycle";
      const edge: WorkflowEdge = { id: newId("edge"), source, target };
      if (sourceHandle) edge.source_handle = sourceHandle;
      commit({ edges: [...edges, edge] });
      return null;
    },

    removeEdges: (ids) => {
      const remove = new Set(ids);
      const { edges, selectedEdgeId } = get();
      if (!edges.some((edge) => remove.has(edge.id))) return;
      commit({
        edges: edges.filter((edge) => !remove.has(edge.id)),
        selectedEdgeId: selectedEdgeId && remove.has(selectedEdgeId) ? null : selectedEdgeId,
      });
    },

    select: (id) => set({ selectedId: id, selectedEdgeId: null }),

    selectEdge: (id) => set({ selectedEdgeId: id, selectedId: id ? null : get().selectedId }),

    autoLayout: () => {
      // Columns by longest path from a source; rows in insertion order.
      const { nodes, edges } = get();
      const depth: Record<string, number> = {};
      const incoming = (id: string) => edges.filter((edge) => edge.target === id).map((edge) => edge.source);
      const visit = (id: string, trail: Set<string>): number => {
        if (depth[id] !== undefined) return depth[id];
        if (trail.has(id)) return 0;
        trail.add(id);
        const parents = incoming(id);
        depth[id] = parents.length ? Math.max(...parents.map((parent) => visit(parent, trail))) + 1 : 0;
        return depth[id];
      };
      nodes.forEach((node) => visit(node.id, new Set()));
      const rows: Record<number, number> = {};
      const placed = nodes.map((node) => {
        const column = depth[node.id] ?? 0;
        const row = rows[column] ?? 0;
        rows[column] = row + 1;
        return { ...node, position: { x: column * 320, y: row * 190 } };
      });
      commit({ nodes: placed });
    },

    undo: () => {
      const { past, nodes, edges, future, pendingNote } = get();
      const previous = past.at(-1);
      if (!previous) return;
      // The version note of a taken draft goes and comes back with the draft.
      set({ ...previous, past: past.slice(0, -1), future: [{ nodes, edges, pendingNote }, ...future], dirty: true, selectedEdgeId: null });
    },

    redo: () => {
      const { past, nodes, edges, future, pendingNote } = get();
      const next = future[0];
      if (!next) return;
      set({ ...next, future: future.slice(1), past: [...past, { nodes, edges, pendingNote }], dirty: true, selectedEdgeId: null });
    },

    setRun: (run) => set({ run }),

    applyEvent: (event) => {
      const run = get().run;
      if (!run || run.id !== event.run_id) return;
      const nodes = { ...run.nodes };
      const id = event.node_id;
      const node: NodeRun | undefined = id ? { ...nodes[id] } : undefined;
      const data = event.data;
      const next: Run = { ...run, nodes };
      switch (event.type) {
        case "run_started":
          next.status = "running";
          break;
        case "node_started":
          if (node) {
            node.status = "running";
            node.prompt = (data.prompt as string) ?? null;
            node.started_at = event.at;
          }
          break;
        case "text":
          if (node) node.text = (node.text ?? "") + String(data.delta ?? "");
          break;
        case "thinking":
          if (node) node.thinking = (node.thinking ?? "") + String(data.delta ?? "");
          break;
        case "tool_started":
          if (node) {
            const call: ToolCallRecord = {
              id: String(data.id),
              name: String(data.name),
              input: (data.input as Record<string, unknown>) ?? {},
              output: null,
              is_error: false,
              started_at: event.at,
              finished_at: null,
            };
            node.tool_calls = [...(node.tool_calls ?? []), call];
          }
          break;
        case "tool_finished":
          if (node) {
            node.tool_calls = (node.tool_calls ?? []).map((call) =>
              call.id === data.id
                ? { ...call, output: String(data.output ?? ""), is_error: Boolean(data.is_error), finished_at: event.at }
                : call,
            );
          }
          break;
        case "usage":
          if (node) node.usage = data.usage as Usage;
          break;
        case "evaluation":
          if (node)
            node.evaluation = {
              passed: Boolean(data.passed),
              attempts: Number(data.attempts),
              feedback: String(data.feedback ?? ""),
            };
          break;
        case "approval_requested":
          if (node) {
            node.status = "awaiting_approval";
            node.started_at = node.started_at ?? event.at;
          }
          break;
        case "approval_decided":
          if (node) {
            node.approval = {
              decision: data.decision as "approved" | "rejected",
              comment: String(data.comment ?? ""),
              decided_at: event.at,
              decided_by: "local",
              reused_from: null,
            };
          }
          break;
        case "node_finished":
          if (node) {
            node.status = data.status as NodeRun["status"];
            if (data.decision) node.decision = data.decision as NodeRun["decision"];
            if (data.child_run_id) node.child_run_id = String(data.child_run_id);
            node.output = data.output ?? node.output;
            node.error = (data.error as string) ?? null;
            node.error_code = (data.error_code as string) ?? null;
            node.error_params = (data.error_params as Record<string, unknown>) ?? {};
            if (data.usage) node.usage = data.usage as Usage;
            node.finished_at = event.at;
          }
          break;
        case "run_paused":
        case "run_finished":
          next.status = data.status as Run["status"];
          next.error = (data.error as string) ?? null;
          next.error_code = (data.error_code as string) ?? null;
          next.error_params = (data.error_params as Record<string, unknown>) ?? {};
          next.output = data.output;
          next.usage = data.usage as Usage;
          next.finished_at = event.type === "run_finished" ? event.at : null;
          break;
        default:
          break;
      }
      if (id && node) nodes[id] = node;
      set({ run: next });
    },
  };
});

/** Totals of a run so far, also while it is running. */
export function liveUsage(run: Run | null): Usage {
  const zero: Usage = {
    requests: 0,
    input_tokens: 0,
    output_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
    thinking_tokens: 0,
    web_search_requests: 0,
    total_tokens: 0,
    estimated_cost_usd: 0,
  };
  if (!run) return zero;
  if (run.finished_at && run.usage.requests) return run.usage;
  return Object.values(run.nodes).reduce<Usage>((sum, node) => {
    const usage = node.usage ?? zero;
    return {
      requests: sum.requests + usage.requests,
      input_tokens: sum.input_tokens + usage.input_tokens,
      output_tokens: sum.output_tokens + usage.output_tokens,
      cache_read_input_tokens: sum.cache_read_input_tokens + usage.cache_read_input_tokens,
      cache_creation_input_tokens: sum.cache_creation_input_tokens + usage.cache_creation_input_tokens,
      thinking_tokens: sum.thinking_tokens + usage.thinking_tokens,
      web_search_requests: sum.web_search_requests + usage.web_search_requests,
      total_tokens: sum.total_tokens + usage.total_tokens,
      estimated_cost_usd:
        sum.estimated_cost_usd === null || usage.estimated_cost_usd === null
          ? null
          : sum.estimated_cost_usd + usage.estimated_cost_usd,
    };
  }, zero);
}
