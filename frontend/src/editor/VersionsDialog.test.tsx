// The versions dialog names the changed fields of every step (ST-011).

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../api/client";
import type { VersionSummary, Workflow } from "../api/types";
import { newNode } from "../lib/defaults";
import { useEditor } from "./store";
import { VersionsDialog } from "./VersionsDialog";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const agent = newNode("agent", { x: 0, y: 0 }, { name: "Schreiber" });
const editorAgent = {
  ...agent,
  id: "a",
  label: "Schreiber",
  agent: { ...agent.agent!, model: "anthropic:claude-sonnet-5-5", system_prompt: "Schreibe kurz.\nNenne Quellen.", tools: ["web_search"] },
};
const workflow: Workflow = {
  id: "wf_v",
  name: "Bericht",
  description: "",
  budget_usd: null,
  nodes: [editorAgent],
  edges: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};
const summary: VersionSummary = {
  workflow_id: "wf_v",
  number: 2,
  label: "v2",
  created_at: "2026-01-02T00:00:00Z",
  description: "",
  restored_from: null,
  name: "Bericht",
  agents: 1,
  nodes: 1,
  edges: 0,
  current: false,
};

describe("version differences", () => {
  it("list model, tools and a line diff of the system prompt for a changed step", async () => {
    useEditor.getState().load(workflow);
    const versionAgent = {
      ...editorAgent,
      agent: { ...editorAgent.agent, model: "openai:gpt-9", system_prompt: "Schreibe ausführlich.\nNenne Quellen.", tools: ["files"] },
    };
    vi.spyOn(api, "versions").mockResolvedValue([summary]);
    vi.spyOn(api, "version").mockResolvedValue({
      workflow_id: "wf_v",
      number: 2,
      created_at: summary.created_at,
      description: "",
      restored_from: null,
      snapshot: { ...workflow, nodes: [versionAgent] },
    });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <VersionsDialog open onClose={() => {}} save={async () => null} onRestored={() => {}} />
      </QueryClientProvider>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Unterschiede" }));
    const step = await screen.findByTestId("version-step-changes");
    expect(within(step).getByText("Schreiber")).toBeInTheDocument();
    expect(within(step).getByText("Modell: anthropic:claude-sonnet-5-5 → openai:gpt-9")).toBeInTheDocument();
    expect(within(step).getByText("Tools: kämen hinzu: files; fielen weg: web_search")).toBeInTheDocument();
    const summaryLine = within(step).getByText("System-Prompt unterscheidet sich: Zeilen zeigen");
    await userEvent.click(summaryLine);
    const diff = within(step).getByTestId("output-diff");
    expect(diff).toHaveTextContent("Schreibe kurz.");
    expect(diff).toHaveTextContent("Schreibe ausführlich.");
    expect(within(step).getByText(/Als hinzugefügt markierte Zeilen stammen aus der Version/)).toBeInTheDocument();
  });
});
