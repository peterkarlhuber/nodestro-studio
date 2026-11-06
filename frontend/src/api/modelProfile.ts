// What one model offers an agent: capabilities, token limits and which agent options apply
// (nodestro-api: GET /api/models/profile; nodestro_runtime.model_profile).
//
// The agent editor shows options by what the chosen model supports, not by provider name, and the agent builder
// refuses the same options with the same reason codes. Unknown values stay unknown: the hook never guesses.

import { useQuery } from "@tanstack/react-query";

import { useDebounced } from "../lib/useDebounced";
import { request } from "./client";
import type { ModelProfile, OptionSupport } from "./types";

export const modelProfileKey = (model: string) => ["model-profile", model] as const;

export function fetchModelProfile(model: string): Promise<ModelProfile> {
  return request<ModelProfile>("GET", `/models/profile?model=${encodeURIComponent(model)}`);
}

/**
 * The profile of ``model``, asked once the id has stopped changing (typed ids). ``undefined`` while it loads or when
 * the API predates the route: callers then keep the options visible (the backend validation still refuses them).
 */
export function useModelProfile(model: string | null | undefined): ModelProfile | undefined {
  const settled = useDebounced(model ?? "", 400);
  const answer = useQuery({
    queryKey: modelProfileKey(settled),
    queryFn: () => fetchModelProfile(settled),
    enabled: settled !== "" && settled === model,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const data = answer.data;
  // An answer without options (an older API, a stub) counts as unknown.
  return settled === model && data && typeof data === "object" && "options" in data && !data.error ? data : undefined;
}

export type ModelOption = keyof ModelProfile["options"];

/** The support of ``option``; null when unknown (no profile yet): the option stays shown. */
export function optionSupport(profile: ModelProfile | undefined, option: ModelOption): OptionSupport | null {
  return profile?.options?.[option] ?? null;
}

/** The effort levels the model accepts; null when undocumented (every level is offered). */
export function acceptedEfforts(profile: ModelProfile | undefined): string[] | null {
  return profile?.limits?.efforts ?? null;
}
