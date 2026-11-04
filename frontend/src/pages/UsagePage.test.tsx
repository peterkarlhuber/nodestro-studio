import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UsagePage } from "./UsagePage";

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
});
