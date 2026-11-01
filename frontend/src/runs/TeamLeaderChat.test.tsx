import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, api } from "../api/client";
import type { ChatMessageIn, ChatTarget, Meta, RunChatView, RunMessage } from "../api/types";
import { TeamLeaderChat } from "./TeamLeaderChat";

function message(overrides: Partial<RunMessage> = {}): RunMessage {
  return {
    id: "m1",
    run_id: "run_1",
    target_run_id: "run_1",
    node_id: "lead",
    seq: 1,
    kind: "question",
    content: "Wie weit seid ihr?",
    author: "u1",
    author_name: "Ana",
    created_at: "2026-11-01T10:00:00Z",
    status: "pending",
    status_at: "2026-11-01T10:00:00Z",
    code: null,
    step: null,
    decision: null,
    reply_to: null,
    answer_id: null,
    model: null,
    usage: null,
    snapshot_at: null,
    snapshot_digest: null,
    ...overrides,
  };
}

function target(overrides: Partial<ChatTarget> = {}): ChatTarget {
  return {
    run_id: "run_1",
    node_id: "lead",
    label: "Projektleitung",
    workflow_name: "Bericht",
    path: [],
    depth: 0,
    status: "running",
    decisions: 2,
    max_decisions: 8,
    steering: true,
    steering_code: null,
    teams: [
      { child_run_id: "c1", member: "research", name: "Recherche", status: "running", step: 1, slot: 0, task: "Quellen", working: ["Analyst"] },
    ],
    ...overrides,
  };
}

function view(overrides: Partial<RunChatView> = {}): RunChatView {
  return {
    run_id: "run_1",
    run_status: "running",
    active: true,
    targets: [target()],
    messages: [],
    limits: { budget_usd: 0.5, max_questions: 30, max_instructions: 20, max_messages: 200, max_pending_questions: 2, questions_per_minute: 6 },
    max_chars: 50,
    remaining_budget_usd: 0.42,
    questions_left: 27,
    answer_model: "claude-haiku",
    ...overrides,
  };
}

/** A stand-in for the browser's EventSource that the test feeds by hand. */
class FakeEventSource {
  static CLOSED = 2;
  static instances: FakeEventSource[] = [];
  readyState = 1;
  onerror: (() => void) | null = null;
  closed = false;
  private listeners = new Map<string, ((event: MessageEvent) => void)[]>();
  constructor(readonly url: string) {
    FakeEventSource.instances.push(this);
  }
  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  close() {
    this.closed = true;
    this.readyState = FakeEventSource.CLOSED;
  }
  emit(type: string, data: unknown) {
    for (const listener of this.listeners.get(type) ?? []) listener(new MessageEvent(type, { data: JSON.stringify(data) }));
  }
}

