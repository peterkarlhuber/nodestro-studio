// Types mirroring the backend's Pydantic models (nodestro-api / nodestro-runtime: nodestro_runtime/schemas.py, OpenAPI /api/openapi.json).

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";
export type ThinkingMode = "adaptive" | "between_tools" | "disabled";
export type ThinkingDisplay = "summarized" | "omitted" | "updates";
export type NodeType = "start" | "agent" | "output" | "condition" | "approval" | "subworkflow" | "orchestrator";
/** ``paused``: the run waits for a person at an approval node. */
export type RunStatus = "queued" | "running" | "paused" | "succeeded" | "failed" | "cancelled";
/** ``skipped``: its branch was not chosen (no error); ``blocked``: a predecessor failed or was cancelled. */
export type NodeStatus =
  | "idle"
  | "waiting"
  | "running"
  | "succeeded"
  | "failed"
  | "skipped"
  | "blocked"
  | "awaiting_approval"
  | "cancelled";
export type RunTrigger = "manual" | "schedule" | "batch" | "benchmark" | "subworkflow" | "resume" | "api";

export interface ExampleMessage {
  role: "user" | "assistant";
  content: string;
}

export interface KnowledgeConfig {
  file_ids: string[];
  mode: "context" | "on_demand" | "search";
  citations: boolean;
}

export interface MemoryConfig {
  mode: "none" | "run" | "persistent";
  space: string | null;
}

export type OutputFieldType = "string" | "number" | "integer" | "boolean" | "string_list" | "number_list";

export interface OutputField {
  name: string;
  type: OutputFieldType;
  description: string;
  required: boolean;
}

export interface OutputConfig {
  mode: "text" | "structured";
  name: string;
  fields: OutputField[];
}

export interface QualityCriterion {
  name: string;
  description: string;
  required: boolean;
}

export interface QualityConfig {
  enabled: boolean;
  criteria: QualityCriterion[];
  max_revisions: number;
  judge_model: string;
}

export interface ToolChoice {
  type: "auto" | "none" | "any" | "tool";
  name?: string | null;
}

export type ContentKind = "extracted" | "generated" | "assumption";

export interface KnowledgeProposalConfig {
  enabled: boolean;
  /** The collection suggested for the proposals. */
  collection: string;
  content_kind: ContentKind;
}

export interface AgentConfig {
  name: string;
  description: string;
  icon: string;
  model: string;
  system_prompt: string;
  task_template: string;
  messages: ExampleMessage[];
  tools: string[];
  server_tools: string[];
  knowledge: KnowledgeConfig;
  /** The agent may propose its result for knowledge; a person confirms every proposal. */
  knowledge_proposals?: KnowledgeProposalConfig;
  memory: MemoryConfig;
  output: OutputConfig;
  quality: QualityConfig;
  effort: Effort | null;
  thinking: ThinkingMode | null;
  thinking_display: ThinkingDisplay | null;
  tool_choice: ToolChoice;
  cache_control: boolean;
  cache_ttl: "5m" | "1h";
  max_tokens: number;
  max_tool_rounds: number;
  max_parallel_tools: number;
  raise_tool_errors: boolean;
  fallbacks: string[];
  on_refusal: "raise" | "return";
  request_options: Record<string, unknown>;
}

export interface Position {
  x: number;
  y: number;
}

export type InputFieldType = "text" | "textarea" | "number" | "date" | "boolean" | "select" | "file";

/** One field of a workflow's input form; placeholders read it as ``{{form.<name>}}``. */
export interface InputField {
  name: string;
  label: string;
  type: InputFieldType;
  description: string;
  required: boolean;
  default: unknown;
  options: string[];
  /** File fields: accepted formats or groups (empty: all known formats). */
  accept?: string[];
  /** File fields: several files allowed. */
  multiple?: boolean;
  max_files?: number | null;
  max_size_mb?: number | null;
  /** File fields: ``auto`` (content when it fits), ``inline`` or ``on_demand`` (overview plus the files tool). */
  delivery?: "auto" | "inline" | "on_demand";
}

export interface StartConfig {
  default_input: string;
  file_ids: string[];
  /** An optional input form; empty keeps the plain free-text input. */
  fields?: InputField[];
}

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "is_true"
  | "is_false"
  | "in"
  | "not_in"
  | "is_empty"
  | "is_not_empty";

/** One named branch of a decision node; ``id`` is the branch's output port. */
export interface ConditionRule {
  id: string;
  label: string;
  field: string;
  operator: ConditionOperator;
  value: unknown;
  case_sensitive: boolean;
}

export interface ConditionConfig {
  source: string | null;
  rules: ConditionRule[];
  mode: "first" | "all";
  default_label: string;
  on_invalid: "default" | "fail";
}

export interface ApprovalConfig {
  instructions: string;
  show: string[];
  allow_comment: boolean;
  require_comment_on_reject: boolean;
  on_reject: "branch" | "stop";
}

export interface SubworkflowConfig {
  workflow_id: string;
  version: number | null;
  input_template: string;
  values: Record<string, string>;
}

/** A team an orchestrator may delegate to; ``version`` null: the latest saved version. */
export interface OrchestratorMember {
  workflow_id: string;
  version: number | null;
}

export const MAX_POOL = 20;
export const MAX_DECISIONS = 50;

/** An AI model that delegates the task step by step to teams of its pool (it has no tools of its own). */
export interface OrchestratorConfig {
  members: OrchestratorMember[];
  task_template: string;
  instructions: string;
  model: string;
  max_decisions: number;
  /** How often one team may be chosen; null: as often as decisions allow. */
  max_per_member: number | null;
}

/** One decision of an orchestrator, as ``orkexa.orchestration`` records it. */
export interface OrchestrationDecision {
  action: "delegate" | "finish";
  member?: string;
  task?: string;
  answer?: string;
  reason?: string;
}

export interface OrchestrationStep {
  index: number;
  /** Null when the model's answer was not a valid decision (see ``raw``). */
  decision: OrchestrationDecision | null;
  /** ``code`` null: accepted. */
  verdict: { code: string | null; message: string };
  result: string | null;
  error: string | null;
  raw: string | null;
}

export interface OrchestrationRecord {
  version: number;
  task: string;
  steps: OrchestrationStep[];
  outcome: "finished" | "stopped" | null;
  answer: string | null;
  stop_code: string | null;
}

export type ReportFormat = "md" | "json" | "csv" | "html" | "pdf" | "docx" | "xlsx";

export interface ResultFileSpec {
  format: ReportFormat;
  name: string;
  sanitize: boolean;
}

export interface OutputNodeConfig {
  files: ResultFileSpec[];
  /** The fields the workflow promises to deliver (output contract of a team); empty: no contract. */
  contract?: OutputField[];
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: Position;
  label: string;
  agent: AgentConfig | null;
  start: StartConfig | null;
  condition?: ConditionConfig | null;
  approval?: ApprovalConfig | null;
  subworkflow?: SubworkflowConfig | null;
  orchestrator?: OrchestratorConfig | null;
  output?: OutputNodeConfig | null;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  /** The branch of a decision or approval node this connection leaves from. */
  source_handle?: string | null;
  /** Makes the connection a loop back to an earlier step (only from a branch). */
  loop?: EdgeLoop | null;
}

/** Limits of a loop connection: the steps from its target to its source run at most ``max_iterations`` times. */
export interface EdgeLoop {
  max_iterations: number;
  on_exhausted: "fail" | "continue";
}

export const MAX_LOOP_ITERATIONS = 20;

