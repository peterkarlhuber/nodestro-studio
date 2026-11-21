// N-09: the agent editor's offline switch sets AgentConfig.offline; an agent without the field shows it off.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AgentConfig } from "../api/types";
import { defaultAgent } from "../lib/defaults";
import { AgentForm } from "./AgentInspector";
import { useAgentSections } from "./sectionState";

vi.mock("../components/CodeEditor", () => ({ CodeEditor: () => null }));

function show(agent: AgentConfig, onChange: (patch: Partial<AgentConfig>) => void) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AgentForm agent={agent} onChange={onChange} onReplace={() => undefined} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("the agent's offline switch", () => {
  beforeEach(() => {
    localStorage.clear();
    useAgentSections.setState({ open: { advanced: true } });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } })),
    );
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("is off for an agent without the field and switches offline on", () => {
    const changes: Partial<AgentConfig>[] = [];
    show(defaultAgent(), (patch) => changes.push(patch));
    const toggle = screen.getByRole("switch", { name: /Offline arbeiten/ });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    expect(changes).toContainEqual({ offline: true });
  });

  it("shows an offline agent as offline and switches it off", () => {
    const changes: Partial<AgentConfig>[] = [];
    show({ ...defaultAgent(), offline: true }, (patch) => changes.push(patch));
    const toggle = screen.getByRole("switch", { name: /Offline arbeiten/ });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    fireEvent.click(toggle);
    expect(changes).toContainEqual({ offline: false });
  });
});
