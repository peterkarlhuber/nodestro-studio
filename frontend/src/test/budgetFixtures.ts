// Budget decisions (BUDGET-1) as the API sends them, for the tests of the card, the store and the pages.
import type { BudgetRequest, RunBudgetOut } from "../api/types";

export function budgetRequest(overrides: Partial<BudgetRequest> = {}): BudgetRequest {
  return {
    id: "bud_1",
    run_id: "run_1",
    workflow_id: "wf_1",
    workflow_name: "Angebot schreiben",
    status: "pending",
    reason: "used_up",
    attended: true,
    block: { scope: "run", run_id: "run_1", node_id: null, label: null },
    limit_usd: "2.00",
    spent_usd: "1.95",
    unknown_cost: false,
    reserved_usd: "0.00",
    requests: [{ run_id: "run_1", node_id: "writer", agent: "Texter", model: "claude-sonnet-4-5", max_cost_usd: "0.40", bounded: true, price_status: "verified", refused: true }],
    suggested_limit_usd: "2.35",
    created_at: "2026-11-02T10:00:00Z",
    deadline: new Date(Date.now() + 24 * 3600_000).toISOString(),
    decided_by: null,
    decided_at: null,
    new_limit_usd: null,
    idempotency_key: null,
    outcome: null,
    ...overrides,
  };
}

export function runBudget(overrides: Partial<RunBudgetOut> = {}, request: Partial<BudgetRequest> | null = {}): RunBudgetOut {
  return {
    run_id: "run_1",
    status: "paused",
    limit_usd: "2.00",
    initial_limit_usd: "1.00",
    source: "workflow",
    spent_usd: "1.95",
    unknown_cost: false,
    remaining_usd: "0.05",
    raises: [
      { request_id: "bud_0", previous_limit_usd: "1.00", new_limit_usd: "2.00", decided_by: "usr_anna", decided_at: "2026-11-02T09:00:00Z" },
    ],
    pending: request === null ? null : budgetRequest(request),
    history: [],
    policy: { max_limit_usd: null, can_decide: true, reason: null, decision_hours: 24 },
    ...overrides,
  };
}
