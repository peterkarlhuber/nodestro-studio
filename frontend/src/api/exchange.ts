// Exchange files (N-14): MCP services, service connections and knowledge collections as versioned files
// (nodestro-api docs/exchange.md). Every import is previewed first (dry run) and applied only after the person
// confirmed; the answer is the same report both times. No file and no report ever carries a secret value:
// ``secrets_to_reenter`` only names where a secret has to be entered again.

import { request, requestFile } from "./client";

export type ExchangeKind = "mcp" | "connections" | "collection";

export interface ImportItem {
  kind: "mcp_server" | "connection" | "document";
  name: string;
  /** ready: the preview found no problem; refused: ``code``/``params`` say why; created/exists after applying. */
  status: "ready" | "refused" | "created" | "exists";
  code: string | null;
  params: Record<string, unknown>;
  id: string | null;
  /** A token, sign-in or connection secret has to be entered before the entry can be used. */
  needs_secret: boolean;
}

export interface EmbeddingMatch {
  package: Record<string, unknown> | null;
  workspace: Record<string, unknown> | null;
  matches: boolean;
}

export interface ImportReport {
  format: string;
  dry_run: boolean;
  items: ImportItem[];
  /** After applying: labels such as ``mcp:<id>`` and ``connection:<id>`` (never a value). */
  secrets_to_reenter: string[];
  /** What an import never takes over: enabled, tool_approvals, secrets, vectors, provenance. */
  left_out: string[];
  collection: string | null;
  collection_exists: boolean;
  embedding: EmbeddingMatch | null;
}

/** The file formats; the file picker offers files of this kind. */
export const EXCHANGE_FORMATS: Record<ExchangeKind, { format: string; accept: string; fallback: string }> = {
  mcp: { format: "nodestro-mcp/1", accept: ".json,application/json", fallback: "mcp-servers.nodestro-mcp.json" },
  connections: {
    format: "nodestro-connection/1",
    accept: ".json,application/json",
    fallback: "connections.nodestro-connection.json",
  },
  collection: { format: "nodestro-collection/1", accept: ".zip,application/zip", fallback: "collection.nodestro-collection.zip" },
};

/** The raw file is the request body of the JSON imports: the API checks it before parsing it. */
const jsonImport = (path: string, file: Blob, dryRun: boolean) =>
  request<ImportReport>("POST", `${path}?dry_run=${dryRun ? "true" : "false"}`, file);

export const exchangeApi = {
  importMcp: (file: Blob, dryRun: boolean) => jsonImport("/mcp/import", file, dryRun),
  importConnections: (file: Blob, dryRun: boolean) => jsonImport("/connections/import", file, dryRun),
  importCollection: (file: Blob, dryRun: boolean, collection?: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("dry_run", dryRun ? "true" : "false");
    if (collection?.trim()) form.append("collection", collection.trim());
    return request<ImportReport>("POST", "/knowledge/collections/import", form);
  },
  exportMcp: () => requestFile("/mcp/export", EXCHANGE_FORMATS.mcp.fallback),
  exportConnections: () => requestFile("/connections/export", EXCHANGE_FORMATS.connections.fallback),
  exportCollection: (name: string) =>
    requestFile(`/knowledge/collections/export?name=${encodeURIComponent(name)}`, EXCHANGE_FORMATS.collection.fallback),
};

/** Whether the preview allows applying: at least one entry and none refused (an import adds all or none). */
export function canApply(report: ImportReport | null): boolean {
  return Boolean(report && report.dry_run && report.items.length && report.items.every((item) => item.status !== "refused"));
}

/** Saves a downloaded file under its name. */
export function saveFile(file: { blob: Blob; name: string }): void {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file.blob);
  link.download = file.name;
  link.click();
  // Some browsers read the object URL only after the click has returned.
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
