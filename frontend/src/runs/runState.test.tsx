// Run state, approvals and failure transparency (ED-01..06, ED-08, ED-13, AD-01, AD-02).

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { NodeRun, Run, RunEvent, WorkflowNode } from "../api/types";
import { Output, fieldLabel } from "../components/Markdown";
import { liveUsage, runWaitsForToolApproval, useEditor, waitsForToolApproval } from "../editor/store";
import i18n, { LANGUAGES, loadLanguage } from "../i18n";
import { problemCode, problemHint, problemText } from "../lib/errors";
import { belongsTo } from "./ApprovalCard";
import { CancelRunButton } from "./CancelRunButton";
import { RunProblem } from "./RunProblem";
import { failedSteps, initialStep, stepsInOrder } from "./runSummary";

const t = i18n.t.bind(i18n);

const node = (id: string, type: WorkflowNode["type"], label: string, extra: Partial<WorkflowNode> = {}): WorkflowNode =>
  ({ id, type, label, position: { x: 0, y: 0 }, agent: null, start: null, ...extra }) as WorkflowNode;

const state = (status: NodeRun["status"], started: string | null, extra: Partial<NodeRun> = {}): NodeRun =>
  ({ status, started_at: started, finished_at: started, tool_calls: [], error: null, ...extra }) as NodeRun;

function run(nodes: WorkflowNode[], states: Record<string, NodeRun>, extra: Partial<Run> = {}): Run {
  return { id: "run_1", workflow_id: "wf_1", status: "failed", workflow: { nodes, edges: [] }, nodes: states, ...extra } as unknown as Run;
}

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(cleanup);

