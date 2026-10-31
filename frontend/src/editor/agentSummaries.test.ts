import { describe, expect, it } from "vitest";

import type { AgentConfig, ConfigIssue } from "../api/types";
import i18n from "../i18n";
import { defaultAgent } from "../lib/defaults";
import {
  SECTION_OF_FIELD,
  advancedSummary,
  knowledgeSummary,
  sectionOf,
  sectionStatus,
  thinkingSummary,
  unroutedIssues,
} from "./agentSummaries";

const t = i18n.t.bind(i18n);
const agent = (patch: Partial<AgentConfig> = {}): AgentConfig => ({ ...defaultAgent(), ...patch });
const issue = (field: string | null, level: ConfigIssue["level"] = "error"): ConfigIssue => ({
  code: "x",
  params: {},
  message: `${field} ${level}`,
  field,
  level,
});

describe("agent section problems", () => {
  // The fields the runtime's AgentBuilder.validate attributes problems to (nodestro_runtime/agent_builder.py).
  it.each(["tools", "server_tools", "knowledge", "quality"])("routes the runtime field %s to a section", (field) => {
    expect(sectionOf(issue(field))).not.toBeNull();
  });

  it("counts errors and warnings per section, not info", () => {
    const issues = [issue("quality"), issue("quality", "warning"), issue("quality", "info"), issue("tools")];
    expect(sectionStatus(issues, "quality")).toEqual({ errors: 1, warnings: 1 });
    expect(sectionStatus(issues, "tools")).toEqual({ errors: 1, warnings: 0 });
    expect(sectionStatus(issues, "advanced")).toEqual({ errors: 0, warnings: 0 });
  });

  it("keeps problems of unknown fields visible at the top", () => {
    const issues = [issue("fallbacks"), issue("task_template", "info"), issue("tools"), issue(null)];
    expect(unroutedIssues(issues).map((item) => item.field)).toEqual(["fallbacks"]);
  });

  it("maps server tools to the tools section", () => {
    expect(SECTION_OF_FIELD.server_tools).toBe("tools");
  });
});

describe("agent section summaries", () => {
  it("says 'Standard' for a new agent's advanced settings", () => {
    expect(advancedSummary(t, agent())).toBe("Standard");
  });

  it("names every changed advanced setting", () => {
    const text = advancedSummary(
      t,
      agent({ fallbacks: ["claude-haiku-5-5"], cache_control: false, raise_tool_errors: true, max_tokens: 2000 }),
    );
    expect(text).toContain("1 Ersatzmodell");
    expect(text).toContain("eigene Grenzen");
    expect(text).toContain("kein Caching");
    expect(text).toContain("+1"); // four changes: three named, the rest counted
  });

  it("names a forced tool", () => {
    expect(advancedSummary(t, agent({ tool_choice: { type: "tool", name: "search" } }))).toBe("immer search");
  });

  it("names request options and example messages", () => {
    const text = advancedSummary(
      t,
      agent({ request_options: { betas: ["x"] }, messages: [{ role: "user", content: "Hi" }] } as Partial<AgentConfig>),
    );
    expect(text).toContain("1 Beispielnachricht");
    expect(text).toContain("Anfrageoptionen");
  });

  it("names citations and proposals next to the file count", () => {
    const configured = agent({
      knowledge: { file_ids: ["a"], mode: "search", citations: true },
      knowledge_proposals: { enabled: true, collection: "", content_kind: "generated" },
    });
    expect(knowledgeSummary(t, configured, 1)).toBe("1 Datei · Zitate · Vorschläge");
    expect(knowledgeSummary(t, agent(), 0)).toBe(t("common.none"));
  });

  it("names thinking settings next to the effort", () => {
    expect(thinkingSummary(t, agent())).toBe(t("agent.options.effortShort.medium"));
    expect(thinkingSummary(t, agent({ thinking: "disabled" }))).toBe(
      `${t("agent.options.effortShort.medium")} · ${t("agent.options.thinking.disabled")}`,
    );
  });
});
