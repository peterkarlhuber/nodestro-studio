// Connected MCP services (ADR-0007, WP-4): remote MCP servers, their tools and the administrator's approvals.
// The runtime enforces every rule (address checks, approvals, hash pinning); the interface shows and edits them
// (nodestro-api: nodestro_api/api_mcp.py, OpenAPI /api/openapi.json).

import { useQuery } from "@tanstack/react-query";

import { request } from "./client";

export type McpAuth = "none" | "bearer" | "oauth";
/** none: no token; vault: sealed with the keychain or server key; session: kept in memory until the app closes. */
export type McpTokenStorage = "none" | "vault" | "session";
/** new and changed wait for a decision; removed: the server no longer offers the tool. */
export type McpToolStatus = "new" | "approved" | "rejected" | "changed" | "removed";
/** The administrator's classification; a missing or unknown statement counts as "changes data". */
export type McpAccess = "read" | "write" | "destructive";

export interface McpStatus {
  available: boolean;
  token_vault: boolean;
  endpoint_list: string[] | null;
  loopback_possible: boolean;
  unattended_enabled: boolean;
  write_tools_enabled: boolean;
}

export interface McpServer {
  id: string;
  slug: string;
  name: string;
  url: string;
  enabled: boolean;
  allow_loopback: boolean;
  auth: McpAuth;
  token_set: boolean;
  token_storage: McpTokenStorage;
  timeout_seconds: number;
  max_output_chars: number;
  max_parallel_calls: number;
  protocol_version: string | null;
  server_name: string | null;
  server_version: string | null;
  last_checked_at: string | null;
  last_error_code: string | null;
  last_error_params: Record<string, unknown>;
  tools_total: number;
  tools_approved: number;
  tools_pending: number;
  created_at: string;
  updated_at: string;
}

export interface McpServerIn {
  name: string;
  url: string;
  enabled?: boolean;
  allow_loopback?: boolean;
  auth?: McpAuth;
  /** Write-only: omitted keeps the stored token, "" removes it. */
  token?: string | null;
  timeout_seconds?: number;
  max_output_chars?: number;
  max_parallel_calls?: number;
}

export interface McpToolDefinition {
  name: string;
  title: string | null;
  description: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown> | null;
  annotations: Record<string, unknown>;
}

export interface McpTool {
  server_id: string;
  name: string;
  /** The name agents use: mcp__<server>__<tool>. */
  tool_name: string;
  status: McpToolStatus;
  access: McpAccess;
  /** From the server's annotations: a hint, never a guarantee. */
  suggested_access: McpAccess;
  hash: string;
  definition: McpToolDefinition;
  approved_definition: McpToolDefinition | null;
  approved_hash: string | null;
  approved_by: string | null;
  approved_at: string | null;
  discovered_at: string;
  last_seen_at: string;
  usable: boolean;
  /** Why agents cannot use the tool right now (an mcp.* error code). */
  refusal: string | null;
}

export interface McpDiscovery {
  server: McpServer;
  protocol_version: string | null;
  tools: McpTool[];
  skipped: Record<string, string>[];
}

export interface McpDecision {
  approve: boolean;
  access?: McpAccess;
  /** The definition the administrator reviewed; the server refuses when it has changed since. */
  expected_hash?: string;
}

export interface McpEvent {
  id: string;
  at: string;
  kind: string;
  actor: string | null;
  server_id: string | null;
  tool: string | null;
  details: Record<string, unknown>;
}

const server = (id: string) => `/mcp/servers/${encodeURIComponent(id)}`;

export const mcpApi = {
  status: () => request<McpStatus>("GET", "/mcp/status"),
  servers: () => request<McpServer[]>("GET", "/mcp/servers"),
  add: (body: McpServerIn) => request<McpServer>("POST", "/mcp/servers", body),
  update: (id: string, body: McpServerIn) => request<McpServer>("PUT", server(id), body),
  remove: (id: string) => request<void>("DELETE", server(id)),
  discover: (id: string) => request<McpDiscovery>("POST", `${server(id)}/discover`),
  tools: (id: string) => request<McpTool[]>("GET", `${server(id)}/tools`),
  decide: (id: string, tool: string, body: McpDecision) =>
    request<McpTool>("POST", `${server(id)}/tools/${encodeURIComponent(tool)}/decision`, body),
  events: (limit = 100) => request<McpEvent[]>("GET", `/mcp/events?limit=${limit}`),
};

export const mcpKeys = {
  all: ["mcp"] as const,
  status: ["mcp", "status"] as const,
  servers: ["mcp", "servers"] as const,
  tools: (id: string) => ["mcp", "tools", id] as const,
  events: ["mcp", "events"] as const,
};

export const useMcpStatus = () => useQuery({ queryKey: mcpKeys.status, queryFn: mcpApi.status });
export const useMcpServers = () => useQuery({ queryKey: mcpKeys.servers, queryFn: mcpApi.servers });
export const useMcpTools = (id: string) => useQuery({ queryKey: mcpKeys.tools(id), queryFn: () => mcpApi.tools(id) });
export const useMcpEvents = (enabled: boolean) =>
  useQuery({ queryKey: mcpKeys.events, queryFn: () => mcpApi.events(), enabled });

/** Tools waiting for the administrator: new or changed definitions. */
export const needsDecision = (tool: McpTool) => tool.status === "new" || tool.status === "changed";

export interface DefinitionChange {
  field: "title" | "description" | "input_schema" | "output_schema" | "annotations";
  before: string;
  after: string;
}

const show = (value: unknown) =>
  value === null || value === undefined ? "" : typeof value === "string" ? value : JSON.stringify(value, null, 2);

/** What changed between the approved and the current definition (the rug-pull review). */
export function definitionChanges(before: McpToolDefinition | null, after: McpToolDefinition): DefinitionChange[] {
  if (!before) return [];
  const fields: DefinitionChange["field"][] = ["title", "description", "input_schema", "output_schema", "annotations"];
  return fields
    .map((field) => ({ field, before: show(before[field]), after: show(after[field]) }))
    .filter((change) => change.before !== change.after);
}
