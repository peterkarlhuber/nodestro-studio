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

const provider = (id: string, configured: boolean) => ({ id, label: id, configured, key_source: configured ? "settings" : "none" });

/** Settings with Anthropic as the provider of the default model, set up or not. */
const settings = (configured: boolean) => ({
  providers: [provider("anthropic", configured), provider("openai", false)],
  default_provider: "anthropic",
  default_model: "anthropic:claude-sonnet-5-5",
  assistant_model: "anthropic:claude-opus-5-5",
});

/** The studio API as far as the page needs it: the workflow list, every other list is empty unless given. */
function stubApi(workflows: unknown[], extra: { configured?: boolean; runs?: unknown[]; approvals?: unknown[] } = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const path = url.replace(/\?.*$/, "");
      const body = path.endsWith("/workflows")
        ? workflows
        : path.endsWith("/organize")
          ? { items: {}, tags: [] }
          : path.endsWith("/settings")
            ? settings(extra.configured ?? true)
            : path.endsWith("/runs")
              ? (extra.runs ?? [])
              : path.endsWith("/approvals")
                ? (extra.approvals ?? [])
                : [];
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

describe("WorkflowsPage without a model connection", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("says that a model is needed, links to Settings and puts the example first", async () => {
    stubApi([], { configured: false });
    show();
    const note = await screen.findByTestId("model-needed");
    expect(within(note).getByRole("link")).toHaveAttribute("href", "/settings");
    const group = await choices();
    const first = group.firstElementChild as HTMLElement;
    expect(first).toHaveAttribute("href", "/workflows/examples");
    expect(within(group).getByRole("button", { name: /Mit KI erstellen/ })).toHaveTextContent("Braucht eine Verbindung zu einem KI-Modell");
  });

  it("warns in the AI dialog before a goal is typed", async () => {
    stubApi([], { configured: false });
    show();
    await screen.findByTestId("model-needed");
    await userEvent.click(within(await choices()).getByRole("button", { name: /Mit KI erstellen/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByTestId("model-needed")).toHaveTextContent("Workflow-Architekt");
    expect(within(dialog).getByRole("link", { name: "In den Einstellungen einrichten" })).toHaveAttribute("href", "/settings");
  });

  it("shows no model note once the provider is set up", async () => {
    stubApi([]);
    show();
    await choices();
    expect(screen.queryByTestId("model-needed")).toBeNull();
    expect((await choices()).firstElementChild).toHaveTextContent("Mit KI erstellen");
  });
});

describe("WorkflowsPage for returning users", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const run = (id: string, status: string, created: string) => ({
    id,
    workflow_id: "wf_1",
    workflow_name: "Antworten",
    status,
    created_at: created,
    imported_at: null,
  });

  it("shows recent runs and waiting approvals under Continue", async () => {
    stubApi([WORKFLOW], {
      runs: [run("run_old", "succeeded", "2026-10-30T10:00:00Z"), run("run_new", "failed", "2026-10-31T10:00:00Z")],
      approvals: [{ run_id: "run_new", workflow_name: "Antworten", label: "Freigabe Text", node_id: "n" }],
    });
    show();
    const area = await screen.findByTestId("continue");
    const runs = await within(area).findByTestId("continue-runs");
    const links = within(runs).getAllByRole("link").filter((link) => link.getAttribute("href")?.startsWith("/executions/"));
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/executions/run_new", "/executions/run_old"]);
    expect(within(area).getByTestId("continue-approvals")).toHaveAttribute("href", "/approvals");
    expect(within(area).getByTestId("continue-approvals")).toHaveTextContent("1 Freigabe wartet auf dich");
  });

  it("shows no Continue area without runs or approvals", async () => {
    stubApi([WORKFLOW]);
    show();
    await screen.findByRole("navigation", { name: "Neu beginnen" });
    expect(screen.queryByTestId("continue")).toBeNull();
  });

  it("folds the example gallery once there are workflows", async () => {
    stubApi([WORKFLOW]);
    const { container } = show();
    await screen.findByRole("navigation", { name: "Neu beginnen" });
    const section = container.querySelector("details[data-section='example-gallery']");
    expect(section).not.toBeNull();
    expect(section).not.toHaveAttribute("open");
  });

  it("groups teams below the own workflows and marks them", async () => {
    stubApi([WORKFLOW, { ...WORKFLOW, id: "wf_team", name: "Claims team", capabilities: ["claims"], contract: ["notice"] }]);
    const { container } = show();
    await screen.findByText("Claims team");
    const teams = container.querySelector("details[data-section='workflow-teams']") as HTMLElement;
    expect(teams).not.toBeNull();
    expect(within(teams).getByText("Claims team")).toBeInTheDocument();
    expect(within(teams).getByText("Team")).toBeInTheDocument();
    expect(container.querySelector(".page__body > .card-grid")).toHaveTextContent("Antworten");
    expect(container.querySelector(".page__body > .card-grid")).not.toHaveTextContent("Claims team");
  });
});
