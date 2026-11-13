// Service connections and the built-in tool catalog (NAL-A1, nodestro-runtime ADR-0001): what a built-in tool needs
// to reach an outside service (settings, allowed hosts, one write-only secret) and each built-in tool's spec. The
// runtime enforces every rule; the interface shows and edits them (nodestro-api: nodestro_api/api_connections.py).

import { useQuery } from "@tanstack/react-query";

import { request } from "./client";
import type { ToolCapabilityStatement } from "./types";

/** none: no secret; vault: sealed with the keychain or server key; session: kept in memory until the app closes. */
export type SecretStorage = "none" | "vault" | "session";
export type CheckStatus = "unchecked" | "ok" | "failed";
export type ConnectionEventKind = "created" | "updated" | "deleted" | "secret_set" | "secret_cleared" | "checked";
export type ToolCategory = "compute" | "data" | "files" | "web" | "communication";
export type ToolNetwork = "none" | "external";

export const TOOL_CATEGORIES: ToolCategory[] = ["compute", "data", "files", "web", "communication"];
export const TOOL_NETWORKS: ToolNetwork[] = ["none", "external"];

export interface ConnectionStatus {
  /** Secrets are stored encrypted; false: they are kept for this session only. */
  secret_vault: boolean;
  mode: "desktop" | "local-container" | "server";
  contract: number;
}

export interface ConnectionTypeInfo {
  name: string;
  providers: string[];
  secret_required: boolean;
  /** What the secret is: api_key, password, signing_key, connection_string. */
  secret_label: string;
  /** JSON Schema of the type's settings (Pydantic). */
  settings_schema: Record<string, unknown>;
  modes: string[];
  checkable: boolean;
}

export interface ConnectionCheck {
  status: CheckStatus;
  checked_at: string | null;
  /** The error code of a failed check (connection.*); never a message from the service. */
  code: string | null;
  kind: "configuration" | "service" | null;
}

/** A connection as every read returns it: never the secret, only whether one is set. */
export interface Connection {
  id: string;
  contract: number;
  type: string;
  name: string;
  provider: string;
  description: string;
  settings: Record<string, unknown>;
  /** host:port pairs the connection may reach, derived from the settings. */
  egress: string[];
  secret_set: boolean;
  secret_storage: SecretStorage;
  check: ConnectionCheck;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  /** Agents that bind this connection ("workflow name / node"). */
  used_by: string[];
}

export interface ConnectionIn {
  type: string;
  name: string;
  provider?: string;
  description?: string;
  settings?: Record<string, unknown>;
}

/** A change; the type cannot change. */
export interface ConnectionPatch {
  name?: string;
  provider?: string;
  description?: string;
  settings?: Record<string, unknown>;
}

export interface ConnectionEvent {
  id: string;
  at: string;
  kind: ConnectionEventKind;
  actor: string | null;
  connection_id: string;
  connection_type: string;
  details: Record<string, unknown>;
}

/** A built-in tool's catalog entry (ToolSpec.catalog()). */
export interface ToolSpec {
  id: string;
  version: number;
  /** id@version, as releases record it. */
  ref: string;
  category: ToolCategory;
  capability: ToolCapabilityStatement;
  network: ToolNetwork;
  /** Usable while the strict offline mode is on. */
  offline: boolean;
  /** The connection type the tool needs (search, smtp, webhook, ...); null: none. */
  connection_type: string | null;
  params_schema: Record<string, unknown>;
  cost_unit: string | null;
  modes: string[];
  timeout_seconds: number;
  max_calls_per_run: number | null;
  i18n_key: string;
}

export interface BuiltinTool {
  name: string;
  description: string;
  /** nodestro: Nodestro's own tools; integration: tools an installed integration added. */
  origin: "nodestro" | "integration";
  spec: ToolSpec | null;
}

const one = (id: string) => `/connections/${encodeURIComponent(id)}`;

