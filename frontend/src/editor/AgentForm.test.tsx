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

  it("links to the knowledge page when no file exists yet", async () => {
    stubApi([]);
    const { container } = show(defaultAgent());
    await userEvent.click(section(container, "knowledge").querySelector(".section__title")!);
    const link = await screen.findByRole("link", { name: "Wissen" });
    expect(link).toHaveAttribute("href", "/knowledge");
  });

  it("keeps a long file name in its own element next to the chunk count", async () => {
    const name = "Contract_playbook_Sample_Trading_with_a_very_long_name.md";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const path = url.replace(/\?.*$/, "");
        const body = path.endsWith("/knowledge")
          ? [{ id: "kf_1", name, kind: "text", chunks: 4 }]
          : path.endsWith("/meta")
            ? { providers: [], capabilities: [], models: [] }
            : path.endsWith("/settings")
              ? { providers: [], default_model: "claude-sonnet-5-5", assistant_model: "claude-opus-5-5" }
              : [];
        return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
      }),
    );
    const { container } = show(defaultAgent());
    await userEvent.click(section(container, "knowledge").querySelector(".section__title")!);
    const label = await screen.findByText(name);
    expect(label).toHaveClass("pick-list__name");
    expect(label.closest("button")!.querySelector("small")).toHaveTextContent("4");
  });

  describe("upload from the knowledge section", () => {
    const FILE = { id: "kf_1", name: "preise.md", kind: "text", chunks: 1 };

    /** Like stubApi, but POST /knowledge answers with `upload` (a status and a body). */
    function stubUpload(upload: { status: number; body: unknown }) {
      const calls: string[] = [];
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string, init?: RequestInit) => {
          const path = url.replace(/\?.*$/, "");
          const method = init?.method ?? "GET";
          calls.push(`${method} ${path}`);
          const answer = (status: number, body: unknown) =>
            new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
          if (method === "POST" && path.endsWith("/knowledge")) return answer(upload.status, upload.body);
          if (path.endsWith("/agents/validate")) return answer(200, []);
          if (path.endsWith("/meta")) return answer(200, { providers: [], capabilities: [], models: [] });
          if (path.endsWith("/settings")) return answer(200, { providers: [], default_model: "claude-sonnet-5-5", assistant_model: "claude-opus-5-5" });
          return answer(200, []);
        }),
      );
      return calls;
    }

    const choose = async (container: HTMLElement) => {
      await userEvent.click(section(container, "knowledge").querySelector(".section__title")!);
      const input = screen.getByTestId("agent-knowledge-file") as HTMLInputElement;
      await userEvent.upload(input, new File(["# Preise"], "preise.md", { type: "text/markdown" }));
    };

    it("stores the file in Knowledge and assigns it as an unsaved change", async () => {
      const calls = stubUpload({ status: 201, body: [FILE] });
      const onChange = vi.fn();
      const { container } = show(defaultAgent(), onChange);
      expect(await screen.findByText(/dauerhaft im Wissen gespeichert/)).toBeInTheDocument();
      await choose(container);
      await waitFor(() => expect(onChange).toHaveBeenCalled());
      const patch = onChange.mock.calls.at(-1)![0] as Partial<AgentConfig>;
      expect(patch.knowledge?.file_ids).toEqual(["kf_1"]);
      expect(calls).toContain("POST /api/knowledge");
    });

    it("assigns nothing when the upload is refused", async () => {
      const calls = stubUpload({ status: 400, body: { detail: { code: "knowledge.unsupported", message: "Unsupported file", params: {} } } });
      const onChange = vi.fn();
      const { container } = show(defaultAgent(), onChange);
      await choose(container);
      await waitFor(() => expect(calls).toContain("POST /api/knowledge"));
      await waitFor(() => expect(screen.getByRole("button", { name: "Datei hochladen" })).not.toBeDisabled());
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});

describe("AgentForm with Amazon Bedrock", () => {
  const SUGGESTED = "bedrock:eu.anthropic.claude-sonnet-5-5";
  function stubBedrock() {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const path = url.replace(/\?.*$/, "");
        const body = path.endsWith("/meta")
          ? {
              providers: [{ id: "bedrock", label: "Amazon Bedrock (AWS)", auth: "aws", example_model: "" }],
              capabilities: [],
              server_tools: [{ key: "web_search", label: "Web search", description: "" }],
              models: [
                {
                  id: SUGGESTED,
                  provider: "bedrock",
                  model: "eu.anthropic.claude-sonnet-5-5",
                  label: "Claude Sonnet 5.5 (Bedrock EU)",
                  recommended: true,
                  capabilities: { reasoning: "supported", structured_output: "supported", forced_tool_choice: "unsupported" },
                },
              ],
            }
          : path.endsWith("/settings")
            ? { providers: [], default_model: "claude-sonnet-5-5", assistant_model: "claude-opus-5-5" }
            : [];
        return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
      }),
    );
  }
  const open = (container: HTMLElement, id: string) => {
    section(container, id).open = true;
  };
  beforeEach(() => {
    localStorage.clear();
    useAgentSections.setState({ open: { thinking: true, advanced: true, output: true } });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("keeps Anthropic-only options off for Claude on Bedrock, with the reason", async () => {
    stubBedrock();
    const { container } = show({ ...defaultAgent(), model: SUGGESTED });
    open(container, "thinking");
    await waitFor(() => expect(screen.getAllByTestId("anthropic-only").length).toBeGreaterThan(0));
    for (const hint of screen.getAllByTestId("anthropic-only"))
      expect(hint).toHaveTextContent("Claude-Modelle auf Amazon Bedrock bieten es ebenfalls nicht");
  });

  it("follows the model's capabilities and turns unknown ones off", async () => {
    stubBedrock();
    const first = show({ ...defaultAgent(), model: SUGGESTED });
    open(first.container, "advanced");
    // Claude Sonnet 5.5 on Bedrock cannot be forced to call a tool.
    await waitFor(() => expect(screen.getByTestId("capability-forced_tool_choice")).toHaveAttribute("data-state", "unsupported"));
    expect(screen.queryByTestId("capability-reasoning")).toBeNull();
    cleanup();
    // A typed ARN: nothing is known about the model behind it.
    const second = show({ ...defaultAgent(), model: "bedrock:arn:aws:bedrock:eu-central-1:123456789012:application-inference-profile/abc" });
    open(second.container, "thinking");
    open(second.container, "output");
    await waitFor(() => expect(screen.getByTestId("capability-reasoning")).toHaveAttribute("data-state", "unknown"));
    expect(screen.getByTestId("capability-structured_output")).toHaveAttribute("data-state", "unknown");
  });
});
