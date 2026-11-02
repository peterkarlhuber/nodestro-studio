import { describe, expect, it } from "vitest";

import type { NodeRun, Run, WorkflowNode } from "../api/types";
import { initialStep, summarizeRun, waitsForBudgetDecision } from "./runSummary";

const node = (id: string, type: WorkflowNode["type"], label: string): WorkflowNode =>
  ({ id, type, label, position: { x: 0, y: 0 }, agent: null, start: null }) as WorkflowNode;

const state = (status: NodeRun["status"], started: string | null, extra: Partial<NodeRun> = {}): NodeRun =>
  ({ status, started_at: started, finished_at: started, tool_calls: [], ...extra }) as NodeRun;

const call = (name: string, is_error = false) => ({
  id: name,
  name,
  input: {},
  output: "",
  is_error,
  started_at: "",
  finished_at: "",
});

function run(nodes: WorkflowNode[], states: Record<string, NodeRun>): Run {
  return { workflow: { nodes, edges: [] }, nodes: states } as unknown as Run;
}

const NODES = [
  node("start", "start", "Start"),
  node("classify", "agent", "Klassifizierer"),
  node("route", "condition", "Routing"),
  node("answer", "agent", "Antwort"),
  node("check", "approval", "Freigabe"),
  node("out", "output", "Ergebnis"),
];

describe("run summary", () => {
  it("names the path, the approvals and the tools from the stored run", () => {
    const summary = summarizeRun(
      run(NODES, {
        classify: state("succeeded", "2026-10-31T10:00:00Z", { tool_calls: [call("web_search"), call("web_search"), call("calc", true)] }),
        route: state("succeeded", "2026-10-31T10:00:01Z", {
          decision: { branches: ["complaint"], labels: ["Beschwerde"], value: "complaint", fallback_code: null, fallback_params: {}, results: {} },
        }),
        answer: state("succeeded", "2026-10-31T10:00:02Z"),
        check: state("succeeded", "2026-10-31T10:00:03Z", {
          approval: { decision: "approved", comment: "", decided_at: "", decided_by: "", reused_from: null },
        }),
      }),
    );
    expect(summary).toEqual({
      done: 4,
      skipped: 0,
      total: 4,
      decisions: [{ nodeId: "route", label: "Routing", branches: ["Beschwerde"] }],
      approvals: [{ nodeId: "check", label: "Freigabe", decision: "approved" }],
      tools: [
        { name: "web_search", calls: 2, errors: 0 },
        { name: "calc", calls: 1, errors: 1 },
      ],
      failed: null,
      budget: { waiting: false, raises: 0 },
    });
  });

  it("names the first failed step and a waiting approval", () => {
    const summary = summarizeRun(
      run(NODES, {
        classify: state("succeeded", "2026-10-31T10:00:00Z"),
        route: state("succeeded", "2026-10-31T10:00:01Z"),
        answer: state("failed", "2026-10-31T10:00:02Z"),
        check: state("awaiting_approval", "2026-10-31T10:00:03Z"),
      }),
    );
    expect(summary.failed).toEqual({ nodeId: "answer", label: "Antwort" });
    expect(summary.done).toBe(2);
    expect(summary.approvals).toEqual([{ nodeId: "check", label: "Freigabe", decision: null }]);
    // The decision ran, but its outcome is missing (e.g. an older trace): reported as missing, not guessed.
    expect(summary.decisions).toEqual([{ nodeId: "route", label: "Routing", branches: null }]);
  });

  it("leaves out steps that did not run and a finished approval without a record is unknown", () => {
    const summary = summarizeRun(
      run(NODES, {
        classify: state("succeeded", "2026-10-31T10:00:00Z"),
        route: state("skipped", null),
        check: state("succeeded", "2026-10-31T10:00:03Z"),
      }),
    );
    expect(summary.decisions).toEqual([]);
    expect(summary.approvals).toEqual([{ nodeId: "check", label: "Freigabe", decision: "unknown" }]);
    expect(summary.tools).toEqual([]);
    expect(summary.total).toBe(4);
    expect(summary.skipped).toBe(1);
  });
});

describe("run summary of a budget decision (BUDGET-1)", () => {
  const budget = (pending: string | null, raises = 0) => ({
    source: "workflow" as const,
    initial_limit_usd: "1.00",
    limit_usd: "2.00",
    raises: Array.from({ length: raises }, (_, index) => ({
      request_id: `bud_${index}`,
      previous_limit_usd: "1.00",
      new_limit_usd: "2.00",
      decided_by: "local",
      decided_at: "2026-11-02T10:00:00Z",
    })),
    pending_request_id: pending,
  });

  it("says that a paused run waits for a budget decision and opens the waiting step", () => {
    const paused = {
      ...run(NODES, {
        classify: state("succeeded", "2026-10-31T10:00:00Z"),
        route: state("succeeded", "2026-10-31T10:00:01Z"),
        answer: state("awaiting_budget", "2026-10-31T10:00:02Z"),
      }),
      status: "paused",
      budget: budget("bud_1", 2),
    } as Run;
    expect(waitsForBudgetDecision(paused)).toBe(true);
    expect(summarizeRun(paused).budget).toEqual({ waiting: true, raises: 2 });
    expect(initialStep(paused)?.id).toBe("answer");
  });

  it("does not call a finished run waiting, and counts its raises", () => {
    const done = { ...run(NODES, {}), status: "succeeded", budget: budget("bud_1", 1) } as Run;
    expect(waitsForBudgetDecision(done)).toBe(false);
    expect(summarizeRun(done).budget).toEqual({ waiting: false, raises: 1 });
    expect(summarizeRun({ ...run(NODES, {}), status: "paused" } as Run).budget).toEqual({ waiting: false, raises: 0 });
  });
});
