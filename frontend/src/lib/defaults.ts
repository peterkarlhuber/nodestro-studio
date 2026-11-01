import type { AgentConfig, ConditionRule, InputField, NodeType, WorkflowNode } from "../api/types";
import i18n from "../i18n";

let defaultModel = "claude-sonnet-5-5";

/** The model new agents start with: the default model for new agents from the settings. */
export function setDefaultModel(model: string): void {
  defaultModel = model;
}

/** The default model for new agents from the settings; also the judge of a newly enabled quality check. */
export function getDefaultModel(): string {
  return defaultModel;
}

/**
 * A new agent in the interface language: its name, system prompt and output name are content the user edits,
 * so they start in the language the user works in. Stored agents are never rewritten.
 */
export function defaultAgent(overrides: Partial<AgentConfig> = {}): AgentConfig {
  return {
    name: i18n.t("editor.nodes.newAgent"),
    description: "",
    icon: "bot",
    model: defaultModel,
    system_prompt: i18n.t("editor.defaults.systemPrompt"),
    task_template: "{{input}}",
    messages: [],
    tools: [],
    server_tools: [],
    knowledge: { file_ids: [], mode: "on_demand", citations: false },
    memory: { mode: "none", space: null },
    output: { mode: "text", name: i18n.t("editor.defaults.outputName"), fields: [] },
    quality: { enabled: false, criteria: [], max_revisions: 1, judge_model: defaultModel },
    effort: "medium",
    thinking: null,
    thinking_display: null,
    tool_choice: { type: "auto", name: null },
    cache_control: true,
    cache_ttl: "5m",
    max_tokens: 8000,
    max_tool_rounds: 8,
    max_parallel_tools: 1,
    raise_tool_errors: false,
    fallbacks: [],
    on_refusal: "raise",
    request_options: {},
    ...overrides,
  };
}

export function newId(prefix: string): string {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Math.random()}`;
  return `${prefix}_${random.replace(/[^a-z0-9]/gi, "").slice(0, 12)}`;
}

export function newRule(overrides: Partial<ConditionRule> = {}): ConditionRule {
  return { id: newId("rule"), label: "", field: "", operator: "equals", value: "", case_sensitive: false, ...overrides };
}

export function newField(overrides: Partial<InputField> = {}): InputField {
  return {
    name: "",
    label: "",
    type: "text",
    description: "",
    required: false,
    default: null,
    options: [],
    ...overrides,
  };
}

export function newNode(type: NodeType, position = { x: 0, y: 0 }, agent?: Partial<AgentConfig>): WorkflowNode {
  const base = { id: newId("node"), type, position, agent: null, start: null };
  if (type === "agent") {
    const config = defaultAgent(agent);
    return { ...base, label: config.name, agent: config };
  }
  if (type === "start") {
    return { ...base, label: i18n.t("editor.nodes.start"), start: { default_input: "", file_ids: [], fields: [] } };
  }
  if (type === "condition") {
    return {
      ...base,
      label: i18n.t("editor.nodes.condition"),
      condition: {
        source: null,
        rules: [newRule({ label: i18n.t("editor.condition.firstBranch") })],
        mode: "first",
        default_label: "",
        on_invalid: "default",
      },
    };
  }
  if (type === "approval") {
    return {
      ...base,
      label: i18n.t("editor.nodes.approval"),
      approval: {
        instructions: "",
        show: [],
        allow_comment: true,
        require_comment_on_reject: false,
        on_reject: "branch",
      },
    };
  }
  if (type === "subworkflow") {
    return {
      ...base,
      label: i18n.t("editor.nodes.subworkflow"),
      subworkflow: { workflow_id: "", version: null, input_template: "{{input}}", values: {} },
    };
  }
  if (type === "orchestrator") {
    return {
      ...base,
      label: i18n.t("editor.nodes.orchestrator"),
      orchestrator: {
        members: [],
        task_template: "{{input}}",
        instructions: "",
        model: defaultModel,
        max_decisions: 8,
        max_per_member: null,
      },
    };
  }
  return { ...base, label: i18n.t("editor.nodes.output"), output: { files: [] } };
}
