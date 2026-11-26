// Conversations with own agents (N-04; nodestro-api docs/conversations.md). The server serves them only while it lists
// "conversations" in /api/meta's ``features`` (off by default); otherwise every route answers 404
// ``conversation.disabled`` and the studio shows nothing of them. A conversation is its owner's: another member's
// answers 404 ``conversation.not_found`` on every route, so the studio never shows anything it was not given.

import { useQuery } from "@tanstack/react-query";

import { request, uploadForm } from "./client";
import { useMeta } from "./hooks";
import type { Meta, Problem, SourceEntry, ToolCallApproval, Usage } from "./types";

/** The agent template and its version that answers. */
export interface TemplateRef {
  template_id: string;
  version: number;
}

/** A file of the conversation (an input file of origin ``conversation``). */
export interface AgentConversationFile {
  id: string;
  name: string;
  format: string;
  media_type: string;
  size: number;
  added_at: string;
}

/** How the answer's model received a file. */
export type FileMode = "text" | "document" | "image" | "ocr_text" | "overview" | "unavailable";

export interface MessageFile {
  file_id: string;
  name: string;
  format?: string | null;
  media_type?: string | null;
  size: number;
  mode?: FileMode | null;
  notes?: string[];
}

export interface ToolCallView {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string | null;
  is_error: boolean;
  started_at: string;
  finished_at?: string | null;
  duration_ms?: number | null;
  approval?: ToolCallApproval | null;
}

export type MessageStatus = "complete" | "queued" | "running" | "paused" | "succeeded" | "failed" | "cancelled";

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  seq: number;
  role: "user" | "assistant";
  content: string;
  attachments: MessageFile[];
  tool_calls: ToolCallView[];
  sources: SourceEntry[];
  status: MessageStatus;
  error?: Problem | null;
  agent?: TemplateRef | null;
  model?: string | null;
  usage?: Usage | null;
  cost_usd?: number | null;
  /** The answer's run ("" while it is reserved and its run starts). */
  run_id?: string | null;
  approval_ids: string[];
  reply_to?: string | null;
  created_at: string;
  finished_at?: string | null;
}

export interface AgentConversationSummary {
  id: string;
  title: string;
  agent: TemplateRef;
  model: string;
  offline: boolean;
  messages: number;
  cost_usd: number | null;
  created_at: string;
  updated_at: string;
}

export interface AgentConversation {
  id: string;
  title: string;
  auto_title: boolean;
  agent: TemplateRef;
  model: string;
  offline: boolean;
  budget_usd?: number | null;
  files: AgentConversationFile[];
  created_at: string;
  updated_at: string;
  messages: ConversationMessage[];
  usage: Usage;
  /** The answer being written right now. */
  answering?: string | null;
  /** N-08: ``granted_content`` once the conversation holds content of a granted source; never cleared. */
  provenance?: "unchecked" | "granted_content";
}

export interface AgentConversationIn {
  agent: { template_id: string; version?: number | null };
  /** Empty: the agent's or the default model, only when it is a local model (a cloud model is never chosen). */
  model?: string | null;
  title?: string;
  offline?: boolean;
}

export interface AgentConversationChange {
  title?: string;
  agent?: { template_id: string; version?: number | null };
  model?: string;
  offline?: boolean;
}

export interface ConversationUpload {
  name: string;
  file?: AgentConversationFile | null;
  problem?: Problem | null;
}

/** Final states of an answer: its run ended. */
export const FINAL_STATUSES: ReadonlySet<MessageStatus> = new Set(["complete", "succeeded", "failed", "cancelled"]);

const BASE = "/conversations";
const path = (id: string) => `${BASE}/${encodeURIComponent(id)}`;

export const conversationsApi = {
  list: () => request<AgentConversationSummary[]>("GET", BASE),
  create: (body: AgentConversationIn) => request<AgentConversation>("POST", BASE, body),
  get: (id: string) => request<AgentConversation>("GET", path(id)),
  change: (id: string, body: AgentConversationChange) => request<AgentConversation>("PATCH", path(id), body),
  remove: (id: string) => request<void>("DELETE", path(id)),
  /** The conversation as Markdown, always a download. */
  exportUrl: (id: string) => `/api${path(id)}/export`,
  upload: (id: string, file: File, onProgress?: (share: number) => void) => {
    const form = new FormData();
    form.append("files", file, file.name);
    return uploadForm<ConversationUpload[]>(`${path(id)}/files`, form, onProgress);
  },
  removeFile: (id: string, fileId: string) => request<AgentConversation>("DELETE", `${path(id)}/files/${encodeURIComponent(fileId)}`),
  /** The file as uploaded, always a download. */
  fileUrl: (id: string, fileId: string) => `/api${path(id)}/files/${encodeURIComponent(fileId)}/content`,
  send: (id: string, content: string, fileIds: string[]) =>
    request<{ user: ConversationMessage; assistant: ConversationMessage }>("POST", `${path(id)}/messages`, {
      content,
      file_ids: fileIds,
    }),
  cancel: (id: string, messageId: string) =>
    request<ConversationMessage>("POST", `${path(id)}/messages/${encodeURIComponent(messageId)}/cancel`),
  eventsUrl: (id: string, messageId: string) => `/api${path(id)}/messages/${encodeURIComponent(messageId)}/events`,
};

export const conversationKeys = {
  list: ["agent-conversations"] as const,
  one: (id: string) => ["agent-conversations", id] as const,
};

/** The server's off-by-default areas it serves right now (``features`` of /api/meta; missing on older servers). */
export function featuresOf(meta: Pick<Meta, "features"> | undefined): string[] {
  const found: unknown = meta?.features;
  return Array.isArray(found) ? found.filter((item): item is string => typeof item === "string") : [];
}

/** Whether the server serves conversations with own agents: only an explicit ``conversations`` shows them. */
export function useConversationsEnabled(): boolean {
  return featuresOf(useMeta().data).includes("conversations");
}

export const useAgentConversations = (enabled = true) =>
  useQuery({ queryKey: conversationKeys.list, queryFn: conversationsApi.list, enabled });

export const useAgentConversation = (id: string | null) =>
  useQuery({ queryKey: conversationKeys.one(id ?? ""), queryFn: () => conversationsApi.get(id!), enabled: Boolean(id), retry: false });
