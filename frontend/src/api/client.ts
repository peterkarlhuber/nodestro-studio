// A thin fetch wrapper for the Nodestro REST API.

import type {
  AttachRequest,
  ChatMessage,
  Conversation,
  ConversationSummary,
  Snapshot,
  ArchitectJob,
  ArchitectRequest,
  ToolDraft,
  ToolDraftDecision,
  AgentConfig,
  AgentDraft,
  AgentTestResult,
  BackupInfo,
  ContextPreview,
  DiagnosticCheck,
  Diagnostics,
  LocalBackup,
  Organize,
  OrganizeKind,
  OrganizeState,
  SearchResult,
  VersionSummary,
  WorkflowVersion,
  AgentTemplate,
  CheckResult,
  ConfigIssue,
  DependencyPlan,
  DependencyScope,
  DependencyStatus,
  ExportedDependencies,
  PythonEnvironment,
  PythonStatus,
  ExampleDetail,
  ExampleSummary,
  KnowledgeFile,
  MemoryFile,
  MemorySeed,
  MemorySpaceInfo,
  Meta,
  ProviderId,
  ProviderSettingsIn,
  Run,
  RunSummary,
  SearchHit,
  Settings,
  SettingsUpdate,
  ToolInfo,
  ToolJob,
  ToolSource,
  TraceImport,
  UsageReport,
  Workflow,
  WorkflowCheck,
  WorkflowIn,
  WorkflowSummary,
  Activation,
  Batch,
  BatchIn,
  BatchPlan,
  BatchSummary,
  BenchmarkComparison,
  BenchmarkPlan,
  BenchmarkRun,
  BenchmarkStart,
  FileRequest,
  ParsedRows,
  PendingApproval,
  ResultFile,
  ResumePlan,
  Schedule,
  ScheduleIn,
  ScheduleState,
  Suite,
  SuiteIn,
  ApiCheck,
  ApiDocs,
  ApiGuide,
  ApiKeyOut,
  ApiLimits,
  ApiOverview,
  ApiRunStatus,
  ApiScope,
  ApiValidation,
  ExportCheck,
  ExportOptions,
  ExportRecord,
  NetworkConfig,
  NetworkStatus,
  NewApiKey,
  Publication,
  PublicationListItem,
  ReleaseSummary,
  AdoptCheck,
  AdoptOutcome,
  AdoptRequest,
  CollectionInfo,
  FileText,
  FormatsInfo,
  InputCleanup,
  InputFile,
  InputStorage,
  RunInput,
  UploadResult,
} from "./types";
import { currentLanguage } from "../i18n";

/**
 * An error response of the API. ``message`` is the technical text (English); ``code`` and
 * ``params`` let the interface explain it in the current language (see lib/errors.tsx).
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null = null,
    readonly params: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

let loginStarted = false;

/**
 * A server answers ``access.login_required`` when the session ended: the browser goes to the login of the
 * identity provider and comes back to the current page. The desktop never answers it (its only principal is the
 * local owner), and the desktop app's own refusals (``access.launch_*``) never lead to a login page.
 */
export function startLogin(location: Pick<Location, "pathname" | "search" | "hash" | "assign"> = window.location): void {
  if (loginStarted) return;
  loginStarted = true;
  const back = `${location.pathname}${location.search}${location.hash}`;
  location.assign(`/api/auth/login?return_to=${encodeURIComponent(back)}`);
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  // The interface language: the backend names new copies and the first examples in it.
  const headers: Record<string, string> = { "Accept-Language": currentLanguage() };
  const init: RequestInit = { method, headers };
  if (body instanceof FormData || body instanceof Blob) {
    init.body = body;
  } else if (body !== undefined) {
    init.body = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  }
  let response: Response;
  try {
    response = await fetch(`/api${path}`, init);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : String(error), 0, "network");
  }
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    let code: string | null = `http.${response.status}`;
    let params: Record<string, unknown> = { status: response.status };
    try {
      const data = await response.json();
      if (typeof data.detail === "string") message = data.detail;
      else if (Array.isArray(data.detail)) {
        message = data.detail.map((d: { msg?: string; loc?: string[] }) => `${d.loc?.join(".")}: ${d.msg}`).join("; ");
        code = "validation";
      }
      if (typeof data.code === "string") code = data.code;
      if (data.params && typeof data.params === "object") params = data.params;
    } catch {
      // not JSON
    }
    if (response.status === 401 && code === "access.login_required") startLogin();
    throw new ApiError(message, response.status, code, params);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const q = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
  const text = search.toString();
  return text ? `?${text}` : "";
};