/** A chat API that stores what is sent, so a fresh read returns it too. */
function serve(initial: RunChatView, reply: (body: ChatMessageIn) => RunMessage) {
  let state = initial;
  const read = vi.spyOn(api, "runChat").mockImplementation(async () => state);
  const send = vi.spyOn(api, "sendRunChatMessage").mockImplementation(async (_run: string, body: ChatMessageIn) => {
    const sent = reply(body);
    state = { ...state, messages: [...state.messages.filter((item) => item.id !== sent.id), sent] };
    return sent;
  });
  /** What the server stored meanwhile (the stream then tells about it). */
  const store = (...messages: RunMessage[]) => {
    for (const item of messages) state = { ...state, messages: [...state.messages.filter((old) => old.id !== item.id), item] };
    return messages;
  };
  return { read, send, store };
}

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  FakeEventSource.instances = [];
  vi.stubGlobal("EventSource", FakeEventSource);
  // No logins (the desktop): every permission is held.
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 404 })));
  vi.spyOn(api, "meta").mockResolvedValue({ profile: "desktop" } as unknown as Meta);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("TeamLeaderChat", () => {
  it("asks a question by default, with Enter, an idempotent client id and the answer below it", async () => {
    const { send, store } = serve(view(), (body) => message({ id: "q1", seq: 1, content: body.content, status: "pending" }));
    const user = userEvent.setup();
    render(wrap(<TeamLeaderChat runId="run_1" />));

    expect(await screen.findByTestId("lrc-mode-question")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("lrc-hint")).toHaveTextContent("Eine Frage ändert den Lauf nie");
    expect(screen.getByText("Entscheidungen: 2 von 8")).toBeInTheDocument();
    expect(screen.getByText("Arbeiten gerade: Analyst")).toBeInTheDocument();
    expect(screen.getByTestId("lrc-meta")).toHaveTextContent("Fragen übrig: 27");
    expect(screen.getByTestId("lrc-send")).toBeDisabled();

    await user.type(screen.getByTestId("lrc-input"), "Wie weit?{Enter}");
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    const body = send.mock.calls[0][1];
    expect(body).toMatchObject({ kind: "question", target_run_id: "run_1", node_id: "lead", content: "Wie weit?" });
    expect(body.client_id).toMatch(/^[A-Za-z0-9._:-]{1,100}$/);
    expect(await screen.findByText("Wird beantwortet…")).toBeInTheDocument();
    expect(screen.getByTestId("lrc-input")).toHaveValue("");

    // The answer arrives over the stream.
    const source = FakeEventSource.instances.at(-1)!;
    expect(source.url).toBe("/api/runs/run_1/chat/events");
    const [question, reply] = store(
      message({ id: "q1", seq: 1, content: "Wie weit?", status: "answered", answer_id: "a1" }),
      message({ id: "a1", seq: 2, kind: "answer", status: "answered", reply_to: "q1", content: "Die Hälfte.", snapshot_at: "2026-11-01T10:01:00Z" }),
    );
    act(() => {
      source.emit("message", question);
      source.emit("message", reply);
    });
    const answer = await screen.findByTestId("lrc-answer");
    expect(answer).toHaveTextContent("Chat-Antwort, keine Entscheidung");
    expect(answer).toHaveTextContent("Die Hälfte.");
    expect(screen.getAllByTestId("lrc-message")).toHaveLength(1);
  });

  it("keeps the client id for a retry after a refusal and shows the reason", async () => {
    vi.spyOn(api, "runChat").mockResolvedValue(view());
    const send = vi
      .spyOn(api, "sendRunChatMessage")
      .mockRejectedValueOnce(new ApiError("busy", 429, "run_chat.busy"))
      .mockResolvedValueOnce(message({ id: "q2", status: "pending" }));
    const user = userEvent.setup();
    render(wrap(<TeamLeaderChat runId="run_1" />));
    await user.type(await screen.findByTestId("lrc-input"), "Status?");
    await user.click(screen.getByTestId("lrc-send"));
    expect(await screen.findByText(/Frühere Fragen werden noch beantwortet/)).toBeInTheDocument();
    await user.click(screen.getByTestId("lrc-send"));
    await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    expect(send.mock.calls[1][1].client_id).toBe(send.mock.calls[0][1].client_id);
  });

  it("gives an instruction in its own mode and shows that it waits for the next decision", async () => {
    const { send } = serve(view(), (body) => message({ id: "i1", kind: "instruction", status: "queued", content: body.content }));
    const user = userEvent.setup();
    render(wrap(<TeamLeaderChat runId="run_1" />));
    await user.click(await screen.findByTestId("lrc-mode-instruction"));
    expect(screen.getByTestId("lrc-hint")).toHaveTextContent("Teams, die schon arbeiten, werden nicht unterbrochen");
    expect(screen.getByTestId("lrc-send")).toHaveTextContent("Anweisung senden");
    await user.type(screen.getByTestId("lrc-input"), "Kürzer");
    await user.click(screen.getByTestId("lrc-send"));
    await waitFor(() => expect(send.mock.calls[0][1].kind).toBe("instruction"));
    const status = await screen.findByTestId("lrc-status");
    expect(status).toHaveTextContent("Wartet auf die nächste Entscheidung");
    expect(screen.getByText(/1 Team arbeitet; die Anweisung wird bei der nächsten Entscheidung berücksichtigt/)).toBeInTheDocument();
  });

  it("closes instructions with the reason when the team leader takes none", async () => {
    vi.spyOn(api, "runChat").mockResolvedValue(
      view({ targets: [target({ steering: false, steering_code: "run_chat.steering_unattended" })] }),
    );
    render(wrap(<TeamLeaderChat runId="run_1" />));
    expect(await screen.findByTestId("lrc-mode-instruction")).toBeDisabled();
    expect(screen.getByTestId("lrc-steering-off")).toHaveTextContent("Live-Steuerung auf Immer");
    expect(screen.getByTestId("lrc-mode-question")).not.toBeDisabled();
  });

  it("lets several team leaders be chosen and shows nested ones with their level", async () => {
    vi.spyOn(api, "runChat").mockResolvedValue(
      view({
        targets: [target(), target({ run_id: "child", node_id: "sub", label: "Unterleitung", path: ["Bericht", "Recherche"], depth: 1, teams: [] })],
        messages: [message({ id: "x", target_run_id: "child", node_id: "sub", kind: "instruction", status: "queued", content: "Nur Quellen ab 2020" })],
      }),
    );
    const user = userEvent.setup();
    render(wrap(<TeamLeaderChat runId="run_1" />));
    const targets = await screen.findAllByTestId("lrc-target");
    expect(targets).toHaveLength(2);
    expect(targets[1]).toHaveTextContent("Verschachteltes Team, Ebene 1");
    expect(targets[1]).toHaveTextContent("Bericht › Recherche");
    expect(targets[1]).not.toHaveTextContent("Recherche › Bericht");
    expect(screen.queryByText("Nur Quellen ab 2020")).toBeNull();
    await user.click(targets[1]);
    expect(targets[1]).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Nur Quellen ab 2020")).toBeInTheDocument();
  });

  it("stays readable after the run ended, read-only, and says what a decision included", async () => {
    vi.spyOn(api, "runChat").mockResolvedValue(
      view({
        active: false,
        run_status: "succeeded",
        targets: [target({ status: "succeeded", steering: false, steering_code: "run_chat.orchestrator_finished", teams: [] })],
        remaining_budget_usd: null as unknown as number,
        messages: [
          message({
            id: "i1",
            kind: "instruction",
            status: "considered",
            step: 2,
            content: "Rechtliches prüfen",
            decision: { action: "delegate", members: ["legal"], accepted: true, reason: "" },
          }),
          message({ id: "i2", seq: 2, kind: "instruction", status: "expired", code: "run_chat.run_ended", content: "Noch mehr" }),
          message({ id: "q3", seq: 3, status: "failed", code: "run_chat.answer_interrupted" }),
        ],
      }),
    );
    render(wrap(<TeamLeaderChat runId="run_1" />));
    expect(await screen.findByTestId("lrc-closed")).toHaveTextContent("Der Lauf ist beendet; das Gespräch kannst du weiterhin lesen.");
    expect(screen.getByTestId("lrc-input")).toBeDisabled();
    expect(screen.getByTestId("lrc-mode-question")).toBeDisabled();
    expect(screen.getByTestId("lrc-send")).toBeDisabled();
    const [considered, expired, failed] = screen.getAllByTestId("lrc-message");
    expect(within(considered).getByTestId("lrc-status")).toHaveTextContent("In Entscheidung 3 einbezogen");
    expect(considered).toHaveTextContent("Entscheidung: delegiert (legal)");
    expect(considered.textContent).not.toMatch(/erledigt/i);
    expect(expired).toHaveTextContent("Der Lauf endete, bevor die Anweisung berücksichtigt wurde.");
    expect(failed).toHaveTextContent("Die Antwort wurde unterbrochen.");
    expect(screen.getByTestId("lrc-meta")).toHaveTextContent("Chat-Budget übrig: unbekannt");
    // Nothing can change any more: no stream is opened.
    expect(FakeEventSource.instances).toHaveLength(0);
  });

  it("follows snapshot and targets events and reads the view again after the end", async () => {
    const read = vi.spyOn(api, "runChat").mockResolvedValue(view());
    render(wrap(<TeamLeaderChat runId="run_1" />));
    await screen.findByTestId("lrc-input");
    const source = FakeEventSource.instances.at(-1)!;
    act(() => source.emit("snapshot", view({ messages: [message({ id: "s1", content: "Aus dem Snapshot" })] })));
    expect(await screen.findByText("Aus dem Snapshot")).toBeInTheDocument();
    act(() => source.emit("targets", { targets: [target({ decisions: 5 })], run_status: "running", active: true }));
    expect(await screen.findByText("Entscheidungen: 5 von 8")).toBeInTheDocument();
    expect(screen.queryByTestId("lrc-deciding")).toBeNull();
    // A decision whose teams still work counts as made, with a note.
    act(() => source.emit("targets", { targets: [target({ decisions: 5, deciding: true })], run_status: "running", active: true }));
    expect(await screen.findByText("Entscheidungen: 6 von 8")).toBeInTheDocument();
    expect(screen.getByTestId("lrc-deciding")).toHaveTextContent("Entscheidung 6 wird gerade umgesetzt");
    const before = read.mock.calls.length;
    act(() => source.emit("end", { status: "succeeded" }));
    expect(source.closed).toBe(true);
    await waitFor(() => expect(read.mock.calls.length).toBeGreaterThan(before));
  });

  it("polls the view when the browser has no EventSource", async () => {
    vi.stubGlobal("EventSource", undefined);
    const read = vi.spyOn(api, "runChat").mockResolvedValue(view());
    render(wrap(<TeamLeaderChat runId="run_1" />));
    await screen.findByTestId("lrc-input");
    await waitFor(() => expect(read.mock.calls.length).toBeGreaterThanOrEqual(2), { timeout: 3500 });
  });

  it("counts the characters against the limit", async () => {
    vi.spyOn(api, "runChat").mockResolvedValue(view({ max_chars: 10 }));
    const user = userEvent.setup();
    render(wrap(<TeamLeaderChat runId="run_1" />));
    await user.type(await screen.findByTestId("lrc-input"), "Hallo");
    expect(screen.getByText("Zeichen: 5 von 10")).toBeInTheDocument();
    expect(screen.getByTestId("lrc-input")).toHaveAttribute("maxLength", "10");
  });
});
