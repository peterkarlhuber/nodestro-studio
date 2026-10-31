import { describe, expect, it } from "vitest";

import type { NodeRun, Run, WorkflowNode } from "../api/types";
import { summarizeRun } from "./runSummary";

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
