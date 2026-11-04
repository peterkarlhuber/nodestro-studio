import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { type NodeProps, ReactFlowProvider } from "@xyflow/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { WorkflowNode } from "../api/types";
import { defaultAgent } from "../lib/defaults";
import { AgentNode } from "./nodes";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function show(data: Record<string, unknown>) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } })));
  const node: WorkflowNode = { id: "writer", type: "agent", label: "Writer", position: { x: 0, y: 0 }, agent: defaultAgent({ name: "Writer" }) } as WorkflowNode;
  const props = { id: "writer", data: { node, issues: 0, warnings: 0, ...data }, selected: false } as unknown as NodeProps;
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ReactFlowProvider>
        <AgentNode {...props} />
      </ReactFlowProvider>
    </QueryClientProvider>,
  );
}

describe("AgentNode status (NJR-18)", () => {
  it("shows Ready for a step without problems", () => {
    show({});
    expect(document.querySelector('[data-status="idle"]')).not.toBeNull();
  });

  it("does not call a step with its own errors ready", () => {
    show({ issues: 1 });
    expect(screen.getByTestId("node-problems")).toBeInTheDocument();
    expect(document.querySelector('[data-status="idle"]')).toBeNull();
  });

  it("keeps Ready next to warnings only", () => {
    show({ warnings: 1 });
    expect(document.querySelector('[data-status="idle"]')).not.toBeNull();
  });
});
