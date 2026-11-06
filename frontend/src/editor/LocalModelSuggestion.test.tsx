// Task-aware local model suggestion next to the agent's model picker (ST-044).

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Recommendation } from "../api/localModels";
import type { AgentConfig } from "../api/types";
import { defaultAgent } from "../lib/defaults";
import { agentTask } from "../lib/localRecommend";
import { LocalModelSuggestion } from "./LocalModelSuggestion";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const asked: string[] = [];

function stub(answer: Partial<Recommendation>) {
  asked.length = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const path = url.replace(/\?.*$/, "");
      let body: unknown = [];
      if (path.endsWith("/local-models/recommend")) {
        asked.push(new URL(url, "http://x").searchParams.get("task") ?? "");
        body = { task: "write", model: null, quality: "recommended", installed: true, download_bytes: 0, reasons: [], better: null, alternatives: [], ...answer };
      } else if (path.endsWith("/meta")) body = { providers: [], capabilities: [], models: [], profile: "desktop" };
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
}

function show(agent: AgentConfig, onUse = vi.fn()) {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <LocalModelSuggestion agent={agent} onUse={onUse} />
    </QueryClientProvider>,
  );
  return onUse;
}

const local = (changes: Partial<AgentConfig> = {}) => ({ ...defaultAgent({ name: "A" }), model: "ollama:qwen3.5:4b", ...changes });

describe("agentTask", () => {
  it("derives the task profile from tools, knowledge and output", () => {
    const base = defaultAgent({ name: "A" });
    expect(agentTask(base)).toBe("write");
    expect(agentTask({ ...base, tools: ["web_search"] })).toBe("tool_agent");
    expect(agentTask({ ...base, knowledge: { file_ids: ["kf_1"], mode: "search", citations: false } })).toBe("tool_agent");
    expect(agentTask({ ...base, knowledge: { file_ids: ["kf_1"], mode: "context", citations: false } })).toBe("write");
    expect(agentTask({ ...base, output: { ...base.output, mode: "structured" } })).toBe("extract");
  });
});

describe("local model suggestion", () => {
  it("suggests another model with its reasons and uses it only on click", async () => {
    stub({ task: "tool_agent", model: "ollama:qwen3.5:9b", quality: "acceptable", installed: false, download_bytes: 6_600_000_000, reasons: ["needs_download", "below_ideal"] });
    const onUse = show(local({ tools: ["web_search"] }));
    const hint = await screen.findByTestId("local-suggestion");
    expect(asked).toEqual(["tool_agent"]);
    expect(hint).toHaveTextContent("Für „Mit Tools arbeiten“ empfiehlt dieser Modellserver ollama:qwen3.5:9b (Geeignet).");
    expect(hint).toHaveTextContent("Dafür ist ein Download von 6,6 GB nötig.");
    expect(hint).toHaveTextContent("Ein größeres Modell könnte das besser.");
    expect(onUse).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Dieses Modell verwenden" }));
    expect(onUse).toHaveBeenCalledWith("ollama:qwen3.5:9b");
  });

  it("confirms the current model when it is the suggestion", async () => {
    stub({ model: "ollama:qwen3.5:4b" });
    show(local());
    expect(await screen.findByTestId("local-suggestion")).toHaveTextContent("Empfohlenes lokales Modell für „Texte schreiben“");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("is not asked for an agent on a cloud model", () => {
    stub({ model: "ollama:qwen3.5:9b" });
    show({ ...defaultAgent({ name: "A" }), model: "anthropic:claude-sonnet-5-5" });
    expect(asked).toEqual([]);
    expect(screen.queryByTestId("local-suggestion")).toBeNull();
  });
});