/** Execution limits of a workflow's runs; null: no limit of this kind. */
export interface WorkflowLimits {
  /** Most steps of a run executing at the same time (1 to MAX_PARALLEL_LIMIT). */
  max_parallel: number | null;
  /** Longest active execution time of a run in seconds; waiting for approvals does not count. */
  max_duration_s: number | null;
  /** Most node executions of a run (every loop round counts again). */
  max_steps: number | null;
}

export const MAX_PARALLEL_LIMIT = 32;
export const MAX_DURATION_LIMIT_S = 7 * 24 * 3600;
export const MAX_STEPS_LIMIT = 10_000;
export const MAX_CAPABILITIES = 20;
export const MAX_CAPABILITY_LENGTH = 40;
export const NO_LIMITS: WorkflowLimits = { max_parallel: null, max_duration_s: null, max_steps: null };

export interface WorkflowIn {
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  budget_usd: number | null;
  /** Missing in workflows of earlier versions (no limits). */
  limits?: WorkflowLimits;
  /** What the workflow can do as a team (up to MAX_CAPABILITIES short tags); they grant nothing. */
  capabilities?: string[];
}

export interface Workflow extends WorkflowIn {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  agents: number;
  updated_at: string;
  last_run_status: RunStatus | null;
  /** Capability tags and output contract field names (teams); missing from older servers. */
  capabilities?: string[];
  contract?: string[];
}

export interface AgentTemplate {
  id: string;
  agent: AgentConfig;
  created_at: string;
  updated_at: string;
}

export interface Usage {
  requests: number;
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
  thinking_tokens: number;
  web_search_requests: number;
  total_tokens: number;
  /** The complete cost; null when part of it is unknown (see known_cost_usd), never 0 for "unknown". */
  estimated_cost_usd: number | null;
  /** The known part of the cost: a lower bound when cost_complete is false (missing in usage recorded before PRICING-1). */
  known_cost_usd?: number | null;
  /** Whether every request was fully priced; null for usage recorded before price references existed. */
  cost_complete?: boolean | null;
  unpriced_requests?: number;
  /** Requests priced with a price that had not been checked for longer than the warning threshold. */
  stale_price_requests?: number;
  missing_cost_components?: string[];
  pricing_versions?: string[];
  pricing_sources?: string[];
  pricing_quality?: string | null;
  /** Requests a budget admitted without capping their cost (no price, native tools, images, or too large). */
  uncapped_requests?: number;
}

export interface ToolCallRecord {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output: string | null;
  is_error: boolean;
  started_at: string;
  finished_at: string | null;
  /** Where the tool came from; for MCP tools: service, qualified name, definition hash, access, external cost. */
  provenance?: {
    source?: string;
    server_id?: string;
    server_name?: string;
    qualified_name?: string;
    definition_hash?: string | null;
    access?: string;
    /** Always "unknown" for external services: Nodestro cannot know what they charge. */
    external_cost?: string;
  };
}

export interface EvaluationRecord {
  passed: boolean;
  attempts: number;
  feedback: string;
}

export interface DecisionRecord {
  branches: string[];
  labels: string[];
  value: unknown;
  fallback_code: string | null;
  fallback_params: Record<string, unknown>;
  results: Record<string, boolean | null>;
}

export interface ApprovalRecord {
  decision: "approved" | "rejected";
  comment: string;
  decided_at: string;
  decided_by: string;
  reused_from: string | null;
}

export interface NodeRun {
  status: NodeStatus;
  prompt: string | null;
  output: unknown;
  text: string;
  thinking: string;
  /** Technical error text; ``error_code``/``error_params`` explain it in the interface language. */
  error: string | null;
  error_code?: string | null;
  error_params?: Record<string, unknown>;
  tool_calls: ToolCallRecord[];
  usage: Usage;
  evaluation: EvaluationRecord | null;
  memory: Record<string, string> | null;
  started_at: string | null;
  finished_at: string | null;
  decision?: DecisionRecord | null;
  approval?: ApprovalRecord | null;
  child_run_id?: string | null;
  child_version?: number | null;
  /** Orchestrator: every decision with its verdict and the team's result, as it happened. */
  orchestration?: OrchestrationRecord | null;
  /** Orchestrator: the runs of the teams it delegated to, in order. */
  child_run_ids?: string[];
  /** Taken over from this earlier run when a failed run was continued. */
  reused_from?: string | null;
  /** The files the agent received, and how. */
  files?: ProvidedFile[];
  /** Content the agent proposed for knowledge (stored only after confirmation). */
  proposals?: KnowledgeProposal[];
  /** The loop round of this result (0 = first run), one entry per loop around the node. */
  iteration?: number[];
  /** The results of earlier loop rounds, oldest first. */
  earlier?: NodeRun[];
}

export type DeliveryMode = "text" | "document" | "image" | "ocr_text" | "overview" | "unavailable";

export interface ProvidedFile {
  file_id: string;
  name: string;
  format: string | null;
  source: "input" | "knowledge";
  mode: DeliveryMode;
  chars: number;
  notes: string[];
}

export interface KnowledgeProposal {
  id: string;
  title: string;
  content: string;
  content_kind: ContentKind;
  origin: "result" | "tool";
  collection: string;
  created_at: string;
  adopted_file_id: string | null;
}

/** Fields that tell where a run came from; shared by runs and their summaries. */
export interface RunOrigin {
  trigger?: RunTrigger;
  /** For API runs: the publication. */
  trigger_ref?: string | null;
  /** For API runs: the published version (release) the run executes. */
  release_id?: string | null;
  release_number?: number | null;
  /** For API runs: the key that started it ("studio" for a test from Nodestro). */
  api_key_id?: string | null;
  resumed_from?: string | null;
  parent_run_id?: string | null;
  workflow_version?: number | null;
}

export interface Run extends RunOrigin {
  id: string;
  workflow_id: string;
  workflow_name: string;
  workflow: Workflow;
  input: string;
  file_ids: string[];
  /** The values of the workflow's input form. */
  values?: Record<string, unknown>;
  status: RunStatus;
  error: string | null;
  error_code?: string | null;
  error_params?: Record<string, unknown>;
  output: unknown;
  nodes: Record<string, NodeRun>;
  usage: Usage;
  /** The budget the run started with (null: no limit, or a run of an earlier version). */
  budget_usd?: number | null;
  /** Whether the budget capped every request in advance; null without a budget. */
  budget_hard_maximum?: boolean | null;
  /** Active execution time in seconds (waiting for approvals not included). */
  active_seconds?: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  /** Set for runs imported from an exported trace; they are only shown, never executed. */
  imported_at?: string | null;
  source_run_id?: string | null;
  /** Set when the trace came from a sanitized export. */
  sanitized?: SanitizeReport | null;
}

export interface SanitizeReport {
  at: string;
  personal_data: boolean;
  contents: boolean;
  replaced: Record<string, number>;
}

export interface RunSummary extends RunOrigin {
  id: string;
  workflow_id: string;
  workflow_name: string;
  status: RunStatus;
  input: string;
  usage: Usage;
  created_at: string;
  finished_at: string | null;
  error: string | null;
  error_code?: string | null;
  error_params?: Record<string, unknown>;
  imported_at?: string | null;
  source_run_id?: string | null;
  sanitized?: SanitizeReport | null;
}

export interface TraceImport {
  run: RunSummary;
  duplicate: boolean;
}

export interface RunEvent {
  seq: number;
  run_id: string;
  type: string;
  node_id: string | null;
  data: Record<string, unknown>;
  at: string;
}

