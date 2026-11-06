import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { ArchitectJob, ChatMessage, ReasoningStreamInfo, ReasoningTrace } from "../api/types";
import { applyArchitectEvent } from "../architect/progress";
import { applyReplyEvent } from "../assistant/useConversation";
import { reasoningNoteKey } from "./ModelReasoningNote";
import { nodeTrace, withDelta, withStatus } from "../lib/reasoningTrace";
import {
  setScopedThinkingDisplay,
  setThinkingDisplay,
  storedScopes,
  THINKING_DISPLAY_KEY,
  THINKING_SCOPES_KEY,
  useThinkingDisplay,
} from "../lib/thinkingDisplay";
import { ReasoningView, reasoningState } from "./ReasoningView";

const trace = (change: Partial<ReasoningTrace> = {}): ReasoningTrace => ({
  text: "",
  kind: null,
  phases: 1,
  redacted: false,
  active: false,
  ...change,
});

const info = (change: Partial<ReasoningStreamInfo> = {}): ReasoningStreamInfo => ({
  text: "summary",
  status: true,
  request_option: null,
  requested: null,
  reason: "",
  ...change,
});

afterEach(() => {
  cleanup();
  localStorage.removeItem(THINKING_DISPLAY_KEY);
  localStorage.removeItem(THINKING_SCOPES_KEY);
});

describe("reasoningState", () => {
  it("tells the five states apart", () => {
    expect(reasoningState(trace({ active: true, text: "" }))).toBe("thinking");
    expect(reasoningState(trace({ text: "Hmm.", kind: "thinking" }))).toBe("text");
    expect(reasoningState(trace({ text: "Plan.", kind: "summary" }))).toBe("summary");
    expect(reasoningState(trace({ redacted: true }))).toBe("notTransmitted");
    expect(reasoningState(null, info({ text: "none" }))).toBe("notExposed");
    expect(reasoningState(null, info())).toBe("none");
    expect(reasoningState(trace({ phases: 0 }))).toBe("none");
  });
});

describe("ReasoningView", () => {
  it("shows only a status while the model thinks without text", () => {
    render(<ReasoningView trace={trace({ active: true })} display="live" />);
    expect(screen.getByTestId("reasoning")).toHaveAttribute("data-state", "thinking");
    expect(screen.getByRole("status")).toHaveTextContent("Denkt nach…");
  });

  it("shows transmitted thinking text open while it arrives in live mode", () => {
    render(<ReasoningView trace={trace({ active: true, text: "Erst die Eingaben prüfen.", kind: "thinking" })} display="live" />);
    const view = screen.getByTestId("reasoning");
    expect(view).toHaveAttribute("data-state", "text");
    expect(view).toHaveAttribute("open");
    expect(view).toHaveTextContent("Denktext");
    expect(view).toHaveTextContent("Erst die Eingaben prüfen.");
    expect(view).toHaveTextContent("Nicht Teil der Antwort");
  });

  it("labels a summary as a summary and keeps it closed until opened (collapsed)", () => {
    render(<ReasoningView trace={trace({ text: "Der Nutzer fragt nach Läufen.", kind: "summary" })} display="collapsed" />);
    const view = screen.getByTestId("reasoning");
    expect(view).toHaveAttribute("data-state", "summary");
    expect(view).not.toHaveAttribute("open");
    expect(view).toHaveTextContent("Zusammenfassung des Denkens");
    fireEvent.click(screen.getByText("Zusammenfassung des Denkens"));
    expect(view).toHaveAttribute("open");
  });

  it("never shows the text in status mode, only that the model reasoned", () => {
    render(<ReasoningView trace={trace({ text: "Geheimer Plan.", kind: "summary" })} display="status" />);
    const view = screen.getByTestId("reasoning");
    expect(view).not.toHaveTextContent("Geheimer Plan.");
    expect(view).toHaveTextContent("Nachgedacht");
    expect(view).toHaveTextContent("nur Status");
  });

  it("explains reasoning that was not transmitted (redacted)", () => {
    render(<ReasoningView trace={trace({ redacted: true })} display="live" />);
    const view = screen.getByTestId("reasoning");
    expect(view).toHaveAttribute("data-state", "notTransmitted");
    expect(view).toHaveTextContent("Denken nicht übertragen");
    expect(view).toHaveTextContent("verschlüsselt");
  });

  it("explains summaries the workspace did not ask for", () => {
    render(<ReasoningView trace={trace()} display="live" info={info({ request_option: "reasoning_summary", requested: false })} />);
    expect(screen.getByTestId("reasoning")).toHaveTextContent("nur auf Anfrage");
  });

  it("says so for a model that does not expose reasoning only when asked to", () => {
    const { rerender } = render(<ReasoningView trace={null} display="live" info={info({ text: "none" })} />);
    expect(screen.queryByTestId("reasoning")).toBeNull();
    rerender(<ReasoningView trace={null} display="live" info={info({ text: "none" })} showNotExposed />);
    expect(screen.getByTestId("reasoning")).toHaveTextContent("Denken nicht offengelegt");
    expect(screen.getByTestId("reasoning")).toHaveTextContent("erfindet nie Denktext");
  });

  it("renders nothing without reasoning", () => {
    render(<ReasoningView trace={null} display="live" />);
    expect(screen.queryByTestId("reasoning")).toBeNull();
  });
});

