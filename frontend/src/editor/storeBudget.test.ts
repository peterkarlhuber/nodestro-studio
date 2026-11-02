import { beforeEach, describe, expect, it } from "vitest";

import type { NodeRun, Run, Workflow } from "../api/types";
import { newNode } from "../lib/defaults";
import { budgetRequest } from "../test/budgetFixtures";
import { budgetWaitingNodes, liveUsage, runWaitsForBudget, useEditor, waitsForBudget } from "./store";

function state(status: NodeRun["status"], extra: Partial<NodeRun> = {}): NodeRun {
  return {
    status,
    prompt: null,
    output: null,
    text: "",
    thinking: "",
    error: null,
    tool_calls: [],
    usage: liveUsage(null),
    evaluation: null,
    memory: null,
    started_at: null,
    finished_at: null,
    ...extra,
  };
}

function run(): Run {
  const wf = {
    id: "wf_1",
    name: "Test",
    description: "",
    budget_usd: 1,
    nodes: [
      { ...newNode("agent", { x: 0, y: 0 }, { name: "A" }), id: "writer" },
      { ...newNode("agent", { x: 300, y: 0 }, { name: "B" }), id: "other" },
      { ...newNode("subworkflow", { x: 600, y: 0 }), id: "team" },
    ],
    edges: [],
  } as unknown as Workflow;
  return {
    id: "run_1",
    workflow_id: wf.id,
    workflow_name: wf.name,
    workflow: wf,
    input: "",
    file_ids: [],
    status: "running",
    error: null,
    output: null,
    nodes: { writer: state("running"), other: state("succeeded"), team: state("running", { child_run_id: "run_child" }) },
    usage: liveUsage(null),
    budget_usd: 2,
    budget: { source: "workflow", initial_limit_usd: "1.00", limit_usd: "2.00", raises: [], pending_request_id: null },
    created_at: "2026-11-02T10:00:00Z",
    started_at: "2026-11-02T10:00:00Z",
    finished_at: null,
  };
}

const at = "2026-11-02T10:05:00Z";
const apply = (type: string, data: Record<string, unknown>, nodeId: string | null = null) =>
  useEditor.getState().applyEvent({ seq: 1, run_id: "run_1", type, node_id: nodeId, data, at });

describe("budget events of the live run (BUDGET-1)", () => {
  beforeEach(() => useEditor.getState().setRun(run()));

  it("marks the run and the blocked step as waiting for a budget decision", () => {
    apply("budget_required", { request: budgetRequest() });
    const current = useEditor.getState().run!;
    expect(current.budget?.pending_request_id).toBe("bud_1");
    expect(current.nodes.writer.status).toBe("awaiting_budget");
    expect(current.nodes.other.status).toBe("succeeded");
    expect(waitsForBudget(current.nodes.writer)).toBe(true);
    expect(runWaitsForBudget(current)).toBe(true);
    apply("run_paused", { status: "paused", usage: liveUsage(null) });
    expect(runWaitsForBudget(useEditor.getState().run)).toBe(true);
  });

  it("records a raise, clears the pending decision and lets the steps go on", () => {
    apply("budget_required", { request: budgetRequest() });
    apply("budget_decided", {
      request: budgetRequest({ status: "raised", new_limit_usd: "3.00", decided_by: "local", decided_at: at, outcome: "continued" }),
    });
    const current = useEditor.getState().run!;
    expect(current.budget).toMatchObject({ pending_request_id: null, limit_usd: "3.00", initial_limit_usd: "1.00" });
    expect(current.budget?.raises).toEqual([
      { request_id: "bud_1", previous_limit_usd: "2.00", new_limit_usd: "3.00", decided_by: "local", decided_at: at },
    ]);
    expect(current.budget_usd).toBe(3);
    expect(current.nodes.writer.status).toBe("running");
    expect(runWaitsForBudget(current)).toBe(false);
    // The same event again changes nothing.
    apply("budget_decided", { request: budgetRequest({ status: "raised", new_limit_usd: "3.00", decided_by: "local" }) });
    expect(useEditor.getState().run!.budget?.raises).toHaveLength(1);
  });

  it("marks the team step whose child run waits, and keeps the run's limit on a team raise", () => {
    const request = budgetRequest({
      block: { scope: "team", run_id: "run_child", node_id: "lead", label: "Recherche" },
      requests: [{ run_id: "run_child", node_id: "a", agent: "", model: "m", max_cost_usd: "0.10", bounded: true, price_status: null }],
    });
    expect(budgetWaitingNodes(run(), request)).toEqual(["team"]);
    apply("budget_required", { request });
    expect(useEditor.getState().run!.nodes.team.status).toBe("awaiting_budget");
    apply("budget_decided", { request: { ...request, status: "raised", new_limit_usd: "0.50", limit_usd: "0.20" } });
    expect(useEditor.getState().run!.budget?.limit_usd).toBe("2.00");
    expect(useEditor.getState().run!.nodes.team.status).toBe("running");
  });

  it("ignores events without a request and runs of older backends", () => {
    apply("budget_required", {});
    expect(useEditor.getState().run!.budget?.pending_request_id).toBeNull();
    useEditor.getState().setRun({ ...run(), budget: undefined });
    apply("budget_required", { request: budgetRequest() });
    expect(useEditor.getState().run!.budget).toMatchObject({ pending_request_id: "bud_1", raises: [] });
  });
});
