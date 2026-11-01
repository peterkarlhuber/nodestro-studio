import { beforeEach, describe, expect, it } from "vitest";

import type { Workflow, WorkflowCheck } from "../api/types";
import { newNode } from "../lib/defaults";
import { countsByNode, startBlock } from "./CheckList";
import { poolStatus } from "./OrchestratorInspector";
import { filterTeams, teamHint } from "./Palette";
import { connectionProblem, useEditor } from "./store";
import { READABLE_ZOOM, inView, openingViewport, placeNewNode } from "./viewport";
import i18n from "../i18n";

function workflow(): Workflow {
  const start = { ...newNode("start"), id: "start" };
  const a = { ...newNode("agent", { x: 300, y: 0 }, { name: "A" }), id: "a", label: "A" };
  const b = { ...newNode("agent", { x: 600, y: 0 }, { name: "B" }), id: "b", label: "B" };
  const out = { ...newNode("output", { x: 900, y: 0 }), id: "out" };
  const approve = { ...newNode("approval", { x: 600, y: 300 }), id: "ok" };
  return {
    id: "wf_ux",
    name: "UX",
    description: "",
    budget_usd: null,
    nodes: [start, a, b, out, approve],
    edges: [
      { id: "e1", source: "start", target: "a" },
      { id: "e2", source: "a", target: "b" },
      { id: "e3", source: "b", target: "out" },
    ],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

const issue = (code: string, level: "error" | "warning" | "info", node_id: string | null = null) => ({
  code,
  params: {},
  message: code,
  level,
  node_id,
  edge_id: null,
});

describe("multi-select (ED-10)", () => {
  beforeEach(() => useEditor.getState().load(workflow()));

  it("keeps a set of selected nodes; the inspector node is only set for exactly one", () => {
    useEditor.getState().setSelection(["a", "b", "missing"]);
    expect(useEditor.getState().selectedIds).toEqual(["a", "b"]);
    expect(useEditor.getState().selectedId).toBeNull();
    useEditor.getState().select("a");
    expect(useEditor.getState().selectedIds).toEqual(["a"]);
    expect(useEditor.getState().selectedId).toBe("a");
    useEditor.getState().selectEdge("e1");
    expect(useEditor.getState().selectedIds).toEqual([]);
  });

  it("removes all selected nodes in one undo step and drops them from the selection", () => {
    useEditor.getState().setSelection(["a", "b"]);
    useEditor.getState().removeNodes(useEditor.getState().selectedIds);
    expect(useEditor.getState().nodes.map((node) => node.id)).toEqual(["start", "out", "ok"]);
    expect(useEditor.getState().selectedIds).toEqual([]);
    useEditor.getState().undo();
    expect(useEditor.getState().nodes).toHaveLength(5);
    expect(useEditor.getState().edges).toHaveLength(3);
  });

  it("duplicates a group with the connections inside it and selects the copies", () => {
    useEditor.getState().duplicateNodes(["a", "b"]);
    const state = useEditor.getState();
    expect(state.nodes).toHaveLength(7);
    expect(state.selectedIds).toHaveLength(2);
    const copies = new Set(state.selectedIds);
    expect(state.edges.filter((edge) => copies.has(edge.source) && copies.has(edge.target))).toHaveLength(1);
    state.undo();
    expect(useEditor.getState().nodes).toHaveLength(5);
  });
});

describe("undo and the saved state (ED-15)", () => {
  beforeEach(() => useEditor.getState().load(workflow()));

  it("is not dirty after undoing back to the loaded state, and dirty again after redo", () => {
    useEditor.getState().removeNodes(["b"]);
    expect(useEditor.getState().dirty).toBe(true);
    useEditor.getState().undo();
    expect(useEditor.getState().dirty).toBe(false);
    useEditor.getState().redo();
    expect(useEditor.getState().dirty).toBe(true);
  });
});

describe("connection rules while dragging (ED-14)", () => {
  beforeEach(() => useEditor.getState().load(workflow()));

  it("gives the same reasons as connect()", () => {
    const { nodes, edges } = useEditor.getState();
    expect(connectionProblem(nodes, edges, "a", "start")).toBe("editor.connect.toStart");
    expect(connectionProblem(nodes, edges, "out", "a")).toBe("editor.connect.fromOutput");
    expect(connectionProblem(nodes, edges, "b", "a")).toBe("editor.connect.cycle");
    expect(connectionProblem(nodes, edges, "a", "b")).toBe("editor.connect.exists");
    expect(connectionProblem(nodes, edges, "ok", "a")).toBe("editor.connect.pickBranch");
    expect(connectionProblem(nodes, edges, "start", "b")).toBeNull();
    // Leading back from a branch is allowed: it becomes a loop.
    expect(connectionProblem(nodes, [...edges, { id: "x", source: "b", target: "ok" }], "ok", "a", "approved")).toBeNull();
  });
});

describe("new nodes in view (ED-11) and the opening zoom (ED-09)", () => {
  const nodes = workflow().nodes;
  const visible = { x: -100, y: -100, width: 1200, height: 800 };

  it("places a node to the right of the selected node, moving down past others", () => {
    expect(placeNewNode(nodes, "a", visible)).toEqual({ x: 620, y: 150 });
  });

  it("places a node in the middle of the visible canvas without a selection", () => {
    const point = placeNewNode(nodes, null, visible);
    expect(inView(point, visible)).toBe(true);
    expect(nodes.some((node) => Math.abs(node.position.x - point.x) < 216 && Math.abs(node.position.y - point.y) < 110)).toBe(
      false,
    );
  });

  it("knows whether a node is fully visible", () => {
    expect(inView({ x: 0, y: 0 }, visible)).toBe(true);
    expect(inView({ x: 1050, y: 0 }, visible)).toBe(false);
  });

  it("keeps a readable fitted view and otherwise opens at the readable zoom from the start node", () => {
    const fitted = { x: 10, y: 20, zoom: 0.8 };
    expect(openingViewport(fitted, nodes, { width: 700, height: 600 })).toBe(fitted);
    const small = openingViewport({ x: 0, y: 0, zoom: 0.29 }, nodes, { width: 700, height: 600 });
    expect(small.zoom).toBe(READABLE_ZOOM);
    expect(small.x).toBe(48);
  });
});

describe("why the start is blocked (OB-01, ED-12)", () => {
  it("prefers a missing provider over node problems and counts errors and warnings per node", () => {
    const check: WorkflowCheck = {
      ok: false,
      errors: 2,
      warnings: 1,
      problems: [
        issue("check.output_unconnected", "error", "out"),
        issue("check.api_key_missing", "error"),
        issue("check.placeholder_unknown", "warning", "a"),
        issue("check.orchestrator_selected", "info", "a"),
      ],
      agents: {},
    };
    const block = startBlock(check);
    expect(block?.provider).toBe(true);
    expect(block?.count).toBe(2);
    expect(block?.first.item.code).toBe("check.api_key_missing");
    expect(countsByNode(check)).toEqual({ errors: { out: 1 }, warnings: { a: 1 } });
    expect(startBlock({ ...check, ok: true })).toBeNull();
  });

  it("counts the pool's problems for the orchestrator's Teams section", () => {
    const check: WorkflowCheck = {
      ok: false,
      errors: 1,
      warnings: 1,
      problems: [
        issue("check.orchestrator_member_missing", "error", "lead"),
        issue("check.orchestrator_member_approval", "warning", "lead"),
        issue("check.unreachable", "warning", "lead"),
      ],
      agents: {},
    };
    expect(poolStatus(check, "lead")).toEqual({ errors: 1, warnings: 1 });
  });
});

describe("palette teams (ED-17)", () => {
  const teams = [
    { name: "Recherche", capabilities: ["research"] },
    { name: "Lektorat", capabilities: ["editing", "proofreading"] },
  ];

  it("filters by name and capability", () => {
    expect(filterTeams(teams, "")).toHaveLength(2);
    expect(filterTeams(teams, "lek").map((team) => team.name)).toEqual(["Lektorat"]);
    expect(filterTeams(teams, "PROOF").map((team) => team.name)).toEqual(["Lektorat"]);
  });

  it("labels the capability tags and shows them unchanged", () => {
    expect(teamHint(i18n.t.bind(i18n), ["research"], ["summary"])).toBe(
      `${i18n.t("editor.palette.teamCapabilities", { tags: "research" })} · ${i18n.t("editor.palette.teamDelivers", { fields: "summary" })}`,
    );
    expect(teamHint(i18n.t.bind(i18n), ["research"], [])).toContain("research");
  });
});