describe("live reasoning events", () => {
  it("joins deltas and counts phases like the server", () => {
    let current = withStatus(null, "started", false);
    expect(current).toMatchObject({ active: true, phases: 1 });
    current = withDelta(current, "Eins.", "summary");
    current = withStatus(current, "finished", false);
    current = withStatus(current, "started", true);
    current = withDelta(current, "\n\nZwei.", "summary");
    expect(current).toEqual({ text: "Eins.\n\nZwei.", kind: "summary", phases: 2, redacted: true, active: true });
  });

  it("counts text without a status event as one phase (providers that only send text)", () => {
    expect(withDelta(null, "Hmm", "thinking")).toEqual({ text: "Hmm", kind: "thinking", phases: 1, redacted: false, active: true });
  });

  it("applies assistant reply events to the message", () => {
    const message = { id: "m", role: "assistant", content: "", status: "streaming", reasoning: null } as unknown as ChatMessage;
    let next = applyReplyEvent(message, { type: "thinking_status", text: "", data: { state: "started", reasoning_kind: "summary", redacted: false } } as never);
    next = applyReplyEvent(next, { type: "thinking", text: "Plan.", data: { reasoning_kind: "summary" } } as never);
    next = applyReplyEvent(next, { type: "thinking_status", text: "", data: { state: "finished" } } as never);
    next = applyReplyEvent(next, { type: "delta", text: "Antwort.", data: {} } as never);
    expect(next.reasoning).toEqual({ text: "Plan.", kind: "summary", phases: 1, redacted: false, active: false });
    expect(next.content).toBe("Antwort.");
  });

  it("keeps the architect's reasoning per request and out of the activity log", () => {
    const job = { id: "j", events: [], usage: { estimated_cost_usd: 0 }, reasoning: [] } as unknown as ArchitectJob;
    const event = (seq: number, type: string, message: string, data: Record<string, unknown>) =>
      ({ seq, job_id: "j", type, message, data, cost_usd: null }) as never;
    let next = applyArchitectEvent(job, event(1, "thinking_status", "", { state: "started", step: "analysis", index: 0 }));
    next = applyArchitectEvent(next, event(2, "thinking", "Eingaben: ein Thema.", { reasoning_kind: "summary", step: "analysis", index: 0 }));
    expect(next.events).toEqual([]);
    expect(next.reasoning).toEqual([
      { text: "Eingaben: ein Thema.", kind: "summary", phases: 1, redacted: false, active: true, step: "analysis" },
    ]);
  });

  it("reads a run step's fields as a trace", () => {
    expect(nodeTrace({ status: "succeeded", thinking: "" })).toBeNull();
    expect(nodeTrace({ status: "running", thinking: "", thinking_phases: 1, thinking_active: true })).toMatchObject({ active: true, text: "" });
    // A step stored before the kind was recorded held Anthropic's summarized thinking.
    expect(nodeTrace({ status: "succeeded", thinking: "Alt." })).toMatchObject({ kind: "summary", phases: 1, active: false });
  });
});

describe("display preference", () => {
  function Probe({ scope }: { scope?: string }) {
    const { display, choice } = useThinkingDisplay(scope);
    return <span data-testid="probe">{`${display}/${choice}`}</span>;
  }

  it("follows the global choice unless a conversation has its own", () => {
    render(
      <>
        <Probe />
        <Probe scope="conversation:a" />
      </>,
    );
    const [global, scoped] = screen.getAllByTestId("probe");
    expect(global).toHaveTextContent("collapsed/collapsed");
    expect(scoped).toHaveTextContent("collapsed/default");
    act(() => setThinkingDisplay("live"));
    expect(scoped).toHaveTextContent("live/default");
    act(() => setScopedThinkingDisplay("conversation:a", "status"));
    expect(scoped).toHaveTextContent("status/status");
    expect(global).toHaveTextContent("live/live");
    act(() => setScopedThinkingDisplay("conversation:a", "default"));
    expect(storedScopes()).toEqual({});
  });

  it("ignores damaged stored values", () => {
    localStorage.setItem(THINKING_DISPLAY_KEY, "loud");
    localStorage.setItem(THINKING_SCOPES_KEY, '{"conversation:a":"loud","conversation:b":"live"}');
    expect(storedScopes()).toEqual({ "conversation:b": "live" });
  });
});

describe("model note", () => {
  it("names what the model's stream transmits", () => {
    expect(reasoningNoteKey(info())).toBe("reasoning.model.summary");
    expect(reasoningNoteKey(info({ request_option: "reasoning_summary", requested: false }))).toBe("reasoning.model.summaryNotRequested");
    expect(reasoningNoteKey(info({ request_option: "thinking_display", requested: null }))).toBe("reasoning.model.summary");
    expect(reasoningNoteKey(info({ text: "thinking" }))).toBe("reasoning.model.thinking");
    expect(reasoningNoteKey(info({ text: "none" }))).toBe("reasoning.model.none");
  });
});
