// Missing local models (nodestro-api: nodestro_api/model_readiness.py, nodestro_runtime/local_readiness.py).
//
// An interactive action whose local model is not ready is refused with 409 "model.local_unavailable"; its params
// carry the problem (cause, operating mode, what this person may do) and the ready alternatives. The same answer comes
// from POST /api/local-models/readiness, which the dialog asks again after a download or setup.

import { ApiError, request } from "./client";
import type { LocalJob, LocalMode } from "./localModels";

export const MODEL_UNAVAILABLE = "model.local_unavailable";

/** Why the model cannot be used now (never lumped together as "missing"). */
export type ModelCause =
  | "model_missing"
  | "runtime_missing"
  | "server_stopped"
  | "server_unreachable"
  | "server_missing"
  | "model_name_invalid"
  | "disk_full"
  | "capability_missing"
  | "hardware_insufficient";

/** What the person may do, computed by the server from permission, operating mode and the strict offline mode. */
export type ModelAction = "download" | "setup_server" | "retry" | "choose_model" | "ask_admin" | "open_settings";

/** What the model is needed for. */
export type ReadinessAction = "architect" | "assistant" | "agent_design" | "agent_test" | "run" | "knowledge_index" | "check";

export interface ModelProblem {
  cause: ModelCause;
  model: string;
  name: string;
  action: ReadinessAction;
  mode: LocalMode;
  /** Where the model has to be installed. */
  location: "this_computer" | "container" | "remote" | "server";
  actions: ModelAction[];
  /** Why no download is offered although the model is missing. */
  blocked: "permission" | "operator" | "offline" | null;
  offline: boolean;
  catalog: boolean;
  download_bytes: number | null;
  memory_bytes: number | null;
  free_bytes: number | null;
  partial_bytes: number | null;
  fits: boolean | null;
  missing_capabilities: string[];
  /** ``missing_capabilities`` come from the model registry before a download (a model outside the catalog that is not
   * installed): the model was not downloaded. Missing from an API before nodestro-runtime RT-062. */
  from_registry?: boolean;
  /** A download or setup that runs now: followed instead of starting another. */
  job: LocalJob | null;
  /** The last download of this model that stopped: starting it again continues where it stopped. */
  previous_job: LocalJob | null;
  host: string | null;
}

export interface ModelAlternative {
  model: string;
  provider: string;
  local: boolean;
  context_window: number | null;
  max_output_tokens: number | null;
  limited: boolean;
}

export interface Readiness {
  model: string;
  ready: boolean;
  problem: ModelProblem | null;
  alternatives: ModelAlternative[];
}

export const readinessApi = {
  check: (model: string, action: ReadinessAction = "check", capabilities: string[] = []) =>
    request<Readiness>("POST", "/local-models/readiness", { model, action, capabilities }),
  /** Downloads the model; a download of the same model that runs already is followed instead (never twice). */
  download: (model: string) => request<LocalJob>("POST", "/local-models/pull", { model: model.replace(/^ollama:/, ""), attach: true }),
};

/** The problem of a refused action, or null for any other error. */
export function unavailableModel(error: unknown): Readiness | null {
  if (!(error instanceof ApiError) || error.code !== MODEL_UNAVAILABLE) return null;
  const problem = error.params.problem as ModelProblem | undefined;
  if (!problem || typeof problem !== "object" || typeof problem.cause !== "string") return null;
  const alternatives = Array.isArray(error.params.alternatives) ? (error.params.alternatives as ModelAlternative[]) : [];
  return { model: problem.model, ready: false, problem, alternatives };
}

/** Codes of problems (checks, runs, schedules, batches) that a missing local model causes; params.model names it. */
export const LOCAL_MODEL_CODES: ReadonlySet<string> = new Set([
  "check.local_model_missing",
  "run.local_model_missing",
  "check.local_runtime_missing",
  MODEL_UNAVAILABLE,
]);

/** The qualified local model a coded problem names (null: none, or not a local model problem). */
export function problemModel(item: { code?: string | null; params?: Record<string, unknown> | null } | null | undefined): string | null {
  // A refused unattended start (a schedule, a batch) lists the check's problems: the first local model among them.
  if (item?.code === "workflow.blocked" && Array.isArray(item.params?.problems)) {
    for (const found of item.params.problems as { code?: string; params?: Record<string, unknown> }[]) {
      const model = found && typeof found === "object" ? problemModel(found) : null;
      if (model) return model;
    }
    return null;
  }
  if (!item?.code || !LOCAL_MODEL_CODES.has(item.code)) return null;
  const model = item.params?.model;
  if (typeof model !== "string" || !model.trim()) return null;
  return model.startsWith("ollama:") ? model : `ollama:${model}`;
}
