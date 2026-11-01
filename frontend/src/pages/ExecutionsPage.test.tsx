import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RUNS_MAX, runsRefetchInterval } from "../api/hooks";
import type { RunStatus } from "../api/types";
import { ExecutionsPage } from "./ExecutionsPage";

const run = (index: number, status: RunStatus = "succeeded") => ({
  id: `run_${index}`,
  workflow_id: "wf_1",
  workflow_name: `Workflow ${index}`,
  status,
  input: "",
  usage: { requests: 0, input_tokens: 0, output_tokens: 0, total_tokens: 0, estimated_cost_usd: 0 },
  created_at: "2026-10-31T10:00:00Z",
  finished_at: "2026-10-31T10:01:00Z",
  error: null,
  trigger: "manual",
});

/**
 * The studio API with ``stored`` runs; /runs answers with at most ``limit`` of them. ``paging``
 * imitates a server with run list paging (``before`` cursor, X-Has-More / X-Next-Before headers).
 */
function stubApi(stored: number, paging = false) {
  const fetch = vi.fn(async (url: string) => {
    const [path, query = ""] = url.split("?");
    let body: unknown = [];
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (path.endsWith("/runs")) {
      const params = new URLSearchParams(query);
      const limit = Number(params.get("limit") ?? 100);
      const start = paging && params.get("before") ? Number(params.get("before")!.replace("cursor-", "")) : 0;
      const end = Math.min(stored, start + limit);
      body = Array.from({ length: end - start }, (_, index) => run(start + index));
      if (paging) {
        headers["X-Has-More"] = String(end < stored);
        if (end < stored) headers["X-Next-Before"] = `cursor-${end}`;
      }
    }
    return new Response(JSON.stringify(body), { status: 200, headers });
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

const rows = () => document.querySelectorAll("tbody tr").length;
const loadOlder = () => screen.getByText("Ältere Ausführungen laden").closest("button")!;

const runRequests = (fetch: ReturnType<typeof stubApi>) =>
  fetch.mock.calls.map(([url]) => String(url)).filter((url) => url.includes("/runs"));

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ExecutionsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ExecutionsPage list limit", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("says nothing about a limit when every run is listed", async () => {
    stubApi(3);
    show();
    expect(await screen.findByText("Workflow 2")).toBeInTheDocument();
    expect(screen.queryByTestId("runs-limit")).not.toBeInTheDocument();
  });

  // Hundreds of table rows take a while in jsdom.
  it("says that only the newest 100 runs are shown and loads older ones on request", { timeout: 30_000 }, async () => {
    const fetch = stubApi(250);
    show();
    expect(await screen.findByText("Angezeigt werden die neuesten 100 Ausführungen.")).toBeInTheDocument();
    expect(runRequests(fetch).at(-1)).toContain("limit=100");
    expect(rows()).toBe(100);
    await userEvent.click(loadOlder());
    expect(await screen.findByText("Angezeigt werden die neuesten 200 Ausführungen.")).toBeInTheDocument();
    expect(runRequests(fetch).at(-1)).toContain("limit=200");
    expect(rows()).toBe(200);
    await userEvent.click(loadOlder());
    // 250 of at most 300: everything is listed, the notice goes away.
    await waitFor(() => expect(screen.queryByTestId("runs-limit")).not.toBeInTheDocument());
    expect(rows()).toBe(250);
  });

  it("names the API maximum when even the longest list is full", { timeout: 60_000 }, async () => {
    stubApi(RUNS_MAX + 20);
    show();
    for (let shown = 100; shown < RUNS_MAX; shown += 100) {
      await screen.findByText(`Angezeigt werden die neuesten ${shown} Ausführungen.`);
      await userEvent.click(loadOlder());
    }
    expect(await screen.findByText(/neuesten 500 Ausführungen\. Ältere Ausführungen bleiben gespeichert/)).toBeInTheDocument();
    expect(screen.queryByText("Ältere Ausführungen laden")).not.toBeInTheDocument();
  });
});

describe("ExecutionsPage with run list paging", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("loads older runs page by page with the server's cursor, beyond the old maximum", { timeout: 60_000 }, async () => {
    const fetch = stubApi(RUNS_MAX + 120, true);
    show();
    for (let shown = 100; shown <= RUNS_MAX + 100; shown += 100) {
      await screen.findByText(`Angezeigt werden die neuesten ${shown} Ausführungen.`);
      expect(rows()).toBe(shown);
      await userEvent.click(loadOlder());
    }
    // 620 stored: after the sixth page the server says there is no more.
    await waitFor(() => expect(screen.queryByTestId("runs-limit")).not.toBeInTheDocument());
    expect(rows()).toBe(RUNS_MAX + 120);
    const requests = runRequests(fetch);
    expect(requests.some((url) => url.includes("before=cursor-100") && url.includes("limit=100"))).toBe(true);
    expect(requests.some((url) => url.includes("before=cursor-500"))).toBe(true);
  });

  it("shows no notice when the server says the first page is all", async () => {
    stubApi(100, true);
    show();
    await screen.findByText("Workflow 99");
    expect(screen.queryByTestId("runs-limit")).not.toBeInTheDocument();
  });
});

describe("runsRefetchInterval", () => {
  it("polls quickly only while a listed run is queued or running", () => {
    expect(runsRefetchInterval([{ status: "running" }, { status: "succeeded" }])).toBe(5_000);
    expect(runsRefetchInterval([{ status: "queued" }])).toBe(5_000);
    expect(runsRefetchInterval([{ status: "succeeded" }, { status: "failed" }, { status: "paused" }])).toBe(30_000);
    expect(runsRefetchInterval([])).toBe(30_000);
    expect(runsRefetchInterval(undefined)).toBe(30_000);
  });
});
