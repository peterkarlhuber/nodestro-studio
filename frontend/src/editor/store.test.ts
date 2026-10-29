import { beforeEach, describe, expect, it } from "vitest";

import type { Workflow } from "../api/types";
import { newNode } from "../lib/defaults";
import { branchHandles, liveUsage, useEditor } from "./store";

function workflow(): Workflow {
  const start = { ...newNode("start"), id: "start" };
  const a = { ...newNode("agent", { x: 300, y: 0 }, { name: "A" }), id: "a", label: "A" };
  const b = { ...newNode("agent", { x: 600, y: 0 }, { name: "B" }), id: "b", label: "B" };
  return {
    id: "wf_1",
    name: "Test",
    description: "",
    budget_usd: null,
    nodes: [start, a, b],
    edges: [
      { id: "e1", source: "start", target: "a" },
      { id: "e2", source: "a", target: "b" },
    ],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("editor store", () => {
  beforeEach(() => useEditor.getState().load(workflow()));

  it("rejects connections that would form a cycle", () => {
    expect(useEditor.getState().connect("b", "a")).toBe("editor.connect.cycle");
    expect(useEditor.getState().connect("a", "a")).toBe("editor.connect.self");
    expect(useEditor.getState().connect("b", "start")).toBe("editor.connect.toStart");
    expect(useEditor.getState().edges).toHaveLength(2);
  });

  it("connects, undoes and redoes", () => {
    const state = useEditor.getState();
    expect(state.connect("start", "b")).toBeNull();
    expect(useEditor.getState().edges).toHaveLength(3);
    expect(useEditor.getState().dirty).toBe(true);
    useEditor.getState().undo();
    expect(useEditor.getState().edges).toHaveLength(2);
    useEditor.getState().redo();
    expect(useEditor.getState().edges).toHaveLength(3);
  });

  it("applies an architect draft as one undoable step with a version note", () => {
    const draft = structuredClone(workflow());
    draft.nodes.push({ ...newNode("agent", { x: 900, y: 0 }, { name: "Critic" }), id: "node_critic", label: "Critic" });
    draft.edges.push({ id: "e3", source: "b", target: "node_critic" });
    useEditor.getState().applyDraft(draft, "AI revision: add a critic");
    expect(useEditor.getState().nodes).toHaveLength(4);
    expect(useEditor.getState().dirty).toBe(true);
    expect(useEditor.getState().pendingNote).toBe("AI revision: add a critic");
    useEditor.getState().undo();
    expect(useEditor.getState().nodes.map((node) => node.id)).toEqual(["start", "a", "b"]);
    expect(useEditor.getState().edges).toHaveLength(2);
    expect(useEditor.getState().pendingNote).toBeNull();
    useEditor.getState().redo();
    expect(useEditor.getState().nodes).toHaveLength(4);
    expect(useEditor.getState().pendingNote).toBe("AI revision: add a critic");
  });

  it("forgets the version note once saved", () => {
    useEditor.getState().applyDraft(workflow(), "AI revision");
    useEditor.getState().markSaved(workflow());
    expect(useEditor.getState().pendingNote).toBeNull();
  });

  it("gives new agents unique names", () => {
    const first = useEditor.getState().addNode("agent", { x: 0, y: 0 });
    const second = useEditor.getState().addNode("agent", { x: 0, y: 0 });
    expect(first.label).not.toEqual(second.label);
    expect(second.agent?.name).toEqual(second.label);
  });

  it("removes edges together with their nodes", () => {
    useEditor.getState().removeNodes(["a"]);
    expect(useEditor.getState().nodes.map((node) => node.id)).toEqual(["start", "b"]);
    expect(useEditor.getState().edges).toHaveLength(0);
  });

  it("lays out nodes in columns by depth", () => {
    useEditor.getState().autoLayout();
    const x = Object.fromEntries(useEditor.getState().nodes.map((node) => [node.id, node.position.x]));
    expect(x.start).toBeLessThan(x.a);
    expect(x.a).toBeLessThan(x.b);
  });

  it("applies run events to the live run", () => {
    const wf = workflow();
    useEditor.getState().setRun({
      id: "run_1",
      workflow_id: wf.id,
      workflow_name: wf.name,
      workflow: wf,
      input: "x",
      file_ids: [],
      status: "queued",
      error: null,
      output: null,
      nodes: {
        a: {
          status: "waiting",
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
        },
      },
      usage: liveUsage(null),
      created_at: "2026-01-01T00:00:00Z",
      started_at: null,
      finished_at: null,
    });
    const at = "2026-01-01T00:00:01Z";
    const apply = (type: string, data: Record<string, unknown>) =>
      useEditor.getState().applyEvent({ seq: 1, run_id: "run_1", type, node_id: "a", data, at });
    apply("node_started", { prompt: "Aufgabe" });
    apply("text", { delta: "Hallo " });
    apply("text", { delta: "Welt" });
    apply("tool_started", { id: "t1", name: "calculator", input: { expression: "1+1" } });
    apply("tool_finished", { id: "t1", output: "2", is_error: false });
    const node = useEditor.getState().run!.nodes.a;
    expect(node.status).toBe("running");
    expect(node.text).toBe("Hallo Welt");
    expect(node.tool_calls[0]).toMatchObject({ name: "calculator", output: "2", is_error: false });
  });
  it("connects a decision only from one of its branches", () => {
    const decision = useEditor.getState().addNode("condition", { x: 450, y: 0 });
    const d = decision.id;
    const ruleId = decision.condition!.rules[0].id;
    expect(branchHandles(decision)).toEqual([ruleId, "default"]);
    expect(useEditor.getState().connect(d, "b")).toBe("editor.connect.pickBranch");
    expect(useEditor.getState().connect(d, "b", "no-such-branch")).toBe("editor.connect.pickBranch");
    expect(useEditor.getState().connect(d, "b", ruleId)).toBeNull();
    expect(useEditor.getState().edges.find((edge) => edge.source === d)).toMatchObject({ target: "b", source_handle: ruleId });
    // An ordinary node never names a branch.
    expect(useEditor.getState().connect("start", d, "default")).toBeNull();
    expect(useEditor.getState().edges.find((edge) => edge.target === d)?.source_handle).toBeUndefined();
  });

  it("drops connections of a branch whose rule was removed", () => {
    const decision = useEditor.getState().addNode("condition", { x: 450, y: 0 });
    const d = decision.id;
    const ruleId = decision.condition!.rules[0].id;
    useEditor.getState().connect(d, "b", ruleId);
    useEditor.getState().connect(d, "a", "default");
    useEditor.getState().updateNode(d, { condition: { ...decision.condition!, rules: [] } });
    const fromDecision = useEditor.getState().edges.filter((edge) => edge.source === d);
    expect(fromDecision.map((edge) => edge.source_handle)).toEqual(["default"]);
  });

  it("offers approved and rejected as the branches of an approval", () => {
    const approval = { ...newNode("approval"), id: "p" };
    expect(branchHandles(approval)).toEqual(["approved", "rejected"]);
    expect(branchHandles({ ...newNode("subworkflow"), id: "s" })).toBeNull();
  });

  it("pauses at an approval and records the decision", () => {
    const wf = workflow();
    useEditor.getState().setRun({
      id: "run_2",
      workflow_id: wf.id,
      workflow_name: wf.name,
      workflow: wf,
      input: "x",
      file_ids: [],
      status: "running",
      error: null,
      output: null,
      nodes: {
        a: {
          status: "waiting",
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
        },
      },
      usage: liveUsage(null),
      created_at: "2026-01-01T00:00:00Z",
      started_at: "2026-01-01T00:00:00Z",
      finished_at: null,
    });
    const at = "2026-01-01T00:00:01Z";
    const apply = (type: string, data: Record<string, unknown>, nodeId: string | null = "a") =>
      useEditor.getState().applyEvent({ seq: 1, run_id: "run_2", type, node_id: nodeId, data, at });
    apply("approval_requested", {});
    apply("run_paused", { status: "paused", usage: liveUsage(null) }, null);
    expect(useEditor.getState().run!.nodes.a.status).toBe("awaiting_approval");
    expect(useEditor.getState().run!.status).toBe("paused");
    expect(useEditor.getState().run!.finished_at).toBeNull();
    apply("approval_decided", { decision: "rejected", comment: "Zu teuer" });
    expect(useEditor.getState().run!.nodes.a.approval).toMatchObject({ decision: "rejected", comment: "Zu teuer" });
  });

  it("selects, deletes and restores a single connection", () => {
    const state = useEditor.getState();
    state.selectEdge("e2");
    expect(useEditor.getState().selectedEdgeId).toBe("e2");
    expect(useEditor.getState().selectedId).toBeNull();
    useEditor.getState().removeEdges(["e2"]);
    expect(useEditor.getState().edges.map((edge) => edge.id)).toEqual(["e1"]);
    expect(useEditor.getState().selectedEdgeId).toBeNull();
    useEditor.getState().undo();
    expect(useEditor.getState().edges.map((edge) => edge.id)).toEqual(["e1", "e2"]);
    useEditor.getState().redo();
    expect(useEditor.getState().edges.map((edge) => edge.id)).toEqual(["e1"]);
  });

  it("selecting a node clears the selected connection", () => {
    useEditor.getState().selectEdge("e1");
    useEditor.getState().select("a");
    expect(useEditor.getState().selectedEdgeId).toBeNull();
    expect(useEditor.getState().selectedId).toBe("a");
  });

  it("removing nothing changes nothing", () => {
    useEditor.getState().removeEdges([]);
    expect(useEditor.getState().dirty).toBe(false);
    expect(useEditor.getState().past).toHaveLength(0);
  });

  it("reset drops unsaved changes and the undo history", () => {
    useEditor.getState().connect("start", "b");
    expect(useEditor.getState().dirty).toBe(true);
    useEditor.getState().reset();
    const state = useEditor.getState();
    expect(state.workflowId).toBeNull();
    expect(state.nodes).toEqual([]);
    expect(state.past).toEqual([]);
    expect(state.future).toEqual([]);
    expect(state.dirty).toBe(false);
    // Loading the saved workflow again starts from its saved state.
    useEditor.getState().load(workflow());
    expect(useEditor.getState().edges).toHaveLength(2);
    expect(useEditor.getState().past).toEqual([]);
  });
});
