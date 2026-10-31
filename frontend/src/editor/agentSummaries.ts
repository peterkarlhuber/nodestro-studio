// What the collapsed sections of the agent form say about their content: the problems routed to each section and
// short summaries that name every setting a new agent would not have. Pure functions, so they can be tested
// without rendering the form.

import type { TFunction } from "i18next";

import type { AgentConfig, ConfigIssue } from "../api/types";
import type { SectionStatus } from "../components/ui";
import { defaultAgent } from "../lib/defaults";

export type AgentSectionId = "tools" | "knowledge" | "memory" | "output" | "thinking" | "quality" | "advanced";

/** The section that shows the problems of a configuration field (`ConfigIssue.field` from the runtime). */
export const SECTION_OF_FIELD: Record<string, AgentSectionId> = {
  tools: "tools",
  server_tools: "tools",
  knowledge: "knowledge",
  quality: "quality",
};

/** Fields whose problems are shown next to the core fields at the top, outside any section. */
export const CORE_FIELDS: ReadonlySet<string> = new Set(["task_template"]);

export function sectionOf(issue: ConfigIssue): AgentSectionId | null {
  return issue.field ? (SECTION_OF_FIELD[issue.field] ?? null) : null;
}

/** Errors and warnings a section holds; info messages are hints, not problems. */
export function sectionStatus(issues: ConfigIssue[], section: AgentSectionId): SectionStatus {
  const mine = issues.filter((issue) => sectionOf(issue) === section);
  return {
    errors: mine.filter((issue) => issue.level === "error").length,
    warnings: mine.filter((issue) => issue.level === "warning").length,
  };
}

/** Problems with a field no section knows: shown at the top so none is ever hidden. */
export function unroutedIssues(issues: ConfigIssue[]): ConfigIssue[] {
  return issues.filter(
    (issue) => issue.level !== "info" && issue.field !== null && !CORE_FIELDS.has(issue.field) && sectionOf(issue) === null,
  );
}

/** Join summary parts; at most `limit` parts, the rest as "+n". */
function join(t: TFunction, parts: string[], limit = 3): string {
  if (parts.length <= limit) return parts.join(" · ");
  return [...parts.slice(0, limit), t("agent.summary.more", { count: parts.length - limit })].join(" · ");
}

export function knowledgeSummary(t: TFunction, agent: AgentConfig, files: number): string {
  const parts = [files ? t("agent.knowledge.files", { count: files }) : t("common.none")];
  if (agent.knowledge.citations) parts.push(t("agent.summary.citations"));
  if (agent.knowledge_proposals?.enabled) parts.push(t("agent.summary.proposals"));
  return join(t, parts);
}

export function thinkingSummary(t: TFunction, agent: AgentConfig): string {
  const parts = [t(`agent.options.effortShort.${agent.effort ?? "default"}`)];
  if (agent.thinking) parts.push(t(`agent.options.thinking.${agent.thinking}`));
  if (agent.thinking_display) parts.push(t(`agent.options.thinkingDisplay.${agent.thinking_display}`));
  return join(t, parts);
}

/** Every advanced setting that differs from a new agent, or "defaults". */
export function advancedSummary(t: TFunction, agent: AgentConfig): string {
  const base = defaultAgent();
  const parts: string[] = [];
  if (agent.fallbacks.length) parts.push(t("agent.summary.fallbacks", { count: agent.fallbacks.length }));
  if (agent.tool_choice.type !== base.tool_choice.type) {
    parts.push(
      agent.tool_choice.type === "tool" && agent.tool_choice.name
        ? t("agent.summary.forcedTool", { name: agent.tool_choice.name })
        : t("agent.summary.toolChoice", { choice: t(`agent.options.toolChoice.${agent.tool_choice.type}`) }),
    );
  }
  if (
    agent.max_tokens !== base.max_tokens ||
    agent.max_tool_rounds !== base.max_tool_rounds ||
    agent.max_parallel_tools !== base.max_parallel_tools
  ) {
    parts.push(t("agent.summary.limits"));
  }
  if (!agent.cache_control) parts.push(t("agent.summary.noCaching"));
  else if (agent.cache_ttl !== base.cache_ttl) parts.push(t("agent.summary.cacheHour"));
  if (agent.raise_tool_errors !== base.raise_tool_errors) parts.push(t("agent.summary.stopOnToolErrors"));
  if (agent.on_refusal !== base.on_refusal) parts.push(t("agent.summary.refusalReturned"));
  if (agent.messages.length) parts.push(t("agent.summary.examples", { count: agent.messages.length }));
  if (Object.keys(agent.request_options ?? {}).length) parts.push(t("agent.summary.requestOptions"));
  return parts.length ? join(t, parts) : t("agent.summary.defaults");
}
