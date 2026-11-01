import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ModelChoice, Workflow } from "../api/types";
import { ModelChoicePanel, withModel } from "./ModelChoicePanel";

const agent = (id: string, label: string, model: string) => ({ id, type: "agent", label, position: { x: 0, y: 0 }, agent: { name: label, model }, start: null });
const WORKFLOW = {
  id: "wf_1",
  name: "Anfragen",
  updated_at: "2026-10-31T10:00:00Z",
  nodes: [{ id: "start", type: "start", label: "", position: { x: 0, y: 0 }, agent: null, start: {} }, agent("worker", "Bearbeitung", "anthropic:claude-sonnet-5-5")],
  edges: [],
} as unknown as Workflow;

const measured = (model: string, extra: Record<string, unknown> = {}) => ({
  model,
  benchmark_run_id: `bench_${model}`,
  created_at: "2026-10-31T10:00:00Z",
  current: model === "anthropic:claude-sonnet-5-5",
  cases: 2,
  passed: 2,
  pass_rate: 1,
  judge_score: null,
  cost_per_case_usd: 0.004,
  avg_duration_s: 1.2,
  new_failures: [],
  available: true,
  excluded: [],
  ...extra,
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function stubApi(choice: Partial<ModelChoice>) {
  const calls: { path: string; search: string; body?: unknown; method: string }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input), "http://localhost");
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ path: url.pathname, search: url.search, body, method: init?.method ?? "GET" });
      if (url.pathname === "/api/benchmarks/suite_a/model-choice") {
        return json({ suite_id: "suite_a", workflow_id: "wf_1", node_id: "worker", current_model: "anthropic:claude-sonnet-5-5", skipped: {}, warnings: [], measurements: [], ...choice });
      }
      if (url.pathname === "/api/workflows/wf_1" && init?.method === "PUT") return json({ ...WORKFLOW, ...body });
      return json({ detail: "not found" }, 404);
    }),
  );
  return calls;
}

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ModelChoicePanel suiteId="suite_a" workflow={WORKFLOW} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ModelChoicePanel", () => {
  it("keeps the configured model without measurements", async () => {
    const calls = stubApi({ outcome: "no_measurement", recommended: null, required_pass_rate: null });
    show();
    expect(await screen.findByTestId("model-choice-outcome")).toHaveTextContent("anthropic:claude-sonnet-5-5");
    expect(screen.queryByRole("button", { name: /claude-haiku/ })).toBeNull();
    const query = new URLSearchParams(calls[0].search);
    expect(query.get("node_id")).toBe("worker");
    expect(query.get("objective")).toBe("cost");
    expect(query.get("min_pass_rate")).toBeNull();
  });

  it("shows the evidence and applies a recommendation only on request", async () => {
    const calls = stubApi({
      outcome: "switch",
      recommended: "anthropic:claude-haiku-4-5",
      required_pass_rate: 1,
      measurements: [
        measured("anthropic:claude-sonnet-5-5", { cost_per_case_usd: 0.02 }),
        measured("anthropic:claude-haiku-4-5"),
        measured("openai:gpt-5-mini", { cost_per_case_usd: null, excluded: ["model.cost_unknown"] }),
      ],
      skipped: { older_record: 2 },
      warnings: ["model_choice.few_cases"],
    } as unknown as Partial<ModelChoice>);
    show();
    const apply = await screen.findByRole("button", { name: /claude-haiku-4-5/ });
    expect(calls.every((call) => call.method === "GET")).toBe(true);
    expect(screen.getByTestId("model-choice-skipped")).toHaveTextContent("2");
    expect(screen.getAllByRole("row")).toHaveLength(4);
    await userEvent.click(apply);
    await waitFor(() => expect(calls.some((call) => call.method === "PUT")).toBe(true));
    const saved = calls.find((call) => call.method === "PUT")!;
    expect(saved.path).toBe("/api/workflows/wf_1");
    expect((saved.body as Workflow).nodes[1].agent?.model).toBe("anthropic:claude-haiku-4-5");
  });

  it("sends the policy the person sets", async () => {
    const calls = stubApi({ outcome: "keep", recommended: null, required_pass_rate: 0.5 });
    show();
    await screen.findByTestId("model-choice-outcome");
    await userEvent.type(screen.getByRole("textbox"), "50");
    await waitFor(() => expect(calls.some((call) => new URLSearchParams(call.search).get("min_pass_rate") === "0.5")).toBe(true));
  });
});

describe("withModel", () => {
  it("changes only the named agent", () => {
    const changed = withModel(WORKFLOW, "worker", "x:y");
    expect(changed.nodes[1].agent?.model).toBe("x:y");
    expect(changed.nodes[0]).toBe(WORKFLOW.nodes[0]);
    expect(WORKFLOW.nodes[1].agent?.model).toBe("anthropic:claude-sonnet-5-5");
  });
});
