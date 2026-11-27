// Whether an imported file is a Nodestro workflow export (AD-08), checked before anything is created. The API
// accepts any object (every field has a default), so {"foo": 1} would become an empty workflow.

export type WorkflowFileProblem =
  | { code: "not_object" }
  | { code: "no_nodes" }
  | { code: "node_invalid"; index: number }
  | { code: "edges_invalid" }
  | { code: "edge_invalid"; index: number };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The first reason the parsed file is not a workflow, or null when it looks like one. */
export function workflowFileProblem(data: unknown): WorkflowFileProblem | null {
  if (!isObject(data)) return { code: "not_object" };
  if (!Array.isArray(data.nodes) || data.nodes.length === 0) return { code: "no_nodes" };
  const bad = data.nodes.findIndex((node) => !isObject(node) || typeof node.id !== "string" || !node.id || typeof node.type !== "string");
  if (bad >= 0) return { code: "node_invalid", index: bad + 1 };
  if (data.edges !== undefined) {
    if (!Array.isArray(data.edges)) return { code: "edges_invalid" };
    const edge = data.edges.findIndex(
      (item) => !isObject(item) || typeof item.source !== "string" || typeof item.target !== "string",
    );
    if (edge >= 0) return { code: "edge_invalid", index: edge + 1 };
  }
  return null;
}

/**
 * The exchange format of a workflow file (N-14). It is written first in every export; the API checks it on import
 * (a newer version is refused with ``exchange.version_newer``). Files of earlier releases have none and are imported
 * as they are.
 */
export const WORKFLOW_FORMAT = "nodestro-workflow/1";

/** The content of an exported workflow file: the format first, then the workflow. */
export function workflowExport<T extends object>(workflow: T): { format: typeof WORKFLOW_FORMAT } & T {
  return { format: WORKFLOW_FORMAT, ...workflow };
}

/** A name for a file without one: the file name without ".nodestro.json" / ".json". */
export function nameFromFile(fileName: string): string {
  return fileName.replace(/\.nodestro\.json$/i, "").replace(/\.json$/i, "").replace(/_/g, " ").trim();
}
