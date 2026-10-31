import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TestStatus } from "./TestStatus";

const SUITES = [
  { id: "suite_a", name: "Regression", workflow_id: "wf_1", updated_at: "2026-10-31T09:00:00+00:00", created_at: "2026-10-31T09:00:00+00:00", cases: [] },
  { id: "suite_b", name: "Grenzfälle", workflow_id: "wf_1", updated_at: "2026-10-31T09:00:00+00:00", created_at: "2026-10-31T09:00:00+00:00", cases: [] },
];
const VERSIONS = [{ number: 2, created_at: "2026-10-31T08:00:00+00:00", current: true }];
const RUN = {
  id: "bench_1",
  suite_id: "suite_b",
  workflow_version: 2,
  status: "finished",
  created_at: "2026-10-31T10:00:00+00:00",
  summary: { cases: 3, passed: 3 },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** Answers like the API; ``failing`` paths answer 500 until removed from the set. */
function stubApi(failing: Set<string>) {
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const path = new URL(String(input), "http://localhost").pathname;
    if (failing.has(path)) return json({ detail: "Database unavailable", code: null, params: {} }, 500);
    if (path === "/api/benchmarks") return json(SUITES);
    if (path === "/api/workflows/wf_1/versions") return json(VERSIONS);
    if (path === "/api/benchmarks/suite_a/runs") return json([]);
    if (path === "/api/benchmarks/suite_b/runs") return json([RUN]);
    return json({ detail: "not found" }, 404);
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <TestStatus workflowId="wf_1" version={2} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const rows = () => screen.getAllByTestId("test-status-row").map((row) => row.textContent ?? "");

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("test status in the publish dialog", () => {
  it("shows untested and passed when everything loads", async () => {
    stubApi(new Set());
    show();
    await waitFor(() => expect(screen.getAllByTestId("test-status-row")).toHaveLength(2));
    expect(rows()[0]).toContain("ungetestet");
    expect(rows()[1]).toContain("3 von 3 bestanden");
    expect(screen.queryByTestId("test-status-error")).toBeNull();
  });

  it("says the test runs of one series could not be loaded instead of untested, and reloads them", async () => {
    const failing = new Set(["/api/benchmarks/suite_a/runs"]);
    stubApi(failing);
    show();
    await waitFor(() => expect(screen.getAllByTestId("test-status-row")).toHaveLength(2));
    expect(rows()[0]).toContain("Testläufe nicht geladen");
    expect(rows()[0]).not.toContain("ungetestet");
    // The other series is unaffected.
    expect(rows()[1]).toContain("3 von 3 bestanden");
    failing.clear();
    await userEvent.click(within(screen.getAllByTestId("test-status-row")[0]).getByRole("button", { name: "Erneut laden" }));
    await waitFor(() => expect(rows()[0]).toContain("ungetestet"));
  });

  it("shows an error, not 'no test series', when the series cannot be loaded, and recovers on reload", async () => {
    const failing = new Set(["/api/benchmarks"]);
    stubApi(failing);
    show();
    const error = await screen.findByTestId("test-status-error");
    expect(error.textContent).toBe("Die Testergebnisse für Version 2 konnten nicht geladen werden.");
    expect(screen.queryByText("Für diesen Workflow gibt es keine Testreihe.")).toBeNull();
    expect(screen.queryByTestId("test-status-row")).toBeNull();
    failing.clear();
    await userEvent.click(screen.getByRole("button", { name: "Erneut laden" }));
    await waitFor(() => expect(screen.getAllByTestId("test-status-row")).toHaveLength(2));
    expect(screen.queryByTestId("test-status-error")).toBeNull();
  });

  it("shows an error when the versions cannot be loaded", async () => {
    stubApi(new Set(["/api/workflows/wf_1/versions"]));
    show();
    expect((await screen.findByTestId("test-status-error")).textContent).toContain("Version 2");
    expect(screen.queryByText("ungetestet")).toBeNull();
  });
});
