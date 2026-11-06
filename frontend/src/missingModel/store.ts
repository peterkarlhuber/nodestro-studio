// The one place where a missing local model is handled, whatever action needed it (Workflow Architect, assistant,
// agent design and tests, run starts, the knowledge index, problems of runs, schedules and checks).
//
// A surface hands the refused action's error to askMissingModel(); the MissingModelHost in the app shell shows the
// dialog, and the promise tells the surface how to continue: with the same model once it is ready, with another
// model the person chose for this action, or not at all (null). The surface keeps its own inputs and repeats its
// own request, so nothing is entered twice and every server-side check (budget, permissions) applies again.

import { create } from "zustand";

import { type ReadinessAction, type Readiness, readinessApi, unavailableModel } from "../api/modelReadiness";

/** How the action continues: ``switched`` when the person chose another ready model for it. */
export interface Resolution {
  model: string;
  switched: boolean;
}

export interface MissingModelRequest {
  id: number;
  readiness: Readiness;
  action: ReadinessAction;
  /** Capabilities the action needs beyond its own (e.g. tools of a tested agent), for the check after a download. */
  capabilities: string[];
  /** Only fix the model (a problem shown in a run or a check): nothing continues by itself afterwards. */
  fixOnly: boolean;
  resolve: (resolution: Resolution | null) => void;
}

interface State {
  request: MissingModelRequest | null;
  open: (request: Omit<MissingModelRequest, "id">) => void;
  /** Ends the request once: later calls (a second click, an automatic continuation) do nothing. */
  finish: (id: number, resolution: Resolution | null) => void;
}

let counter = 0;

export const useMissingModel = create<State>((set, get) => ({
  request: null,
  open: (request) => {
    // A new request replaces one that is still open; the earlier action does not continue.
    get().request?.resolve(null);
    counter += 1;
    set({ request: { ...request, id: counter } });
  },
  finish: (id, resolution) => {
    const current = get().request;
    if (!current || current.id !== id) return;
    set({ request: null });
    current.resolve(resolution);
  },
}));

export interface AskOptions {
  action: ReadinessAction;
  capabilities?: string[];
}

/**
 * The dialog for an error that says a local model is not ready, as a promise of how to continue; null (not a
 * promise) for any other error, which the caller shows as before.
 */
export function askMissingModel(error: unknown, options: AskOptions): Promise<Resolution | null> | null {
  const readiness = unavailableModel(error);
  if (!readiness) return null;
  return new Promise((resolve) =>
    useMissingModel.getState().open({
      readiness,
      action: (readiness.problem?.action as ReadinessAction | undefined) ?? options.action,
      capabilities: options.capabilities ?? [],
      fixOnly: false,
      resolve,
    }),
  );
}

/** The dialog for a model a problem names (a failed run, a schedule, a check): install or set it up, nothing else. */
export async function fixMissingModel(model: string, action: ReadinessAction = "check"): Promise<boolean> {
  const readiness = await readinessApi.check(model, action);
  if (readiness.ready) return true;
  const resolution = await new Promise<Resolution | null>((resolve) =>
    useMissingModel.getState().open({ readiness, action, capabilities: [], fixOnly: true, resolve }),
  );
  return resolution !== null;
}

/**
 * Runs an action and, while it is refused because a local model is not ready, shows the dialog and repeats it: with
 * the same inputs once the model is ready, or with the model chosen for it (``attempt(model)``). Several missing
 * models (a run's agents) come one after the other; the person ending the dialog ends it with the original error.
 */
export async function withLocalModel<T>(attempt: (model?: string) => Promise<T>, options: AskOptions): Promise<T> {
  let model: string | undefined;
  for (let round = 0; ; round += 1) {
    try {
      return await attempt(model);
    } catch (error) {
      const asked = round < 5 ? askMissingModel(error, options) : null;
      const choice = asked ? await asked : null;
      if (!choice) throw error;
      if (choice.switched) model = choice.model;
    }
  }
}
