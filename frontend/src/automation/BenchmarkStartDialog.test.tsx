import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Suite } from "../api/types";
import { BenchmarkStartDialog } from "./BenchmarkStartDialog";

const SUITE = { id: "suite_a", name: "Regression", workflow_id: "wf_1", cases: [{ id: "c1" }, { id: "c2" }] } as unknown as Suite;
const agent = (id: string, label: string, model: string) => ({ id, type: "agent", label, position: { x: 0, y: 0 }, agent: { name: label, model }, start: null });
const WORKFLOW = {
  id: "wf_1",
  name: "Anfragen",
  nodes: [
    { id: "start", type: "start", label: "", position: { x: 0, y: 0 }, agent: null, start: {} },
    agent("research", "Recherche", "anthropic:claude-sonnet-4-5"),
    agent("reply", "Antwort", "anthropic:claude-sonnet-4-5"),
  ],
  edges: [],
};
const PLAN = { cases: 2, estimate: { runs: 2, per_run_usd: null, total_usd: null, max_total_usd: null, based_on: 0 }, judged_cases: 0, external_tools: [], approvals: 0, problems: [] };

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function stubApi() {
  const bodies: Record<string, unknown[]> = { plan: [], runs: [] };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = new URL(String(input), "http://localhost").pathname;
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      if (path === "/api/workflows/wf_1") return json(WORKFLOW);
      if (path === "/api/workflows/wf_1/versions") return json([]);
      if (path === "/api/meta") return json({ providers: [{ id: "anthropic", example_model: "" }], models: [] });
      if (path === "/api/settings") return json({ providers: [{ id: "anthropic", configured: true }] });
      if (path === "/api/benchmarks/suite_a/plan") {
        bodies.plan.push(body);
        return json(PLAN);
      }
      if (path === "/api/benchmarks/suite_a/runs") {
        bodies.runs.push(body);
        return json({ id: "bench_1", suite_id: "suite_a", models: body.models }, 201);
      }
      return json({ detail: "not found" }, 404);
    }),
  );
  return bodies;
}

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onStarted = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <BenchmarkStartDialog suite={SUITE} open onClose={() => {}} onStarted={onStarted} />
    </QueryClientProvider>,
  );
  return onStarted;
}

const startButton = () => screen.getByRole("button", { name: "2 Testfälle ausführen" });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("comparing models when starting a test series", () => {
  it("starts the saved version without models by default", async () => {
    const bodies = stubApi();
    show();
    await waitFor(() => expect(startButton()).toBeEnabled());
    expect(screen.queryByTestId("benchmark-models")).toBeNull();
    await userEvent.click(startButton());
    await waitFor(() => expect(bodies.runs).toHaveLength(1));
    expect(bodies.runs[0]).toMatchObject({ models: {} });
  });

  it("sends only the changed models and needs a cost limit for them", async () => {
    const bodies = stubApi();
    const onStarted = show();
    await userEvent.click(await screen.findByRole("switch", { name: /Andere Modelle testen/ }));
    const model = await screen.findByRole("combobox", { name: "Modell für Antwort" });
    expect(screen.getByRole("combobox", { name: "Modell für Recherche" })).toHaveValue("claude-sonnet-4-5");
    fireEvent.change(model, { target: { value: "claude-haiku-4-5" } });
    expect(await screen.findByTestId("benchmark-needs-limit")).toBeInTheDocument();
    expect(screen.getByText("1 Agent läuft mit einem anderen Modell.")).toBeInTheDocument();
    expect(startButton()).toBeDisabled();

    // The limit fields are concurrency, cost and failures, in this order.
    fireEvent.change(screen.getAllByRole("spinbutton")[1], { target: { value: "0.5" } });
    await waitFor(() => expect(startButton()).toBeEnabled());
    expect(screen.queryByTestId("benchmark-needs-limit")).toBeNull();
    await userEvent.click(startButton());
    await waitFor(() => expect(bodies.runs).toHaveLength(1));
    expect(bodies.runs[0]).toMatchObject({ max_cost_usd: 0.5, models: { reply: "anthropic:claude-haiku-4-5" } });
    expect(bodies.plan.at(-1)).toMatchObject({ models: { reply: "anthropic:claude-haiku-4-5" } });
    expect(onStarted).toHaveBeenCalled();
  });
});
