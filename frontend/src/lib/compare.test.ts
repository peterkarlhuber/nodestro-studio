import { describe, expect, it } from "vitest";

import type { NodeRun, Run, Usage, WorkflowNode } from "../api/types";
import { newNode } from "./defaults";
import { compareRuns, totals } from "./compare";
import { diffLines } from "./diff";
import { HIDDEN, redact } from "./redact";
import { hasChanges, versionChanges } from "./versionDiff";

function usage(tokens: number, cost: number | null): Usage {
  return {
    requests: tokens ? 1 : 0,
    input_tokens: tokens / 2,
    output_tokens: tokens / 2,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    total_tokens: tokens,
    estimated_cost_usd: cost,
  } as Usage;
}

function nodeRun(output: string, model_tokens = 100, extra: Partial<NodeRun> = {}): NodeRun {
  return {
    status: "succeeded",
    prompt: "p",
    output,
    text: output,
    thinking: "",
    error: null,
    tool_calls: [],
    usage: usage(model_tokens, 0.01),
    evaluation: null,
    memory: null,
    started_at: "2026-01-01T00:00:00Z",
    finished_at: "2026-01-01T00:00:02Z",
    ...extra,
  };
}

function agent(id: string, name: string, model = "claude-sonnet-5-5"): WorkflowNode {
  const node = newNode("agent", { x: 0, y: 0 }, { name });
  return { ...node, id, label: name, agent: { ...node.agent!, model } };
}

function run(id: string, nodes: WorkflowNode[], states: Record<string, NodeRun>, output: string, workflowId = "wf"): Run {
  return {
    id,
    workflow_id: workflowId,
    workflow_name: "Test",
    workflow: {
      id: workflowId,
      name: "Test",
      description: "",
      budget_usd: null,
      nodes,
      edges: [],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    input: "x",
    file_ids: [],
    status: "succeeded",
    error: null,
    output,
    nodes: states,
    usage: usage(200, 0.02),
    created_at: "2026-01-01T00:00:00Z",
    started_at: "2026-01-01T00:00:00Z",
    finished_at: "2026-01-01T00:00:05Z",
  };
}

describe("diffLines", () => {
  it("marks added and removed lines around common ones", () => {
    expect(diffLines("a\nb\nc", "a\nc\nd")).toEqual([
      { type: "same", text: "a" },
      { type: "removed", text: "b" },
      { type: "same", text: "c" },
      { type: "added", text: "d" },
    ]);
  });

  it("treats equal texts as unchanged", () => {
    expect(diffLines("x\ny", "x\ny").every((line) => line.type === "same")).toBe(true);
  });
});

describe("compareRuns", () => {
  it("finds what differs per agent", () => {
    const a = run("r1", [agent("n1", "Writer"), agent("n2", "Editor")], { n1: nodeRun("hello"), n2: nodeRun("same") }, "hello");
    const b = run(
      "r2",
      [agent("n1", "Writer", "claude-opus-5-5"), agent("n2", "Editor")],
      { n1: nodeRun("hello world", 300), n2: nodeRun("same") },
      "hello world",
    );
    const result = compareRuns(a, b);
    expect(result.sameWorkflow).toBe(true);
    expect(result.configChanged).toBe(true);
    const writer = result.agents.find((pair) => pair.label === "Writer")!;
    expect([...writer.differs].sort()).toEqual(["model", "output", "tokens"]);
    const editor = result.agents.find((pair) => pair.label === "Editor")!;
    expect(editor.differs.size).toBe(0);
    expect(result.outputA).toBe("hello");
    expect(result.outputB).toBe("hello world");
  });

  it("matches agents by name across workflows and reports missing ones", () => {
    const a = run("r1", [agent("x", "Research")], { x: nodeRun("one") }, "one", "wf1");
    const b = run("r2", [agent("y", "research"), agent("z", "Summary")], { y: nodeRun("one"), z: nodeRun("two") }, "two", "wf2");
    const result = compareRuns(a, b);
    expect(result.sameWorkflow).toBe(false);
    expect(result.agents).toHaveLength(2);
    expect(result.agents.find((pair) => pair.key === "research")!.differs.size).toBe(0);
    expect([...result.agents.find((pair) => pair.key === "summary")!.differs]).toEqual(["presence"]);
  });

  it("sums totals from the run", () => {
    const value = totals(run("r1", [agent("n1", "A")], { n1: nodeRun("x") }, "x"));
    expect(value.durationMs).toBe(5000);
    expect(value.totalTokens).toBe(200);
    expect(value.cost).toBe(0.02);
  });
});

describe("versionChanges", () => {
  it("lists added, removed and changed agents and connections", () => {
    const one = agent("a", "A");
    const two = agent("b", "B");
    const before = { name: "W", description: "", budget_usd: null, nodes: [one], edges: [] };
    const after = {
      name: "W2",
      description: "",
      budget_usd: 1,
      nodes: [{ ...one, agent: { ...one.agent!, system_prompt: "new" } }, two],
      edges: [{ id: "e", source: "a", target: "b" }],
    };
    const changes = versionChanges(before, after);
    expect(changes).toMatchObject({
      renamed: true,
      added: ["B"],
      removed: [],
      changed: ["A"],
      connectionsAdded: 1,
      connectionsRemoved: 0,
      settingsChanged: true,
    });
    expect(hasChanges(changes)).toBe(true);
    expect(hasChanges(versionChanges(before, before))).toBe(false);
  });

  it("ignores moved nodes", () => {
    const one = agent("a", "A");
    const moved = { ...one, position: { x: 500, y: 500 } };
    const base = { name: "W", description: "", budget_usd: null, edges: [] };
    expect(hasChanges(versionChanges({ ...base, nodes: [one] }, { ...base, nodes: [moved] }))).toBe(false);
  });
});

describe("redact", () => {
  it("hides secret keys and key-like values", () => {
    const value = redact({
      headers: { "x-api-key": "abc", Authorization: "Bearer xyz" },
      note: "use sk-ant-api03-abcdefghij please",
      max_tokens: 10,
    }) as Record<string, Record<string, string> | string | number>;
    expect(value.headers).toEqual({ "x-api-key": HIDDEN, Authorization: HIDDEN });
    expect(value.note).toBe(`use ${HIDDEN} please`);
    expect(value.max_tokens).toBe(10);
  });
});
