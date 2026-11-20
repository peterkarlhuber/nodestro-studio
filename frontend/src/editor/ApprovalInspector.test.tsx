// The approval node's "Allow a note to the agent" (E-0R-1 A): new approvals allow it, approvals saved before the
// note existed (null) show it as allowed, as the runtime treats them, and saving writes an explicit value.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ApprovalConfig, Workflow } from "../api/types";
import { newNode } from "../lib/defaults";
import { ApprovalInspector } from "./FlowInspectors";
import { useEditor, withExplicitAgentNote } from "./store";

const LEGACY: ApprovalConfig = {
  instructions: "",
  show: [],
  allow_comment: true,
  require_comment_on_reject: false,
  on_reject: "branch",
  allow_agent_note: null,
};

function workflow(approval: ApprovalConfig): Workflow {
  return {
    id: "wf_1",
    name: "Entwurf prüfen",
    description: "",
    budget_usd: null,
    nodes: [{ ...newNode("start"), id: "start" }, { ...newNode("approval", { x: 300, y: 0 }), id: "check", label: "Prüfen", approval }],
    edges: [{ id: "e1", source: "start", target: "check" }],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function Inspector() {
  const node = useEditor((state) => state.nodes.find((item) => item.id === "check"));
  return node ? <ApprovalInspector node={node} /> : null;
}

function show() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <Inspector />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return screen.getByRole("switch", { name: /Notiz an den Agenten erlauben/ });
}

const config = () => useEditor.getState().nodes.find((node) => node.id === "check")!.approval!;

afterEach(cleanup);

describe("the note to the agent of an approval node", () => {
  beforeEach(() => useEditor.getState().load(workflow(LEGACY)));

  it("is allowed for a new approval node", () => {
    expect(newNode("approval").approval?.allow_agent_note).toBe(true);
  });

  it("shows an approval from before the note as allowed and switches it off and on explicitly", () => {
    const toggle = show();
    expect(toggle).toBeChecked();
    fireEvent.click(toggle);
    expect(config().allow_agent_note).toBe(false);
    expect(screen.getByRole("switch", { name: /Notiz an den Agenten erlauben/ })).not.toBeChecked();
    fireEvent.click(screen.getByRole("switch", { name: /Notiz an den Agenten erlauben/ }));
    expect(config().allow_agent_note).toBe(true);
  });

  it("saves an explicit value and keeps a saved choice", () => {
    const sent = useEditor.getState().toWorkflow();
    const saved = withExplicitAgentNote(sent.nodes);
    expect(saved.find((node) => node.id === "check")!.approval!.allow_agent_note).toBe(true);
    // Unchanged nodes stay the same objects; the same nodes give the same array.
    expect(saved[0]).toBe(sent.nodes[0]);
    expect(withExplicitAgentNote(sent.nodes)).toBe(saved);
    useEditor.getState().markSaved(workflow(LEGACY), sent);
    expect(useEditor.getState().dirty).toBe(false);
    expect(config().allow_agent_note).toBe(true);

    useEditor.getState().load(workflow({ ...LEGACY, allow_agent_note: false }));
    const nodes = useEditor.getState().toWorkflow().nodes;
    expect(withExplicitAgentNote(nodes)).toBe(nodes);
  });
});
