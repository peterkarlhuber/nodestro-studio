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
