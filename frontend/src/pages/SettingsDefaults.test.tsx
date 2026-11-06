import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../api/client";
import type { SettingsDefaults } from "../api/types";
import { Field, Toggle } from "../components/ui";
import { DefaultMark, isDefault } from "./SettingsDefaults";

const DEFAULTS: SettingsDefaults = {
  default_model: "anthropic/claude-sonnet",
  assistant_model: "anthropic/claude-haiku",
  default_budget_usd: 2,
  sandbox: "auto",
  language: null,
  architect_budget_usd: 2,
  architect_max_repairs: 2,
  architect_retry_truncated: true,
  architect_retry_max_tokens: 64000,
  ocr_enabled: false,
  price_mode: "standard",
  max_run_budget_usd: null,
  budget_decision_hours: 24,
  knowledge_retrieval: "fts",
  embedding_model: null,
  strict_offline: false,
  prefer_european_models: false,
  local_reasoning: "auto",
  reasoning_summaries: false,
};

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
  );
}

describe("isDefault", () => {
  it("compares numbers by value, also when the input keeps them as text", () => {
    expect(isDefault(2, 2)).toBe(true);
    expect(isDefault("2.00", 2)).toBe(true);
    expect(isDefault("64000", 64000)).toBe(true);
    expect(isDefault(2.5, 2)).toBe(false);
    expect(isDefault("5.00", "5")).toBe(true);
    // A money input in a language with a decimal comma.
    expect(isDefault("2,50", "2.5")).toBe(true);
  });

  it("treats empty input, null and NaN as no value", () => {
    expect(isDefault(null, null)).toBe(true);
    expect(isDefault("", null)).toBe(true);
    expect(isDefault(Number.NaN, null)).toBe(true);
    expect(isDefault("5", null)).toBe(false);
    expect(isDefault(null, 2)).toBe(false);
  });

  it("compares ids, modes and switches as written", () => {
    expect(isDefault("anthropic/claude-sonnet", "anthropic/claude-sonnet")).toBe(true);
    expect(isDefault("openai/gpt-5", "anthropic/claude-sonnet")).toBe(false);
    expect(isDefault(true, false)).toBe(false);
    expect(isDefault("docker", "auto")).toBe(false);
  });

  it("never marks a setting the backend does not send", () => {
    expect(isDefault(undefined, true)).toBe(true);
  });
});

describe("the Changed mark", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("marks a changed field and resets it to the default", async () => {
    vi.spyOn(api, "settingsDefaults").mockResolvedValue(DEFAULTS);
    const onReset = vi.fn();
    render(
      wrap(
        <Field
          label="Standard-Budget"
          action={<DefaultMark setting="default_budget_usd" value={5} label="Standard-Budget" onReset={onReset} format={(v) => `$${v}`} />}
        >
          <input />
        </Field>,
      ),
    );
    expect(await screen.findByText("Geändert")).toBeInTheDocument();
    const reset = screen.getByRole("button", { name: "Standard-Budget auf die Vorgabe zurücksetzen ($2)" });
    fireEvent.click(reset);
    expect(onReset).toHaveBeenCalledWith(2);
    // The settings search does not index the mark.
    expect(screen.getByTestId("setting-changed-default_budget_usd")).toHaveAttribute("data-settings-search", "skip");
  });

  it("shows nothing while the value is the default", async () => {
    const read = vi.spyOn(api, "settingsDefaults").mockResolvedValue(DEFAULTS);
    render(wrap(<DefaultMark setting="sandbox" value="auto" label="Sandbox" onReset={vi.fn()} />));
    await waitFor(() => expect(read).toHaveBeenCalled());
    expect(screen.queryByText("Geändert")).toBeNull();
  });

  it("shows a switch's default as on or off, under its label", async () => {
    vi.spyOn(api, "settingsDefaults").mockResolvedValue(DEFAULTS);
    render(
      wrap(
        <Toggle
          checked
          onChange={vi.fn()}
          label="OCR"
          action={<DefaultMark setting="ocr_enabled" value label="OCR" onReset={vi.fn()} disabled />}
        />,
      ),
    );
    const reset = await screen.findByRole("button", { name: "OCR auf die Vorgabe zurücksetzen (aus)" });
    // Without the right to change the settings the action is there but disabled.
    expect(reset).toBeDisabled();
    expect(reset.closest(".toggle__body")).not.toBeNull();
  });

  it("shows no mark and no error on an API without the defaults route", async () => {
    vi.spyOn(api, "settingsDefaults").mockResolvedValue(null);
    render(wrap(<DefaultMark setting="sandbox" value="docker" label="Sandbox" onReset={vi.fn()} />));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByText("Geändert")).toBeNull();
  });

  it("shows no mark when reading the defaults fails", async () => {
    vi.spyOn(api, "settingsDefaults").mockRejectedValue(new Error("down"));
    render(wrap(<DefaultMark setting="sandbox" value="docker" label="Sandbox" onReset={vi.fn()} />));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByText("Geändert")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("api.settingsDefaults", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is null on an API without the route", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail: "Not Found" }), { status: 404 })));
    await expect(api.settingsDefaults()).resolves.toBeNull();
  });

  it("returns the defaults", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(DEFAULTS), { status: 200 })));
    await expect(api.settingsDefaults()).resolves.toMatchObject({ sandbox: "auto", max_run_budget_usd: null });
  });

  it("passes other failures on (the page ignores them)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 500 })));
    await expect(api.settingsDefaults()).rejects.toMatchObject({ status: 500 });
  });
});
