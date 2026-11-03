// Local models (Ollama) and the semantic knowledge index. The runtime does the work (managed server, catalog,
// recommendations, offline imports, reindexing); the interface shows it and starts jobs
// (nodestro-api: nodestro_api/api_local_models.py, OpenAPI /api/openapi.json).

import { useQuery } from "@tanstack/react-query";

import { request } from "./client";

/** managed: the desktop's own server; container: Nodestro Local Docker's; external: a saved address; unavailable: none. */
export type LocalMode = "managed" | "container" | "external" | "unavailable";
export type LocalJobState = "running" | "done" | "failed" | "cancelled";
export type LocalQuality = "recommended" | "acceptable" | "limited" | "insufficient";
export type RetrievalMode = "fts" | "vector" | "hybrid";
export type IndexState = "off" | "ready" | "incomplete" | "building" | "reindex_required" | "unavailable";

export interface InstalledModel {
  name: string;
  size: number;
  digest: string;
  kind: "chat" | "embedding";
  /** What the server reports in /api/show; an unknown capability is never assumed. */
  capabilities: string[];
  context_length: number | null;
  embedding_length: number | null;
  /** One of the suggested models. */
  catalog: boolean;
  /** The installed build is the one Nodestro checked (same digest). */
  verified: boolean;
}

export interface LocalStatus {
  mode: LocalMode;
  running: boolean;
  base_url: string | null;
  version: string | null;
  pinned_version: string;
  runtime_installed: boolean;
  runtime_bundled: boolean;
  runtime_path: string | null;
  autostart: boolean;
  models_dir: string | null;
  free_bytes: number | null;
  models: InstalledModel[];
  /** An Ollama the user runs on this computer; used only once its address is saved as the Ollama base URL. */
  detected_external: string | null;
  offline: boolean;
  error_code: string | null;
  error: string | null;
}

export interface CatalogModel {
  name: string;
  kind: "chat" | "embedding";
  family: string;
  download_bytes: number;
  digest: string;
  listed_capabilities: string[];
  min_ollama: string;
  license: string;
  memory_bytes: number;
  rank: number;
  cpu_friendly: boolean;
  context: number | null;
  dimensions: number | null;
  notes: string;
  /** The publisher (e.g. "Mistral AI") and its region ("eu", "cn", "us"). */
  vendor?: string;
  region?: string | null;
  languages?: string[];
  /** Task profiles the model is meant for; empty means all. */
  tasks?: string[];
  /** An alternative to the standard models: suggested only with a matching preference (e.g. European models). */
  alternative?: boolean;
  installed: boolean;
  verified: boolean;
}

export interface Hardware {
  system: string;
  machine: string;
  cpus: number;
  ram_bytes: number | null;
  gpu: "nvidia" | "apple" | "none";
  gpu_memory_bytes: number | null;
}

export interface Recommendation {
  task: string;
  /** The qualified model (ollama:…), or null when nothing fits this computer. */
  model: string | null;
  quality: LocalQuality;
  installed: boolean;
  download_bytes: number;
  reasons: string[];
  /** A better model that needs a download or more memory. */
  better: string | null;
  alternatives: string[];
}

export interface LocalOverview {
  status: LocalStatus;
  catalog: CatalogModel[];
  hardware: Hardware;
  recommendations: Recommendation[];
  /** False on a server's tenants: the operator runs the model server. */
  manageable: boolean;
}

export interface LocalJob {
  id: string;
  kind: "pull" | "install_runtime" | "import_package" | "import_gguf" | "move_models";
  target: string;
  state: LocalJobState;
  completed: number;
  total: number | null;
  message: string;
  error_code: string | null;
  error: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface ReindexJob {
  model: string;
  state: LocalJobState;
  completed: number;
  total: number;
  error_code: string | null;
  error: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface KnowledgeIndexStatus {
  mode: RetrievalMode;
  embedding_model: string | null;
  state: IndexState;
  chunks: number;
  embedded: number;
  active: Record<string, unknown> | null;
  building: Record<string, unknown> | null;
  building_embedded: number;
  /** The running or last reindex. */
  job: ReindexJob | null;
  pgvector: boolean | null;
  detail: string;
}

export type LocalImport =
  | { kind: "package"; path: string; models?: string[] }
  | { kind: "gguf"; path: string; name: string; projector?: string | null };

export const localKeys = {
  overview: ["local-models"] as const,
  jobs: ["local-models", "jobs"] as const,
  index: ["knowledge-index"] as const,
};

export const localApi = {
  overview: () => request<LocalOverview>("GET", "/local-models"),
  start: () => request<LocalStatus>("POST", "/local-models/start"),
  stop: () => request<LocalStatus>("POST", "/local-models/stop"),
  setAutostart: (enabled: boolean) => request<LocalStatus>("PUT", "/local-models/autostart", { enabled }),
  installRuntime: (source: { archive?: string; download?: boolean }) =>
    request<LocalJob>("POST", "/local-models/runtime", source),
  pull: (model: string) => request<LocalJob>("POST", "/local-models/pull", { model }),
  importModel: (body: LocalImport) => request<LocalJob>("POST", "/local-models/import", body),
  deleteModel: (name: string) => request<void>("DELETE", `/local-models/models/${encodeURIComponent(name)}`),
  setStorage: (path: string, transfer: "use" | "copy") =>
    request<LocalJob | LocalStatus>("PUT", "/local-models/storage", { path, transfer }),
  jobs: () => request<LocalJob[]>("GET", "/local-models/jobs"),
  cancelJob: (id: string) => request<LocalJob>("POST", `/local-models/jobs/${encodeURIComponent(id)}/cancel`),
  index: () => request<KnowledgeIndexStatus>("GET", "/knowledge/index"),
  rebuildIndex: (model?: string) => request<KnowledgeIndexStatus>("POST", "/knowledge/index/rebuild", { model: model ?? null }),
  cancelIndex: () => request<KnowledgeIndexStatus>("POST", "/knowledge/index/cancel"),
  dropIndex: () => request<KnowledgeIndexStatus>("DELETE", "/knowledge/index"),
};

/** Whether a job answer is a job (a folder move without copying answers with the status). */
export function isJob(value: LocalJob | LocalStatus): value is LocalJob {
  return "state" in value && "kind" in value;
}

export function useLocalModels(enabled = true) {
  return useQuery({ queryKey: localKeys.overview, queryFn: localApi.overview, enabled, staleTime: 5_000 });
}

/** The jobs; polled while one runs. */
export function useLocalJobs(enabled = true) {
  return useQuery({
    queryKey: localKeys.jobs,
    queryFn: localApi.jobs,
    enabled,
    refetchInterval: (query) => (query.state.data?.some((job) => job.state === "running") ? 1_000 : false),
  });
}

/** The semantic index; polled while it is built. */
export function useKnowledgeIndex(enabled = true) {
  return useQuery({
    queryKey: localKeys.index,
    queryFn: localApi.index,
    enabled,
    refetchInterval: (query) => (query.state.data?.state === "building" || query.state.data?.job?.state === "running" ? 1_500 : false),
  });
}
