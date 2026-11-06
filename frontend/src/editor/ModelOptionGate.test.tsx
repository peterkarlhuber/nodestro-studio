// The agent editor shows model-dependent options by the model's profile (GET /api/models/profile), not by the
// provider's name: thinking, caching, fallbacks, provider-native tools, effort levels, the thinking budget and the
// model's token limits next to Max. tokens.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AgentConfig, ModelProfile } from "../api/types";
import { defaultAgent } from "../lib/defaults";
import { AgentForm } from "./AgentInspector";
import { useAgentSections } from "./sectionState";

vi.mock("../components/CodeEditor", () => ({ CodeEditor: () => null }));

const yes = { available: true, reason: null, values: null };
const no = (reason: string) => ({ available: false, reason, values: null });

function profile(model: string, patch: Partial<ModelProfile>): ModelProfile {
  return {
    model,
    provider: model.split(":")[0],
    error: null,
    capabilities: {},
    reasons: {},
    limits: { context_window: null, max_output_tokens: null, efforts: null, thinking_modes: null, thinking_budget: null, source: "unknown" },
    max_tokens_limit: 1_000_000,
    options: {
      thinking: yes,
      thinking_display: yes,
      thinking_budget: no("provider"),
      cache_control: yes,
      cache_ttl: yes,
      fallbacks: yes,
    },
    native_tools: [{ key: "web_search", available: true, reason: null }],
    ...patch,
  };
}

const PROFILES: Record<string, ModelProfile> = {
  "openai:gpt-6.1-sol": profile("openai:gpt-6.1-sol", {
    limits: { context_window: null, max_output_tokens: null, efforts: ["low", "medium", "high", "xhigh", "max"], thinking_modes: [], thinking_budget: false, source: "unknown" },
    options: {
      thinking: no("provider"),
      thinking_display: no("provider"),
      thinking_budget: no("provider"),
      cache_control: no("automatic"),
      cache_ttl: no("automatic"),
      fallbacks: no("provider"),
    },
    native_tools: [{ key: "web_search", available: false, reason: "not_integrated" }],
  }),
  "anthropic:claude-haiku-4-5": profile("anthropic:claude-haiku-4-5", {
    limits: { context_window: 200_000, max_output_tokens: 64_000, efforts: [], thinking_modes: [], thinking_budget: false, source: "documented" },
    max_tokens_limit: 64_000,
    options: { ...profile("x:y", {}).options, thinking: no("model"), thinking_display: no("model") },
  }),
  "anthropic:claude-opus-5-5": profile("anthropic:claude-opus-5-5", {
    limits: { context_window: 1_000_000, max_output_tokens: 128_000, efforts: ["low", "medium", "high", "xhigh", "max"], thinking_modes: ["adaptive"], thinking_budget: false, source: "documented" },
    max_tokens_limit: 128_000,
    options: { ...profile("x:y", {}).options, thinking: { available: true, reason: null, values: ["adaptive"] } },
  }),
  "gemini:gemini-2.5-flash": profile("gemini:gemini-2.5-flash", {
    limits: { context_window: null, max_output_tokens: null, efforts: [], thinking_modes: [], thinking_budget: true, source: "unknown" },
    options: {
      thinking: no("provider"),
      thinking_display: no("provider"),
      thinking_budget: yes,
      cache_control: no("automatic"),
      cache_ttl: no("automatic"),
      fallbacks: no("provider"),
    },
    native_tools: [{ key: "web_search", available: false, reason: "not_integrated" }],
  }),
};

function stubApi() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const path = url.replace(/\?.*$/, "");
      const model = new URL(url, "http://x").searchParams.get("model") ?? "";
      const body = path.endsWith("/models/profile")
        ? PROFILES[model]
        : path.endsWith("/meta")
          ? { providers: [], capabilities: [], models: [], server_tools: [{ key: "web_search", label: "Web search", description: "" }] }
          : path.endsWith("/settings")
            ? { providers: [], default_model: "anthropic:claude-sonnet-5-5", assistant_model: "anthropic:claude-opus-5-5" }
            : [];
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
}