export type ProviderId = "anthropic" | "openai" | "gemini" | "compatible" | "ollama" | "vllm";

/** What a provider needs and offers (static, from /meta). */
export interface ProviderInfo {
  id: ProviderId;
  label: string;
  /** Whether an API key is required (OpenAI-compatible servers usually need none). */
  needs_key: boolean;
  /** The environment variables that hold the key, in order of precedence. */
  env_vars: string[];
  /** Whether the provider is reached through a base URL. */
  base_url: boolean;
  default_base_url: string | null;
  /** Capabilities are unknown until declared in the settings. */
  declare_capabilities: boolean;
  example_model: string;
}

export type CapabilityState = "supported" | "unsupported" | "unknown";

/** A provider's configuration state; never contains the key. */
export interface ProviderStatus {
  id: ProviderId;
  label: string;
  configured: boolean;
  key_source: "environment" | "settings" | "none" | "not_needed";
  env_var: string | null;
  /** A key is stored, also when the environment overrides it. */
  key_stored: boolean;
  base_url: string | null;
  base_url_default: string | null;
  capabilities: Record<string, CapabilityState>;
}

/** A change of one provider's settings: undefined keeps a value, an empty text removes it. */
export interface ProviderSettingsIn {
  api_key?: string | null;
  base_url?: string | null;
  capabilities?: Record<string, CapabilityState> | null;
}

export interface ModelInfo {
  /** The qualified name provider:model that agent configurations store. */
  id: string;
  provider: ProviderId;
  /** The provider's own model id. */
  model: string;
  label: string;
  tier: string;
  description: string;
  /** Prices in USD per million tokens; null when no price is known (costs then stay unknown). */
  input_usd_per_mtok: number | null;
  output_usd_per_mtok: number | null;
  cache_write_5m_usd_per_mtok: number | null;
  cache_write_1h_usd_per_mtok: number | null;
  cache_read_usd_per_mtok: number | null;
  recommended: boolean;
  /** current, stale, pending_review, custom (an individual price) or unknown (no price). */
  price_status?: "current" | "stale" | "unknown" | "pending_review" | "custom";
  /** Orkexa's quality of the price: verified, contract, unverified or estimated. */
  price_quality?: string | null;
  price_source?: string | null;
  price_version?: string | null;
}

export interface ServerToolInfo {
  key: string;
  label: string;
  description: string;
}

export interface Meta {
  version: string;
  library_version: string;
  providers: ProviderInfo[];
  /** Capabilities that can be declared for OpenAI-compatible endpoints. */
  capabilities: string[];
  models: ModelInfo[];
  server_tools: ServerToolInfo[];
  efforts: Effort[];
}

/** A change of the settings (only the given values change). */
export type SettingsUpdate = Partial<Omit<Settings, "providers" | "default_provider">> & {
  providers?: Partial<Record<ProviderId, ProviderSettingsIn>>;
};

/** Whether the built-in Linux sandbox isolates AI-created code on this computer. */
export interface BuiltinSandboxStatus {
  available: boolean;
  /** Why not: platform, untested-system, landlock, seccomp, root, paths, verify, failed or server; "" if available. */
  reason: string;
  /** Technical detail in English, for support. */
  detail: string;
  /** The Linux distribution, e.g. "ubuntu 24.04". */
  system: string;
}

/** Whether AI-created code can run here: in Docker or in the built-in Linux sandbox. */
export function isolationAvailable(settings: Pick<Settings, "sandbox" | "builtin_sandbox">): boolean {
  return settings.sandbox === "docker" || settings.builtin_sandbox?.available === true;
}

export interface Settings {
  /** Every AI provider with its configuration state. */
  providers: ProviderStatus[];
  /** The provider of new agents (the provider of default_model). */
  default_provider: ProviderId;
  default_model: string;
  assistant_model: string;
  default_budget_usd: number | null;
  sandbox: "subprocess" | "docker";
  docker_available: boolean;
  /** The built-in Linux sandbox: with it, AI-created code runs isolated without Docker (desktop only). */
  builtin_sandbox?: BuiltinSandboxStatus;
  /** The interface language the user picked; null follows the browser. */
  language: string | null;
  /** Cost limit of one Workflow Architect job in USD; null: no limit. */
  architect_budget_usd: number | null;
  /** How often the Workflow Architect may ask the AI for a correction. */
  architect_max_repairs: number;
  /** Recognize text in scanned PDFs locally (needs Tesseract). */
  ocr_enabled?: boolean;
  ocr_available?: boolean;
  /** standard warns about unknown and stale prices; strict refuses requests without a reliable price. */
  price_mode?: "standard" | "strict";
}

/** A message from the backend: a code with parameters for the interface, plus the technical text. */
export interface Problem {
  code: string;
  params: Record<string, unknown>;
  message: string;
}

export interface ConfigIssue extends Problem {
  level: "error" | "warning" | "info";
  field: string | null;
}

/** A finding of the workflow check, attributed to a node or connection where possible. */
export interface CheckIssue extends Problem {
  level: "error" | "warning" | "info";
  node_id: string | null;
  edge_id: string | null;
}

export interface WorkflowCheck {
  /** False when anything blocks the run. */
  ok: boolean;
  problems: CheckIssue[];
  agents: Record<string, ConfigIssue[]>;
  errors: number;
  warnings: number;
}

export interface ToolInfo {
  name: string;
  /** mcp: a tool of a connected MCP service (ADR-0007), approved by an administrator. */
  kind: "builtin" | "custom" | "generated" | "mcp";
  /** ADR-0006: who wrote the code; ``untrusted`` runs only in an isolating sandbox (Docker). */
  trust: "trusted" | "user-authored" | "untrusted";
  description: string;
  input_schema: Record<string, unknown> | null;
  version: number;
  created_at: string | null;
  function_name: string | null;
  code: string | null;
  tests: string | null;
  requirement: string | null;
  /** MCP tools only: the service, the tool's own name there and the approved definition's hash. */
  server_id?: string | null;
  server_name?: string | null;
  mcp_name?: string | null;
  definition_hash?: string | null;
  /** The shared capability statement: access read/write/destructive, reach internal/external, source. */
  capability?: { access: string; reach: string; source: string } | null;
}

export interface TestResult {
  name: string;
  ok: boolean;
  error: string | null;
}

export interface CheckResult {
  ok: boolean;
  /** Third-party libraries must be approved (and installed) before the tests can run. */
  dependencies_pending?: boolean;
  errors: Problem[];
  tests: TestResult[];
  output: string;
  name: string | null;
  description: string | null;
  input_schema: Record<string, unknown> | null;
}

export interface ToolSource {
  function_name: string;
  code: string;
  tests: string;
}

export interface ToolAttempt {
  number: number;
  function_name: string;
  description: string;
  code: string;
  tests: string;
}

export interface ToolJob {
  id: string;
  requirement: string;
  status: "running" | "awaiting_dependencies" | "awaiting_approval" | "approved" | "rejected" | "failed";
  message: string;
  message_code: string;
  message_params: Record<string, unknown>;
  attempts: ToolAttempt[];
  approval: Record<string, unknown> | null;
  /** The approval overview of the libraries the latest proposal needs. */
  dependency_plan: DependencyPlan | null;
  dependencies: string[];
  tool_name: string | null;
  error: string | null;
  cost_usd: number | null;
  created_at: string;
  finished_at: string | null;
}

