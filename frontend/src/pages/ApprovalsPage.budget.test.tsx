import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { budgetRequest, runBudget } from "../test/budgetFixtures";
import { ApprovalsPage } from "./ApprovalsPage";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("the Approvals page lists budget decisions (BUDGET-1)", () => {
  it("shows a section with each pending decision and a link to its run", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.startsWith("/api/budget-requests")) return json([budgetRequest(), budgetRequest({ id: "bud_old", status: "raised" })]);
        if (url === "/api/runs/run_1/budget") return json(runBudget());
        if (url === "/api/meta") return json({ profile: "desktop" });
        if (url.startsWith("/api/tool-approvals/legacy")) return json({ enabled: false, stamped: false, legacy: [] });
        return json([]);
      }),
    );
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <ApprovalsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const section = await screen.findByTestId("approvals-budget");
    expect(within(section).getByRole("heading", { name: /Budget-Entscheidungen/ })).toBeInTheDocument();
    const card = await within(section).findByTestId("budget-decision");
    expect(within(card).getByTestId("budget-run-link")).toHaveAttribute("href", "/executions/run_1");
    expect(within(section).getAllByTestId("budget-decision")).toHaveLength(1);
    expect(screen.queryByText("Keine offenen Freigaben")).toBeNull();
  });
});
