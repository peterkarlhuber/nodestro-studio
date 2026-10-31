import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AgentConfig, ConfigIssue } from "../api/types";
import { defaultAgent, setDefaultModel } from "../lib/defaults";
import { AgentForm } from "./AgentInspector";
import { useAgentSections } from "./sectionState";

// CodeMirror needs a real layout engine; the form's request options editor is not under test here.
vi.mock("../components/CodeEditor", () => ({ CodeEditor: () => null }));

const QUALITY_ERROR: ConfigIssue = {
  level: "error",
  field: "quality",
  code: "config.quality_no_criteria",
  params: {},
  message: "The quality check needs at least one criterion",
};

/** The studio API as far as the form needs it: validation answers with `issues`, every list is empty. */
function stubApi(issues: ConfigIssue[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const path = url.replace(/\?.*$/, "");
      const body = path.endsWith("/agents/validate")
        ? issues
        : path.endsWith("/meta")
          ? { providers: [], capabilities: [], models: [] }
          : path.endsWith("/settings")
            ? { providers: [], default_model: "claude-sonnet-5-5", assistant_model: "claude-opus-5-5" }
            : [];
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
}

function show(agent: AgentConfig, onChange: (patch: Partial<AgentConfig>) => void = () => undefined) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AgentForm agent={agent} onChange={onChange} onReplace={() => undefined} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const section = (container: HTMLElement, id: string) => container.querySelector<HTMLDetailsElement>(`[data-section="${id}"]`)!;

describe("AgentForm sections", () => {
  beforeEach(() => {
    localStorage.clear();
    useAgentSections.setState({ open: {} });
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    };
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows a problem of the closed quality section and opens it on request", async () => {
    stubApi([QUALITY_ERROR]);
    const { container } = show({ ...defaultAgent(), quality: { enabled: true, criteria: [], max_revisions: 1, judge_model: "x" } });
    const quality = section(container, "quality");
    expect(quality.open).toBe(false);
    await waitFor(() => expect(quality.querySelector("summary")).toHaveTextContent("1 Fehler"));
    await userEvent.click(screen.getByRole("button", { name: /Qualitätsprüfung: 1 Fehler/ }));
    expect(quality.open).toBe(true);
  });

  it("shows no problem links for a valid agent", async () => {
    stubApi([]);
    const { container } = show(defaultAgent());
    await waitFor(() => expect(section(container, "advanced").querySelector("summary")).toHaveTextContent("Standard"));
    expect(container.querySelector(".section-problems")).toBeNull();
  });

  it("starts a new quality check with the default model from the settings", async () => {
    stubApi([]);
    setDefaultModel("ollama:llama3.3");
    try {
      const onChange = vi.fn();
      const agent = { ...defaultAgent(), model: "ollama:llama3.3", quality: { enabled: false, criteria: [], max_revisions: 1, judge_model: "claude-opus-5-5" } };
      const { container } = show(agent, onChange);
      await userEvent.click(section(container, "quality").querySelector(".section__title")!);
      await userEvent.click(screen.getByRole("switch", { name: /von einem Judge prüfen/ }));
      const patch = onChange.mock.calls.at(-1)![0] as Partial<AgentConfig>;
      expect(patch.quality?.judge_model).toBe("ollama:llama3.3"); // no Anthropic model the user did not choose
      expect(patch.quality?.enabled).toBe(true);
    } finally {
      setDefaultModel("claude-sonnet-5-5");
    }
  });

  it("keeps the judge of a configured check and warns when it is the agent's own model", async () => {
    stubApi([]);
    const onChange = vi.fn();
    const criteria = [{ name: "correct", description: "ok", required: true }];
    const agent = { ...defaultAgent(), model: "claude-sonnet-5-5", quality: { enabled: false, criteria, max_revisions: 1, judge_model: "claude-sonnet-5-5" } };
    const { container, rerender } = show(agent, onChange);
    await userEvent.click(section(container, "quality").querySelector(".section__title")!);
    await userEvent.click(screen.getByRole("switch", { name: /von einem Judge prüfen/ }));
    const patch = onChange.mock.calls.at(-1)![0] as Partial<AgentConfig>;
    expect(patch.quality?.judge_model).toBe("claude-sonnet-5-5");
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <AgentForm agent={{ ...agent, quality: { ...agent.quality, enabled: true } }} onChange={onChange} onReplace={() => undefined} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId("self-judge")).toBeInTheDocument();
  });

  it("keeps a section the user opened open on the next agent and leaves the agent unchanged", async () => {
    stubApi([]);
    const onChange = vi.fn();
    const first = show(defaultAgent(), onChange);
    expect(section(first.container, "advanced").open).toBe(false);
    await userEvent.click(section(first.container, "advanced").querySelector(".section__title")!);
    expect(section(first.container, "advanced").open).toBe(true);
    first.unmount(); // the editor remounts the form for every selected node
    const second = show({ ...defaultAgent(), name: "Other" }, onChange);
    expect(section(second.container, "advanced").open).toBe(true);
    expect(JSON.parse(localStorage.getItem("nodestro-agent-sections")!)).toEqual({ advanced: true });
    expect(onChange).not.toHaveBeenCalled(); // a UI preference, never part of the agent
  });

  it("keeps a section closed that the user closed, even when its default would open it", async () => {
    stubApi([]);
    const agent = { ...defaultAgent(), tools: ["search"] };
    const first = show(agent);
    expect(section(first.container, "tools").open).toBe(true);
    await userEvent.click(section(first.container, "tools").querySelector(".section__title")!);
    first.unmount();
    const second = show(agent);
    expect(section(second.container, "tools").open).toBe(false);
  });
});
