// What changed between a saved workflow version and another state (e.g. the editor's).

import type { AgentConfig, WorkflowIn } from "../api/types";

type Node = WorkflowIn["nodes"][number];

/** The fields a version comparison names one by one; everything else of a step counts as "other". */
export const DIFF_FIELDS = [
  "label",
  "name",
  "model",
  "system_prompt",
  "task_template",
  "tools",
  "server_tools",
  "fallbacks",
  "knowledge",
  "output",
  "other",
] as const;
export type DiffField = (typeof DIFF_FIELDS)[number];

/** Long texts are shown as a line diff, lists as added and removed entries, short values as before and after. */
export type FieldChange =
  | { field: DiffField; kind: "text"; before: string; after: string }
  | { field: DiffField; kind: "list"; added: string[]; removed: string[] }
  | { field: DiffField; kind: "value"; before: string; after: string }
  | { field: DiffField; kind: "flag" };

export interface StepChange {
  id: string;
  name: string;
  fields: FieldChange[];
}

const TEXT_FIELDS = ["system_prompt", "task_template"] as const satisfies readonly (keyof AgentConfig)[];
const LIST_FIELDS = ["tools", "server_tools", "fallbacks"] as const satisfies readonly (keyof AgentConfig)[];
const VALUE_FIELDS = ["name", "model"] as const satisfies readonly (keyof AgentConfig)[];
const FLAG_FIELDS = ["knowledge", "output"] as const satisfies readonly (keyof AgentConfig)[];
const NAMED = new Set<string>([...TEXT_FIELDS, ...LIST_FIELDS, ...VALUE_FIELDS, ...FLAG_FIELDS]);

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function without<T extends object>(value: T | null | undefined, names: Set<string>): Record<string, unknown> | null {
  if (!value) return null;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !names.has(key)));
}

/** The fields of one step that differ between two states, in the order of DIFF_FIELDS. */
export function fieldChanges(from: Node, to: Node): FieldChange[] {
  const changes: FieldChange[] = [];
  if (from.label !== to.label) changes.push({ field: "label", kind: "value", before: from.label, after: to.label });
  const a = from.agent;
  const b = to.agent;
  if (a && b) {
    for (const field of VALUE_FIELDS)
      if (a[field] !== b[field]) changes.push({ field, kind: "value", before: a[field] ?? "", after: b[field] ?? "" });
    for (const field of TEXT_FIELDS)
      if ((a[field] ?? "") !== (b[field] ?? "")) changes.push({ field, kind: "text", before: a[field] ?? "", after: b[field] ?? "" });
    for (const field of LIST_FIELDS) {
      const before = a[field] ?? [];
      const after = b[field] ?? [];
      if (!same(before, after))
        changes.push({
          field,
          kind: "list",
          added: after.filter((item) => !before.includes(item)),
          removed: before.filter((item) => !after.includes(item)),
        });
    }
    for (const field of FLAG_FIELDS) if (!same(a[field], b[field])) changes.push({ field, kind: "flag" });
  }
  // Everything not named above: the other agent options, and the settings of non-agent steps.
  const rest = (node: Node) => ({
    ...node,
    id: null,
    position: null,
    label: null,
    agent: a && b ? without(node.agent, NAMED) : node.agent,
  });
  if (!same(rest(from), rest(to))) changes.push({ field: "other", kind: "flag" });
  return changes;
}

export interface VersionChanges {
  renamed: boolean;
  added: string[];
  removed: string[];
  changed: string[];
  /** The changed steps with the fields that differ, in the order of ``changed``. */
  steps: StepChange[];
  connectionsAdded: number;
  connectionsRemoved: number;
  settingsChanged: boolean;
}

export function versionChanges(from: WorkflowIn, to: WorkflowIn): VersionChanges {
  const before = new Map(from.nodes.map((node) => [node.id, node]));
  const after = new Map(to.nodes.map((node) => [node.id, node]));
  const name = (node: Node) => node.label || node.agent?.name || node.type;
  const content = (node: Node) => JSON.stringify({ ...node, position: null });
  const changedNodes = [...after.values()].filter((node) => before.has(node.id) && content(before.get(node.id)!) !== content(node));
  const edgeKey = (edge: WorkflowIn["edges"][number]) => `${edge.source}>${edge.target}`;
  const edgesBefore = new Set(from.edges.map(edgeKey));
  const edgesAfter = new Set(to.edges.map(edgeKey));
  return {
    renamed: from.name !== to.name,
    added: [...after.values()].filter((node) => !before.has(node.id)).map(name),
    removed: [...before.values()].filter((node) => !after.has(node.id)).map(name),
    changed: changedNodes.map(name),
    steps: changedNodes.map((node) => ({ id: node.id, name: name(node), fields: fieldChanges(before.get(node.id)!, node) })),
    connectionsAdded: [...edgesAfter].filter((key) => !edgesBefore.has(key)).length,
    connectionsRemoved: [...edgesBefore].filter((key) => !edgesAfter.has(key)).length,
    settingsChanged: from.description !== to.description || from.budget_usd !== to.budget_usd,
  };
}

export function hasChanges(changes: VersionChanges): boolean {
  return (
    changes.renamed ||
    changes.settingsChanged ||
    changes.added.length + changes.removed.length + changes.changed.length > 0 ||
    changes.connectionsAdded + changes.connectionsRemoved > 0
  );
}
