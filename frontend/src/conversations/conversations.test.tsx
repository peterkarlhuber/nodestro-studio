// Conversations with own agents (N-04): the area exists only while the server serves it; the list per agent, start,
// rename and delete; sending a message with a file; the live answer from the run's events; an answer with its tool
// calls, sources, cost and the approval card of a call that waits.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type AgentConversation, type ConversationMessage, featuresOf } from "../api/conversations";
import { AppShell } from "../layout/AppShell";
import { EMPTY_LIVE, applyAnswerEvent } from "./answerStream";
import { sendsOnEnter, unsentFiles } from "./ConversationView";
import { ConversationsPage, conversationsOf } from "./ConversationsPage";
import { shownCalls } from "./MessageItem";

vi.mock("../assistant/AssistantPanel", () => ({ AssistantPanel: () => null }));

const USAGE = {
  requests: 1,
  input_tokens: 10,
  output_tokens: 5,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
  thinking_tokens: 0,
  web_search_requests: 0,
  total_tokens: 15,
  estimated_cost_usd: 0.0123,
};

function message(fields: Partial<ConversationMessage>): ConversationMessage {
  return {
    id: "msg_1",
    conversation_id: "conv_1",
    seq: 1,
    role: "user",
    content: "",
    attachments: [],
    tool_calls: [],
    sources: [],
    status: "complete",
    approval_ids: [],
    created_at: "2026-11-21T10:00:00Z",
    ...fields,
  };
}

function conversation(fields: Partial<AgentConversation> = {}): AgentConversation {
  return {
    id: "conv_1",
    title: "Reise",
    auto_title: false,
    agent: { template_id: "tpl_1", version: 2 },
    model: "ollama:qwen3:8b",
    offline: false,
    files: [],
    created_at: "2026-11-21T10:00:00Z",
    updated_at: "2026-11-21T10:00:00Z",
    messages: [],
    usage: USAGE,
    answering: null,
    ...fields,
  };
}

interface Call {
  method: string;
  path: string;
  body: unknown;
}

let features: string[] = [];
let calls: Call[] = [];
let stored: AgentConversation;

