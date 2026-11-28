// Workflows as tools (N-20) in the studio: the approval card of a workflow tool's start (fixed version, arguments,
// what it may do at every depth, a decision for this start only), the workflow part of a conversation's tool call
// (run, cards of the run tree, result files as attachments) and the agent editor's list and dialog, which offer adding
// a workflow only while the server lists ``workflow_tools`` (off by default).

import { UiTextProvider } from "@nodestro/ui-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode, useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AgentConversation, ConversationMessage, WorkflowCallView } from "../api/conversations";
import type { AgentConfig, ToolApprovalRequest, WorkflowEffect, WorkflowToolConfig, WorkflowToolInfo } from "../api/types";
import { MessageItem } from "../conversations/MessageItem";
import { ToolApprovalForm } from "../runs/ToolApprovalCard";
import { splitRef } from "./effect";
import { WorkflowToolsSection, bindingFrom, nameProblem, takenNames } from "./WorkflowToolsSection";

const inMinutes = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();

const EFFECT: WorkflowEffect = {
  access: "write",
  reach: "internal",
  memory: true,
  approvals: 1,
  workflows: ["wf_invoices@3", "wf_ledger@2"],
  unknown: [],
};

const BINDING: WorkflowToolConfig = { workflow_id: "wf_invoices", version: 3, name: "book_invoices", effect: EFFECT };

const WORKFLOWS = [
  { id: "wf_invoices", name: "Rechnungen buchen", description: "", agents: 1, updated_at: "2026-11-20T10:00:00Z", last_run_status: null },
  { id: "wf_ledger", name: "Hauptbuch", description: "", agents: 1, updated_at: "2026-11-20T10:00:00Z", last_run_status: null },
  { id: "wf_self", name: "Dieser Workflow", description: "", agents: 1, updated_at: "2026-11-20T10:00:00Z", last_run_status: null },
];

function request(overrides: Partial<ToolApprovalRequest> = {}): ToolApprovalRequest {
  return {
    id: "tap_1",
    run_id: "run_1",
    node_id: "writer",
    iteration: [],
    call_id: "toolu_1",
    tool: "book_invoices",
    input: { month: "2026-10", input: "Nur offene Posten" },
    capability: { access: "write", reach: "internal", source: "derived" },
    version: 3,
    definition_hash: "def-hash",
    arguments_hash: "hash-shown",
    status: "pending",
    requested_at: new Date().toISOString(),
    deadline: inMinutes(15),
    decided_by: null,
    decided_at: null,
    comment: null,
    closed_because: null,
    ...overrides,
  };
}

