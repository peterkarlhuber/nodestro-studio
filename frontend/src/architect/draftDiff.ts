// What a draft of the Workflow Architect changes compared with the workflow it started from:
// agents added, changed (field by field) or removed, and connections added or removed.

import type { AgentConfig, WorkflowIn, WorkflowNode } from "../api/types";

/** The agent settings a review compares, in the order it shows them. */
export const COMPARED_FIELDS = [
  "name",
  "description",
  "model",
  "effort",
  "system_prompt",
  "task_template",
  "tools",
  "server_tools",
  "knowledge",
  "memory",
  "output",
  "quality",
  "max_tokens",
  "max_tool_rounds",
] as const;

export type ComparedField = (typeof COMPARED_FIELDS)[number];

export interface FieldChange {
  field: ComparedField | "other";
  before: string;
  after: string;
}

export interface AgentDiff {
  nodeId: string;
  name: string;
  kind: "added" | "changed" | "removed" | "kept";
  fields: FieldChange[];
  /** Names of the nodes the agent receives from, before and after. */
  inputsBefore: string[];
  inputsAfter: string[];
}

export interface EdgeDiff {
  key: string;
  source: string;
  target: string;
  kind: "added" | "removed" | "kept";
}

export interface DraftDiff {
  agents: AgentDiff[];
  edges: EdgeDiff[];
  counts: { added: number; changed: number; removed: number; edgesAdded: number; edgesRemoved: number };
}

function show(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value.join(", ");
  return JSON.stringify(value, null, 2);
}

const label = (node: WorkflowNode) => node.label || node.agent?.name || node.type;

function fieldChanges(before: AgentConfig, after: AgentConfig): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const field of COMPARED_FIELDS) {
    const old = show(before[field]);
    const now = show(after[field]);
    if (old !== now) changes.push({ field, before: old, after: now });
  }
  const rest = (config: AgentConfig) => {
    const copy: Record<string, unknown> = { ...config };
    for (const field of COMPARED_FIELDS) delete copy[field];
    return JSON.stringify(copy);
  };
  if (rest(before) !== rest(after)) changes.push({ field: "other", before: "", after: "" });
  return changes;
}

export function draftDiff(base: WorkflowIn | null, draft: WorkflowIn): DraftDiff {
  const beforeNodes = new Map((base?.nodes ?? []).map((node) => [node.id, node]));
  const afterNodes = new Map(draft.nodes.map((node) => [node.id, node]));
  const name = (id: string) => {
    const node = afterNodes.get(id) ?? beforeNodes.get(id);
    return node ? label(node) : id;
  };
  const inputs = (workflow: WorkflowIn | null, id: string) =>
    (workflow?.edges ?? []).filter((edge) => edge.target === id).map((edge) => name(edge.source)).sort();
  const agents: AgentDiff[] = [];
  for (const node of draft.nodes) {
    if (node.type !== "agent" || !node.agent) continue;
    const old = beforeNodes.get(node.id);
    const inputsBefore = old ? inputs(base, node.id) : [];
    const inputsAfter = inputs(draft, node.id);
    if (!old?.agent) {
      agents.push({ nodeId: node.id, name: label(node), kind: "added", fields: [], inputsBefore, inputsAfter });
      continue;
    }
    const fields = fieldChanges(old.agent, node.agent);
    const rewired = inputsBefore.join("|") !== inputsAfter.join("|");
    agents.push({
      nodeId: node.id,
      name: label(node),
      kind: fields.length || rewired ? "changed" : "kept",
      fields,
      inputsBefore,
      inputsAfter,
    });
  }
  for (const node of base?.nodes ?? []) {
    if (node.type === "agent" && !afterNodes.has(node.id))
      agents.push({ nodeId: node.id, name: label(node), kind: "removed", fields: [], inputsBefore: inputs(base, node.id), inputsAfter: [] });
  }
  const key = (edge: { source: string; target: string }) => `${edge.source}>${edge.target}`;
  const beforeEdges = new Set((base?.edges ?? []).map(key));
  const afterEdges = new Set(draft.edges.map(key));
  const edges: EdgeDiff[] = [
    ...draft.edges.map((edge) => ({
      key: key(edge),
      source: name(edge.source),
      target: name(edge.target),
      kind: (base === null || !beforeEdges.has(key(edge)) ? "added" : "kept") as EdgeDiff["kind"],
    })),
    ...(base?.edges ?? [])
      .filter((edge) => !afterEdges.has(key(edge)))
      .map((edge) => ({ key: key(edge), source: name(edge.source), target: name(edge.target), kind: "removed" as const })),
  ];
  return {
    agents,
    edges,
    counts: {
      added: agents.filter((agent) => agent.kind === "added").length,
      changed: agents.filter((agent) => agent.kind === "changed").length,
      removed: agents.filter((agent) => agent.kind === "removed").length,
      edgesAdded: edges.filter((edge) => edge.kind === "added").length,
      edgesRemoved: edges.filter((edge) => edge.kind === "removed").length,
    },
  };
}

/** Whether two states of a workflow differ in their agents and connections (positions aside). */
export function graphDiffers(a: WorkflowIn, b: WorkflowIn): boolean {
  const shape = (workflow: WorkflowIn) =>
    JSON.stringify({
      nodes: workflow.nodes.map((node) => ({ ...node, position: null })).sort((x, y) => x.id.localeCompare(y.id)),
      edges: workflow.edges.map((edge) => `${edge.source}>${edge.target}`).sort(),
    });
  return shape(a) !== shape(b);
}