export const connectionsApi = {
  status: () => request<ConnectionStatus>("GET", "/connections/status"),
  types: () => request<ConnectionTypeInfo[]>("GET", "/connections/types"),
  list: (type?: string) =>
    request<Connection[]>("GET", type ? `/connections?type=${encodeURIComponent(type)}` : "/connections"),
  get: (id: string) => request<Connection>("GET", one(id)),
  create: (body: ConnectionIn) => request<Connection>("POST", "/connections", body),
  update: (id: string, body: ConnectionPatch) => request<Connection>("PATCH", one(id), body),
  /** Refused with connection.in_use while agents bind it, unless force. */
  remove: (id: string, force = false) => request<void>("DELETE", force ? `${one(id)}?force=true` : one(id)),
  /** Write-only: "" removes the secret; the answer only says secret_set. */
  setSecret: (id: string, secret: string) => request<Connection>("PUT", `${one(id)}/secret`, { secret }),
  check: (id: string) => request<Connection>("POST", `${one(id)}/check`),
  events: (limit = 200) => request<ConnectionEvent[]>("GET", `/connections/events?limit=${limit}`),
  builtinTools: () => request<BuiltinTool[]>("GET", "/tools/builtin"),
};

export const connectionKeys = {
  all: ["connections"] as const,
  status: ["connections", "status"] as const,
  types: ["connections", "types"] as const,
  list: ["connections", "list"] as const,
  events: ["connections", "events"] as const,
  builtinTools: ["tools", "builtin"] as const,
};

export const useConnectionStatus = () => useQuery({ queryKey: connectionKeys.status, queryFn: connectionsApi.status });
export const useConnectionTypes = () => useQuery({ queryKey: connectionKeys.types, queryFn: connectionsApi.types });
export const useConnections = (enabled = true) =>
  useQuery({ queryKey: connectionKeys.list, queryFn: () => connectionsApi.list(), enabled });
export const useConnectionEvents = (enabled: boolean) =>
  useQuery({ queryKey: connectionKeys.events, queryFn: () => connectionsApi.events(), enabled });
/** The built-in tools with their specs; an older API without the route leaves it empty (no filters, no pickers). */
export const useBuiltinTools = () =>
  useQuery({ queryKey: connectionKeys.builtinTools, queryFn: connectionsApi.builtinTools, retry: false, staleTime: 60_000 });

// ---- the settings form -------------------------------------------------------------------------------------------

/** One field of a connection type's settings; only simple fields (text, whole number, number, choice). */
export interface SettingsField {
  name: string;
  kind: "string" | "integer" | "number" | "enum";
  options: string[];
  required: boolean;
  default: unknown;
  title: string;
}

type JsonSchema = {
  type?: string;
  enum?: unknown[];
  const?: unknown;
  anyOf?: JsonSchema[];
  $ref?: string;
  title?: string;
  default?: unknown;
};

function simpleKind(schema: JsonSchema, defs: Record<string, JsonSchema>): Pick<SettingsField, "kind" | "options"> | null {
  const resolved = schema.$ref ? defs[schema.$ref.split("/").pop() ?? ""] ?? {} : schema;
  if (Array.isArray(resolved.enum)) return { kind: "enum", options: resolved.enum.map(String) };
  if (resolved.type === "string" || resolved.type === "integer" || resolved.type === "number")
    return { kind: resolved.type, options: [] };
  // Optional fields read anyOf [<type>, null]; a decimal reads anyOf [number, string, null]: the first simple one wins.
  for (const option of resolved.anyOf ?? []) {
    if (option.type === "null") continue;
    const found = simpleKind(option, defs);
    if (found) return found;
  }
  return null;
}

/** The simple fields of a settings schema, in the schema's order; other fields are left out. */
export function settingsFields(schema: Record<string, unknown>): SettingsField[] {
  const properties = (schema.properties ?? {}) as Record<string, JsonSchema>;
  const defs = (schema.$defs ?? {}) as Record<string, JsonSchema>;
  const required = new Set(Array.isArray(schema.required) ? (schema.required as string[]) : []);
  const fields: SettingsField[] = [];
  for (const [name, property] of Object.entries(properties)) {
    const kind = simpleKind(property, defs);
    if (!kind) continue;
    fields.push({ name, ...kind, required: required.has(name), default: property.default ?? null, title: property.title ?? name });
  }
  return fields;
}

/** The form's text values of stored settings (or the defaults). */
export function settingsText(fields: SettingsField[], settings: Record<string, unknown> = {}): Record<string, string> {
  return Object.fromEntries(
    fields.map((field) => {
      const value = settings[field.name] ?? field.default;
      return [field.name, value === null || value === undefined ? "" : String(value)];
    }),
  );
}

/** The settings to send: empty fields are left out (the type's default applies), numbers as numbers. */
export function settingsValues(fields: SettingsField[], text: Record<string, string>): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    const value = (text[field.name] ?? "").trim();
    if (!value) continue;
    values[field.name] = field.kind === "integer" || field.kind === "number" ? Number(value) : value;
  }
  return values;
}