export interface KnowledgeFile {
  id: string;
  name: string;
  media_type: string;
  kind: "document" | "image";
  size: number;
  description: string;
  created_at: string;
  chunks: number;
  /** ``docx``/``xlsx`` when the file was converted to Markdown on upload. */
  source_format?: string | null;
  scanned?: boolean;
  ocr?: "done" | "unavailable" | "failed" | null;
  ocr_uncertain?: number;
  ocr_words?: number;
  notes?: Record<string, string>;
  collection?: string;
  /** ``upload``, ``input_file``, ``result_file``, ``agent_result`` or ``proposal``. */
  origin?: string;
  provenance?: Record<string, string>;
  searchable?: boolean;
}

export interface CollectionInfo {
  name: string;
  files: number;
}

export interface SearchHit {
  file_id: string | null;
  source: string;
  title: string | null;
  text: string;
  score: number;
}

export interface MemorySpaceInfo {
  name: string;
  files: number;
  size: number;
}

export interface MemoryFile {
  path: string;
  size: number;
}

export interface MemorySeed {
  files: { path: string; content: string }[];
  explanation: string;
}

export interface AgentDraft {
  config: AgentConfig;
  missing_tools: { name: string; requirement: string }[];
  notes: Problem[];
  cost_usd: number | null;
}

export interface UsageBucket {
  key: string;
  label: string;
  runs: number;
  /** AI operations outside workflow runs (agent tests, assistants, tool generation). */
  operations: number;
  unpriced: number;
  requests: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  /** The sum of the known costs: a lower bound when cost_state is partial. */
  estimated_cost_usd: number;
  known_cost_usd?: number;
  /** known: every request priced; partial: some costs missing (lower bound); unknown: none priced; none: no requests. */
  cost_state?: "known" | "partial" | "unknown" | "none";
  stale_price_requests?: number;
  missing_cost_components?: string[];
  pricing_versions?: string[];
  pricing_sources?: string[];
  pricing_quality?: string | null;
}

export type UsageSource =
  | "agent_test"
  | "agent_design"
  | "memory_proposal"
  | "tool_generation"
  | "workflow_design"
  | "assistant"
  | "benchmark_judge"
  | "api_docs";

export interface UsageEntry {
  id: string;
  at: string;
  source: UsageSource;
  label: string;
  model: string;
  usage: Usage;
  ref: string | null;
  /** The kind of request within the operation, e.g. "plan" or "tool" for the Workflow Architect. */
  detail: string | null;
  /** The single request within ``ref``, e.g. the answer of an assistant conversation. */
  request?: string | null;
  /** Part of the tokens are estimated (a cancelled answer). */
  estimated?: boolean;
}

export interface UsageReport {
  total: UsageBucket;
  by_day: UsageBucket[];
  by_workflow: UsageBucket[];
  by_model: UsageBucket[];
  by_source: UsageBucket[];
  recent: UsageEntry[];
}

// ---- agent test and context preview -------------------------------------------

export interface AgentTestResult {
  id: string;
  kind: "agent_test";
  agent_name: string;
  model: string;
  prompt: string;
  status: "succeeded" | "failed";
  output: unknown;
  text: string;
  tool_calls: ToolCallRecord[];
  error: string | null;
  error_code: string | null;
  error_params: Record<string, unknown>;
  usage: Usage;
  evaluation: EvaluationRecord | null;
  memory: Record<string, string> | null;
  memory_isolated: boolean;
  started_at: string;
  finished_at: string | null;
}

export interface PromptSegment {
  kind: "text" | "run_input" | "input" | "pending";
  text: string;
  node_id: string | null;
  label: string | null;
  truncated: boolean;
}

export interface PreviewInput {
  node_id: string;
  label: string;
  status: "available" | "pending";
  run_status: string | null;
  chars: number;
}

export interface KnowledgeRef {
  id: string;
  name: string | null;
  missing: boolean;
  /** Run files: how the agent gets the file. */
  mode?: DeliveryMode | null;
  format?: string | null;
  source?: string | null;
  chars?: number;
  notes?: string[];
}

export interface ContextPreview {
  node_id: string;
  agent_name: string;
  model: string;
  system_prompt: string;
  task_template: string;
  segments: PromptSegment[];
  complete: boolean;
  inputs: PreviewInput[];
  placeholders: { name: string; status: "run_input" | "input" | "not_connected" | "unknown" }[];
  run_input: string;
  run_input_source: "given" | "start_default" | "run" | "empty";
  run_id: string | null;
  run_created_at: string | null;
  examples: ExampleMessage[];
  tools: string[];
  server_tools: string[];
  knowledge_mode: KnowledgeConfig["mode"];
  knowledge: KnowledgeRef[];
  run_files: KnowledgeRef[];
  memory_mode: MemoryConfig["mode"];
  memory_space: string | null;
  memory_files: number;
  output: OutputConfig;
  quality: boolean;
  request_options: Record<string, unknown>;
}

// ---- versions, organisation, search -------------------------------------------

export interface VersionSummary {
  workflow_id: string;
  number: number;
  label: string;
  created_at: string;
  description: string;
  restored_from: number | null;
  name: string;
  agents: number;
  nodes: number;
  edges: number;
  current: boolean;
}

export interface WorkflowVersion {
  workflow_id: string;
  number: number;
  created_at: string;
  description: string;
  restored_from: number | null;
  snapshot: WorkflowIn;
}

export type OrganizeKind = "workflow" | "template" | "tool";

export interface Organize {
  favorite: boolean;
  tags: string[];
}

export interface OrganizeState {
  items: Record<string, Organize>;
  tags: string[];
}

export interface SearchResult {
  kind: "workflow" | "agent" | "template" | "tool" | "knowledge" | "example";
  id: string;
  title: string;
  subtitle: string;
  snippet: string;
  workflow_id: string | null;
  node_id: string | null;
  score: number;
  favorite: boolean;
  tags: string[];
}

// ---- diagnosis and backups -----------------------------------------------------

export type DiagnosticStatus = "ok" | "warning" | "error";

export interface DiagnosticCheck {
  id: string;
  status: DiagnosticStatus;
  code: string;
  params: Record<string, unknown>;
  message: string;
}

export interface Diagnostics {
  versions: Record<string, string>;
  checks: DiagnosticCheck[];
  status: DiagnosticStatus;
}

export interface BackupContents {
  workflows: number;
  versions: number;
  templates: number;
  runs: number;
  knowledge_files: number;
  memory_spaces: number;
  memory_files: number;
  tools: number;
  usage_entries: number;
  conversations: number;
  input_files: number;
}

export interface BackupInfo {
  id: string;
  file_name: string;
  created_at: string;
  nodestro_version: string;
  library_version: string;
  contents: BackupContents;
  current: BackupContents;
  notes: string[];
}

export interface LocalBackup {
  name: string;
  size: number;
  created_at: string;
}

// ---- example library ----------------------------------------------------------------

export type ExampleCategory = "industry" | "business" | "customers" | "knowledge" | "administration" | "private";
export type ExampleLevel = "beginner" | "advanced";
export type ExamplePattern = "sequential" | "parallel" | "branching";
export type ExampleFeature =
  | "tools"
  | "structured"
  | "judge"
  | "review"
  | "decision"
  | "approval"
  | "form"
  | "subworkflow"
  | "files"
  | "documents"
  | "proposals"
  | "memory";
export type AgentRole = "research" | "analysis" | "planning" | "review" | "writing";