beforeEach(() => {
  features = ["conversations"];
  calls = [];
  stored = conversation();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = url.replace(/^\/api/, "").replace(/\?.*$/, "");
      const method = init?.method ?? "GET";
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : init?.body;
      calls.push({ method, path, body });
      let answer: unknown = [];
      let status = 200;
      if (path === "/meta") answer = { providers: [], capabilities: [], models: [], server_tools: [], efforts: [], features };
      else if (path === "/settings") answer = { providers: [], default_model: "ollama:qwen3:8b", assistant_model: "ollama:qwen3:8b" };
      else if (path === "/auth/me") status = 404;
      else if (path === "/agents/templates")
        answer = [
          { id: "tpl_1", agent: { name: "Reiseberater", model: "ollama:qwen3:8b" }, created_at: "", updated_at: "" },
          { id: "tpl_2", agent: { name: "Steuerhilfe", model: "ollama:qwen3:8b" }, created_at: "", updated_at: "" },
        ];
      else if (path === "/conversations" && method === "GET")
        answer = [
          { id: "conv_1", title: "Reise", agent: { template_id: "tpl_1", version: 2 }, model: "ollama:qwen3:8b", offline: false, messages: 2, cost_usd: 0.01, created_at: "2026-11-21T10:00:00Z", updated_at: "2026-11-21T10:00:00Z" },
          { id: "conv_2", title: "Steuern", agent: { template_id: "tpl_2", version: 1 }, model: "ollama:qwen3:8b", offline: false, messages: 0, cost_usd: null, created_at: "2026-11-21T09:00:00Z", updated_at: "2026-11-21T09:00:00Z" },
        ];
      else if (path === "/conversations" && method === "POST") {
        stored = conversation({ id: "conv_new", title: "" });
        answer = stored;
        status = 201;
      } else if (path.startsWith("/conversations/") && path.endsWith("/messages") && method === "POST") {
        const user = message({ id: "msg_u", content: body.content, attachments: [] });
        const assistant = message({ id: "msg_a", seq: 2, role: "assistant", status: "queued", run_id: "run_1" });
        stored = { ...stored, messages: [...stored.messages, user, assistant], answering: "msg_a" };
        answer = { user, assistant };
        status = 201;
      } else if (path.startsWith("/conversations/") && method === "DELETE") status = 204;
      else if (path.startsWith("/conversations/") && method === "PATCH") {
        stored = { ...stored, ...body };
        answer = stored;
      } else if (path.startsWith("/conversations/")) answer = stored;
      else if (path === "/tool-approvals") answer = [];
      if (status === 204) return new Response(null, { status });
      return new Response(JSON.stringify(status === 404 ? { code: "http.404" } : answer), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function show(path: string, shell = false) {
  const page = { path: "conversations", element: <ConversationsPage /> };
  const one = { path: "conversations/:id", element: <ConversationsPage /> };
  const router = createMemoryRouter(
    shell ? [{ path: "/", element: <AppShell />, children: [page, one, { index: true, element: <p>start</p> }] }] : [{ path: "/", children: [page, one] }],
    { initialEntries: [path] },
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe("the conversation area", () => {
  it("is listed in the navigation only while the server serves conversations", async () => {
    show("/", true);
    expect(await screen.findByRole("link", { name: "Gespräche" })).toHaveAttribute("href", "/conversations");
    cleanup();
    features = [];
    show("/", true);
    await screen.findByRole("link", { name: "Ausführungen" });
    expect(screen.queryByRole("link", { name: "Gespräche" })).toBeNull();
  });

  it("does not exist while the server does not serve it", async () => {
    features = [];
    show("/conversations");
    expect(await screen.findByRole("heading", { level: 1 })).not.toHaveTextContent("Gespräche");
    expect(calls.some((call) => call.path.startsWith("/conversations"))).toBe(false);
  });

  it("reads the feature from /api/meta only when it is named", () => {
    expect(featuresOf(undefined)).toEqual([]);
    expect(featuresOf({ features: ["conversations", 3 as never] })).toEqual(["conversations"]);
  });

  it("lists the conversations of the chosen agent", async () => {
    show("/conversations");
    const list = await screen.findByTestId("conversation-list");
    expect(within(list).getAllByTestId("conversation-item")).toHaveLength(2);
    await userEvent.selectOptions(screen.getByTestId("conversation-agent-filter"), "tpl_2");
    await waitFor(() => expect(within(screen.getByTestId("conversation-list")).getAllByTestId("conversation-item")).toHaveLength(1));
    expect(screen.getByText("Steuern")).toBeInTheDocument();
    const items = [{ agent: { template_id: "a" } }, { agent: { template_id: "b" } }] as never;
    expect(conversationsOf(items, "")).toHaveLength(2);
    expect(conversationsOf(items, "b")).toHaveLength(1);
  });

  it("starts a conversation with the chosen agent and no model unless one is chosen", async () => {
    const router = show("/conversations");
    await userEvent.click(await screen.findByTestId("conversation-new"));
    await userEvent.selectOptions(await screen.findByTestId("conversation-new-agent"), "tpl_2");
    await userEvent.click(screen.getByTestId("conversation-create"));
    await waitFor(() => expect(router.state.location.pathname).toBe("/conversations/conv_new"));
    const created = calls.find((call) => call.method === "POST" && call.path === "/conversations");
    expect(created?.body).toEqual({ agent: { template_id: "tpl_2" }, model: null, title: "", offline: false });
  });

  it("renames, switches offline and deletes the open conversation", async () => {
    const router = show("/conversations/conv_1");
    await userEvent.click(await screen.findByTestId("conversation-rename"));
    const input = screen.getByTestId("conversation-title-input");
    await userEvent.clear(input);
    await userEvent.type(input, "Urlaub{Enter}");
    await waitFor(() => expect(screen.getByTestId("conversation-title")).toHaveTextContent("Urlaub"));
    expect(calls.find((call) => call.method === "PATCH")?.body).toEqual({ title: "Urlaub" });
    await userEvent.click(screen.getByRole("switch", { name: /Nur lokal/ }));
    await waitFor(() => expect(calls.filter((call) => call.method === "PATCH").at(-1)?.body).toEqual({ offline: true }));
    await userEvent.click(screen.getByRole("button", { name: "Gespräch löschen" }));
    await userEvent.click(screen.getByRole("button", { name: /Gespräch löschen:/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/conversations"));
    expect(calls.some((call) => call.method === "DELETE" && call.path === "/conversations/conv_1")).toBe(true);
  });

  it("marks a conversation that holds content of a granted source, and only such a one", async () => {
    stored = conversation({ provenance: "granted_content" });
    show("/conversations/conv_1");
    expect(await screen.findByTestId("granted-content-badge-conversation")).toHaveTextContent("Geschützter Inhalt");
    expect(screen.getByTestId("granted-content-notice-conversation")).toHaveTextContent("Cloud-Modell");
    cleanup();
    stored = conversation();
    show("/conversations/conv_1");
    await screen.findByTestId("conversation-title");
    expect(screen.queryByTestId("granted-content-badge-conversation")).not.toBeInTheDocument();
    expect(screen.queryByTestId("granted-content-notice-conversation")).not.toBeInTheDocument();
  });

  it("sends a message with Enter together with the files waiting for it", async () => {
    stored = conversation({ files: [{ id: "in_1", name: "plan.txt", format: "txt", media_type: "text/plain", size: 12, added_at: "" }] });
    show("/conversations/conv_1");
    expect(await screen.findByTestId("conversation-pending-file")).toHaveTextContent("plan.txt");
    await userEvent.type(screen.getByTestId("conversation-input"), "Wohin im Mai?{Enter}");
    await waitFor(() => expect(calls.some((call) => call.method === "POST" && call.path.endsWith("/messages"))).toBe(true));
    const sent = calls.find((call) => call.method === "POST" && call.path.endsWith("/messages"));
    expect(sent?.body).toEqual({ content: "Wohin im Mai?", file_ids: ["in_1"] });
    expect(await screen.findByTestId("conversation-stop")).toBeInTheDocument();
  });

  it("shows an answer with its tool calls, sources, cost and model", async () => {
    stored = conversation({
      messages: [
        message({ content: "Wie warm ist es?", attachments: [{ file_id: "in_9", name: "alt.pdf", size: 2048, mode: "overview" }] }),
        message({
          id: "msg_2",
          seq: 2,
          role: "assistant",
          status: "succeeded",
          content: "Etwa **20 Grad**.",
          model: "ollama:qwen3:8b",
          run_id: "run_7",
          usage: USAGE,
          cost_usd: 0.0123,
          tool_calls: [{ id: "c1", name: "web_search", arguments: { q: "Wetter" }, result: "sonnig", is_error: false, started_at: "2026-11-21T10:00:00Z", finished_at: "2026-11-21T10:00:01Z", duration_ms: 1000 }],
          sources: [{ id: "S1", url: "https://example.org/wetter", title: "Wetter", origin: "fetched", retrieved_at: "2026-11-21T10:00:00Z" }],
        }),
      ],
    });
    show("/conversations/conv_1");
    const answer = await screen.findByTestId("conversation-message-answer");
    expect(await within(answer).findByText("20 Grad")).toBeInTheDocument();
    expect(within(answer).getByTestId("conversation-tool-call")).toHaveTextContent("web_search");
    expect(within(answer).getByTestId("conversation-tool-call")).toHaveTextContent("dauerte 1000 ms");
    expect(within(answer).getByRole("link", { name: "Wetter" })).toHaveAttribute("href", "https://example.org/wetter");
    expect(within(answer).getByTestId("conversation-answer-meta")).toHaveTextContent("ollama:qwen3:8b");
    expect(within(answer).getByRole("link", { name: /Ausführung öffnen/ })).toHaveAttribute("href", "/executions/run_7");
    // A file no longer in the conversation keeps its name, without a download.
    const user = screen.getByTestId("conversation-message-user");
    expect(within(user).getByText("alt.pdf")).toBeInTheDocument();
    expect(within(user).queryByTestId("conversation-file-link")).toBeNull();
    expect(within(user).getByText("Überblick")).toBeInTheDocument();
  });

  it("shows the approval card of a tool call that waits inside the answer", async () => {
    stored = conversation({
      answering: "msg_2",
      messages: [message({ id: "msg_2", seq: 2, role: "assistant", status: "running", run_id: "run_8" })],
    });
    const request = {
      id: "tap_1",
      run_id: "run_8",
      node_id: "agent",
      iteration: [],
      call_id: "c1",
      tool: "send_message",
      input: { to: "a@example.org" },
      arguments_hash: "h",
      capability: { access: "write", reach: "external", source: "declared" },
      status: "pending",
      requested_at: "2026-11-21T10:00:00Z",
      deadline: "2099-01-01T00:00:00Z",
    };
    const original = globalThis.fetch;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) =>
        url.startsWith("/api/tool-approvals") && (init?.method ?? "GET") === "GET"
          ? new Response(JSON.stringify([request]), { status: 200, headers: { "Content-Type": "application/json" } })
          : original(url, init),
      ),
    );
    show("/conversations/conv_1");
    const card = await screen.findByTestId("tool-approval");
    expect(within(card).getByTestId("tool-approval-arguments")).toHaveTextContent("a@example.org");
  });
});

describe("the live answer", () => {
  it("adds text, tool calls, approvals and usage of the agent's step", () => {
    let live = applyAnswerEvent(EMPTY_LIVE, { type: "text", node_id: "agent", data: { delta: "Hal" } });
    live = applyAnswerEvent(live, { type: "text", node_id: "agent", data: { delta: "lo" } });
    live = applyAnswerEvent(live, { type: "text", node_id: "start", data: { delta: "x" } });
    expect(live.text).toBe("Hallo");
    live = applyAnswerEvent(live, { type: "tool_approval_requested", node_id: "agent", data: { id: "c1", name: "send" } });
    expect(live.calls).toEqual([expect.objectContaining({ id: "c1", waiting: true })]);
    live = applyAnswerEvent(live, { type: "tool_started", node_id: "agent", data: { id: "c1", name: "send", input: { a: 1 } } });
    live = applyAnswerEvent(live, { type: "tool_finished", node_id: "agent", data: { id: "c1", output: "ok", is_error: false } });
    expect(live.calls).toEqual([expect.objectContaining({ id: "c1", arguments: { a: 1 }, result: "ok", finished: true, waiting: false })]);
    live = applyAnswerEvent(live, { type: "usage", node_id: "agent", data: { usage: USAGE } });
    expect(live.usage?.total_tokens).toBe(15);
  });

  it("shows the stored calls and the live ones not stored yet", () => {
    const stored = [{ id: "c1", name: "a", arguments: {}, is_error: false, started_at: "" }];
    const live = [
      { id: "c1", name: "a", arguments: {}, result: null, is_error: false, waiting: false, finished: false },
      { id: "c2", name: "b", arguments: {}, result: null, is_error: false, waiting: true, finished: false },
    ];
    expect(shownCalls(stored, live).map((call) => call.id)).toEqual(["c1", "c2"]);
  });

  it("counts only the files no message has sent as waiting", () => {
    const file = (id: string) => ({ id, name: id, format: "txt", media_type: "text/plain", size: 1, added_at: "" });
    const sent = message({ attachments: [{ file_id: "a", name: "a", size: 1 }] });
    expect(unsentFiles({ files: [file("a"), file("b")], messages: [sent] }).map((item) => item.id)).toEqual(["b"]);
  });

  it("sends on Enter, not on Shift+Enter or while composing", () => {
    expect(sendsOnEnter({ key: "Enter", shiftKey: false, nativeEvent: {} as never })).toBe(true);
    expect(sendsOnEnter({ key: "Enter", shiftKey: true, nativeEvent: {} as never })).toBe(false);
    expect(sendsOnEnter({ key: "Enter", shiftKey: false, nativeEvent: { isComposing: true } as never })).toBe(false);
  });
});
