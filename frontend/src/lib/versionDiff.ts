// What changed between a saved workflow version and another state (e.g. the editor's).

import type { WorkflowIn } from "../api/types";

export interface VersionChanges {
  renamed: boolean;
  added: string[];
  removed: string[];
  changed: string[];
  connectionsAdded: number;
  connectionsRemoved: number;
  settingsChanged: boolean;
}

export function versionChanges(from: WorkflowIn, to: WorkflowIn): VersionChanges {
  const before = new Map(from.nodes.map((node) => [node.id, node]));
  const after = new Map(to.nodes.map((node) => [node.id, node]));
  const name = (node: WorkflowIn["nodes"][number]) => node.label || node.agent?.name || node.type;
  const content = (node: WorkflowIn["nodes"][number]) => JSON.stringify({ ...node, position: null });
  const edgeKey = (edge: WorkflowIn["edges"][number]) => `${edge.source}>${edge.target}`;
  const edgesBefore = new Set(from.edges.map(edgeKey));
  const edgesAfter = new Set(to.edges.map(edgeKey));
  return {
    renamed: from.name !== to.name,
    added: [...after.values()].filter((node) => !before.has(node.id)).map(name),
    removed: [...before.values()].filter((node) => !after.has(node.id)).map(name),
    changed: [...after.values()]
      .filter((node) => before.has(node.id) && content(before.get(node.id)!) !== content(node))
      .map(name),
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