/** One example of the library in one language (GET /api/library). */
export interface ExampleSummary {
  id: string;
  number: number;
  language: string;
  category: ExampleCategory;
  field: string;
  name: string;
  description: string;
  level: ExampleLevel;
  pattern: ExamplePattern;
  featured: boolean;
  /** Finance, law, HR or administration: results need a human check. */
  sensitive: boolean;
  agents: number;
  features: ExampleFeature[];
  tools: string[];
}

export interface ExampleGuide {
  problem: string;
  flow: string;
  input: string;
  result: string;
  adapt: string;
}

export interface ExampleAgent {
  node_id: string;
  name: string;
  description: string;
  role: AgentRole | null;
  model: string;
  tools: string[];
  structured: boolean;
  judge: boolean;
  /** Names of the agents (or the start) whose results this agent receives. */
  receives: string[];
}

/** An example with everything the preview shows (GET /api/library/{id}); nothing is stored. */
export interface ExampleDetail extends ExampleSummary {
  guide: ExampleGuide;
  agent_details: ExampleAgent[];
  input: string;
  workflow: WorkflowIn;
  /** Small synthetic files for the file fields, rendered on download in the chosen language. */
  samples: ExampleSample[];
  /** Names of the prepared test cases; copied as a test series only on request. */
  tests: string[];
}

/** A synthetic sample file for one file field of an example. */
export interface ExampleSample {
  id: string;
  field: string;
  field_label: string;
  format: string;
  file_name: string;
  description: string;
}

// ---- Workflow Architect -------------------------------------------------------------

export type ArchitectMode = "create" | "revise";
export type ArchitectStatus = "running" | "needs_input" | "ready" | "failed" | "cancelled" | "accepted" | "discarded";
export type ArchitectPhase = "analyze" | "plan" | "resources" | "configure" | "tools" | "connect" | "validate" | "present";
/** How a node of the draft relates to the work: being configured, or compared with the original. */
export type ArchitectMark = "pending" | "configured" | "added" | "changed" | "kept" | "removed";

export interface ArchitectRequest {
  mode: ArchitectMode;
  description: string;
  name?: string;
  workflow?: WorkflowIn | null;
  workflow_id?: string | null;
  language: string;
  clarifications?: { question: string; answer: string }[];
  skip_questions?: boolean;
  generate_tools?: boolean;
  budget_usd?: number | null;
}

export interface ArchitectEvent {
  seq: number;
  job_id: string;
  type: "phase" | "log" | "graph" | "usage" | "finished";
  phase: ArchitectPhase | null;
  code: string | null;
  params: Record<string, unknown>;
  message: string;
  level: "info" | "success" | "warning" | "fix";
  data: Record<string, unknown>;
  cost_usd: number | null;
  at: string;
}

export interface RequirementAnalysis {
  title: string;
  goal: string;
  inputs: string[];
  outputs: string[];
  constraints: string[];
  assumptions: string[];
  question: string | null;
}

export interface PlannedTool {
  name: string;
  requirement: string;
}

export interface ToolDraft {
  id: string;
  name: string;
  requirement: string;
  description: string;
  code: string;
  tests: string;
  /** Findings of the static check; no code ran for it. */
  static_errors: Problem[];
  /** Third-party packages the draft needs; nothing is installed before approval. */
  dependencies?: string[];
  status: "draft" | "approved";
  job_id: string | null;
  agents: string[];
  /** The latest sandbox test the user started. */
  check: CheckResult | null;
  created_at: string;
  decided_at: string | null;
}

export interface DraftAgentChange {
  node_id: string;
  name: string;
  kind: "added" | "changed" | "removed" | "kept";
  fields: string[];
}

export interface ArchitectJob {
  id: string;
  mode: ArchitectMode;
  description: string;
  language: string;
  workflow_id: string | null;
  status: ArchitectStatus;
  phase: ArchitectPhase | null;
  phases: ArchitectPhase[];
  question: string | null;
  analysis: RequirementAnalysis | null;
  summary: string;
  assumptions: string[];
  base: WorkflowIn | null;
  draft: WorkflowIn | null;
  marks: Record<string, ArchitectMark>;
  changes: DraftAgentChange[];
  check: WorkflowCheck | null;
  tool_drafts: ToolDraft[];
  missing_tools: PlannedTool[];
  notes: Problem[];
  fixes: number;
  repairs: number;
  max_repairs: number;
  usage: Usage;
  budget_usd: number | null;
  error: Problem | null;
  events: ArchitectEvent[];
  created_at: string;
  finished_at: string | null;
  result_workflow_id: string | null;
}

export interface ToolDraftDecision {
  draft: ToolDraft;
  tool: ToolInfo | null;
}

// ---- Python dependencies --------------------------------------------------------------

export type DependencyScope = "workflow" | "tool";
export type DependencyState =
  | "none"
  | "ready"
  | "approval_needed"
  | "install_needed"
  | "installing"
  | "failed"
  | "unresolved"
  | "unsupported";

/** A direct requirement: the union of what the tools of a workflow (or one tool) need. */
export interface NeededRequirement {
  name: string;
  key: string;
  spec: string;
  extras: string[];
  marker: string;
  required_by: string[];
  modules: string[];
}

export interface DependencyToolIssue extends Problem {
  tool: string;
  blocking: boolean;
}

export interface LockedPackage {
  name: string;
  key: string;
  version: string;
  marker: string;
  direct: boolean;
  runtime: boolean;
  required_by: string[];
}

export interface EnvChange {
  at: string;
  kind: "approved" | "installed" | "install_failed" | "removed" | "imported" | "copied" | "cleaned";
  details: string[];
}

