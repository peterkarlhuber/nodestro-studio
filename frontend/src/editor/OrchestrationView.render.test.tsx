import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../api/client";
import type { NodeRun, OrchestrationRecord, Run, WorkflowNode } from "../api/types";
import { OrchestrationView } from "./OrchestrationView";

const ok = { code: null, message: "" };
const usage = (cost: number) => ({ requests: 1, total_tokens: 10, estimated_cost_usd: cost }) as NodeRun["usage"];

const NODE = {
  id: "lead",
  type: "orchestrator",
  label: "Leitung",
  position: { x: 0, y: 0 },
  orchestrator: { members: [{ workflow_id: "wf_r", version: 1 }, { workflow_id: "wf_d", version: 2 }], model: "", max_decisions: 8, max_parallel: 2, max_per_member: null, staffing: false },
} as unknown as WorkflowNode;

function state(record: OrchestrationRecord, children: string[]): NodeRun {
  return { status: "awaiting_approval", orchestration: record, child_run_ids: children, usage: usage(0.016), decision_usage: usage(0.008) } as unknown as NodeRun;
}

function child(id: string, name: string, status: Run["status"], extra: Partial<Run> = {}): Run {
  return { id, workflow_name: name, status, usage: usage(0.004), active_seconds: 1.5, nodes: {}, parent_run_id: "run_p", ...extra } as unknown as Run;
}

function show(node: NodeRun) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <OrchestrationView node={NODE} state={node} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.spyOn(api, "workflows").mockResolvedValue([
    { id: "wf_r", name: "Recherche" },
    { id: "wf_d", name: "Entwurf" },
  ] as never);
  vi.spyOn(api, "meta").mockResolvedValue({ models: [] } as never);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const PARALLEL = { action: "parallel" as const, assignments: [{ member: "wf_r", task: "Fakten" }, { member: "wf_d", task: "Entwurf schreiben" }], reason: "Beides ist unabhängig" };

describe("the run view of an orchestrator", () => {
  it("shows a paused run: the waiting decision, both team runs with status, time and cost, and the limits", async () => {
    const runs: Record<string, Run> = {
      run_r: child("run_r", "Recherche", "succeeded"),
      // This team is itself an orchestrator: it started two team runs of its own.
      run_d: child("run_d", "Entwurf", "paused", { nodes: { inner: { child_run_ids: ["run_x", "run_y"] } } as never }),
    };
    vi.spyOn(api, "run").mockImplementation(async (id: string) => runs[id]);
    const record: OrchestrationRecord = {
      version: 2,
      task: "t",
      steps: [{ index: 0, decision: { action: "staff", add: ["wf_r", "wf_d"], reason: "Zuerst" }, verdict: ok, result: null, error: null, raw: null, outcomes: [] }],
      outcome: null,
      answer: null,
      stop_code: null,
      pending: {
        index: 1,
        decision: PARALLEL,
        outcomes: [
          { member: "wf_r", status: "succeeded", result: "Otter", ref: "run_r" },
          { member: "wf_d", status: "waiting", ref: "run_d" },
        ],
      },
    };
    show(state(record, ["run_r", "run_d"]));
    const pending = await screen.findByTestId("orchestration-pending");
    expect(pending).toHaveTextContent("Entscheidung 2 · Wartet auf Freigabe: 1 Team");
    expect(pending).toHaveTextContent("Beides ist unabhängig");
    const rows = within(pending).getAllByTestId("orchestration-team-run");
    expect(rows.map((row) => row.dataset.ref)).toEqual(["run_r", "run_d"]);
    await waitFor(() => expect(within(pending).getAllByTestId("orchestration-team-run-meta")).toHaveLength(2));
    expect(rows[0]).toHaveTextContent("aktiv 1,5 s");
    expect(within(rows[1]).getByTestId("orchestration-nested")).toHaveTextContent("arbeitet mit 2 eigenen Läufen");
    expect(within(pending).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/executions/run_r", "/executions/run_d"]);
    const limits = screen.getByTestId("orchestration-limits");
    expect(limits).toHaveTextContent("2 von 8");
    expect(limits).toHaveTextContent("bis zu 2 Teams gleichzeitig");
    expect(limits).toHaveTextContent("Wartet auf Freigabe: 1");
    expect(limits).toHaveTextContent("Erfolgreich: 1");
    expect(screen.getByText("Pool: 2 Teams")).toBeInTheDocument();
  });

  it("folds refused answers, offers a way out and says why the orchestrator stopped", async () => {
    vi.spyOn(api, "run").mockRejectedValue(new Error("gone"));
    const bad = (index: number) => ({ index, decision: null, verdict: { code: "orchestration.invalid_decision", message: "" }, result: null, error: null, raw: '{"action": "Beispiel"}', outcomes: [] });
    const record: OrchestrationRecord = {
      version: 2,
      task: "t",
      steps: [
        { index: 0, decision: { action: "delegate", member: "wf_r", task: "Fakten" }, verdict: ok, result: "x", error: null, raw: null, outcomes: [{ member: "wf_r", status: "failed", error: "kaputt", ref: "run_r" }] },
        bad(1),
        bad(2),
        bad(3),
      ],
      outcome: "stopped",
      answer: null,
      stop_code: "orchestration.decision_limit",
      pending: null,
    };
    show({ ...state(record, ["run_r"]), status: "failed" });
    const group = await screen.findByTestId("orchestration-refused-group");
    expect(group).toHaveTextContent("Entscheidungen 2–4");
    expect(group).toHaveTextContent("3 Antworten in Folge abgelehnt, nichts ausgeführt");
    expect(within(group).getByTestId("orchestration-refused-hint")).toHaveTextContent("leistungsfähigeres Modell");
    expect(screen.getByTestId("orchestration-stopped")).toHaveTextContent("Der Orchestrator hat aufgehört: Es sind keine Entscheidungen mehr übrig.");
    const first = screen.getAllByTestId("orchestration-step")[0];
    expect(first).toHaveTextContent("Entscheidung 1");
    expect(within(first).getByTestId("orchestration-outcome").dataset.status).toBe("failed");
    expect(first).toHaveTextContent("kaputt");
    // The team's run cannot be loaded: the row stays, without time and cost.
    expect(within(first).queryByTestId("orchestration-team-run-meta")).toBeNull();
  });

  it("shows teams that are still working in the current decision", async () => {
    vi.spyOn(api, "run").mockImplementation(async (id: string) => child(id, "Recherche", "running"));
    const record: OrchestrationRecord = { version: 2, task: "t", steps: [], outcome: null, answer: null, stop_code: null, pending: null };
    show({ ...state(record, ["run_r"]), status: "running" });
    const current = await screen.findByTestId("orchestration-current");
    expect(current).toHaveTextContent("Entscheidung 1");
    expect(current).toHaveTextContent("1 Team arbeitet gerade");
    await waitFor(() => expect(current).toHaveTextContent("Recherche"));
    expect(screen.getByTestId("orchestration-team-run-count")).toHaveTextContent("1");
  });
});
