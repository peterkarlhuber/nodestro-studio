import { describe, expect, it } from "vitest";

import type { ArchitectEvent, ArchitectJob, WorkflowIn } from "../api/types";
import { newNode } from "../lib/defaults";
import { draftDiff, graphDiffers } from "./draftDiff";
import { applyArchitectEvent, latestGraph, logEntries, stepStates } from "./progress";

const PHASES: ArchitectJob["phases"] = ["analyze", "plan", "resources", "configure", "tools", "connect", "validate", "present"];

function job(overrides: Partial<ArchitectJob> = {}): ArchitectJob {
  return {
    id: "arc_1",
    mode: "create",
    description: "Write a report",
    language: "en",
    workflow_id: null,
    status: "running",
    phase: null,
    phases: PHASES,
    question: null,
    analysis: null,
    summary: "",
    assumptions: [],
    base: null,
    draft: null,
    marks: {},
    changes: [],
    check: null,
    tool_drafts: [],
    missing_tools: [],
    notes: [],
    fixes: 0,
    repairs: 0,
    max_repairs: 2,
    usage: {
      requests: 0,
      input_tokens: 0,
      output_tokens: 0,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
      thinking_tokens: 0,
      web_search_requests: 0,
      total_tokens: 0,
      estimated_cost_usd: 0,
    },
    budget_usd: 2,
    error: null,
    events: [],
    created_at: "2026-01-01T00:00:00Z",
    finished_at: null,
    result_workflow_id: null,
    ...overrides,
  };
}

let seq = 0;
function event(type: ArchitectEvent["type"], overrides: Partial<ArchitectEvent> = {}): ArchitectEvent {
  seq += 1;
  return {
    seq,
    job_id: "arc_1",
    type,
    phase: null,
    code: null,
    params: {},
    message: "",
    level: "info",
    data: {},
    cost_usd: null,
    at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function workflow(): WorkflowIn {
  const start = { ...newNode("start"), id: "start" };
  const a = {
    ...newNode("agent", { x: 300, y: 0 }, { name: "A" }),
    id: "a",
    label: "A",
  };
  const b = {
    ...newNode("agent", { x: 600, y: 0 }, { name: "B" }),
    id: "b",
    label: "B",
  };
  return {
    name: "Test",
    description: "",
    budget_usd: null,
    nodes: [start, a, b],
    edges: [
      { id: "e1", source: "start", target: "a" },
      { id: "e2", source: "a", target: "b" },
    ],
  } as WorkflowIn;
}

describe("architect progress", () => {
  it("follows phases, cost and the end of a job from its events", () => {
    let state = job();
    state = applyArchitectEvent(state, event("phase", { phase: "analyze" }));
    state = applyArchitectEvent(state, event("log", { code: "analyze.started", phase: "analyze" }));
    state = applyArchitectEvent(state, event("phase", { phase: "plan", cost_usd: 0.012 }));
    expect(state.phase).toBe("plan");
    expect(state.usage.estimated_cost_usd).toBe(0.012);
    expect(stepStates(state).slice(0, 3)).toEqual([
      { phase: "analyze", state: "done" },
      { phase: "plan", state: "active" },
      { phase: "resources", state: "todo" },
    ]);
    expect(logEntries(state).map((item) => item.code)).toEqual(["analyze.started"]);

    state = applyArchitectEvent(state, event("finished", { data: { status: "cancelled" } }));
    expect(state.status).toBe("cancelled");
    expect(stepStates(state)[1]).toEqual({ phase: "plan", state: "stopped" });
  });

  it("ignores repeated events and events of other jobs", () => {
    const first = event("phase", { phase: "analyze" });
    const state = applyArchitectEvent(job(), first);
    expect(applyArchitectEvent(state, first)).toBe(state);
    expect(
      applyArchitectEvent(state, {
        ...event("phase", { phase: "plan" }),
        job_id: "arc_2",
      }),
    ).toBe(state);
  });

  it("shows the latest graph, then the draft", () => {
    const graph = workflow();
    const state = applyArchitectEvent(job(), event("graph", { data: { workflow: graph, marks: { a: "pending" } } }));
    expect(latestGraph(state)?.marks).toEqual({ a: "pending" });
    expect(state.marks).toEqual({ a: "pending" });
    expect(latestGraph(job({ draft: graph, marks: { a: "added" } }))?.marks).toEqual({ a: "added" });
    expect(latestGraph(job())).toBeNull();
  });

  it("marks every step done once the draft is ready", () => {
    expect(stepStates(job({ status: "ready", phase: "present" })).every((step) => step.state === "done")).toBe(true);
  });
});

describe("draft diff", () => {
  it("finds added, changed, removed and kept agents and connections", () => {
    const base = workflow();
    const draft = structuredClone(base);
    const b = draft.nodes.find((node) => node.id === "b");
    if (!b?.agent) throw new Error("missing agent");
    b.agent.system_prompt = "Check everything critically.";
    const critic = {
      ...newNode("agent", { x: 900, y: 0 }, { name: "Critic" }),
      id: "node_critic",
      label: "Critic",
    };
    draft.nodes.push(critic);
    draft.edges.push({ id: "e3", source: "b", target: "node_critic" });

    const diff = draftDiff(base, draft);
    const kinds = Object.fromEntries(diff.agents.map((agent) => [agent.nodeId, agent.kind]));
    expect(kinds).toEqual({ a: "kept", b: "changed", node_critic: "added" });
    expect(diff.agents.find((agent) => agent.nodeId === "b")?.fields.map((field) => field.field)).toEqual(["system_prompt"]);
    expect(diff.counts).toEqual({
      added: 1,
      changed: 1,
      removed: 0,
      edgesAdded: 1,
      edgesRemoved: 0,
    });

    draft.nodes = draft.nodes.filter((node) => node.id !== "a");
    draft.edges = draft.edges.filter((edge) => edge.source !== "a" && edge.target !== "a");
    draft.edges.push({ id: "e4", source: "start", target: "b" });
    const removed = draftDiff(base, draft);
    expect(removed.agents.find((agent) => agent.nodeId === "a")?.kind).toBe("removed");
    expect(removed.agents.find((agent) => agent.nodeId === "b")?.inputsAfter).toEqual(["Start"]);
    expect(removed.counts.edgesRemoved).toBe(2);
  });

  it("treats every agent of a new workflow as added", () => {
    const diff = draftDiff(null, workflow());
    expect(diff.agents.map((agent) => agent.kind)).toEqual(["added", "added"]);
    expect(diff.counts.edgesAdded).toBe(2);
  });

  it("ignores positions when comparing graphs", () => {
    const base = workflow();
    const moved = structuredClone(base);
    moved.nodes[1].position = { x: 10, y: 10 };
    expect(graphDiffers(base, moved)).toBe(false);
    moved.edges.pop();
    expect(graphDiffers(base, moved)).toBe(true);
  });
});
