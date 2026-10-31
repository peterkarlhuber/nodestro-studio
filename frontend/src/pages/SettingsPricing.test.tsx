import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Settings } from "../api/types";

import { PricingPanel, ReconciliationPanel } from "./SettingsPricing";

const ENTRY = {
  provider: "openai",
  model: "gpt-x",
  currency: "USD",
  input_usd_per_mtok: "2",
  output_usd_per_mtok: "8",
  cache_read_usd_per_mtok: "0.5",
  cache_write_5m_usd_per_mtok: null,
  cache_write_1h_usd_per_mtok: null,
  has_long_context: false,
  tariffs: [],
  status: "stale",
  staleness: "warning",
  quality: "unverified",
  source: "litellm",
  source_url: null,
  checked_at: "2026-10-28T10:00:00Z",
  version: "v1",
  overridden: false,
  reference: null,
};

const STATUS = {
  active_version: "v1",
  activated_at: null,
  last_attempt_at: null,
  last_success_at: "2026-10-28T10:00:00Z",
  last_error: null,
  staleness: "warning",
  counts: { stale: 1 },
  pending_reviews: ["v2"],
  overrides: 0,
  reference_read_only: false,
  sync_enabled: true,
  price_mode: "standard",
  warn_after_hours: 48,
  critical_after_days: 7,
  review_change_percent: 20,
  refresh_interval_hours: 24,
};

const REVIEW = {
  version: "v2",
  source: "litellm",
  created_at: "2026-10-31T10:00:00Z",
  changes: [{ provider: "openai", model: "gpt-x", kind: "changed", field: "input_usd_per_mtok", old: "2", new: "3", ratio: "0.5", needs_review: true }],
  issues: [],
};

const SETTINGS = { price_mode: "standard" } as Settings;

type Route = (method: string, url: string, body: unknown) => unknown;