describe("timeline order (ED-06)", () => {
  const nodes = [node("a", "agent", "Schritt 1"), node("b", "agent", "Kaputt"), node("c", "agent", "Schritt 3")];
  const failed = run(nodes, {
    a: state("succeeded", "2026-11-01T10:00:00Z"),
    b: state("failed", "2026-11-01T10:00:01Z", { error: "IncompleteResponseError: x", error_code: "run.agent.IncompleteResponseError" }),
    c: state("blocked", null),
  });

  it("puts steps that never started last instead of first", () => {
    expect(stepsInOrder(failed).map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("opens the failed step, else the waiting one, else the first", () => {
    expect(initialStep(failed)?.id).toBe("b");
    const waiting = run(nodes, { a: state("succeeded", "2026-11-01T10:00:00Z"), b: state("awaiting_approval", "2026-11-01T10:00:01Z"), c: state("waiting", null) });
    expect(initialStep(waiting)?.id).toBe("b");
    expect(failedSteps(failed).map((item) => item.id)).toEqual(["b"]);
  });
});

describe("failure reasons (ED-05, AD-01)", () => {
  it("explains a cut-off answer with the limit and what to change", () => {
    const item = {
      code: "run.agent.IncompleteResponseError",
      params: { type: "IncompleteResponseError" },
      message: "IncompleteResponseError: b: incomplete response (stop_reason='max_tokens', max_tokens=8000).",
    };
    expect(problemText(t, item)).toContain("max. Tokens: 8.000");
    expect(problemHint(t, item)).toContain("Max. Tokens");
    const context = { ...item, message: "IncompleteResponseError: (stop_reason='model_context_window_exceeded', max_tokens=8000)" };
    expect(problemCode(context)).toBe("run.agent.ContextWindowExceeded");
  });

  it("tells provider failures apart by status and never shows an empty status", () => {
    const provider = (status: unknown, message = "ProviderError") => ({ code: "run.api_error", params: { status, provider: "anthropic" }, message });
    expect(problemCode(provider(401))).toBe("run.api_error_auth");
    expect(problemText(t, provider(401))).toBe("Anthropic hat den API-Schlüssel abgelehnt.");
    expect(problemHint(t, provider(401))).toContain("Einstellungen");
    expect(problemCode(provider(429))).toBe("run.api_error_rate_limit");
    expect(problemCode(provider(529))).toBe("run.api_error_server");
    expect(problemCode(provider(""))).toBe("run.api_error_connection");
    expect(problemCode(provider("", "AuthenticationError: invalid x-api-key"))).toBe("run.api_error_auth");
    expect(problemText(t, provider(""))).not.toContain("Status");
    expect(problemText(t, { code: "run.api_error", params: { status: "" }, message: "" })).toBe("Der KI-Anbieter war nicht erreichbar.");
    expect(problemText(t, provider(400))).toContain("Status 400");
  });

  it("takes the runtime's own provider codes first and keeps reading older runs", () => {
    const coded = (code: string, params: Record<string, unknown> = { provider: "anthropic", status: 429 }) => ({
      code,
      params,
      message: "RateLimitError: rate_limit_error",
    });
    expect(problemCode(coded("run.provider_rate_limited"))).toBe("run.provider_rate_limited");
    expect(problemText(t, coded("run.provider_rate_limited"))).toBe(
      "Anthropic hat zu viele Anfragen oder Tokens in kurzer Zeit gemeldet (Rate-Limit).",
    );
    expect(problemHint(t, coded("run.provider_rate_limited"))).toContain("setze den Lauf fort");
    expect(problemText(t, coded("run.provider_auth", { provider: "openai", status: 401 }))).toContain("OpenAI hat den API-Schlüssel nicht akzeptiert");
    expect(problemHint(t, coded("run.provider_overloaded", { provider: "anthropic", status: 529 }))).toContain("ein paar Minuten");
    // No answer at all: no status, and a provider without a name reads as the provider in general.
    expect(problemText(t, coded("run.provider_unreachable", {}))).toBe("Der KI-Anbieter war nicht erreichbar.");
    // An older run with the generic code is still read from its status.
    expect(problemCode(coded("run.api_error"))).toBe("run.api_error_rate_limit");
  });

  it("links a refused key to the settings, from the runtime's code too", () => {
    const agent = { name: "Kaputt", model: "openai:gpt-x" } as WorkflowNode["agent"];
    const failed = run(
      [node("a", "agent", "Kaputt", { agent })],
      { a: state("failed", "2026-11-01T10:00:00Z", { error: "AuthenticationError: bad key", error_code: "run.provider_auth", error_params: { status: 401, provider: "openai" } }) },
      { error: "Failed: Kaputt", error_code: "run.nodes_failed", error_params: { nodes: "Kaputt" } },
    );
    render(wrap(<RunProblem run={failed} />));
    const banner = screen.getByTestId("run-failure");
    expect(banner).toHaveTextContent("OpenAI hat den API-Schlüssel nicht akzeptiert");
    expect(banner).toHaveTextContent("Modell: openai:gpt-x");
    expect(screen.getByTestId("problem-hint")).toHaveTextContent("Einstellungen → KI-Anbieter");
    expect(screen.getByRole("link", { name: /Einstellungen öffnen/ })).toHaveAttribute("href", "/settings");
  });

  it("gives retry advice, not a settings link, when the provider is busy", () => {
    const failed = run(
      [node("a", "agent", "Kaputt", { agent: { name: "Kaputt", model: "anthropic:claude-x" } as WorkflowNode["agent"] })],
      { a: state("failed", "2026-11-01T10:00:00Z", { error: "ProviderServerError: overloaded", error_code: "run.provider_overloaded", error_params: { status: 529, provider: "anthropic" } }) },
      { error: "Failed: Kaputt", error_code: "run.nodes_failed", error_params: { nodes: "Kaputt" } },
    );
    render(wrap(<RunProblem run={failed} />));
    expect(screen.getByTestId("run-failure")).toHaveTextContent("Anthropic ist gerade überlastet.");
    expect(screen.getByTestId("problem-hint")).toHaveTextContent("setze den Lauf dann fort");
    expect(screen.queryByRole("link", { name: /Einstellungen öffnen/ })).toBeNull();
  });

  it("has every new text and hint in all six languages", async () => {
    const codes = [
      "run.agent.IncompleteResponseError",
      "run.agent.RefusalError",
      "run.agent.MaxToolRoundsError",
      "run.api_error_auth",
      "run.api_error_rate_limit",
      "run.api_error_connection",
      "run.provider_auth",
      "run.provider_unreachable",
      "run.provider_rate_limited",
      "run.provider_overloaded",
    ];
    for (const language of LANGUAGES) {
      await loadLanguage(language);
      for (const code of codes) {
        // Asked of the language itself: English, the fallback, must not answer for it.
        const own = { lng: language, fallbackLng: false as const };
        expect(i18n.exists(`errors.${code}`, own), `${language} ${code}`).toBe(true);
        expect(i18n.exists(`errors.hints.${code}`, own), `${language} hint ${code}`).toBe(true);
      }
    }
  });

  it("shows the failed step's own problem in the run banner instead of 'Failed: <step>'", () => {
    const agent = { name: "Kaputt", model: "anthropic:claude-x" } as WorkflowNode["agent"];
    const failed = run(
      [node("a", "agent", "Kaputt", { agent })],
      { a: state("failed", "2026-11-01T10:00:00Z", { error: "AuthenticationError: bad key", error_code: "run.api_error", error_params: { status: 401, provider: "anthropic" } }) },
      { error: "Failed: Kaputt", error_code: "run.nodes_failed", error_params: { nodes: "Kaputt" } },
    );
    render(wrap(<RunProblem run={failed} />));
    const banner = screen.getByTestId("run-failure");
    expect(banner).toHaveTextContent("Fehlgeschlagen bei Kaputt");
    expect(banner).toHaveTextContent("Anthropic hat den API-Schlüssel abgelehnt.");
    expect(banner).toHaveTextContent("Modell: anthropic:claude-x");
    expect(screen.getByRole("link", { name: /Einstellungen öffnen/ })).toHaveAttribute("href", "/settings");
  });

  it("keeps run-level stops (time limit) as the reason", () => {
    const stopped = run([node("a", "agent", "A")], { a: state("cancelled", "2026-11-01T10:00:00Z") }, {
      error: "time", error_code: "run.time_limit", error_params: { max_duration_s: 60 },
    });
    render(wrap(<RunProblem run={stopped} />));
    expect(screen.getByTestId("run-failure")).toHaveTextContent("Zeitlimit von 60 Sekunden");
    expect(screen.getByTestId("problem-hint")).toHaveTextContent("Grenzen");
  });
});

describe("structured results (ED-04)", () => {
  it("shows labelled fields with the output model's descriptions and keeps the JSON reachable", () => {
    render(wrap(<Output value={{ d1_team: "Anna, Ben", d2_problem: "Kratzer", count: 3, done: true }} fields={[{ name: "d1_team", type: "string", description: "D1 Team mit Rollen", required: true }]} />));
    expect(screen.getByText("D1 Team mit Rollen")).toBeInTheDocument();
    expect(screen.getByText("D2 problem")).toBeInTheDocument();
    expect(screen.getByText("Ja")).toBeInTheDocument();
    expect(screen.getByText("Als JSON anzeigen")).toBeInTheDocument();
    expect(fieldLabel("riskLevel")).toBe("Risk Level");
  });
});

describe("following a run (ED-01, ED-02, ED-03)", () => {
  it("relates an approval of a team or sub-workflow to the editor's run", () => {
    expect(belongsTo("root", { run_id: "child", root_run_id: "root" })).toBe(true);
    expect(belongsTo("child", { run_id: "child", root_run_id: "root" })).toBe(true);
    expect(belongsTo("other", { run_id: "child", root_run_id: "root" })).toBe(false);
  });

  it("uses the server's totals for a paused run (teams' usage is not in the events)", () => {
    const usage = { requests: 4, total_tokens: 4800, estimated_cost_usd: 0.02 } as Run["usage"];
    const paused = { ...run([], { lead: state("awaiting_approval", null, { usage: { requests: 1, total_tokens: 1 } as NodeRun["usage"] }) }), status: "paused", finished_at: null, usage } as Run;
    expect(liveUsage(paused).requests).toBe(4);
  });

  it("marks a step that waits for a tool approval from the run events", () => {
    const base = run([node("a", "agent", "A")], { a: state("running", "2026-11-01T10:00:00Z") }, { status: "running" });
    useEditor.getState().setRun(base);
    const event = (type: string, data: Record<string, unknown>, seq: number): RunEvent => ({ seq, run_id: "run_1", type, node_id: "a", data, at: "2026-11-01T10:00:02Z" });
    useEditor.getState().applyEvent(event("tool_approval_requested", { id: "c1", name: "send_message", request_id: "r1", deadline: "2026-11-01T10:05:00Z" }, 1));
    let current = useEditor.getState().run!;
    expect(waitsForToolApproval(current.nodes.a)).toBe(true);
    expect(runWaitsForToolApproval(current)).toBe(true);
    useEditor.getState().applyEvent(event("tool_approval_decided", { id: "c1", status: "approved" }, 2));
    useEditor.getState().applyEvent(event("tool_started", { id: "c1", name: "send_message", input: { to: "x" } }, 3));
    current = useEditor.getState().run!;
    expect(waitsForToolApproval(current.nodes.a)).toBe(false);
    expect(current.nodes.a.tool_calls).toHaveLength(1);
    expect(current.nodes.a.tool_calls[0].input).toEqual({ to: "x" });
    expect(current.nodes.a.tool_calls[0].approval?.status).toBe("approved");
    useEditor.getState().setRun(null);
  });

  it("asks for a fresh copy of the run when nudged", () => {
    const before = useEditor.getState().runNudge;
    useEditor.getState().nudgeRun();
    expect(useEditor.getState().runNudge).toBe(before + 1);
  });
});

describe("cancelling a run (ED-08)", () => {
  it("says 'Cancel run' and asks once more before it cancels", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    render(wrap(<CancelRunButton runId="run_1" />));
    fireEvent.click(screen.getByRole("button", { name: "Lauf abbrechen" }));
    expect(fetchMock).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Wirklich abbrechen?" }));
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toContain("/runs/run_1/cancel");
    vi.unstubAllGlobals();
  });
});

describe("field labels of a passed-on result (ED-04)", () => {
  it("finds the agent whose fields name every key, and keeps long descriptions out of the label", async () => {
    const { outputFieldsOf } = await import("../components/Markdown");
    const report = { id: "report", agent: { output: { fields: [{ name: "d1_team", type: "string", description: "D1 Team mit Rollen", required: true }] } } };
    const fields = outputFieldsOf([{ id: "output", agent: null }, report] as never, "output", { d1_team: "x" });
    expect(fields?.[0].description).toBe("D1 Team mit Rollen");
    expect(fieldLabel("analysis", [{ name: "analysis", type: "string", description: "x".repeat(80), required: true }])).toBe("Analysis");
  });
});
