// Local model recommendations in the interface's words, shared by Settings → Local models and the agent form.

import type { TFunction } from "i18next";

import type { LocalReason, LocalTask, Recommendation } from "../api/localModels";
import type { AgentConfig } from "../api/types";

export type ShownReason = Exclude<LocalReason, "installed" | "needs_download">;

/** The text key of a reason; those that speak of "this computer" have a server wording for a server's tenants (ST-048). */
export function reasonKey(reason: ShownReason, server: boolean): ShownReason | "hardware_limit_server" | "no_fit_server" {
  if (server && reason === "hardware_limit") return "hardware_limit_server";
  if (server && reason === "no_fit") return "no_fit_server";
  return reason;
}

export function reasonText(t: TFunction, item: Recommendation, server = false): string {
  return item.reasons
    .filter((reason): reason is ShownReason => reason !== "installed" && reason !== "needs_download")
    .map((reason) => t(`localModels.reasons.${reasonKey(reason, server)}`, { model: item.better ?? "" }))
    .join(" ");
}

/**
 * The task profile an agent's configuration points to (ST-044): a structured result is extraction, tools or knowledge
 * the agent searches or loads on demand make a tool agent, everything else writes text. Only a hint for the suggestion; nothing is stored.
 */
export function agentTask(agent: Pick<AgentConfig, "tools" | "server_tools" | "knowledge" | "output">): LocalTask {
  if (agent.tools.length || agent.server_tools.length || (agent.knowledge?.file_ids.length && agent.knowledge.mode !== "context")) return "tool_agent";
  if (agent.output?.mode === "structured") return "extract";
  return "write";
}
