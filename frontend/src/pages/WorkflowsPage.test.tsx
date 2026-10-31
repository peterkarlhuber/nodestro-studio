import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WorkflowsPage } from "./WorkflowsPage";

const WORKFLOW = {
  id: "wf_1",
  name: "Antworten",
  description: "",
  agents: 1,
  updated_at: "2026-10-31T10:00:00Z",
  last_run_status: null,
};

/** The studio API as far as the page needs it: the workflow list, every other list is empty. */
function stubApi(workflows: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const path = url.replace(/\?.*$/, "");
      const body = path.endsWith("/workflows") ? workflows : path.endsWith("/organize") ? { items: {}, tags: [] } : [];
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
}

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <WorkflowsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const choices = () => screen.findByRole("group", { name: "Neu beginnen" });

describe("WorkflowsPage start choices", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("offers the three ways to start in the empty state", async () => {
    stubApi([]);
    show();
    const group = await choices();
    expect(within(group).getByRole("button", { name: /Mit KI erstellen/ })).toBeInTheDocument();
    expect(within(group).getByRole("link", { name: /Mit einem Beispiel beginnen/ })).toHaveAttribute("href", "/workflows/examples");
    expect(within(group).getByRole("button", { name: /Selbst aufbauen/ })).toBeInTheDocument();
  });

  it("opens the new-workflow dialog in the mode that was picked", async () => {
    stubApi([]);
    show();
    await userEvent.click(within(await choices()).getByRole("button", { name: /Mit KI erstellen/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("radio", { name: "Mit KI erstellen" })).toHaveAttribute("aria-checked", "true");
    await userEvent.click(within(dialog).getByRole("button", { name: "Abbrechen" }));
    await userEvent.click(within(await choices()).getByRole("button", { name: /Selbst aufbauen/ }));
    expect(within(await screen.findByRole("dialog")).getByRole("radio", { name: "Manuell" })).toHaveAttribute("aria-checked", "true");
  });

  it("shows a compact row instead of the tiles above existing workflows", async () => {
    stubApi([WORKFLOW]);
    show();
    const row = await screen.findByRole("navigation", { name: "Neu beginnen" });
    expect(within(row).getAllByRole("button")).toHaveLength(2);
    expect(within(row).getByRole("link", { name: /Mit einem Beispiel beginnen/ })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Neu beginnen" })).toBeNull();
    expect(screen.getByRole("button", { name: "Neuer Workflow" })).toBeInTheDocument(); // the header action stays
  });
});