function runWith(tools: WorkflowToolConfig[]) {
  return {
    id: "run_1",
    workflow_id: "wf_agent",
    workflow_name: "Buchhaltung",
    status: "running",
    nodes: {},
    workflow: { id: "wf_agent", name: "Buchhaltung", nodes: [{ id: "writer", type: "agent", label: "Buchhalter", agent: { name: "Buchhalter", workflow_tools: tools } }], edges: [] },
  };
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

interface Sent {
  method: string;
  path: string;
  body: unknown;
}
let sent: Sent[] = [];
let routes: Record<string, unknown> = {};

beforeEach(() => {
  sent = [];
  routes = { "/api/workflows": WORKFLOWS, "/api/approvals": [], "/api/tool-approvals": [], "/api/meta": { features: [] } };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = String(url).split("?")[0];
      const method = init?.method ?? "GET";
      sent.push({ method, path, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (method !== "GET") return json(routes[`${method} ${path}`] ?? {});
      if (path in routes) return json(routes[path]);
      return json({ code: "not_found", message: "not found" }, 404);
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <UiTextProvider locale="de">
        <MemoryRouter>{children}</MemoryRouter>
      </UiTextProvider>
    </QueryClientProvider>
  );
}

describe("the approval card of a workflow tool", () => {
  it("names the workflow and its fixed version and shows the arguments and what it may do", async () => {
    routes["/api/runs/run_1"] = runWith([BINDING]);
    routes["/api/workflows/wf_invoices"] = { id: "wf_invoices", name: "Rechnungen buchen", nodes: [], edges: [] };
    render(wrap(<ToolApprovalForm request={request()} />));
    const card = await screen.findByTestId("workflow-tool-approval");
    expect(card).toHaveAttribute("data-version", "3");
    expect(await within(card).findByText("Workflow „Rechnungen buchen“ starten")).toBeInTheDocument();
    expect(within(card).getByText("Version 3 (fest)")).toBeInTheDocument();
    expect(within(card).getByText(/als Tool book_invoices/)).toBeInTheDocument();
    // The arguments as a list and as the exact JSON.
    const args = within(card).getByTestId("workflow-tool-args");
    expect(args).toHaveTextContent("month");
    expect(args).toHaveTextContent("2026-10");
    expect(card).toHaveTextContent('"input": "Nur offene Posten"');
    // What it may do, at every depth: access, reach, memory, approval steps and the workflows inside.
    expect(within(card).getByText("Ändert Daten")).toBeInTheDocument();
    expect(within(card).getByText("Bleibt in Nodestro")).toBeInTheDocument();
    expect(within(card).getByText("Nutzt dauerhaftes Memory")).toBeInTheDocument();
    expect(within(card).getByText("1 Freigabeschritt")).toBeInTheDocument();
    expect(within(card).getByTestId("workflow-tool-nested")).toHaveTextContent("Hauptbuch (Version 2)");
    // Never remembered: no scope or duration choice, and the card says it holds for this start only.
    expect(within(card).queryByTestId("tool-approval-remember")).toBeNull();
    expect(within(card).getByTestId("workflow-tool-approval-once")).toBeInTheDocument();
    expect(screen.queryByTestId("tool-approval")).toBeNull();
  });

  it("sends the hash of the shown arguments with the comment to the tool approval route", async () => {
    routes["/api/runs/run_1"] = runWith([BINDING]);
    render(wrap(<ToolApprovalForm request={request()} />));
    const card = await screen.findByTestId("workflow-tool-approval");
    await userEvent.type(within(card).getByRole("textbox"), "ok so");
    await userEvent.click(within(card).getByRole("button", { name: "Freigeben" }));
    await waitFor(() => expect(sent.some((item) => item.method === "POST")).toBe(true));
    expect(sent.find((item) => item.method === "POST")).toEqual({
      method: "POST",
      path: "/api/runs/run_1/tool-approvals/tap_1",
      body: { decision: "approved", arguments_hash: "hash-shown", comment: "ok so" },
    });
  });

  it("says so when the workflow may do more now than when it was added", async () => {
    routes["/api/runs/run_1"] = runWith([BINDING]);
    render(wrap(<ToolApprovalForm request={request({ capability: { access: "write", reach: "external", source: "derived" } })} />));
    await screen.findByTestId("workflow-tool-approval");
    expect(screen.getByTestId("workflow-tool-effect-raised")).toBeInTheDocument();
    // The badge shows what the call is asked with now, not the stored value.
    expect(screen.getByText("Wirkt nach außen")).toBeInTheDocument();
  });

  it("keeps the tool card for a call that is no workflow tool of the step", async () => {
    routes["/api/runs/run_1"] = runWith([{ ...BINDING, name: "other_tool" }]);
    render(wrap(<ToolApprovalForm request={request()} />));
    expect(await screen.findByTestId("tool-approval")).toHaveTextContent("Tool-Aufruf: book_invoices");
    expect(screen.queryByTestId("workflow-tool-approval")).toBeNull();
  });

  it("keeps the tool card when the request names another version than the binding", async () => {
    routes["/api/runs/run_1"] = runWith([BINDING]);
    render(wrap(<ToolApprovalForm request={request({ version: 4 })} />));
    expect(await screen.findByTestId("tool-approval")).toBeInTheDocument();
  });

  it("does not wait for the run for a tool whose capability was declared", () => {
    render(wrap(<ToolApprovalForm request={request({ capability: { access: "write", reach: "external", source: "declared" } })} />));
    expect(screen.getByTestId("tool-approval")).toBeInTheDocument();
    expect(sent.some((item) => item.path === "/api/runs/run_1")).toBe(false);
  });
});

function answer(fields: Partial<ConversationMessage>): ConversationMessage {
  return {
    id: "msg_2",
    conversation_id: "conv_1",
    seq: 2,
    role: "assistant",
    content: "Erledigt.",
    attachments: [],
    tool_calls: [],
    sources: [],
    status: "running",
    approval_ids: [],
    run_id: "run_1",
    created_at: "2026-11-21T10:00:00Z",
    ...fields,
  };
}

const CONVERSATION = {
  id: "conv_1",
  title: "Buchhaltung",
  auto_title: false,
  agent: { template_id: "tpl_1", version: 1 },
  model: "ollama:qwen3:8b",
  offline: false,
  files: [],
  created_at: "2026-11-21T10:00:00Z",
  updated_at: "2026-11-21T10:00:00Z",
  messages: [],
  usage: { requests: 0, input_tokens: 0, output_tokens: 0, total_tokens: 0, estimated_cost_usd: 0 },
} as unknown as AgentConversation;

const FILE = { run_id: "run_child", file_id: "file_1", name: "bericht.csv", format: "csv", media_type: "text/csv", size: 2048 };

function workflowCall(fields: Partial<WorkflowCallView> = {}): WorkflowCallView {
  return {
    workflow_id: "wf_invoices",
    version: 3,
    run_id: "run_child",
    status: "paused",
    approvals: [],
    tool_approvals: [],
    files: [],
    cost_usd: 0.01,
    ...fields,
  };
}

function withCall(call: WorkflowCallView, fields: Partial<ConversationMessage> = {}) {
  return answer({
    tool_calls: [
      { id: "toolu_1", name: "book_invoices", arguments: { month: "2026-10" }, is_error: false, started_at: "2026-11-21T10:00:00Z", workflow: call },
    ],
    ...fields,
  });
}

describe("a workflow tool's call in a conversation", () => {
  it("shows the workflow, its fixed version, its run and status", async () => {
    render(wrap(<MessageItem conversation={CONVERSATION} message={withCall(workflowCall())} live={null} />));
    const panel = screen.getByTestId("workflow-call");
    expect(panel).toHaveAttribute("data-status", "paused");
    expect(await within(panel).findByText("Rechnungen buchen")).toBeInTheDocument();
    expect(within(panel).getByText("Version 3 (fest)")).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: /Lauf des Workflows öffnen/ })).toHaveAttribute("href", "/executions/run_child");
    expect(panel).toHaveAccessibleName("Workflow Rechnungen buchen, Version 3");
  });

  it("decides an approval step of the workflow's run with the run route", async () => {
    const call = workflowCall({ approvals: [{ run_id: "run_child", node_id: "check", label: "Buchung prüfen", instructions: "Summen ansehen" }] });
    render(wrap(<MessageItem conversation={CONVERSATION} message={withCall(call)} live={null} />));
    const card = await screen.findByTestId("workflow-step-approval");
    expect(within(card).getByText("Buchung prüfen")).toBeInTheDocument();
    expect(within(card).getByText("Summen ansehen")).toBeInTheDocument();
    await userEvent.click(within(card).getByRole("button", { name: "Ablehnen" }));
    await waitFor(() => expect(sent.some((item) => item.method === "POST")).toBe(true));
    expect(sent.find((item) => item.method === "POST")).toMatchObject({
      path: "/api/runs/run_child/approvals/check",
      body: { decision: "rejected" },
    });
  });

  it("shows a waiting tool call inside the workflow with the tool approval card once it is listed", async () => {
    routes["/api/tool-approvals"] = [request({ id: "tap_inner", run_id: "run_child", node_id: "booker", tool: "post_entry", capability: { access: "write", reach: "internal", source: "declared" } })];
    const call = workflowCall({ tool_approvals: [{ run_id: "run_child", request_id: "tap_inner", tool: "post_entry" }] });
    render(wrap(<MessageItem conversation={CONVERSATION} message={withCall(call)} live={null} />));
    expect(await screen.findByText("Tool-Aufruf: post_entry")).toBeInTheDocument();
  });

  it("points to the approvals page while the inner request is not listed", () => {
    const call = workflowCall({ tool_approvals: [{ run_id: "run_child", request_id: "tap_inner", tool: "post_entry" }] });
    render(wrap(<MessageItem conversation={CONVERSATION} message={withCall(call)} live={null} />));
    expect(screen.getByTestId("workflow-tool-inner-waiting")).toHaveTextContent("post_entry");
  });

  it("hides the cards once the answer is final and lists the result files as attachments", () => {
    const call = workflowCall({ status: "succeeded", files: [FILE], approvals: [{ run_id: "run_child", node_id: "check", label: "x", instructions: "" }] });
    render(wrap(<MessageItem conversation={CONVERSATION} message={withCall(call, { status: "succeeded", result_files: [FILE] })} live={null} />));
    expect(screen.queryByTestId("workflow-step-approval")).toBeNull();
    const files = screen.getByTestId("answer-result-files");
    expect(within(files).getByRole("link", { name: "bericht.csv" })).toHaveAttribute("href", "/api/runs/run_child/files/file_1");
    expect(files).toHaveAccessibleName("Anhänge der Antwort");
    // The call names its files without a second download.
    expect(screen.getByTestId("workflow-call-files-attached")).toHaveTextContent("bericht.csv");
    expect(screen.getAllByRole("link", { name: "bericht.csv" })).toHaveLength(1);
  });

  it("shows the workflow's error", () => {
    const call = workflowCall({ status: "failed", error: { code: "workflow_tool.missing", params: { name: "book_invoices" } } as never });
    render(wrap(<MessageItem conversation={CONVERSATION} message={withCall(call, { status: "failed" })} live={null} />));
    expect(within(screen.getByTestId("workflow-call")).getByRole("alert")).toHaveTextContent("book_invoices");
  });

  it("shows an ordinary tool call as before (no workflow part)", () => {
    const message = answer({ tool_calls: [{ id: "t", name: "calculator", arguments: {}, is_error: false, started_at: "2026-11-21T10:00:00Z" }] });
    render(wrap(<MessageItem conversation={CONVERSATION} message={message} live={null} />));
    expect(screen.queryByTestId("workflow-call")).toBeNull();
    expect(screen.queryByTestId("answer-result-files")).toBeNull();
  });
});