const chatPath = (id: string) => `/assistant/conversations/${encodeURIComponent(id)}`;

export const api = {
  conversations: () => request<ConversationSummary[]>("GET", "/assistant/conversations"),
  createConversation: (title = "") => request<Conversation>("POST", "/assistant/conversations", { title }),
  conversation: (id: string) => request<Conversation>("GET", chatPath(id)),
  renameConversation: (id: string, title: string) => request<Conversation>("PATCH", chatPath(id), { title }),
  deleteConversation: (id: string) => request<void>("DELETE", chatPath(id)),
  /** The user's explicit choice: Nodestro takes a snapshot of the object for the next messages. */
  attach: (id: string, body: AttachRequest) => request<Conversation>("POST", `${chatPath(id)}/attachments`, body),
  /** A new snapshot for the following messages; ``workflow`` is the editor's unsaved draft. */
  refreshAttachment: (id: string, attachmentId: string, workflow?: WorkflowIn | null) =>
    request<Conversation>("POST", `${chatPath(id)}/attachments/${attachmentId}/refresh`, { workflow: workflow ?? null }),
  detach: (id: string, attachmentId: string) => request<Conversation>("DELETE", `${chatPath(id)}/attachments/${attachmentId}`),
  snapshot: (id: string, snapshotId: string) => request<Snapshot>("GET", `${chatPath(id)}/snapshots/${snapshotId}`),
  /** The assistant answers in the interface language unless the message asks for another. */
  sendMessage: (id: string, content: string) =>
    request<{ user: ChatMessage; assistant: ChatMessage }>("POST", `${chatPath(id)}/messages`, {
      content,
      language: currentLanguage(),
    }),
  retryMessage: (id: string, messageId: string) =>
    request<ChatMessage>("POST", `${chatPath(id)}/messages/${messageId}/retry`, { language: currentLanguage() }),
  cancelMessage: (id: string, messageId: string) => request<ChatMessage>("POST", `${chatPath(id)}/messages/${messageId}/cancel`),
  messageEventsUrl: (id: string, messageId: string) => `/api${chatPath(id)}/messages/${messageId}/events`,

  /** Start the Workflow Architect; the job runs in the background (follow it via its events). */
  startArchitect: (body: ArchitectRequest) => request<ArchitectJob>("POST", "/architect/jobs", body),
  architectJob: (id: string) => request<ArchitectJob>("GET", `/architect/jobs/${id}`),
  cancelArchitect: (id: string) => request<ArchitectJob>("POST", `/architect/jobs/${id}/cancel`),
  /** Take a ready draft: "create" stores a new workflow, "revise" only marks it (the editor applies it). */
  acceptArchitect: (id: string, name?: string) => request<ArchitectJob>("POST", `/architect/jobs/${id}/accept`, { name: name ?? "" }),
  discardArchitect: (id: string) => request<ArchitectJob>("POST", `/architect/jobs/${id}/discard`),
  toolDrafts: () => request<ToolDraft[]>("GET", "/tools/drafts"),
  /** Run a draft's tests in the sandbox; nothing is registered. */
  testToolDraft: (id: string) => request<ToolDraft>("POST", `/tools/drafts/${id}/test`),
  /** The user's approval: sandbox test, then registration if everything passes. */
  approveToolDraft: (id: string) => request<ToolDraftDecision>("POST", `/tools/drafts/${id}/approve`),
  rejectToolDraft: (id: string) => request<void>("DELETE", `/tools/drafts/${id}`),

  meta: () => request<Meta>("GET", "/meta"),
  settings: () => request<Settings>("GET", "/settings"),
  saveSettings: (body: SettingsUpdate) => request<Settings>("PUT", "/settings", body),
  /** Changes one provider's key, endpoint or declared capabilities. */
  saveProvider: (provider: ProviderId, change: ProviderSettingsIn) =>
    request<Settings>("PUT", "/settings", { providers: { [provider]: change } }),

  workflows: () => request<WorkflowSummary[]>("GET", "/workflows"),
  workflow: (id: string) => request<Workflow>("GET", `/workflows/${id}`),
  createWorkflow: (body: Partial<WorkflowIn>) => request<Workflow>("POST", "/workflows", body),
  importWorkflow: (body: WorkflowIn & { python?: ExportedDependencies | null }) =>
    request<Workflow>("POST", "/workflows/import", body),
  /** Saves the workflow; a changed workflow becomes a new version, ``note`` describes it. */
  saveWorkflow: (id: string, body: WorkflowIn, note?: string) =>
    request<Workflow>("PUT", `/workflows/${id}${q({ note })}`, body),
  deleteWorkflow: (id: string) => request<void>("DELETE", `/workflows/${id}`),
  duplicateWorkflow: (id: string) => request<Workflow>("POST", `/workflows/${id}/duplicate`),
  examples: (language: string) => request<ExampleSummary[]>("GET", `/library${q({ language })}`),
  example: (id: string, language: string) => request<ExampleDetail>("GET", `/library/${id}${q({ language })}`),
  /** An independent, editable copy of an example; the example itself never changes. */
  copyExample: (id: string, language: string, tests: boolean) =>
    request<Workflow>("POST", `/library/${id}/copy`, { language, tests }),
  exampleSampleUrl: (id: string, sampleId: string, language: string) =>
    `/api/library/${id}/samples/${sampleId}?language=${encodeURIComponent(language)}`,
  /** ``workflowId`` names the stored workflow (for its Python environment). */
  checkWorkflow: (body: WorkflowIn, workflowId?: string) =>
    request<WorkflowCheck>("POST", `/workflows/check${q({ workflow_id: workflowId })}`, body),
  /** What an agent would receive; free, nothing is sent to the API. */
  previewContext: (body: { workflow: WorkflowIn; node_id: string; workflow_id?: string; input?: string | null; run_id?: string }) =>
    request<ContextPreview>("POST", "/workflows/preview", body),
  versions: (id: string) => request<VersionSummary[]>("GET", `/workflows/${id}/versions`),
  version: (id: string, number: number) => request<WorkflowVersion>("GET", `/workflows/${id}/versions/${number}`),
  describeVersion: (id: string, number: number, description: string) =>
    request<WorkflowVersion>("PATCH", `/workflows/${id}/versions/${number}`, { description }),
  restoreVersion: (id: string, number: number) => request<Workflow>("POST", `/workflows/${id}/versions/${number}/restore`),

  startRun: (workflowId: string, input: string, fileIds: string[] = [], values: Record<string, unknown> = {}) =>
    request<Run>("POST", `/workflows/${workflowId}/runs`, { input, file_ids: fileIds, values }),
  runs: (workflowId?: string, options: { triggerRef?: string; includeChildren?: boolean } = {}) =>
    request<RunSummary[]>(
      "GET",
      `/runs${q({
        workflow_id: workflowId,
        trigger_ref: options.triggerRef,
        include_children: options.includeChildren ? "true" : undefined,
      })}`,
    ),
  resumePlan: (id: string) => request<ResumePlan>("GET", `/runs/${id}/resume`),
  resumeRun: (id: string, mode: "continue" | "restart", confirmSideEffects: boolean) =>
    request<Run>("POST", `/runs/${id}/resume`, { mode, confirm_side_effects: confirmSideEffects }),
  approvals: () => request<PendingApproval[]>("GET", "/approvals"),
  decideApproval: (runId: string, nodeId: string, decision: "approved" | "rejected", comment: string) =>
    request<Run>("POST", `/runs/${runId}/approvals/${encodeURIComponent(nodeId)}`, { decision, comment }),
  resultFiles: (runId: string) => request<ResultFile[]>("GET", `/runs/${runId}/files`),
  createResultFile: (runId: string, body: FileRequest) => request<ResultFile>("POST", `/runs/${runId}/files`, body),
  deleteResultFile: (runId: string, fileId: string) => request<void>("DELETE", `/runs/${runId}/files/${fileId}`),
  resultFileUrl: (runId: string, fileId: string, inline = false) =>
    `/api/runs/${runId}/files/${fileId}${inline ? "?inline=true" : ""}`,
  run: (id: string) => request<Run>("GET", `/runs/${id}`),
  cancelRun: (id: string) => request<{ cancelled: boolean }>("POST", `/runs/${id}/cancel`),
  deleteRun: (id: string) => request<void>("DELETE", `/runs/${id}`),
  /** Store an exported trace file for viewing; nothing is executed. */
  importTrace: (file: Blob) => request<TraceImport>("POST", "/runs/import", file),
  /** A run as a trace file; ``sanitized`` changes only the exported copy. */
  exportRun: (id: string, options: { sanitized: boolean; personalData: boolean; contents: boolean }) =>
    request<Run>(
      "GET",
      `/runs/${id}/export${q({
        mode: options.sanitized ? "sanitized" : "full",
        personal_data: options.sanitized ? String(options.personalData) : undefined,
        contents: options.sanitized ? String(options.contents) : undefined,
      })}`,
    ),
  usage: (days = 30) => request<UsageReport>("GET", `/usage?days=${days}`),

  validateAgent: (config: AgentConfig) => request<ConfigIssue[]>("POST", "/agents/validate", config),
  /** Runs one agent on a test task; not stored as a workflow run. */
  testAgent: (agent: AgentConfig, input: string, raw = false, workflowId?: string) =>
    request<AgentTestResult>("POST", "/agents/test", { agent, input, raw, workflow_id: workflowId ?? null }),
  /** The Agent Architect writes in the interface language unless the description asks for another. */
  designAgent: (description: string, existing: string[]) =>
    request<AgentDraft>("POST", "/agents/design", {
      description,
      existing_agents: existing,
      language: currentLanguage(),
    }),
  templates: () => request<AgentTemplate[]>("GET", "/agents/templates"),
  createTemplate: (agent: AgentConfig) => request<AgentTemplate>("POST", "/agents/templates", { agent }),
  saveTemplate: (id: string, agent: AgentConfig) => request<AgentTemplate>("PUT", `/agents/templates/${id}`, { agent }),
  deleteTemplate: (id: string) => request<void>("DELETE", `/agents/templates/${id}`),

  tools: () => request<ToolInfo[]>("GET", "/tools"),
  tool: (name: string) => request<ToolInfo>("GET", `/tools/${encodeURIComponent(name)}`),
  toolTemplate: () => request<ToolSource>("GET", "/tools/template"),
  checkTool: (body: ToolSource) => request<CheckResult>("POST", "/tools/check", body),
  saveTool: (body: ToolSource) => request<{ check: CheckResult; tool: ToolInfo | null }>("POST", "/tools", body),
  deleteTool: (name: string) => request<void>("DELETE", `/tools/${encodeURIComponent(name)}`),
  runTool: (name: string, input: Record<string, unknown>) =>
    request<{ output: string; is_error: boolean }>("POST", `/tools/${encodeURIComponent(name)}/run`, { input }),
  toolJobs: () => request<ToolJob[]>("GET", "/tools/jobs"),
  toolJob: (id: string) => request<ToolJob>("GET", `/tools/jobs/${id}`),
  startToolJob: (requirement: string) => request<ToolJob>("POST", "/tools/jobs", { requirement }),
  decideToolJob: (id: string, approved: boolean) =>
    request<ToolJob>("POST", `/tools/jobs/${id}/decision`, { approved }),
  /** The answer to the libraries a generated tool needs. */
  decideToolJobDependencies: (id: string, choice: "approve" | "without" | "cancel") =>
    request<ToolJob>("POST", `/tools/jobs/${id}/dependencies`, { choice }),

  pythonStatus: () => request<PythonStatus>("GET", "/python"),
  workflowDependencies: (id: string, workflow?: WorkflowIn) =>
    request<DependencyStatus>("POST", `/python/workflows/${id}/status`, { workflow: workflow ?? null }),
  /** The approval overview; resolves versions, installs nothing. */
  workflowDependencyPlan: (id: string, workflow?: WorkflowIn) =>
    request<DependencyPlan>("POST", `/python/workflows/${id}/plan`, { workflow: workflow ?? null }),
  workflowDependencyExport: (id: string) =>
    request<ExportedDependencies | null>("GET", `/python/workflows/${id}/export`),
  toolDependencies: (name: string, code: string, tests: string) =>
    request<DependencyStatus>("POST", `/python/tools/${encodeURIComponent(name)}/status`, { code, tests }),
  toolDependencyPlan: (name: string, code: string, tests: string) =>
    request<DependencyPlan>("POST", `/python/tools/${encodeURIComponent(name)}/plan`, { code, tests }),
  /** The user's approval: stores the versions and installs them in the background. */
  approveDependencyPlan: (planId: string) => request<PythonEnvironment>("POST", `/python/plans/${planId}/approve`),
  pythonEnvironment: (kind: DependencyScope, ref: string) =>
    request<PythonEnvironment>("GET", `/python/environments/${kind}/${encodeURIComponent(ref)}`),
  reinstallEnvironment: (kind: DependencyScope, ref: string) =>
    request<PythonEnvironment>("POST", `/python/environments/${kind}/${encodeURIComponent(ref)}/install`),
  removeEnvironment: (kind: DependencyScope, ref: string, forget = false) =>
    request<void>("DELETE", `/python/environments/${kind}/${encodeURIComponent(ref)}${q({ forget: forget ? "true" : undefined })}`),
  cleanupEnvironments: () => request<{ removed: string[] }>("POST", "/python/cleanup"),

  knowledge: (query?: string) => request<KnowledgeFile[]>("GET", `/knowledge${q({ q: query })}`),
  uploadKnowledge: (files: File[], description: string, collection = "") => {
    const form = new FormData();
    for (const file of files) form.append("files", file);
    form.append("description", description);
    if (collection) form.append("collection", collection);
    return request<KnowledgeFile[]>("POST", "/knowledge", form);
  },
  updateKnowledge: (id: string, description: string, collection?: string) =>
    request<KnowledgeFile>("PATCH", `/knowledge/${id}`, { description, collection }),
  knowledgeCollections: () => request<CollectionInfo[]>("GET", "/knowledge/collections"),
  checkAdoption: (body: AdoptRequest) => request<AdoptCheck[]>("POST", "/knowledge/adopt/check", body),
  adopt: (body: AdoptRequest & { confirmed: boolean; tokens: string[] }) =>
    request<AdoptOutcome>("POST", "/knowledge/adopt", body),

  inputFormats: () => request<FormatsInfo>("GET", "/inputs/formats"),
  /** Uploads files for a run; ``name`` keeps the relative path of a file from a folder. */
  uploadInputs: (
    files: { file: File; name: string }[],
    options: { accept?: string[]; maxSizeMb?: number | null; origin?: string } = {},
  ) => {
    const form = new FormData();
    for (const item of files) form.append("files", item.file, item.name);
    if (options.accept?.length) form.append("accept", options.accept.join(","));
    if (options.maxSizeMb) form.append("max_size_mb", String(options.maxSizeMb));
    form.append("origin", options.origin ?? "studio");
    return request<UploadResult[]>("POST", "/inputs", form);
  },
  inputFile: (id: string) => request<InputFile>("GET", `/inputs/${id}`),
  inputText: (id: string, path = "") => request<FileText>("GET", `/inputs/${id}/text${q({ path: path || undefined })}`),
  inputUrl: (id: string) => `/api/inputs/${id}/content`,
  deleteInput: (id: string) => request<void>("DELETE", `/inputs/${id}`),
  inputStorage: () => request<InputStorage>("GET", "/inputs"),
  cleanupInputs: (olderThanDays: number | null) =>
    request<InputCleanup>("POST", "/inputs/cleanup", { older_than_days: olderThanDays }),
  runInputs: (runId: string) => request<RunInput[]>("GET", `/runs/${runId}/inputs`),
  deleteKnowledge: (id: string) => request<void>("DELETE", `/knowledge/${id}`),
  searchKnowledge: (query: string, fileIds?: string[]) =>
    request<SearchHit[]>("GET", `/knowledge/search${q({ q: query, file_ids: fileIds?.join(",") })}`),
  knowledgeUrl: (id: string) => `/api/knowledge/${id}/content`,
  recognizeText: (id: string) => request<KnowledgeFile>("POST", `/knowledge/${id}/ocr`),

  // Batches: one workflow over many inputs.
  parseBatchFile: (workflowId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("workflow_id", workflowId);
    return request<ParsedRows>("POST", "/batches/parse", form);
  },
  planBatch: (body: BatchIn) => request<BatchPlan>("POST", "/batches/plan", body),
  createBatch: (body: BatchIn) => request<Batch>("POST", "/batches", body),
  batches: () => request<BatchSummary[]>("GET", "/batches"),
  batch: (id: string) => request<Batch>("GET", `/batches/${id}`),
  pauseBatch: (id: string) => request<Batch>("POST", `/batches/${id}/pause`),
  resumeBatch: (id: string) => request<Batch>("POST", `/batches/${id}/resume`),
  cancelBatch: (id: string) => request<Batch>("POST", `/batches/${id}/cancel`),
  deleteBatch: (id: string) => request<void>("DELETE", `/batches/${id}`),
  batchExportUrl: (id: string, format: "csv" | "json") => `/api/batches/${id}/export?format=${format}`,

  // Workflow test series.
  suites: (workflowId?: string) => request<Suite[]>("GET", `/benchmarks${q({ workflow_id: workflowId })}`),
  suite: (id: string) => request<Suite>("GET", `/benchmarks/${id}`),
  createSuite: (body: SuiteIn) => request<Suite>("POST", "/benchmarks", body),
  updateSuite: (id: string, body: SuiteIn) => request<Suite>("PUT", `/benchmarks/${id}`, body),
  deleteSuite: (id: string) => request<void>("DELETE", `/benchmarks/${id}`),
  planBenchmark: (id: string, body: BenchmarkStart) => request<BenchmarkPlan>("POST", `/benchmarks/${id}/plan`, body),
  startBenchmark: (id: string, body: BenchmarkStart) =>
    request<BenchmarkRun>("POST", `/benchmarks/${id}/runs`, body),
  benchmarkRuns: (suiteId: string) => request<BenchmarkRun[]>("GET", `/benchmarks/${suiteId}/runs`),
  benchmarkRun: (id: string) => request<BenchmarkRun>("GET", `/benchmark-runs/${id}`),
  cancelBenchmarkRun: (id: string) => request<BenchmarkRun>("POST", `/benchmark-runs/${id}/cancel`),
  deleteBenchmarkRun: (id: string) => request<void>("DELETE", `/benchmark-runs/${id}`),
  compareBenchmarkRuns: (a: string, b: string) =>
    request<BenchmarkComparison>("GET", `/benchmark-runs/compare${q({ a, b })}`),

  // Schedules.
  timeZones: () => request<string[]>("GET", "/schedules/time-zones"),
  previewSchedule: (body: ScheduleIn) => request<Activation>("POST", "/schedules/preview", body),
  schedules: () => request<Schedule[]>("GET", "/schedules"),
  createSchedule: (body: ScheduleIn) => request<Schedule>("POST", "/schedules", body),
  updateSchedule: (id: string, body: ScheduleIn) => request<Schedule>("PUT", `/schedules/${id}`, body),
  deleteSchedule: (id: string) => request<void>("DELETE", `/schedules/${id}`),
  enableSchedule: (id: string) => request<ScheduleState>("POST", `/schedules/${id}/enable`),
  disableSchedule: (id: string) => request<ScheduleState>("POST", `/schedules/${id}/disable`),

  memorySpaces: () => request<MemorySpaceInfo[]>("GET", "/memory"),
  memoryFiles: (space: string) => request<MemoryFile[]>("GET", `/memory/${encodeURIComponent(space)}`),
  memoryFile: (space: string, path: string) =>
    request<{ path: string; content: string }>(
      "GET",
      `/memory/${encodeURIComponent(space)}/file${q({ path })}`,
    ),
  writeMemory: (space: string, path: string, content: string) =>
    request<{ path: string; content: string }>("PUT", `/memory/${encodeURIComponent(space)}/file`, { path, content }),
  deleteMemoryFile: (space: string, path: string) =>
    request<void>("DELETE", `/memory/${encodeURIComponent(space)}/file${q({ path })}`),
  clearMemory: (space: string) => request<void>("DELETE", `/memory/${encodeURIComponent(space)}`),
  proposeMemory: (role: string, wishes: string) =>
    request<{ seed: MemorySeed; cost_usd: number | null }>("POST", "/memory/propose", {
      role,
      wishes,
      language: currentLanguage(),
    }),

  search: (query: string) => request<SearchResult[]>("GET", `/search${q({ q: query })}`),
  organize: () => request<OrganizeState>("GET", "/organize"),
  setOrganize: (kind: OrganizeKind, id: string, value: Organize) =>
    request<Organize>("PUT", `/organize/${kind}/${encodeURIComponent(id)}`, value),

  diagnostics: () => request<Diagnostics>("GET", "/diagnostics"),
  checkConnection: (provider?: ProviderId) =>
    request<DiagnosticCheck>("POST", `/diagnostics/connection${provider ? `?provider=${encodeURIComponent(provider)}` : ""}`),

  backupUrl: "/api/backup",
  inspectBackup: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<BackupInfo>("POST", "/backup/inspect", form);
  },
  inspectLocalBackup: (name: string) => request<BackupInfo>("POST", `/backup/local/${encodeURIComponent(name)}/inspect`),
  restoreBackup: (id: string) =>
    request<{ contents: BackupInfo["contents"]; safety_backup: string }>("POST", "/backup/restore", { id, confirm: true }),
  localBackups: () => request<LocalBackup[]>("GET", "/backup/local"),
  localBackupUrl: (name: string) => `/api/backup/local/${encodeURIComponent(name)}`,

  // Published workflows (API & Export).
  apiOverview: (workflowId: string) => request<ApiOverview>("GET", `/workflows/${workflowId}/api`),
  apiCheck: (workflowId: string, version?: number | null) =>
    request<ApiCheck>("POST", `/workflows/${workflowId}/api/check`, { version: version ?? null }),
  publishApi: (workflowId: string, body: { version?: number | null; note?: string; slug?: string | null; activate?: boolean }) =>
    request<{ publication: Publication; release: ReleaseSummary }>("POST", `/workflows/${workflowId}/api/publish`, body),
  publications: () => request<PublicationListItem[]>("GET", "/publications"),
  updatePublication: (
    id: string,
    body: { slug?: string; description?: string; limits?: ApiLimits; network?: boolean },
  ) => request<Publication>("PATCH", `/publications/${id}`, body),
  setPublicationEnabled: (id: string, enabled: boolean, cancelRunning = false) =>
    request<{ publication: Publication; cancelled: number }>("POST", `/publications/${id}/enabled`, {
      enabled,
      cancel_running: cancelRunning,
    }),
  activateRelease: (id: string, number: number) => request<Publication>("POST", `/publications/${id}/activate`, { number }),
  deletePublication: (id: string) => request<void>("DELETE", `/publications/${id}`),
  apiDocs: (id: string, number?: number | null) =>
    request<ApiDocs>("GET", `/publications/${id}/docs${q({ number: number ? String(number) : undefined })}`),
  testApi: (id: string, body: Record<string, unknown>, dryRun: boolean, number?: number | null) =>
    request<ApiValidation | ApiRunStatus>("POST", `/publications/${id}/test`, { body, dry_run: dryRun, number: number ?? null }),
  exportCheck: (id: string, options: ExportOptions, number?: number | null) =>
    request<ExportCheck>("POST", `/publications/${id}/export/check`, { options, number: number ?? null }),
  createExport: (id: string, options: ExportOptions, number?: number | null) =>
    request<ExportRecord>("POST", `/publications/${id}/exports`, { options, number: number ?? null }),
  exports: (id: string) => request<ExportRecord[]>("GET", `/publications/${id}/exports`),
  exportUrl: (exportId: string) => `/api/exports/${exportId}/download`,
  createGuide: (id: string, language: string, number?: number | null) =>
    request<ApiGuide>("POST", `/publications/${id}/guide`, { language, number: number ?? null }),
  guides: (id: string) => request<ApiGuide[]>("GET", `/publications/${id}/guides`),
  decideGuide: (guideId: string, decision: "accept" | "discard") =>
    request<ApiGuide | null>("POST", `/api-guides/${guideId}/decision`, { decision }),
  apiKeys: () => request<ApiKeyOut[]>("GET", "/api-keys"),
  createApiKey: (body: { name: string; scopes: ApiScope[]; publications: string[] }) =>
    request<NewApiKey>("POST", "/api-keys", body),
  revokeApiKey: (id: string) => request<ApiKeyOut>("POST", `/api-keys/${id}/revoke`),
  rotateApiKey: (id: string) => request<NewApiKey>("POST", `/api-keys/${id}/rotate`),
  deleteApiKey: (id: string) => request<void>("DELETE", `/api-keys/${id}`),
  apiNetwork: () => request<NetworkStatus>("GET", "/api-network"),
  configureApiNetwork: (body: NetworkConfig) => request<NetworkStatus>("PUT", "/api-network", body),
};
