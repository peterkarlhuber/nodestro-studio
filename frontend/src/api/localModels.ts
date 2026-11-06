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
  /** The last measured generation speed ("Measure speed"); null until measured. Never an estimate. */
  speed?: ModelSpeed | null;
}

export interface ModelSpeed {
  tokens_per_second: number;
  measured_at: string;
  /** The context window the measurement ran with. */
  context_length: number | null;
  /** Prompt processing speed of the same measurement, when the server reports it. */
  prompt_tokens_per_second?: number | null;
  /** Where the model ran during the measurement. */
  processor?: "gpu" | "cpu" | "mixed" | null;
}

/** configured: Nodestro starts the server with this window; server: read from the running server; unknown: not measured. */
export type ContextSource = "configured" | "server" | "unknown";

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
  /** The context window of the server's models in tokens (older APIs leave both out). */
  context_length?: number | null;
  context_source?: ContextSource;
  /** Models run on a GPU; null: unknown (an external server). */
  accelerated?: boolean | null;
}

export interface CatalogModel {
  name: string;
  kind: "chat" | "embedding";
  family: string;
  download_bytes: number;
  digest: string;
  listed_capabilities: string[];
  min_ollama: string;
  /** The SPDX id ("Apache-2.0"); APIs before license_source add an English note: "Apache-2.0 (upstream; ...)". */
  license: string;
  /** Where the license was read: the Ollama manifest's license layer, or the publisher's model card (upstream). */
  license_source?: "ollama" | "upstream";
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
  /** registry: pulled from the Ollama library; build: built from pinned upstream files (e.g. mdenseon:307m). */
  source?: "registry" | "build";
  /** Build: the pinned input files, when the API lists them (shown so an air-gapped computer gets the right ones). */
  build_inputs?: BuildInput[];
  /** Whether the runtime's fits() says the model can run on this computer (older APIs leave it out). */
  fits?: boolean;
  installed: boolean;
  verified: boolean;
}

/** One pinned input of a model built from upstream files. */
export interface BuildInput {
  role: "weights" | "template";
  /** Where it is published (the URL names the pinned revision). */
  url: string;
  sha256: string;
  /** Bytes; for the template the length of its header (the start of the published file); null when unknown. */
  size: number | null;
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
  /**
   * The hardware of the computer that runs the model server; null for a server's tenants (API3-08: the server's
   * machine is its operator's). Their status then also has no base_url, runtime_path, models_dir, free_bytes or
   * detected_external (null).
   */
  hardware: Hardware | null;
  recommendations: Recommendation[];
  /** False on a server's tenants: the operator runs the model server. */
  manageable: boolean;
  /** Hints for this computer and server (context window, CPU only, memory, slow models); older APIs leave it out. */
  advice?: LocalAdvice[];
}

/**
 * One hint of the runtime. Codes: local.context_small (value: tokens, recommended: tokens), local.context_unknown,
 * local.cpu_only, local.reasoning_saving, local.model_slow (model; value: measured tokens/s x 10),
 * local.model_too_large (model; value: its memory need in bytes), local.memory_low (value: RAM, recommended: RAM, in
 * bytes). Unknown codes get a general sentence.
 */
export interface LocalAdvice {
  code: string;
  severity: "info" | "warning";
  model: string | null;
  value: number | null;
  recommended: number | null;
}

export type LocalJobKind =
  | "pull"
  | "setup"
  | "install_runtime"
  | "import_package"
  | "import_gguf"
  | "move_models"
  | "build"
  | "benchmark";

export type LocalStepState = "pending" | "running" | "done" | "skipped" | "failed";

/** One step of a job as the runtime runs it (setup: check … ready; download: check, manifest, download, verify, finalize). */
export interface LocalJobStep {
  id: string;
  state: LocalStepState;
  /** A code for the interface's own text (e.g. "bundled", "already_running", "gpu_nvidia"). */
  note?: string | null;
  /** Technical detail in English (paths, versions, addresses), shown on request. */
  detail?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
}

/** One file of a model download as Ollama reports it. */
export interface LocalJobLayer {
  digest: string;
  total: number | null;
  completed: number;
}

export interface LocalJob {
  id: string;
  kind: LocalJobKind;
  target: string;
  state: LocalJobState;
  /** Bytes (or items) of the step named by progress_step. */
  completed: number;
  total: number | null;
  message: string;
  error_code: string | null;
  error: string | null;
  started_at: string;
  finished_at: string | null;
  // Steps and measured progress (older APIs leave them out).
  /** The step that runs now. */
  phase?: string | null;
  steps?: LocalJobStep[];
  /** The step completed/total belong to; any other running step has no measurable progress. */
  progress_step?: string | null;
  /** Whether total is final (a model download learns each file's size only when Ollama starts it). */
  total_final?: boolean;
  /** Measured bytes per second; null while not measured reliably. */
  rate?: number | null;
  /** Remaining seconds; null when not reliable. eta_scope: the whole job, or the file that downloads now. */
  eta_seconds?: number | null;
  eta_scope?: "job" | "file" | null;
  /** Seconds without new bytes in a running download (null: data arrives). */
  stalled_seconds?: number | null;
  /** Bytes already there when the job started (a download that continues). */
  resumed_bytes?: number;
  layers?: LocalJobLayer[];
  /** Technical lines (English). */
  log?: string[];
  /** Whether starting the same job again makes sense now. */
  retryable?: boolean;
  updated_at?: string | null;
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
  | { kind: "gguf"; path: string; name: string; projector?: string | null }
  /** A catalog model with source "build": its upstream weights and template files on this computer. */
  | { kind: "build"; path: string; name: string; template: string };

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
  /** Sets the server up step by step (one job; a second one is refused while it runs). */
  setup: (source: { archive?: string; download?: boolean } = {}) => request<LocalJob>("POST", "/local-models/setup", source),
  pull: (model: string) => request<LocalJob>("POST", "/local-models/pull", { model }),
  /** Measures the generation speed of an installed chat model (a short local generation). */
  benchmark: (model: string) => request<LocalJob>("POST", "/local-models/benchmark", { model }),
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

/**
 * The local model jobs: polled every second while one runs, and every ten seconds otherwise, so that a job started
 * elsewhere (another tab, the assistant, another admin) shows up without a reload.
 */
export function useLocalJobs(enabled = true) {
  return useQuery({
    queryKey: localKeys.jobs,
    queryFn: localApi.jobs,
    enabled,
    refetchInterval: (query) => (query.state.data?.some((job) => job.state === "running") ? 1_000 : 10_000),
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