const AGENT = { name: "Buchhalter", tools: ["calculator"], server_tools: [] } as unknown as AgentConfig;

function Editor({ initial, workflowId = "wf_self" }: { initial: AgentConfig; workflowId?: string }) {
  const [agent, setAgent] = useState(initial);
  return (
    <>
      <WorkflowToolsSection agent={agent} update={(patch) => setAgent({ ...agent, ...patch })} currentWorkflowId={workflowId} />
      <pre data-testid="agent-state">{JSON.stringify(agent.workflow_tools ?? null)}</pre>
    </>
  );
}

const INFO: WorkflowToolInfo = {
  binding: { workflow_id: "wf_invoices", version: 3, name: "rechnungen_buchen", effect: EFFECT },
  workflow_name: "Rechnungen buchen",
  description: "Bucht Rechnungen.",
  input_schema: {
    type: "object",
    properties: { month: { type: "string", format: "date", description: "Monat der Buchung" }, input: { type: "string" } },
    required: ["month"],
  },
  latest_version: 4,
  blocked_fields: [],
};

describe("the agent's workflow tools", () => {
  it("shows nothing while workflow tools are off and none is bound", () => {
    render(wrap(<Editor initial={AGENT} />));
    expect(screen.queryByTestId("workflow-tools")).toBeNull();
  });

  it("shows a bound workflow tool while they are off, with the note and without adding", async () => {
    render(wrap(<Editor initial={{ ...AGENT, workflow_tools: [BINDING] }} />));
    expect(screen.getByTestId("workflow-tools-off")).toBeInTheDocument();
    expect(screen.queryByTestId("workflow-tools-add")).toBeNull();
    const row = screen.getByTestId("workflow-tool-binding");
    expect(await within(row).findByText("Rechnungen buchen")).toBeInTheDocument();
    expect(within(row).getByText("Version 3 (fest)")).toBeInTheDocument();
    // Removing the last one leaves the field out, as the runtime stores an agent without workflow tools.
    await userEvent.click(within(row).getByRole("button", { name: "Workflow-Tool book_invoices entfernen" }));
    expect(screen.getByTestId("agent-state")).toHaveTextContent("null");
  });

  it("adds a workflow in a fixed version after showing what it may do and its arguments", async () => {
    routes["/api/meta"] = { features: ["workflow_tools"] };
    routes["/api/workflows/wf_invoices/versions"] = [
      { workflow_id: "wf_invoices", number: 2, label: "", created_at: "2026-11-01T10:00:00Z", description: "", restored_from: null, name: "", agents: 1, nodes: 2, edges: 1, current: false },
      { workflow_id: "wf_invoices", number: 3, label: "Oktober", created_at: "2026-11-10T10:00:00Z", description: "", restored_from: null, name: "", agents: 1, nodes: 2, edges: 1, current: true },
    ];
    routes["/api/workflows/wf_invoices/versions/3/tool"] = INFO;
    render(wrap(<Editor initial={AGENT} />));
    await userEvent.click(await screen.findByTestId("workflow-tools-add"));
    const dialog = await screen.findByRole("dialog", { name: "Workflow als Tool hinzufügen" });
    const workflow = within(dialog).getByTestId("workflow-tool-dialog-workflow");
    // The workflow being edited cannot call itself.
    expect(within(workflow).queryByRole("option", { name: "Dieser Workflow" })).toBeNull();
    expect(within(dialog).getByTestId("workflow-tool-dialog-add")).toBeDisabled();
    await userEvent.selectOptions(workflow, "wf_invoices");
    // The newest saved version is chosen; a newer one is reported, never used.
    expect(await within(dialog).findByTestId("workflow-tool-dialog-version")).toHaveValue("3");
    const preview = await within(dialog).findByTestId("workflow-tool-dialog-preview");
    expect(within(preview).getByText("Neuer: Version 4")).toBeInTheDocument();
    expect(within(preview).getByText("Ändert Daten")).toBeInTheDocument();
    expect(within(preview).getByTestId("workflow-tool-dialog-args")).toHaveTextContent("Monat der Buchung");
    expect(within(dialog).getByTestId("workflow-tool-dialog-name")).toHaveValue("rechnungen_buchen");
    await userEvent.click(within(dialog).getByTestId("workflow-tool-dialog-add"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(JSON.parse(screen.getByTestId("agent-state").textContent!)).toEqual([INFO.binding]);
  });

  it("refuses a taken name and a workflow that needs files at its start", async () => {
    routes["/api/meta"] = { features: ["workflow_tools"] };
    routes["/api/workflows/wf_invoices/versions"] = [
      { workflow_id: "wf_invoices", number: 3, label: "", created_at: "2026-11-10T10:00:00Z", description: "", restored_from: null, name: "", agents: 1, nodes: 2, edges: 1, current: true },
    ];
    routes["/api/workflows/wf_invoices/versions/3/tool"] = { ...INFO, blocked_fields: ["beleg"] };
    render(wrap(<Editor initial={AGENT} />));
    await userEvent.click(await screen.findByTestId("workflow-tools-add"));
    const dialog = await screen.findByRole("dialog");
    await userEvent.selectOptions(within(dialog).getByTestId("workflow-tool-dialog-workflow"), "wf_invoices");
    expect(await within(dialog).findByTestId("workflow-tool-dialog-blocked")).toHaveTextContent("beleg");
    expect(within(dialog).getByTestId("workflow-tool-dialog-add")).toBeDisabled();
    const name = within(dialog).getByTestId("workflow-tool-dialog-name");
    await userEvent.clear(name);
    await userEvent.type(name, "calculator");
    expect(within(dialog).getByText("Der Agent hat schon ein Tool mit diesem Namen.")).toBeInTheDocument();
    expect(name).toHaveAttribute("aria-invalid", "true");
  });
});

describe("helpers", () => {
  it("checks tool names like the runtime", () => {
    const taken = takenNames({ tools: ["calculator"], server_tools: ["web_search"], workflow_tools: [BINDING] });
    expect(nameProblem("book_invoices", taken)).toBe("taken");
    expect(nameProblem("memory", taken)).toBe("taken");
    expect(nameProblem("files", taken)).toBe("taken");
    expect(nameProblem("bad name", taken)).toBe("invalid");
    expect(nameProblem("x".repeat(65), taken)).toBe("invalid");
    expect(nameProblem("new-tool_1", taken)).toBeNull();
  });

  it("stores the API's binding with its effect, the chosen name and a description only when given", () => {
    expect(bindingFrom(INFO, "mine", "  ")).toEqual({ ...INFO.binding, name: "mine" });
    expect(bindingFrom(INFO, "mine", " Nur Oktober ")).toEqual({ ...INFO.binding, name: "mine", description: "Nur Oktober" });
  });

  it("splits workflow references", () => {
    expect(splitRef("wf_a@3")).toEqual({ id: "wf_a", version: 3 });
    expect(splitRef("team selection")).toEqual({ id: "team selection", version: null });
  });
});
