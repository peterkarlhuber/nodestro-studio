import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Settings } from "../api/types";
import { OutputLimitsPanel, effectiveLimit } from "./SettingsOutputLimits";

const DEFAULTS = {
  architect_analysis: 8000,
  architect_plan: 32_000,
  architect_agent: 16_000,
  architect_repair: 8000,
  assistant_chat: 16_000,
  agent_design: 16_000,
  memory_proposal: 8000,
  api_guide: 8000,
  run_chat: 4000,
  orchestrator: 8000,
  quality_judge: 8000,
  tool_generation: 16_000,
};

const settings = {
  assistant_model: "anthropic:claude-opus-5-5",
  output_limits: { architect_plan: 500_000, architect_analysis: 3000 },
  output_limit_defaults: DEFAULTS,
  architect_retry_truncated: true,
  architect_retry_max_tokens: 64_000,
} as unknown as Settings;

const OPUS = {
  model: "anthropic:claude-opus-5-5",
  provider: "anthropic",
  error: null,
  capabilities: {},
  reasons: {},
  limits: { context_window: 1_000_000, max_output_tokens: 128_000, efforts: null, thinking_modes: null, thinking_budget: false, source: "documented" },
  max_tokens_limit: 128_000,
  options: {},
  native_tools: [],
};

let saved: unknown[] = [];

beforeEach(() => {
  saved = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = url.replace(/\?.*$/, "");
      if (path.endsWith("/settings") && init?.method === "PUT") saved.push(JSON.parse(String(init.body)));
      const body = path.endsWith("/models/profile") ? OPUS : settings;
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function show(admin = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <OutputLimitsPanel settings={settings} admin={admin} />
    </QueryClientProvider>,
  );
}

describe("effectiveLimit", () => {
  it("caps at the documented maximum, else at half the context window, and says why", () => {
    const limits = (max: number | null, window: number | null) => ({ ...OPUS, limits: { ...OPUS.limits, max_output_tokens: max, context_window: window } }) as never;
    expect(effectiveLimit(500_000, limits(128_000, null))).toEqual({ value: 128_000, reduced: "model_maximum" });
    expect(effectiveLimit(32_000, limits(128_000, null))).toEqual({ value: 32_000, reduced: null });
    expect(effectiveLimit(32_000, limits(null, 32_768))).toEqual({ value: 16_384, reduced: "context_window" });
    expect(effectiveLimit(32_000, undefined)).toEqual({ value: 32_000, reduced: null });
  });
});

describe("Model output limits section", () => {
  it("is a settings section the navigation finds", () => {
    const { container } = show();
    const heading = container.querySelector("section > h2.panel__title[id]");
    expect(heading?.id).toBe("settings-output-limits");
  });

  it("shows overrides, defaults and the value sent to the assistant model, lowered with the reason", async () => {
    show();
    await waitFor(() => expect(screen.getByTestId("output-limit-sent-architect_plan")).toHaveTextContent("128.000"));
    expect(screen.getByTestId("output-limit-sent-architect_plan").querySelector("[data-reduced]")).toHaveAttribute(
      "data-reduced",
      "model_maximum",
    );
    expect(screen.getByTestId("output-limit-sent-architect_analysis")).toHaveTextContent("3.000");
    // An operation without an override sends its default.
    expect(screen.getByTestId("output-limit-sent-architect_agent")).toHaveTextContent("16.000");
    expect(screen.getByTestId("output-limits-model")).toHaveTextContent("128.000");
  });

  it("saves overrides, removes a reset one (0) and the retry settings", async () => {
    show();
    const analysis = await screen.findByRole("spinbutton", { name: /Architekt: Anforderungsanalyse/ });
    await userEvent.click(screen.getByRole("button", { name: /Architekt: Anforderungsanalyse auf die Vorgabe zurücksetzen/ }));
    expect(analysis).toHaveValue(null);
    const plan = screen.getByRole("spinbutton", { name: /Architekt: Workflow-Plan/ });
    await userEvent.clear(plan);
    await userEvent.type(plan, "40000");
    await userEvent.click(screen.getByRole("switch", { name: /Abgeschnittene Antworten/ }));
    await userEvent.click(screen.getByRole("button", { name: "Speichern" }));
    await waitFor(() => expect(saved).toHaveLength(1));
    const body = saved[0] as { output_limits: Record<string, number>; architect_retry_truncated: boolean };
    expect(body.output_limits.architect_plan).toBe(40_000);
    expect(body.output_limits.architect_analysis).toBe(0);
    expect(body.output_limits.run_chat).toBe(0);
    expect(body.architect_retry_truncated).toBe(false);
  });

  it("refuses values outside the range before saving", async () => {
    show();
    const plan = await screen.findByRole("spinbutton", { name: /Architekt: Workflow-Plan/ });
    await userEvent.clear(plan);
    await userEvent.type(plan, "12");
    expect(plan).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: "Speichern" })).toBeDisabled();
  });

  it("is read-only without the admin permission", () => {
    show(false);
    expect(screen.getByRole("spinbutton", { name: /Architekt: Workflow-Plan/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Speichern" })).toBeDisabled();
  });
});

describe("texts of the output limits", () => {
  it("name the step in the interface language inside error and log texts", async () => {
    const { default: i18n } = await import("../i18n");
    const truncated = i18n.t("errors.architect.truncated", { operation: "architect_plan", max_tokens: "32,000", lng: "en" });
    expect(truncated).toContain("“Architect: workflow plan”");
    const log = i18n.t("architect.log.architect.limit_reduced", { operation: "architect_plan", configured: 500000, max_tokens: 128000, lng: "en" });
    expect(log).toContain("Architect: workflow plan");
    expect(i18n.t("errors.config.option_unsupported", { option: "cache_control", lng: "en" })).toContain("“Prompt caching”");
    expect(i18n.t("errors.config.effort_adjusted", { effort: "xhigh", used: "high", lng: "en" })).toContain("High – thorough");
  });
});