function serve(route: Route) {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const answer = route(init?.method ?? "GET", url, body);
    if (answer instanceof Response) return answer;
    if (answer === undefined) return new Response(null, { status: 204 });
    return new Response(JSON.stringify(answer), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

const pricingRoutes =
  (overrides: Partial<Record<string, unknown>> = {}): Route =>
  (method, url) => {
    if (url === "/api/pricing/status") return overrides.status ?? STATUS;
    if (url === "/api/pricing") return [ENTRY];
    if (url === "/api/pricing/reviews") return overrides.reviews ?? [REVIEW];
    if (url.startsWith("/api/pricing/history")) return [];
    if (method === "POST" && url === "/api/pricing/reviews/v2/approve") return { outcome: "activated", active_version: "v2" };
    if (method === "PUT" && url === "/api/pricing/overrides/openai/gpt-x") return { ...ENTRY, status: "custom", overridden: true };
    if (url === "/api/meta") return { models: [] };
    throw new Error(`unexpected ${method} ${url}`);
  };

const renderWith = (node: React.ReactNode) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{node}</QueryClientProvider>);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PricingPanel", () => {
  it("shows the staleness, the prices with their status and a review to decide", async () => {
    const fetch = serve(pricingRoutes());
    renderWith(<PricingPanel settings={SETTINGS} onMode={() => undefined} />);
    expect(await screen.findByText(/seit mehr als 48 Stunden nicht geprüft/)).toBeInTheDocument();
    const review = await screen.findByTestId("pricing-reviews");
    expect(within(review).getByText(/Eingabe: .*2,00.* → .*3,00.* \(\+50 %\)/)).toBeInTheDocument();
    await userEvent.click(within(review).getByRole("button", { name: "Übernehmen" }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith("/api/pricing/reviews/v2/approve", expect.objectContaining({ method: "POST" })),
    );
    const table = await screen.findByTestId("pricing-table");
    const row = within(table).getByText("openai:gpt-x").closest("tr")!;
    expect(within(row).getByText("Veraltet")).toBeInTheDocument();
    expect(within(row).getByText("Unverifiziert")).toBeInTheDocument();
  });

  it("hides sync and review decisions where the reference prices are read-only", async () => {
    serve(pricingRoutes({ status: { ...STATUS, reference_read_only: true } }));
    renderWith(<PricingPanel settings={SETTINGS} onMode={() => undefined} />);
    expect(await screen.findByText(/verwaltet sein Betreiber/)).toBeInTheDocument();
    await screen.findByTestId("pricing-reviews");
    expect(screen.queryByRole("button", { name: "Preise jetzt prüfen" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Übernehmen" })).not.toBeInTheDocument();
  });

  it("saves an individual price as decimal strings", async () => {
    const fetch = serve(pricingRoutes({ reviews: [] }));
    renderWith(<PricingPanel settings={SETTINGS} onMode={() => undefined} />);
    await userEvent.click(await screen.findByRole("button", { name: "Preis von openai:gpt-x bearbeiten" }));
    const input = screen.getByLabelText("Eingabe");
    await userEvent.clear(input);
    await userEvent.type(input, "1,75");
    await userEvent.click(screen.getByRole("button", { name: "Speichern" }));
    await waitFor(() => {
      const call = fetch.mock.calls.find(([url, init]) => url === "/api/pricing/overrides/openai/gpt-x" && init?.method === "PUT");
      expect(call).toBeDefined();
      expect(JSON.parse(String(call![1]!.body))).toMatchObject({
        input_usd_per_mtok: "1.75",
        output_usd_per_mtok: "8",
        cache_read_usd_per_mtok: "0.5",
        cache_write_5m_usd_per_mtok: null,
        quality: "contract",
        source: "custom",
      });
    });
  });

  it("switches the price mode", async () => {
    serve(pricingRoutes({ reviews: [] }));
    const onMode = vi.fn();
    renderWith(<PricingPanel settings={SETTINGS} onMode={onMode} />);
    await userEvent.click(await screen.findByRole("radio", { name: "Streng" }));
    expect(onMode).toHaveBeenCalledWith("strict");
  });
});

describe("ReconciliationPanel", () => {
  it("sends a one-off key without keeping it and shows deviating days", async () => {
    const fetch = serve((method, url, body) => {
      if (url === "/api/pricing/billing-keys")
        return [
          { provider: "openai", configured: false, origin: "none", scope_ids: [], storable: false },
          { provider: "anthropic", configured: false, origin: "none", scope_ids: [], storable: false },
        ];
      if (method === "POST" && url === "/api/pricing/reconciliation") {
        expect(body).toMatchObject({ keys: { openai: { admin_key: "sk-admin-123456" } }, relative_threshold_percent: 5 });
        return {
          created_at: "2026-10-31T12:00:00Z",
          start: "2026-10-01",
          end: "2026-10-31",
          providers: [{ provider: "openai", ok: true, error: null, complete_until: null }],
          rows: [
            { day: "2026-10-20", provider: "openai", model: null, estimated_usd: "10", billed_usd: "12", difference_usd: "-2", relative_difference: "-0.1667", status: "warning", note: null },
            { day: "2026-10-20", provider: "openai", model: "gpt-x", estimated_usd: "10", billed_usd: "10", difference_usd: "0", relative_difference: "0", status: "ok", note: null },
          ],
          warnings: 1,
          relative_threshold: "0.05",
          absolute_threshold_usd: "1",
        };
      }
      throw new Error(`unexpected ${method} ${url}`);
    });
    renderWith(<ReconciliationPanel />);
    expect(await screen.findByText(/speichert keine Admin-Schlüssel/)).toBeInTheDocument();
    await userEvent.click(screen.getByText("Admin-Schlüssel nur für diesen Abgleich"));
    const key = screen.getByLabelText("OpenAI");
    await userEvent.type(key, "sk-admin-123456");
    await userEvent.click(screen.getByRole("button", { name: "Abgleichen" }));
    const result = await screen.findByTestId("reconciliation-result");
    expect(within(result).getByText("1 Tag oder Modell weicht ab.", { exact: false })).toBeInTheDocument();
    expect(within(result).getByText("Weicht ab")).toBeInTheDocument();
    // Matching model rows are hidden until "all rows" is chosen.
    expect(within(result).queryByText("gpt-x")).not.toBeInTheDocument();
    expect(key).toHaveValue("");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
