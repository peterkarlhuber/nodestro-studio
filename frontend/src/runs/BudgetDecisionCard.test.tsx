import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Run } from "../api/types";
import { budgetRequest, runBudget } from "../test/budgetFixtures";
import { BudgetDecisionForm, RunBudgetDecision, checkNewLimit, initialLimitInput } from "./BudgetDecisionCard";

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function serve(answer: (url: string, body: unknown, method: string) => Response | Promise<Response>) {
  const fetch = vi.fn(async (url: string, init?: RequestInit) =>
    answer(url, init?.body ? JSON.parse(String(init.body)) : undefined, init?.method ?? "GET"),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

/** Answers every read with nothing special; decisions go to ``decide``. */
function serveDecisions(decide: (body: Record<string, unknown>) => Response | Promise<Response>) {
  return serve((url, body, method) => {
    if (method === "POST" && url.endsWith("/budget/decisions")) return decide(body as Record<string, unknown>);
    if (url === "/api/meta") return json({ profile: "desktop" });
    if (url.endsWith("/budget")) return json(runBudget({}, null));
    return json([]);
  });
}

const decisionPosts = (fetch: ReturnType<typeof vi.fn>) =>
  fetch.mock.calls.filter(([url, init]) => String(url).endsWith("/budget/decisions") && (init as RequestInit)?.method === "POST");

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("checkNewLimit", () => {
  it("takes a decimal above the current limit, with a dot or a comma", () => {
    expect(checkNewLimit("2.5", "2.00", null)).toEqual({ value: "2.50", problem: null });
    expect(checkNewLimit("2,50", "2.00", null)).toEqual({ value: "2.50", problem: null });
  });

  it("names why a value cannot be sent", () => {
    expect(checkNewLimit("", "2.00", null).problem).toBe("empty");
    expect(checkNewLimit("zwei", "2.00", null).problem).toBe("invalid");
    expect(checkNewLimit("-3", "2.00", null).problem).toBe("invalid");
    expect(checkNewLimit("1,000.50", "2.00", null).problem).toBe("invalid");
    expect(checkNewLimit("2.00", "2.00", null).problem).toBe("notHigher");
    expect(checkNewLimit("1.99", "2.00", null).problem).toBe("notHigher");
    expect(checkNewLimit("10.01", "2.00", "10.00").problem).toBe("overPolicy");
    expect(checkNewLimit("10", "2.00", "10.00").problem).toBeNull();
  });

  it("prefills the suggestion only when it is above the current limit", () => {
    expect(initialLimitInput({ suggested_limit_usd: "2.35", limit_usd: "2.00" })).toBe("2.35");
    expect(initialLimitInput({ suggested_limit_usd: "2.00", limit_usd: "2.00" })).toBe("");
    expect(initialLimitInput({ suggested_limit_usd: null, limit_usd: "2.00" })).toBe("");
  });
});

describe("BudgetDecisionForm", () => {
  it("shows the run, the status, the limits, the cost, the blocked request and the suggestion", () => {
    serveDecisions(() => json(runBudget()));
    const budget = runBudget();
    render(wrap(<BudgetDecisionForm budget={budget} request={budget.pending!} />));
    expect(screen.getByRole("article", { name: "Budget-Entscheidung Angebot schreiben" })).toBeInTheDocument();
    expect(screen.getByText("Wartet auf Budget-Entscheidung")).toBeInTheDocument();
    expect(screen.getByTestId("budget-initial")).toHaveTextContent("1,00");
    expect(screen.getByTestId("budget-current")).toHaveTextContent("2,00");
    expect(screen.getByTestId("budget-spent")).toHaveTextContent("1,95");
    expect(screen.getByTestId("budget-spent")).not.toHaveTextContent("unbekannte");
    expect(screen.getByTestId("budget-remaining")).toHaveTextContent("0,05");
    expect(screen.queryByTestId("budget-reserved")).toBeNull();
    expect(screen.getByTestId("budget-reason")).toHaveTextContent("Das Limit ist aufgebraucht");
    expect(screen.getByTestId("budget-block")).toHaveTextContent("Das Limit dieses Laufs blockiert. Eine Erhöhung ändert genau dieses Limit.");
    expect(screen.getByTestId("budget-blocked")).toHaveTextContent("claude-sonnet-4-5 · Texter · kann bis zu 0,40");
    expect(screen.getByTestId("budget-suggested")).toHaveTextContent(/2,35.*Minimum für die nächste Anfrage.*keine Prognose/);
    expect(screen.getByLabelText("Neues Gesamtlimit für diesen Lauf (USD)")).toHaveValue("2.35");
    expect(screen.getByTestId("budget-difference")).toHaveTextContent("+ 0,35");
    expect(screen.getByTestId("budget-scope-note")).toHaveTextContent("Gilt nur für diesen Lauf; der Workflow und die Einstellungen bleiben unverändert.");
    expect(screen.getByTestId("budget-scope-note")).toHaveTextContent("Chat-Nachrichten geben nie Budget frei.");
    expect(screen.getByTestId("budget-history")).toHaveTextContent(/1,00.*→.*2,00.*usr_anna/);
    expect(screen.getByTestId("budget-deadline")).toBeInTheDocument();
  });

  it("marks unknown costs and never shows them as 0", () => {
    const budget = runBudget({ remaining_usd: "0.05" }, { unknown_cost: true, spent_usd: "0.00", reserved_usd: "0.30" });
    render(wrap(<BudgetDecisionForm budget={budget} request={budget.pending!} />));
    expect(screen.getByTestId("budget-spent")).toHaveTextContent("plus unbekannte Kosten");
    expect(screen.getByTestId("budget-remaining")).toHaveTextContent("abzüglich der unbekannten Kosten");
    expect(screen.getByTestId("budget-reserved")).toHaveTextContent("0,30");
  });

  it("explains a request too large, an unbounded cost and the limit of a team", () => {
    const budget = runBudget(
      {},
      {
        reason: "request_too_large",
        spent_usd: "1.65",
        block: { scope: "team", run_id: "run_child", node_id: "lead", label: "Recherche" },
        requests: [{ run_id: "run_child", node_id: "a", agent: null, model: "gpt-x", max_cost_usd: null, bounded: false, price_quality: null }],
        suggested_limit_usd: null,
      },
    );
    render(wrap(<BudgetDecisionForm budget={budget} request={budget.pending!} />));
    expect(screen.getByTestId("budget-reason")).toHaveTextContent("übrig sind nur");
    expect(screen.getByText("Nächste Anfrage zu groß")).toBeInTheDocument();
    expect(screen.getByTestId("budget-block")).toHaveTextContent("Das eigene Limit des Teams „Recherche“ blockiert.");
    expect(screen.getByTestId("budget-blocked")).toHaveTextContent("ihre Kosten lassen sich vorab nicht begrenzen");
    expect(screen.getByTestId("budget-suggested")).toHaveTextContent("keins");
    // The run's own starting limit does not belong to a team's limit.
    expect(screen.queryByTestId("budget-initial")).toBeNull();
    expect(screen.getByLabelText("Neues Gesamtlimit für diesen Lauf (USD)")).toHaveValue("");
  });

  it("checks the value before sending and names the problem for screen readers", async () => {
    const fetch = serveDecisions(() => json(runBudget()));
    const budget = runBudget({ policy: { max_limit_usd: "5.00", can_decide: true, reason: null } });
    render(wrap(<BudgetDecisionForm budget={budget} request={budget.pending!} />));
    const input = screen.getByLabelText("Neues Gesamtlimit für diesen Lauf (USD)");
    await userEvent.clear(input);
    await userEvent.type(input, "1.50");
    expect(screen.getByRole("alert")).toHaveTextContent("höher sein als das aktuelle Limit");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain("budget-limit-bud_1-error");
    await userEvent.clear(input);
    await userEvent.type(input, "6");
    expect(screen.getByRole("alert")).toHaveTextContent("höchstens 5,00");
    await userEvent.click(screen.getByRole("button", { name: "Prüfen und fortsetzen" }));
    expect(decisionPosts(fetch)).toHaveLength(0);
  });

  it("raises to the new total once, with a stable idempotency key, even when clicked twice", async () => {
    let release: (value: Response) => void = () => undefined;
    const fetch = serveDecisions(() => new Promise<Response>((resolve) => (release = resolve)));
    const budget = runBudget();
    render(wrap(<BudgetDecisionForm budget={budget} request={budget.pending!} />));
    const button = screen.getByRole("button", { name: "Prüfen und fortsetzen" });
    await userEvent.click(button);
    await userEvent.click(button);
    await waitFor(() => expect(decisionPosts(fetch)).toHaveLength(1));
    const body = JSON.parse(String((decisionPosts(fetch)[0][1] as RequestInit).body));
    expect(body).toMatchObject({ request_id: "bud_1", action: "raise", limit_usd: "2.35" });
    expect(body.idempotency_key).toMatch(/:raise:2\.35$/);
    expect(button).toBeDisabled();
    await act(async () => release(json(runBudget({ limit_usd: "2.35" }, null))));
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(decisionPosts(fetch)).toHaveLength(1);
  });

  it("keeps the key of the card when the same decision is sent again after an error", async () => {
    let calls = 0;
    const fetch = serveDecisions(() => (++calls === 1 ? json({ detail: "boom", code: "network" }, 500) : json(runBudget({}, null))));
    const budget = runBudget();
    render(wrap(<BudgetDecisionForm budget={budget} request={budget.pending!} />));
    const button = screen.getByRole("button", { name: "Prüfen und fortsetzen" });
    await userEvent.click(button);
    await waitFor(() => expect(button).not.toBeDisabled());
    await userEvent.click(button);
    await waitFor(() => expect(decisionPosts(fetch)).toHaveLength(2));
    const keys = decisionPosts(fetch).map(([, init]) => JSON.parse(String((init as RequestInit).body)).idempotency_key);
    expect(keys[0]).toBe(keys[1]);
  });

  it("ends the run only after the confirmation", async () => {
    const fetch = serveDecisions(() => json(runBudget({}, null)));
    const budget = runBudget();
    render(wrap(<BudgetDecisionForm budget={budget} request={budget.pending!} />));
    await userEvent.click(screen.getByRole("button", { name: "Lauf beenden" }));
    expect(decisionPosts(fetch)).toHaveLength(0);
    const confirm = screen.getByRole("button", { name: "Lauf wirklich beenden?" });
    expect(confirm).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Lauf beenden" })).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "Lauf beenden" }));
    await userEvent.click(screen.getByRole("button", { name: "Lauf wirklich beenden?" }));
    await waitFor(() => expect(decisionPosts(fetch)).toHaveLength(1));
    expect(JSON.parse(String((decisionPosts(fetch)[0][1] as RequestInit).body))).toMatchObject({ request_id: "bud_1", action: "end" });
  });

  it("says who decided when the server answers that the decision is no longer open", async () => {
    serveDecisions(() =>
      json({ detail: "not pending", code: "budget.not_pending", params: { request_status: "raised", decided_by: "usr_ben" } }, 409),
    );
    const budget = runBudget();
    render(wrap(<BudgetDecisionForm budget={budget} request={budget.pending!} />));
    await userEvent.click(screen.getByRole("button", { name: "Prüfen und fortsetzen" }));
    expect(await screen.findByTestId("budget-conflict")).toHaveTextContent("usr_ben hat bereits entschieden: Limit erhöht.");
    expect(screen.queryByRole("button", { name: "Prüfen und fortsetzen" })).toBeNull();
  });

  it.each([
    ["budget.limit_not_higher", 422, "Das neue Limit muss höher sein als das aktuelle Limit."],
    ["budget.limit_invalid", 422, "kein gültiger Betrag"],
    ["budget.over_policy", 403, "Höchstwert von 5.00 USD"],
    ["access.forbidden", 403, "Berechtigung"],
  ])("explains the server's refusal %s", async (code, status, text) => {
    serveDecisions(() => json({ detail: "refused", code, params: { max_limit_usd: "5.00", permission: "run" } }, status));
    const budget = runBudget();
    render(wrap(<BudgetDecisionForm budget={budget} request={budget.pending!} />));
    await userEvent.click(screen.getByRole("button", { name: "Prüfen und fortsetzen" }));
    expect(await screen.findByText(text, { exact: false })).toBeInTheDocument();
  });

  it("explains instead of offering buttons when the person may not decide", () => {
    const budget = runBudget({ policy: { max_limit_usd: null, can_decide: false, reason: "access.forbidden" } });
    render(wrap(<BudgetDecisionForm budget={budget} request={budget.pending!} />));
    expect(screen.getByTestId("budget-cannot-decide")).toHaveTextContent("Du kannst diese Entscheidung sehen, aber nicht treffen");
    expect(screen.queryByRole("button", { name: "Prüfen und fortsetzen" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Lauf beenden" })).toBeNull();
    expect(screen.queryByLabelText("Neues Gesamtlimit für diesen Lauf (USD)")).toBeNull();
  });

  it("cannot be decided once the deadline passed", () => {
    const budget = runBudget({}, { deadline: new Date(Date.now() - 60_000).toISOString() });
    render(wrap(<BudgetDecisionForm budget={budget} request={budget.pending!} />));
    expect(screen.getByTestId("budget-deadline")).toHaveTextContent("Die Frist ist abgelaufen");
    expect(screen.queryByRole("button", { name: "Prüfen und fortsetzen" })).toBeNull();
  });

  it("gives every fact a help button with an accessible name", () => {
    const budget = runBudget({}, { reserved_usd: "0.10" });
    render(wrap(<BudgetDecisionForm budget={budget} request={budget.pending!} />));
    for (const label of ["Limit beim Start", "Aktuelles Limit", "Bekannte Kosten", "Übrig", "Reserviert für laufende Anfragen", "Entscheiden bis"])
      expect(screen.getByRole("button", { name: new RegExp(`${label}`) })).toBeInTheDocument();
  });
});

describe("RunBudgetDecision", () => {
  const run = (pending: string | null): Pick<Run, "id" | "status" | "budget" | "parent_run_id"> => ({
    id: "run_1",
    status: "paused",
    parent_run_id: null,
    budget: { source: "workflow", initial_limit_usd: "1.00", limit_usd: "2.00", raises: [], pending_request_id: pending },
  });

  it("reads the decision from the API, so it is found again after leaving and returning", async () => {
    serve((url) => (url.endsWith("/runs/run_1/budget") ? json(runBudget()) : url === "/api/meta" ? json({ profile: "desktop" }) : json([])));
    render(wrap(<RunBudgetDecision run={run("bud_1")} />));
    expect(await screen.findByTestId("budget-decision")).toHaveAttribute("data-request", "bud_1");
  });

  it("reads nothing for a run without a pending decision", () => {
    const fetch = serve(() => json([]));
    const { container } = render(wrap(<RunBudgetDecision run={run(null)} />));
    expect(container).toBeEmptyDOMElement();
    expect(fetch.mock.calls.some(([url]) => String(url).endsWith("/budget"))).toBe(false);
  });

  it("says that someone else decided once the decision it showed is gone", async () => {
    let decided = false;
    serve((url) => {
      if (url === "/api/meta") return json({ profile: "desktop" });
      if (!url.endsWith("/runs/run_1/budget")) return json([]);
      return json(
        decided
          ? runBudget({ history: [budgetRequest({ status: "raised", decided_by: "usr_ben", new_limit_usd: "3.00" })] }, null)
          : runBudget(),
      );
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <RunBudgetDecision run={run("bud_1")} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await screen.findByTestId("budget-decision");
    decided = true;
    view.rerender(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <RunBudgetDecision run={{ ...run(null), status: "running" }} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId("budget-decided-elsewhere")).toHaveTextContent("usr_ben hat bereits entschieden: Limit erhöht.");
  });
});
