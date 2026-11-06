import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UsageBudgets } from "../api/types";
import { BudgetsCard, UsagePage } from "./UsagePage";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const bucket = (key: string) => ({
  key,
  runs: 1,
  operations: 0,
  requests: 1,
  input_tokens: 100,
  output_tokens: 20,
  total_tokens: 120,
  cost_usd: 0.01,
  unpriced: 0,
});

describe("UsagePage (AD-20)", () => {
  it("says which costs the estimate leaves out", async () => {
    const usage = {
      days: 30,
      total: bucket("total"),
      by_day: [bucket("2026-11-03")],
      by_workflow: [bucket("wf_1")],
      by_model: [bucket("anthropic:claude-sonnet-5-5")],
      by_source: [bucket("workflow_run")],
      recent: [],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        new Response(JSON.stringify(String(url).includes("/usage") ? usage : String(url).includes("/meta") ? { models: [], providers: [] } : []), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <UsagePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId("usage-not-included")).toHaveTextContent("(MCP)");
  });

  it("shows the daily limits of published APIs and the runs budgets stopped (ST-014, API-017)", () => {
    const budgets: UsageBudgets = {
      publications: [
        { publication_id: "pub_b", slug: "berichte", name: "Berichte", daily_budget_usd: 0.1, last_24h_usd: 0.2, run_budget_usd: null, exhausted: true },
        { publication_id: "pub_a", slug: "angebote", name: "Angebote", daily_budget_usd: 1, last_24h_usd: 0.3, run_budget_usd: 0.5, exhausted: false },
        { publication_id: "pub_c", slug: "offen", name: "Offen", daily_budget_usd: null, last_24h_usd: 0, run_budget_usd: null, exhausted: false },
      ],
      stopped_runs: 2,
      waiting_runs: 1,
    };
    render(<BudgetsCard budgets={budgets} />);
    expect(screen.getByTestId("usage-budget-runs")).toHaveTextContent("2 Läufe dieses Zeitraums wurden von ihrem Budget gestoppt. 1 Lauf wartet auf eine Budget-Entscheidung.");
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("Berichte Limit erreicht"),
      expect.stringContaining("Angebote"),
      expect.stringContaining("Kein Limit"),
    ]);
    const meters = screen.getAllByRole("meter");
    expect(meters.map((meter) => meter.getAttribute("aria-valuenow"))).toEqual(["100", "30"]);
  });

  it("hides the card when no API has a budget and no run met one, and for an older API", () => {
    const { container } = render(<BudgetsCard budgets={{ publications: [], stopped_runs: 0, waiting_runs: 0 }} />);
    expect(container).toBeEmptyDOMElement();
    render(<BudgetsCard budgets={undefined} />);
    expect(screen.queryByTestId("usage-budgets")).toBeNull();
    render(<BudgetsCard budgets={{ publications: [], stopped_runs: 1, waiting_runs: 0 }} />);
    expect(screen.getByTestId("usage-budget-runs")).toHaveTextContent("1 Lauf dieses Zeitraums wurde von seinem Budget gestoppt.");
  });
});
