// NAL-B2: an example whose built-in tools need a service connection (the web research example's `search`). The
// person chooses one of their connections or none; nothing is preselected (E-3), and the choice goes into the copy.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ExampleDetail } from "../api/types";
import i18n from "../i18n";
import { ExamplePreview } from "./ExamplePreview";
import { copyRequest } from "./examples";

vi.mock("@xyflow/react", async (original) => ({
  ...(await original<typeof import("@xyflow/react")>()),
  ReactFlow: () => <div data-testid="graph" />,
}));

const RESEARCH: ExampleDetail = {
  id: "web-research",
  number: 25,
  language: "en",
  category: "knowledge",
  field: "Research",
  name: "Web research",
  description: "Answers a question with sources.",
  level: "beginner",
  pattern: "sequential",
  featured: true,
  sensitive: false,
  agents: 1,
  features: ["structured", "budget"],
  tools: ["search_web", "fetch_web_page"],
  teams: 0,
  guide: { problem: "P", flow: "F", input: "I", result: "R", adapt: "A", control: "", why: "" },
  agent_details: [],
  input: "What changed?",
  workflow: { name: "x", description: "", nodes: [], edges: [] } as unknown as ExampleDetail["workflow"],
  samples: [],
  tests: ["Quick answer"],
  team_details: [],
  integrations: [],
  knowledge: [],
  budget_usd: 1,
  services: ["search"],
};

const SEARCH_TYPE = {
  name: "search",
  providers: ["brave", "test"],
  provider_modes: {},
  keyless_providers: ["test"],
  modes: ["desktop", "local-container", "server"],
  secret_required: true,
  secret_label: "API key",
  checkable: true,
  settings_schema: {},
};
const connection = (id: string, name: string, type = "search") => ({
  id,
  name,
  type,
  provider: "test",
  description: "",
  settings: {},
  secret_set: false,
  egress: [],
  check: { status: "unchecked" },
  contract: 1,
  created_at: "2026-11-14T00:00:00Z",
});

function serve(connections: unknown[], copied: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      let answer: unknown;
      if (url.startsWith("/api/library/web-research/copy")) {
        copied.push(body);
        answer = { id: "wf_1", name: "Web research" };
      } else if (url.startsWith("/api/library/web-research")) answer = RESEARCH;
      else if (url === "/api/connections") answer = connections;
      else if (url === "/api/connections/types") answer = [SEARCH_TYPE];
      else if (url === "/api/connections/status") answer = { mode: "desktop", secret_vault: true, contract: 1 };
      else if (url === "/api/meta") answer = { models: [] };
      else if (url === "/api/workflows") answer = [];
      else throw new Error(`unexpected ${method} ${url}`);
      return new Response(JSON.stringify(answer), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
}

const renderPreview = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ExamplePreview id="web-research" onClose={() => undefined} onCopied={() => undefined} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("service connections of an example (NAL-B2)", () => {
  it("puts only a chosen connection of a needed kind into the copy request", () => {
    expect(copyRequest(RESEARCH, "en", false, {}, {}, "", {})).toEqual({ language: "en", tests: false });
    expect(copyRequest(RESEARCH, "en", false, {}, {}, "", { search: "conn_1" })).toEqual({
      language: "en",
      tests: false,
      services: { search: "conn_1" },
    });
    expect(copyRequest(RESEARCH, "en", false, {}, {}, "", { smtp: "conn_2", search: "" })).toEqual({
      language: "en",
      tests: false,
    });
    expect(copyRequest({ ...RESEARCH, services: undefined }, "en", false, {}, {}, "", { search: "conn_1" })).toEqual({
      language: "en",
      tests: false,
    });
  });

  it("offers the person's search connections without a preselection and copies with the chosen one", async () => {
    await i18n.changeLanguage("en");
    const copied: unknown[] = [];
    serve([connection("conn_1", "My Brave"), connection("conn_2", "Team SearXNG"), connection("hook", "Hook", "webhook")], copied);
    renderPreview();
    const box = await screen.findByTestId("example-service-search");
    const select = within(box).getByRole("combobox");
    await waitFor(() => expect(within(select).getAllByRole("option").map((item) => item.textContent)).toContain("My Brave"));
    expect((select as HTMLSelectElement).value).toBe("");
    expect(within(select).queryByText("Hook")).toBeNull();
    expect(within(box).getByRole("button", { name: "Set up search service" })).toBeTruthy();
    await userEvent.selectOptions(select, "conn_2");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("library.copy") }));
    await waitFor(() => expect(copied).toHaveLength(1));
    expect(copied[0]).toMatchObject({ language: "en", services: { search: "conn_2" } });
  });

  it("copies without a connection when none is chosen and says how to add one", async () => {
    await i18n.changeLanguage("en");
    const copied: unknown[] = [];
    serve([], copied);
    renderPreview();
    const box = await screen.findByTestId("example-service-search");
    await within(box).findByText(/You have no .*connection yet/);
    await userEvent.click(screen.getByRole("button", { name: i18n.t("library.copy") }));
    await waitFor(() => expect(copied).toHaveLength(1));
    expect(copied[0]).not.toHaveProperty("services");
  });
});