export interface InstallState {
  status: "none" | "installing" | "installed" | "failed";
  step: string | null;
  error: Problem | null;
  log: string[];
  lock_sha: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface DependencyStatus {
  scope: string;
  kind: DependencyScope;
  ref: string;
  label: string;
  state: DependencyState;
  needed: NeededRequirement[];
  issues: DependencyToolIssue[];
  pending: string[];
  reasons: string[];
  packages: LockedPackage[];
  approved_at: string | null;
  python_version: string;
  current_python: string;
  install: InstallState;
  history: EnvChange[];
  problem: Problem | null;
}

export type PlanPackageStatus = "approved" | "new" | "changed" | "runtime" | "removed";

export interface PlanPackage {
  name: string;
  key: string;
  version: string;
  previous_version: string | null;
  marker: string;
  direct: boolean;
  runtime: boolean;
  required_by: string[];
  status: PlanPackageStatus;
  approved_elsewhere: string[];
}

/** The approval overview: resolved versions, nothing installed yet. */
export interface DependencyPlan {
  id: string;
  scope: string;
  kind: DependencyScope;
  ref: string;
  label: string;
  python_version: string;
  requirements: NeededRequirement[];
  packages: PlanPackage[];
  issues: DependencyToolIssue[];
  error: Problem | null;
  needs_approval: boolean;
  created_at: string;
}

export interface PythonEnvironment {
  scope: string;
  kind: DependencyScope;
  ref: string;
  label: string;
  requirements: NeededRequirement[];
  packages: LockedPackage[];
  python_version: string;
  history: EnvChange[];
  install: InstallState;
}

export interface EnvironmentInfo {
  scope: string;
  kind: DependencyScope | null;
  ref: string;
  label: string;
  path: string;
  size_bytes: number;
  orphaned: boolean;
  has_definition: boolean;
  packages: number;
  installed_at: string | null;
}

export interface PythonStatus {
  uv_available: boolean;
  uv_version: string | null;
  python_version: string;
  environments: EnvironmentInfo[];
  cache_bytes: number;
  root: string;
}

/** The dependency part of an exported workflow (never contains approvals). */
export interface ExportedDependencies {
  requirements: NeededRequirement[];
  lock: string;
  packages: LockedPackage[];
  python_version: string;
}

// ---- Nodestro Assistant -----------------------------------------------------------------

export type AttachmentKind = "workflow" | "agent" | "tool" | "memory" | "knowledge" | "run";
export type AttachmentVariant = "saved" | "draft";
export type AttachmentState = "current" | "changed" | "missing" | "draft";

export interface AttachRequest {
  kind: AttachmentKind;
  /** Workflow id, template id or "<workflow id>/<node id>", tool name, memory space, file id, run id. */
  ref_id: string;
  variant?: AttachmentVariant;
  workflow?: WorkflowIn | null;
  paths?: string[];
  include_content?: boolean;
}

export interface Attachment {
  id: string;
  kind: AttachmentKind;
  ref_id: string;
  label: string;
  variant: AttachmentVariant;
  version: string | null;
  snapshot_id: string;
  added_at: string;
  refreshed_at: string | null;
  paths: string[];
  include_content: boolean;
  truncated: boolean;
  secrets: number;
  notes: Problem[];
  state: AttachmentState;
}

export interface ContextRef {
  attachment_id: string;
  snapshot_id: string;
  kind: AttachmentKind;
  ref_id: string;
  label: string;
  variant: AttachmentVariant;
  version: string | null;
  captured_at: string;
  partial: boolean;
  secrets: number;
}

export interface DocSource {
  ref: string;
  title: string;
  chapter_title: string;
  link: string;
}

export type HandoverTarget = "workflow_architect" | "agent_designer" | "tool_builder";

export interface Handover {
  id: string;
  target: HandoverTarget;
  mode: "create" | "revise" | null;
  instruction: string;
  workflow_id: string | null;
  workflow_name: string | null;
  attachment_id: string | null;
  variant: AttachmentVariant | null;
}

export type AssistantStepKind = "context" | "docs_search" | "docs_read" | "generate" | "handover";

export interface AssistantStep {
  kind: AssistantStepKind;
  detail: string;
  at: string;
}

export type ChatStatus = "complete" | "streaming" | "failed" | "cancelled";

export interface ChatMessage {
  id: string;
  conversation_id: string;
  seq: number;
  role: "user" | "assistant";
  content: string;
  status: ChatStatus;
  error: Problem | null;
  context: ContextRef[];
  sources: DocSource[];
  handovers: Handover[];
  steps: AssistantStep[];
  usage: Usage | null;
  estimated: boolean;
  model: string | null;
  language: string | null;
  reply_to: string | null;
  attempts: number;
  created_at: string;
  finished_at: string | null;
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: number;
  attachments: number;
  cost_usd: number | null;
}

export interface Conversation {
  id: string;
  title: string;
  auto_title: boolean;
  created_at: string;
  updated_at: string;
  usage: Usage;
  messages: number;
  attachment_states: Attachment[];
  history: ChatMessage[];
  streaming: string | null;
}

export interface ReplyEvent {
  seq: number;
  message_id: string;
  type: "step" | "delta" | "source" | "handover" | "usage" | "finished";
  text: string;
  data: Record<string, unknown>;
}

export interface Snapshot {
  id: string;
  kind: AttachmentKind;
  ref_id: string;
  label: string;
  variant: AttachmentVariant;
  version: string | null;
  fingerprint: string;
  captured_at: string;
  data: Record<string, unknown>;
  notes: Problem[];
  chars: number;
  truncated: boolean;
  secrets: number;
}

// ---- decisions, approvals, continuing runs, result files -----------------------------

export interface FieldError {
  field: string;
  code: string;
  message: string;
  params: Record<string, unknown>;
}

export interface ReviewItem {
  node_id: string;
  label: string;
  value: unknown;
}

export interface PendingApproval {
  run_id: string;
  root_run_id: string;
  workflow_id: string;
  workflow_name: string;
  path: string[];
  node_id: string;
  label: string;
  instructions: string;
  allow_comment: boolean;
  require_comment_on_reject: boolean;
  on_reject: "branch" | "stop";
  has_rejected_branch: boolean;
  has_approved_branch: boolean;
  waiting_since: string | null;
  trigger: RunTrigger;
  items: ReviewItem[];
}

export type ResumeAction = "reuse" | "rerun" | "run";

export interface ResumeNode {
  node_id: string;
  label: string;
  type: string;
  action: ResumeAction;
  reason: string | null;
  side_effects: string[];
  saved_cost_usd: number | null;
}

export interface ResumePlan {
  run_id: string;
  workflow_id: string;
  possible: boolean;
  can_restart: boolean;
  reused: number;
  rerun: number;
  nodes: ResumeNode[];
  issues: CheckIssue[];
  needs_confirmation: boolean;
  workflow_changed: boolean;
  saved_cost_usd: number | null;
}

export interface ResultFile {
  id: string;
  run_id: string;
  name: string;
  format: ReportFormat;
  media_type: string;
  size: number;
  created_at: string;
  source: "output" | "manual";
  node_id: string | null;
  sanitized: boolean;
  error_code: string | null;
  error: string | null;
  error_params: Record<string, unknown>;
}

export interface FileRequest {
  format: ReportFormat;
  name?: string;
  node_id?: string | null;
  sanitize?: boolean;
  personal_data?: boolean;
}

// ---- batches, test series, schedules ---------------------------------------------------

export interface CostEstimate {
  runs: number;
  per_run_usd: number | null;
  total_usd: number | null;
  max_total_usd: number | null;
  based_on: number;
}

export type BatchItemStatus = "pending" | "invalid" | "running" | "paused" | "succeeded" | "failed" | "cancelled" | "skipped";
export type BatchStatus = "running" | "paused" | "finished" | "cancelled" | "stopped" | "interrupted";

export interface BatchRow {
  values: Record<string, unknown>;
  input: string;
  file_ids: string[];
  ref?: string | null;
}

export interface BatchItem {
  index: number;
  values: Record<string, unknown>;
  input: string;
  file_ids: string[];
  ref: string | null;
  status: BatchItemStatus;
  run_id: string | null;
  previous_run_ids: string[];
  errors: FieldError[];
  error_code: string | null;
  error: string | null;
  error_params: Record<string, unknown>;
  cost_usd: number | null;
  tokens: number;
  duration_s: number | null;
  output: unknown;
}

export interface BatchIn {
  workflow_id: string;
  name: string;
  rows: BatchRow[];
  file_ids: string[];
  concurrency: number;
  max_cost_usd: number | null;
  max_failures: number | null;
  confirm_external: boolean;
}

export interface BatchCounts {
  total: number;
  pending: number;
  running: number;
  paused: number;
  succeeded: number;
  failed: number;
  cancelled: number;
  skipped: number;
  invalid: number;
}

export interface BatchSummary {
  id: string;
  kind: "batch" | "benchmark";
  ref: string | null;
  workflow_id: string;
  workflow_name: string;
  workflow_version: number | null;
  name: string;
  status: BatchStatus;
  stop_code: string | null;
  created_at: string;
  finished_at: string | null;
  cost_usd: number | null;
  counts: BatchCounts;
}

export interface Batch extends BatchSummary {
  stop_params: Record<string, unknown>;
  items: BatchItem[];
  file_ids: string[];
  concurrency: number;
  max_cost_usd: number | null;
  max_failures: number | null;
  tokens: number;
}

export interface BatchPlan {
  total: number;
  valid: number;
  invalid: number;
  items: BatchItem[];
  estimate: CostEstimate;
  external_tools: string[];
  approvals: number;
  fields: string[];
}

export interface ParsedRows {
  columns: string[];
  rows: Record<string, string>[];
  /** Form field -> column. */
  mapping: Record<string, string>;
}

export interface TestCase {
  id: string;
  name: string;
  input: string;
  values: Record<string, unknown>;
  file_ids: string[];
  checks: ConditionRule[];
  judge_criteria: string;
  expected: string;
  /** Set for a case proposed from a failed run (Q-4); absent or null for cases written by hand. */
  origin?: CaseOrigin | null;
}

export interface CaseOrigin {
  run_id: string;
  run_status: string;
  run_at: string;
  workflow_version: number | null;
  error_code: string | null;
  personal_data: boolean;
  replaced: Record<string, number>;
  proposed_at: string;
}

/** A redacted test case from a failed run; nothing is stored until it is saved into a series. */
export interface CaseProposal {
  workflow_id: string;
  case: TestCase;
  missing_files: string[];
  problems: { field: string; code: string; message: string; params?: Record<string, unknown> }[];
}

export interface SuiteIn {
  name: string;
  description: string;
  workflow_id: string;
  cases: TestCase[];
  judge_model: string | null;
}

export interface Suite extends SuiteIn {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface BenchmarkStart {
  version: number | null;
  concurrency: number;
  max_cost_usd: number | null;
  max_failures: number | null;
  judge: boolean;
  confirm_external: boolean;
  /** Agent node id -> model to use instead of the saved one (comparing models, Q-2). Needs ``max_cost_usd``. */
  models: Record<string, string>;
}

export interface CaseCheck {
  rule_id: string;
  label: string;
  passed: boolean | null;
}

export interface JudgeVerdict {
  ai: true;
  model: string;
  passed: boolean;
  score: number;
  criteria: Record<string, unknown>[];
  summary: string;
  cost_usd: number | null;
  error_code: string | null;
  error: string | null;
}

export interface CaseResult {
  case_id: string;
  name: string;
  run_id: string | null;
  run_status: string;
  /** ``null``: not decided (no check and no judge, or the run did not finish). */
  passed: boolean | null;
  checks: CaseCheck[];
  judge: JudgeVerdict | null;
  cost_usd: number | null;
  tokens: number;
  duration_s: number | null;
  output: unknown;
  error_code: string | null;
}

export interface BenchmarkSummary {
  cases: number;
  passed: number;
  failed: number;
  undecided: number;
  errors: number;
  pass_rate: number;
  checks_passed: number;
  checks_total: number;
  judged: number;
  judge_score: number | null;
  cost_usd: number | null;
  judge_cost_usd: number | null;
  tokens: number;
  avg_duration_s: number | null;
}

export type BenchmarkStatus = "running" | "evaluating" | "finished" | "stopped" | "cancelled" | "interrupted";

export interface BenchmarkRun {
  id: string;
  suite_id: string;
  suite_name: string;
  workflow_id: string;
  workflow_version: number | null;
  batch_id: string | null;
  status: BenchmarkStatus;
  stop_code: string | null;
  judge: boolean;
  /** Agent node id -> model this run used instead of the saved one (Q-2); empty for the saved version. */
  models?: Record<string, string>;
  created_at: string;
  finished_at: string | null;
  results: CaseResult[];
  summary: BenchmarkSummary;
  judge_usage: Usage;
}

export interface BenchmarkPlan {
  cases: number;
  estimate: CostEstimate;
  judged_cases: number;
  external_tools: string[];
  approvals: number;
  /** Cases whose form values do not fit the workflow's form (they would be marked invalid). */
  problems: { case: string; errors: FieldError[] }[];
}

export type CaseChange = "improved" | "worse" | "same" | "changed";

export interface CaseComparison {
  case_id: string;
  name: string;
  a: CaseResult | null;
  b: CaseResult | null;
  change: CaseChange;
}

export interface BenchmarkComparison {
  a: BenchmarkRun;
  b: BenchmarkRun;
  cases: CaseComparison[];
}

export type ScheduleKind = "once" | "hourly" | "daily" | "weekly" | "monthly";

export interface ScheduleIn {
  name: string;
  workflow_id: string;
  kind: ScheduleKind;
  at: string;
  start_date: string;
  /** 0 = Monday. */
  weekdays: number[];
  day_of_month: number;
  every_hours: number;
  time_zone: string;
  input: string;
  values: Record<string, unknown>;
  file_ids: string[];
  missed: "skip" | "run_once";
  confirm_external: boolean;
}

export interface Schedule extends ScheduleIn {
  id: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  next_run_at: string | null;
  last_run_at: string | null;
  last_run_id: string | null;
  last_error_code: string | null;
  last_error: string | null;
  last_error_params: Record<string, unknown>;
  runs: number;
  missed_slots: string[];
  missed_total: number;
  completed: boolean;
}

export interface Activation {
  ok: boolean;
  problems: Problem[];
  notes: Problem[];
  external_tools: string[];
  next_runs: string[];
}

export interface ScheduleState {
  schedule: Schedule;
  activation: Activation | null;
}

// ---- published workflows (API & Export) --------------------------------------------------

export type ApiScope = "run" | "read" | "approve";

export interface ApiLimits {
  max_concurrent_runs: number;
  max_waiting_runs: number;
  runs_per_minute: number;
  requests_per_minute: number;
  daily_budget_usd: number | null;
  run_budget_usd: number | null;
  sync_enabled: boolean;
  sync_timeout_seconds: number;
  max_upload_mb: number;
}

export interface PublicationEvent {
  at: string;
  kind:
    | "published"
    | "activated"
    | "enabled"
    | "disabled"
    | "network_on"
    | "network_off"
    | "settings"
    | "renamed"
    | "exported"
    | "gate_on"
    | "gate_changed"
    | "gate_off"
    | "gate_override";
  details: Record<string, unknown>;
}

/** The opt-in release gate of a publication (Q-3). */
export interface ReleaseGate {
  /** Test series whose latest run with the saved models must have tested the published version. */
  suite_ids: string[];
  /** Minimum share (0..1) of cases whose run succeeded and whose checks all passed. */
  min_pass_rate: number;
  /** Minimum mean AI judge score (0..1); null: AI verdicts are shown but not gated. */
  judge_min_score: number | null;
}

export type GateItemKind = "critical" | "deterministic" | "judge";

export interface GateItem {
  kind: GateItemKind;
  code: string;
  passed: boolean;
  suite_id: string;
  suite_name: string;
  run_id: string | null;
  value: number | null;
  threshold: number | null;
  probabilistic: boolean;
  params: Record<string, unknown>;
}

export interface GateReport {
  status: "off" | "passed" | "overridable" | "blocked";
  workflow_version: number | null;
  gate: ReleaseGate | null;
  items: GateItem[];
}

export interface Publication {
  id: string;
  workflow_id: string;
  slug: string;
  name: string;
  description: string;
  enabled: boolean;
  active_release: number | null;
  network: boolean;
  limits: ApiLimits;
  /** null: no release gate (publishing needs no test evidence). */
  gate?: ReleaseGate | null;
  created_at: string;
  updated_at: string;
  history: PublicationEvent[];
}

export interface PublicationListItem {
  id: string;
  slug: string;
  name: string;
  workflow_id: string;
  enabled: boolean;
  network: boolean;
  active_release: number | null;
}

export interface ReleaseSummary {
  id: string;
  number: number;
  workflow_version: number | null;
  note: string;
  created_at: string;
  digest: string;
  active: boolean;
  agents: number;
  approvals: number;
  tools: string[];
  runs: number;
  /** How the release gate let this release through; null: released without a gate. */
  gate?: "passed" | "overridden" | null;
}

export interface ReleaseKnowledge {
  id: string;
  name: string;
  media_type: string;
  size: number;
  sha256: string;
  used_by: string[];
  modes: string[];
}

export interface ReleaseMemory {
  space: string;
  used_by: string[];
}

/** What a reference list is about (GET /api/used-by, UX-7). */
export type ReferenceKind = "knowledge" | "tool" | "memory";

/** One place that uses a knowledge file, a tool or a memory space. */
export interface ReferenceUser {
  kind: "workflow" | "template" | "publication";
  /** The workflow, library agent or publication. */
  id: string;
  name: string;
  node_id: string | null;
  node_label: string | null;
  /** "start": the start node gives the file to every run. */
  role: "agent" | "start";
  /** The active release (publications only). */
  release: number | null;
  /** The published workflow (publications only). */
  workflow_id: string | null;
}

export interface Reference {
  ref: string;
  users: ReferenceUser[];
}

export interface ApiCheck {
  ok: boolean;
  workflow_version: number | null;
  problems: CheckIssue[];
  agents: Record<string, ConfigIssue[]>;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  approvals: number;
  subworkflows: string[];
  tools: string[];
  libraries: string[];
  knowledge: ReleaseKnowledge[];
  memory: ReleaseMemory[];
  errors: number;
  warnings: number;
}

export interface NetworkConfig {
  enabled: boolean;
  host: string;
  port: number;
  tls_certfile: string;
  tls_keyfile: string;
}

export interface NetworkStatus {
  enabled: boolean;
  running: boolean;
  host: string;
  port: number;
  tls: boolean;
  tls_certfile: string;
  tls_keyfile: string;
  urls: string[];
  error: string | null;
  error_code: string | null;
  studio_local_only: boolean;
}

export interface ApiOverview {
  workflow_id: string;
  current_version: number | null;
  publication: Publication | null;
  releases: ReleaseSummary[];
  local_url: string | null;
  network_urls: string[];
  network: NetworkStatus;
  keys: number;
  runs: RunSummary[];
  pending_approvals: number;
  missing_resources: string[];
}

export interface ApiKeyOut {
  id: string;
  name: string;
  scopes: ApiScope[];
  publications: string[];
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  replaces: string | null;
  prefix: string;
}

export interface NewApiKey {
  key: ApiKeyOut;
  /** The complete key; shown this one time only. */
  token: string;
}

export interface ApiEndpoint {
  method: string;
  path: string;
  scope: ApiScope;
  purpose: string;
}

export interface ApiExamples {
  base_url: string;
  endpoints: ApiEndpoint[];
  request: Record<string, unknown>;
  curl: Record<string, string>;
  python: string;
  responses: Record<string, unknown>;
}

export interface ApiDocs {
  number: number;
  openapi: Record<string, unknown>;
  examples: ApiExamples;
  scopes: ApiScope[];
}

export interface ApiValidation {
  ok: boolean;
  request: Record<string, unknown>;
  input_text: string;
}

/** What a published endpoint answers about a run. */
export interface ApiRunStatus {
  run_id: string;
  status: "queued" | "running" | "awaiting_approval" | "succeeded" | "failed" | "cancelled";
  publication: string;
  version: number | null;
  created_at: string;
  error: { code: string; message: string; params: Record<string, unknown> } | null;
  usage: { requests: number; total_tokens: number; estimated_cost_usd: number | null };
  output?: unknown;
}

export interface ExportOptions {
  orkexa: "git" | "bundle";
  confirm_distribution: boolean;
  knowledge: string[];
  memory: string[];
  language: "de" | "en";
  guide_id: string | null;
}

export interface ExportResource {
  kind: "knowledge" | "memory";
  id: string;
  name: string;
  size: number;
  used_by: string[];
  available: boolean;
  included: boolean;
}

export interface ExportCheck {
  ok: boolean;
  problems: CheckIssue[];
  resources: ExportResource[];
  dependencies: string[];
  tool_libraries: string[];
  runtime_modules: string[];
  runtime: Record<string, string>;
  files: string[];
}

export interface ExportRecord {
  id: string;
  publication_id: string;
  release_id: string;
  release_number: number;
  created_at: string;
  options: ExportOptions;
  file_name: string;
  size: number;
  sha256: string;
  files: number;
  warnings: string[];
  runtime: Record<string, string>;
}

export interface ApiGuide {
  id: string;
  publication_id: string;
  release_id: string;
  release_number: number;
  language: string;
  markdown: string;
  model: string;
  usage: Usage;
  created_at: string;
  accepted: boolean;
  accepted_at: string | null;
}

// ---- files as workflow inputs ---------------------------------------------------

export type FormatGroup = "text" | "data" | "document" | "image" | "archive";

export interface FileFormatInfo {
  key: string;
  group: FormatGroup;
  extensions: string[];
  /** Whether knowledge can search its text. */
  indexable: boolean;
}

export interface FormatsInfo {
  formats: FileFormatInfo[];
  limits: Record<string, number>;
}

export interface ArchiveEntry {
  path: string;
  size: number;
  compressed: number;
  is_dir: boolean;
  format: string | null;
  group: string | null;
  status: "ok" | "unsupported" | "nested" | "skipped";
  reason: string | null;
}

export interface InputFile {
  id: string;
  name: string;
  format: string;
  group: FormatGroup;
  media_type: string;
  size: number;
  created_at: string;
  origin: string;
  info: Record<string, unknown>;
  notes: string[];
  outline: string;
  chars: number;
  entries: ArchiveEntry[];
  knowledge_ids: string[];
}

export interface UploadResult {
  name: string;
  file: InputFile | null;
  problem: Problem | null;
}

export interface FileText {
  name: string;
  format: string | null;
  text: string;
  truncated: boolean;
  tables: { name: string; columns: string[]; rows: number; preview: string }[];
}

export interface RunInput {
  id: string;
  source: "input" | "knowledge";
  available: boolean;
  name: string | null;
  file: InputFile | null;
  field: string | null;
}

export interface InputStorage {
  files: number;
  bytes: number;
  unreferenced: number;
  in_use: number;
}

export interface InputCleanup {
  removed: number;
  freed_bytes: number;
  kept_in_use: number;
}

// ---- taking content over into knowledge -------------------------------------------

export interface AdoptSource {
  kind: "input" | "result_file" | "node_output" | "proposal";
  input_id?: string | null;
  path?: string | null;
  run_id?: string | null;
  file_id?: string | null;
  node_id?: string | null;
  proposal_id?: string | null;
  title?: string;
  text?: string | null;
  content_kind?: ContentKind | null;
}

export interface AdoptRequest {
  items: AdoptSource[];
  collection: string;
  description?: string;
}

export interface KnowledgeLink {
  id: string;
  name: string;
  collection: string;
}

export interface AdoptCheck {
  name: string;
  format: string | null;
  size: number;
  indexable: boolean;
  editable: boolean;
  preview: string;
  text: string | null;
  content_kind: ContentKind | null;
  duplicate: KnowledgeLink | null;
  similar: KnowledgeLink[];
  provenance: Record<string, string>;
  token: string;
  problem: Problem | null;
}

export interface AdoptOutcome {
  added: KnowledgeFile[];
  skipped: { name: string; reason: string; existing?: KnowledgeLink; message?: string }[];
}
