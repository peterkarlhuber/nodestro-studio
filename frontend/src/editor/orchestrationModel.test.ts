import { describe, expect, it } from "vitest";

import type { OrchestrationRecord, OrchestrationStep, OrchestratorConfig, Run } from "../api/types";
import { teamRunOrigin } from "../runs/RunOrigin";
import { limitUse, nestedRunCount, orchestrationsOf, roundsOf, teamRunCounts, teamRunsOf } from "./orchestrationModel";

const ok = { code: null, message: "" };

function step(index: number, extra: Partial<OrchestrationStep>): OrchestrationStep {
  return { index, decision: null, verdict: ok, result: null, error: null, raw: null, outcomes: [], ...extra };
}

// The shape the API returns for the e2e orchestration server's first run (staff, parallel, staff, delegate, finish).
const DONE: OrchestrationRecord = {
  version: 2,
  task: "Schreibe über Otter",
  steps: [
    step(0, { decision: { action: "staff", add: ["wf_r", "wf_d"], remove: [], reason: "first" } }),
    step(1, {
      decision: { action: "parallel", assignments: [{ member: "wf_r", task: "facts" }, { member: "wf_d", task: "draft" }], reason: "independent" },
      outcomes: [
        { member: "wf_r", status: "succeeded", result: "a", ref: "run_r" },
        { member: "wf_d", status: "succeeded", result: "b", ref: "run_d" },
      ],
    }),
    step(2, { decision: { action: "staff", add: ["wf_l"], remove: ["wf_r"] } }),
    step(3, {
      decision: { action: "delegate", member: "wf_l", task: "polish", values: { tone: "formal" } },
      result: "c",
      outcomes: [{ member: "wf_l", status: "succeeded", result: "c", ref: "run_l" }],
    }),
    step(4, { decision: { action: "finish", answer: "done" } }),
  ],
  outcome: "finished",
  answer: "done",
  stop_code: null,
  pending: null,
};

const PAUSED: OrchestrationRecord = {
  ...DONE,
  steps: [DONE.steps[0]],
  outcome: null,
  answer: null,
  pending: {
    index: 1,
    decision: DONE.steps[1].decision!,
    outcomes: [
      { member: "wf_r", status: "succeeded", result: "a", ref: "run_r" },
      { member: "wf_d", status: "waiting", ref: "run_d" },
    ],
  },
};

const CONFIG = { max_decisions: 8, max_parallel: 2, max_per_member: 2, staffing: true, max_team: 2 } as OrchestratorConfig;

