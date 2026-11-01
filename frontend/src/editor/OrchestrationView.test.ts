import { describe, expect, it } from "vitest";

import type { OrchestrationRecord, OrchestrationStep } from "../api/types";
import { childRuns } from "./OrchestrationView";
import { wholeNumber } from "./OrchestratorInspector";

function step(index: number, action: "delegate" | "finish" | null, code: string | null = null): OrchestrationStep {
  return {
    index,
    decision: action === null ? null : { action, member: "wf_a", task: "go" },
    verdict: { code, message: "" },
    result: null,
    error: null,
    raw: action === null ? "nonsense" : null,
  };
}

describe("childRuns", () => {
  it("links only accepted delegations to the team runs, in order", () => {
    const record: OrchestrationRecord = {
      version: 1,
      task: "t",
      steps: [step(0, "delegate"), step(1, "delegate", "orchestration.repeated"), step(2, null, "orchestration.invalid_decision"), step(3, "delegate"), step(4, "finish")],
      outcome: "finished",
      answer: "a",
      stop_code: null,
    };
    const links = childRuns(record, ["run_1", "run_2"]);
    expect([...links.entries()]).toEqual([
      [0, "run_1"],
      [3, "run_2"],
    ]);
  });

  it("does not invent runs that are missing", () => {
    const record: OrchestrationRecord = { version: 1, task: "t", steps: [step(0, "delegate")], outcome: null, answer: null, stop_code: null };
    expect(childRuns(record, []).size).toBe(0);
  });
});

describe("wholeNumber", () => {
  it("clamps and rounds, and treats empty input as no value", () => {
    expect(wholeNumber("", 1, 50)).toBeNull();
    expect(wholeNumber("abc", 1, 50)).toBeNull();
    expect(wholeNumber("0", 1, 50)).toBe(1);
    expect(wholeNumber("70", 1, 50)).toBe(50);
    expect(wholeNumber("3.6", 1, 50)).toBe(4);
  });
});

import type { Run, WorkflowNode } from "../api/types";
import { assignmentsOf, teamChanges, teamTemplate, teamsThatWorked } from "./OrchestrationView";

function record(steps: OrchestrationStep[], extra: Partial<OrchestrationRecord> = {}): OrchestrationRecord {
  return { version: 2, task: "t", steps, outcome: "finished", answer: "a", stop_code: null, pending: null, ...extra };
}

function staff(index: number, add: string[], remove: string[] = [], code: string | null = null): OrchestrationStep {
  return { index, decision: { action: "staff", add, remove }, verdict: { code, message: "" }, result: null, error: null, raw: null, outcomes: [] };
}

describe("protocol version 2", () => {
  it("links delegations to their team runs by the outcome's reference", () => {
    const delegated: OrchestrationStep = {
      ...step(0, "delegate"),
      outcomes: [{ member: "wf_a", status: "succeeded", result: "r", ref: "run_9" }],
    };
    expect([...childRuns(record([delegated]), ["run_1"]).entries()]).toEqual([[0, "run_9"]]);
  });

  it("follows the team over time and ignores refused changes", () => {
    const changes = teamChanges(
      record([staff(0, ["a", "b"]), staff(1, ["c"], [], "orchestration.team_limit"), staff(2, ["c"], ["a"])]),
    );
    expect(changes.map((change) => change.team)).toEqual([
      ["a", "b"],
      ["b", "c"],
    ]);
  });

  it("lists the teams that worked once, in order of first use", () => {
    const parallel: OrchestrationStep = {
      index: 1,
      decision: { action: "parallel", assignments: [{ member: "wf_b", task: "x" }, { member: "wf_a", task: "y" }] },
      verdict: { code: null, message: "" },
      result: null,
      error: null,
      raw: null,
      outcomes: [],
    };
    expect(teamsThatWorked(record([step(0, "delegate"), parallel, step(2, "delegate", "orchestration.repeated")]))).toEqual([
      "wf_a",
      "wf_b",
    ]);
    expect(assignmentsOf(parallel.decision)).toHaveLength(2);
    expect(assignmentsOf({ action: "finish", answer: "x" })).toEqual([]);
  });

  it("builds a template with the teams that worked, pinned to the run's versions", () => {
    const node = {
      id: "lead",
      type: "orchestrator",
      label: "Lead",
      position: { x: 0, y: 0 },
      orchestrator: {
        members: [
          { workflow_id: "wf_a", version: 3 },
          { workflow_id: "wf_b", version: 1 },
          { workflow_id: "wf_c", version: 2 },
        ],
        task_template: "{{input}}",
        instructions: "",
        model: "m",
        max_decisions: 8,
        max_per_member: null,
        select: { capabilities: ["x"], max_teams: 5, done: true },
        staffing: true,
        max_team: 2,
      },
    } as unknown as WorkflowNode;
    const run = {
      workflow_name: "Report",
      workflow: { name: "Report", description: "d", nodes: [{ id: "s", type: "start", position: { x: 0, y: 0 } }], edges: [], budget_usd: 2 },
    } as unknown as Run;
    const template = teamTemplate(run, node, ["wf_c", "wf_a"], "Report – Team");
    const lead = template.nodes.find((item) => item.id === "lead")!;
    expect(lead.orchestrator?.members).toEqual([
      { workflow_id: "wf_c", version: 2 },
      { workflow_id: "wf_a", version: 3 },
    ]);
    expect(lead.orchestrator?.select).toBeNull();
    expect(lead.orchestrator?.staffing).toBe(false);
    expect(template.budget_usd).toBe(2);
    expect(template.edges.map((edge) => `${edge.source}>${edge.target}`)).toEqual(["start>lead", "lead>out"]);
  });
});
