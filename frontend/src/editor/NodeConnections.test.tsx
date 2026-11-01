import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Workflow } from "../api/types";
import { newNode } from "../lib/defaults";
import { NodeConnections } from "./NodeConnections";
import { useEditor } from "./store";

function workflow(): Workflow {
  const start = { ...newNode("start"), id: "start", label: "Start" };
  const a = { ...newNode("agent", { x: 300, y: 0 }, { name: "Writer" }), id: "a", label: "Writer" };
  const b = { ...newNode("agent", { x: 600, y: 0 }, { name: "Critic" }), id: "b", label: "Critic" };
  const out = { ...newNode("output", { x: 900, y: 0 }), id: "out", label: "Ergebnis" };
  return {
    id: "wf_1",
    name: "Test",
    description: "",
    budget_usd: null,
    nodes: [start, a, b, out],
    edges: [{ id: "e1", source: "start", target: "a" }],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("NodeConnections (keyboard connect)", () => {
  beforeEach(() => useEditor.getState().load(workflow()));
  afterEach(cleanup);

  it("lists only valid targets and connects through the store", async () => {
    render(<NodeConnections nodeId="a" />);
    const target = screen.getByRole("combobox", { name: "Verbinden mit" });
    const options = within(target).getAllByRole("option").map((option) => option.textContent);
    // Not itself, not the start node.
    expect(options).toEqual(["Schritt wählen …", "Critic (Agent)", "Ergebnis"]);
    expect(screen.getByRole("button", { name: "Verbinden" })).toBeDisabled();
    await userEvent.selectOptions(target, "b");
    await userEvent.click(screen.getByRole("button", { name: "Verbinden" }));
    expect(useEditor.getState().edges.some((edge) => edge.source === "a" && edge.target === "b")).toBe(true);
    expect(screen.getByRole("status")).toHaveTextContent("Writer (Agent) mit Critic (Agent) verbunden.");
    // Now listed, and no longer offered as a target.
    expect(screen.getByText("Zu Critic (Agent)")).toBeInTheDocument();
    expect(within(screen.getByRole("combobox", { name: "Verbinden mit" })).queryByText("Critic (Agent)")).toBeNull();
  });

  it("does not offer a target that would form a cycle", () => {
    useEditor.getState().connect("a", "b");
    render(<NodeConnections nodeId="b" />);
    const options = within(screen.getByRole("combobox", { name: "Verbinden mit" }))
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).not.toContain("Writer (Agent)");
  });

  it("removes and selects a connection from the list", async () => {
    render(<NodeConnections nodeId="a" />);
    await userEvent.click(screen.getByRole("button", { name: "Verbindung auswählen: Von Start" }));
    expect(useEditor.getState().selectedEdgeId).toBe("e1");
    useEditor.getState().select("a");
    await userEvent.click(screen.getByRole("button", { name: "Verbindung entfernen: Von Start" }));
    expect(useEditor.getState().edges).toHaveLength(0);
  });

  it("asks for the branch of a decision", async () => {
    const decision = { ...newNode("condition", { x: 300, y: 200 }), id: "d", label: "Prüfen" };
    const wf = workflow();
    wf.nodes.push(decision);
    useEditor.getState().load(wf);
    render(<NodeConnections nodeId="d" />);
    expect(screen.getByRole("combobox", { name: "Zweig" })).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Verbinden mit" }), "b");
    await userEvent.click(screen.getByRole("button", { name: "Verbinden" }));
    const edge = useEditor.getState().edges.find((item) => item.source === "d");
    expect(edge?.source_handle).toBeTruthy();
  });
});