describe("team runs of an orchestrator", () => {
  it("lists every team run by decision, with its run", () => {
    const runs = teamRunsOf(DONE, ["run_r", "run_d", "run_l"]);
    expect(runs.map((item) => [item.round, item.slot, item.member, item.ref, item.outcome?.status])).toEqual([
      [1, 0, "wf_r", "run_r", "succeeded"],
      [1, 1, "wf_d", "run_d", "succeeded"],
      [3, 0, "wf_l", "run_l", "succeeded"],
    ]);
    expect(runs[2].values).toEqual({ tone: "formal" });
    expect(teamRunCounts(runs)).toEqual([["succeeded", 3]]);
  });

  it("shows the waiting decision of a paused run with the finished and the waiting team", () => {
    const runs = teamRunsOf(PAUSED, ["run_r", "run_d"]);
    expect(runs.map((item) => [item.round, item.pending, item.outcome?.status, item.ref])).toEqual([
      [1, true, "succeeded", "run_r"],
      [1, true, "waiting", "run_d"],
    ]);
    expect(teamRunCounts(runs)).toEqual([
      ["waiting", 1],
      ["succeeded", 1],
    ]);
  });

  it("adds runs the record does not know yet as running in the current decision", () => {
    const record = { ...DONE, steps: DONE.steps.slice(0, 1), outcome: null };
    const runs = teamRunsOf(record, ["run_r", "run_d"]);
    expect(runs.map((item) => [item.round, item.ref, item.outcome])).toEqual([
      [1, "run_r", null],
      [1, "run_d", null],
    ]);
    expect(teamRunCounts(runs)).toEqual([["running", 2]]);
  });

  it("gives version 1 delegations the listed runs in order and keeps their end", () => {
    const record: OrchestrationRecord = {
      version: 1,
      task: "t",
      steps: [
        { index: 0, decision: { action: "delegate", member: "wf_a", task: "x" }, verdict: ok, result: "fine", error: null, raw: null },
        { index: 1, decision: { action: "delegate", member: "wf_a", task: "x" }, verdict: { code: "orchestration.repeated", message: "" }, result: null, error: null, raw: null },
        { index: 2, decision: { action: "delegate", member: "wf_b", task: "y" }, verdict: ok, result: null, error: "boom", raw: null },
      ],
      outcome: "finished",
      answer: "a",
      stop_code: null,
    };
    const runs = teamRunsOf(record, ["run_1", "run_2"]);
    expect(runs.map((item) => [item.round, item.ref, item.outcome?.status])).toEqual([
      [0, "run_1", "succeeded"],
      [2, "run_2", "failed"],
    ]);
  });

  it("never invents a run that the API does not list", () => {
    const record = { ...DONE, steps: [step(0, { decision: { action: "delegate", member: "wf_a", task: "x" }, outcomes: [{ member: "wf_a", status: "failed" as const }] })] };
    expect(teamRunsOf(record, [])[0].ref).toBeNull();
  });
});

describe("rounds", () => {
  it("folds refused answers in a row into one group and keeps a single one", () => {
    const bad = (index: number) => step(index, { verdict: { code: "orchestration.invalid_decision", message: "" }, raw: '{"action": "x"}' });
    const rounds = roundsOf([bad(0), DONE.steps[1], bad(2), bad(3), bad(4), DONE.steps[4]]);
    expect(rounds.map((round) => (round.kind === "step" ? round.step.index : round.steps.map((item) => item.index)))).toEqual([
      0,
      1,
      [2, 3, 4],
      4,
    ]);
  });
});

describe("limits", () => {
  it("counts decisions (the waiting one too), the busiest team and the widest decision", () => {
    expect(limitUse(CONFIG, DONE)).toEqual({
      decisions: 5,
      maxDecisions: 8,
      busiest: { member: "wf_r", count: 1 },
      maxPerMember: 2,
      widest: 2,
      maxParallel: 2,
    });
    expect(limitUse(CONFIG, PAUSED).decisions).toBe(2);
  });
});

describe("nested teams", () => {
  const lead = { id: "lead", type: "orchestrator", label: "Leitung", position: { x: 0, y: 0 } };
  const parent = {
    id: "run_p",
    workflow: { nodes: [lead] },
    nodes: { lead: { orchestration: DONE, child_run_ids: ["run_r", "run_d", "run_l"] } },
  } as unknown as Run;

  it("counts the runs a team started itself", () => {
    expect(nestedRunCount(parent)).toBe(3);
    expect(nestedRunCount({ nodes: { a: { child_run_id: "run_x" } } } as unknown as Run)).toBe(1);
    expect(nestedRunCount({ nodes: { a: {} } } as unknown as Run)).toBe(0);
  });

  it("finds the orchestrator and decision that started a team run", () => {
    expect(teamRunOrigin(parent, "run_l")).toEqual({ label: "Leitung", decision: 4 });
    expect(teamRunOrigin(parent, "run_other")).toBeNull();
    expect(teamRunOrigin(undefined, "run_l")).toBeNull();
  });

  it("summarizes the orchestrator steps of a run", () => {
    const [item] = orchestrationsOf(parent);
    expect(item.label).toBe("Leitung");
    expect(item.runs).toHaveLength(3);
  });
});