function show(agent: AgentConfig) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AgentForm agent={agent} onChange={() => undefined} onReplace={() => undefined} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const sectionOf = (container: HTMLElement, id: string) => container.querySelector<HTMLElement>(`[data-section="${id}"]`)!;

function effortOptions(container: HTMLElement): string[] {
  const section = sectionOf(container, "thinking");
  const select = within(section).getByLabelText("Aufwand", { selector: "select" }) as HTMLSelectElement;
  return [...select.options].map((option) => option.value);
}

describe("model-dependent agent options", () => {
  beforeEach(() => {
    localStorage.clear();
    useAgentSections.setState({ open: { thinking: true, advanced: true, tools: true } });
    stubApi();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("follows an OpenAI model's profile: no thinking switch, automatic caching, web search not integrated", async () => {
    const { container } = show({ ...defaultAgent(), model: "openai:gpt-6.1-sol" });
    // Before the profile arrives the former rule applies (Anthropic only); wait for the profile's own reasons.
    await waitFor(() => expect(screen.getByTestId("option-unavailable-cache_control")).toHaveAttribute("data-reason", "automatic"));
    expect(screen.getByTestId("option-unavailable-thinking")).toHaveAttribute("data-reason", "provider");
    expect(screen.getByTestId("option-unavailable-fallbacks")).toHaveAttribute("data-reason", "provider");
    expect(screen.getByTestId("native-tool-unavailable-web_search")).toHaveAttribute("data-reason", "not_integrated");
    expect(effortOptions(container)).toEqual(["", "low", "medium", "high", "xhigh", "max"]);
    expect(screen.queryByLabelText("Denkbudget (Tokens)")).toBeNull();
  });

  it("offers Claude Opus 5.5 everything it supports, and only adaptive thinking", async () => {
    const { container } = show({ ...defaultAgent(), model: "anthropic:claude-opus-5-5", max_tokens: 16_000 });
    await waitFor(() => expect(screen.getByTestId("model-token-limits")).toHaveAttribute("data-source", "documented"));
    expect(screen.queryByTestId(/^option-unavailable-/)).toBeNull();
    expect(screen.queryByTestId(/^native-tool-unavailable-/)).toBeNull();
    const thinking = within(sectionOf(container, "thinking")).getByLabelText("Thinking", { selector: "select" }) as HTMLSelectElement;
    expect([...thinking.options].map((option) => option.value)).toEqual(["", "adaptive"]);
    expect(screen.getByTestId("model-token-limits")).toHaveTextContent("128.000");
  });

  it("limits Claude Haiku 4.5: no effort levels, 64,000 output tokens, a higher value is named", async () => {
    const { container } = show({ ...defaultAgent(), model: "anthropic:claude-haiku-4-5", effort: null, max_tokens: 100_000 });
    await waitFor(() => expect(screen.getByTestId("max-tokens-above-model")).toBeInTheDocument());
    expect(screen.getByTestId("max-tokens-above-model")).toHaveTextContent("64.000");
    expect(effortOptions(container)).toEqual([""]);
    expect(screen.getByTestId("option-unavailable-thinking")).toHaveAttribute("data-reason", "model");
    const input = within(sectionOf(container, "advanced")).getByDisplayValue("100000") as HTMLInputElement;
    expect(input.max).toBe("64000");
  });

  it("keeps a set value visible next to the reason, so it can be reset after a model switch", async () => {
    show({ ...defaultAgent(), model: "openai:gpt-6.1-sol", thinking: "adaptive" });
    await waitFor(() => expect(screen.getByTestId("option-unavailable-thinking")).toBeInTheDocument());
    expect(screen.getByLabelText("Thinking", { selector: "select" })).toHaveValue("adaptive");
  });

  it("shows the thinking budget for Gemini 2.5", async () => {
    show({ ...defaultAgent(), model: "gemini:gemini-2.5-flash", effort: null });
    await waitFor(() => expect(screen.getByLabelText("Denkbudget (Tokens)")).toBeInTheDocument());
  });
});
