import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ExampleDetail, ExampleSummary } from "../api/types";
import i18n from "../i18n";
import { ExamplesPage } from "../pages/ExamplesPage";
import { copiedModel } from "./ExampleNeeds";
import { byLevel, easiestFirst, filterExamples, startHere, startHereFirst } from "./examples";

// The read-only canvas needs a real layout.
vi.mock("@xyflow/react", async (original) => ({
  ...(await original<typeof import("@xyflow/react")>()),
  ReactFlow: () => <div data-testid="graph" />,
}));

const summary = (id: string, number: number, extra: Partial<ExampleSummary> = {}): ExampleSummary => ({
  id,
  number,
  language: "de",
  category: "business",
  field: "Feld",
  name: id,
  description: "",
  level: "advanced",
  pattern: "branching",
  featured: true,
  sensitive: false,
  agents: 2,
  features: [],
  tools: [],
  teams: 0,
  ...extra,
});

const DOWNTIME = summary("production-downtime", 1, { features: ["decision", "subworkflow", "files", "documents"] });
const BLOG = summary("blog-article", 6, { level: "beginner", pattern: "sequential", features: ["judge", "files"] });
const BUDGET = summary("household-budget", 14, { level: "beginner", pattern: "sequential", features: ["form", "documents"] });
const SERVICE = summary("customer-service", 8, {
  level: "beginner",
  features: ["approval", "integration", "knowledge"],
  tools: ["days_between"],
});
const ALL = [DOWNTIME, BLOG, BUDGET, SERVICE];

const labels = {
  category: (item: string) => i18n.t(`library.category.${item}`),
  level: (item: string) => i18n.t(`library.level.${item}`),
  pattern: (item: string) => i18n.t(`library.pattern.${item}`),
  feature: (item: string) => i18n.t(`library.feature.${item}`),
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("gallery search and order", () => {
  it("matches building blocks, levels and tools in the interface language", () => {
    const ids = (query: string, level: "beginner" | "advanced" | null = null) =>
      filterExamples(ALL, query, null, labels, level).map((item) => item.id);
    expect(ids("freigabe")).toEqual(["customer-service"]);
    expect(ids("Wissen")).toEqual(["customer-service"]);
    expect(ids("einsteiger")).toEqual(["blog-article", "household-budget", "customer-service"]);
    expect(ids("mcp")).toEqual(["customer-service"]);
    expect(ids("days_between")).toEqual(["customer-service"]);
    expect(ids("", "advanced")).toEqual(["production-downtime"]);
  });

  it("puts the easiest example first and recommends it", () => {
    expect(easiestFirst(ALL).map((item) => item.id)).toEqual([
      "blog-article",
      "household-budget",
      "customer-service",
      "production-downtime",
    ]);
    expect(startHere(ALL)).toBe("blog-article");
    expect(startHere([])).toBeNull();
  });

  it("begins the full gallery with the Start here example (F9)", () => {
    const shown = startHereFirst(byLevel(ALL), startHere(ALL));
    expect(shown[0].id).toBe("blog-article");
    expect(shown).toHaveLength(ALL.length);
    expect(startHereFirst(ALL, null)).toEqual(ALL);
  });
});

describe("copiedModel", () => {
  const models = [
    { id: "anthropic:claude-opus-5-5", tier: "Opus" },
    { id: "anthropic:claude-haiku-5-5", tier: "Haiku" },
  ] as never;
  it("keeps the example's models while the default model is Anthropic's", () => {
    const settings = { default_model: "anthropic:claude-sonnet-5-5", assistant_model: "anthropic:claude-opus-5-5" };
    expect(copiedModel("anthropic:claude-haiku-5-5", settings, models)).toBe("anthropic:claude-haiku-5-5");
  });
  it("uses the default model, and the assistant model of the same provider for the strong tier, otherwise", () => {
    const settings = { default_model: "openai:gpt-5.5", assistant_model: "openai:gpt-6.1-sol" };
    expect(copiedModel("anthropic:claude-haiku-5-5", settings, models)).toBe("openai:gpt-5.5");
    expect(copiedModel("anthropic:claude-opus-5-5", settings, models)).toBe("openai:gpt-6.1-sol");
    expect(copiedModel("anthropic:claude-opus-5-5", { ...settings, assistant_model: "anthropic:claude-opus-5-5" }, models)).toBe(
      "openai:gpt-5.5",
    );
  });
});

const agent = {
  node_id: "a",
  name: "Brief",
  description: "",
  role: null,
  model: "anthropic:claude-haiku-5-5",
  tools: [],
  structured: false,
  judge: false,
  receives: ["Start"],
  kind: "agent" as const,
  knowledge: [],
  integrations: [],
  memory: false,
};

const DETAIL: ExampleDetail = {
  ...SERVICE,
  guide: { problem: "", flow: "", input: "", result: "", adapt: "", control: "", why: "" },
  agent_details: [agent],
  input: "Aufgabe",
  workflow: { name: "x", description: "", nodes: [], edges: [] } as unknown as ExampleDetail["workflow"],
  samples: [{ id: "s", field: "f", field_label: "Datei", format: "pdf", file_name: "a.pdf", description: "" }],
  tests: [],
  team_details: [],
  integrations: [{ id: "crm", kind: "mcp", name: "CRM", description: "", setup: "", tools: [], offline: "" }],
  knowledge: [{ id: "k", name: "Richtlinie", description: "" }],
  budget_usd: null,
};

function serve(defaultModel: string, configured: string[]) {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    const path = url.replace(/\?.*$/, "");
    let body: unknown = [];
    if (path === "/api/library") body = ALL;
    else if (path.startsWith("/api/library/customer-service/copy")) body = { id: "wf_copy", name: "Kopie" };
    else if (path.startsWith("/api/library/")) body = DETAIL;
    else if (path === "/api/settings")
      body = {
        default_model: defaultModel,
        assistant_model: defaultModel,
        providers: ["anthropic", "openai"].map((id) => ({ id, label: id, configured: configured.includes(id) })),
      };
    else if (path === "/api/meta")
      body = {
        models: [
          { id: "anthropic:claude-haiku-5-5", provider: "anthropic", label: "Claude Haiku 5.5", tier: "Haiku", recommended: true },
          { id: "openai:gpt-5.5", provider: "openai", label: "GPT-5.5", tier: "GPT", recommended: true },
        ],
      };
    else if (path === "/api/mcp/servers") body = [];
    void init;
    return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function showGallery(entry: string) {
  const router = createMemoryRouter(
    [
      { path: "/workflows/examples", element: <ExamplesPage /> },
      { path: "/workflows/:id", element: <p>Editor</p> },
      { path: "/", element: <p>Start</p> },
    ],
    { initialEntries: ["/", entry], initialIndex: 1 },
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe("ExamplesPage", () => {
  it("keeps the search in the URL and closes the preview with Back", async () => {
    serve("anthropic:claude-sonnet-5-5", ["anthropic"]);
    const router = showGallery("/workflows/examples");
    await screen.findByTestId("example-blog-article");
    expect(within(screen.getByTestId("example-blog-article")).getByTestId("start-here")).toBeInTheDocument();
    await userEvent.type(screen.getByRole("searchbox"), "Freigabe");
    await waitFor(() => expect(router.state.location.search).toBe("?q=Freigabe"));
    expect(screen.queryByTestId("example-blog-article")).toBeNull();
    await userEvent.click(within(screen.getByTestId("example-customer-service")).getAllByRole("button")[0]!);
    await screen.findByTestId("example-preview");
    expect(router.state.location.search).toBe("?q=Freigabe&template=customer-service");
    await act(() => router.navigate(-1));
    await waitFor(() => expect(screen.queryByTestId("example-preview")).toBeNull());
    expect(router.state.location.search).toBe("?q=Freigabe");
    expect(screen.getByRole("searchbox")).toHaveValue("Freigabe");
  });

  it("filters by level from the URL", async () => {
    serve("anthropic:claude-sonnet-5-5", ["anthropic"]);
    showGallery("/workflows/examples?level=advanced");
    await screen.findByTestId("example-production-downtime");
    expect(screen.queryByTestId("example-blog-article")).toBeNull();
    expect(screen.getByRole("combobox", { name: "Niveau" })).toHaveValue("advanced");
  });

  it("replaces the preview with the editor, so Back returns to the gallery", async () => {
    serve("anthropic:claude-sonnet-5-5", ["anthropic"]);
    const router = showGallery("/workflows/examples?q=Freigabe");
    await userEvent.click(within(await screen.findByTestId("example-customer-service")).getAllByRole("button")[0]!);
    await userEvent.click(await screen.findByRole("button", { name: "Als Kopie übernehmen" }));
    await screen.findByText("Editor");
    await act(() => router.navigate(-1));
    await screen.findByTestId("example-customer-service");
    expect(router.state.location.search).toBe("?q=Freigabe");
    expect(screen.queryByTestId("example-preview")).toBeNull();
  });

  it("says what the example needs, with the provider that is missing", async () => {
    serve("anthropic:claude-sonnet-5-5", []);
    showGallery("/workflows/examples?template=customer-service");
    const needs = await screen.findByTestId("example-needs");
    const provider = await within(needs).findByTestId("example-needs-provider");
    expect(provider).toHaveTextContent("Claude Haiku 5.5");
    expect(provider).toHaveTextContent("Noch nicht eingerichtet.");
    expect(within(provider).getByRole("link", { name: "Einrichten" })).toHaveAttribute("href", "/settings");
    expect(within(needs).getByTestId("example-needs-approval")).toBeInTheDocument();
    expect(within(needs).getByTestId("example-needs-knowledge")).toHaveTextContent("1 Wissensdatei");
    expect(within(needs).getByTestId("example-needs-samples")).toHaveTextContent("1 Beispieldatei");
    expect(within(needs).getByTestId("example-needs-connection")).toHaveTextContent("CRM");
  });

  it("names the default models a copy gets with another provider", async () => {
    serve("openai:gpt-5.5", ["openai"]);
    showGallery("/workflows/examples?template=customer-service");
    const provider = await screen.findByTestId("example-needs-provider");
    await waitFor(() => expect(provider).toHaveTextContent("GPT-5.5"));
    expect(provider).toHaveTextContent("Eingerichtet.");
    expect(provider).not.toHaveTextContent("Claude");
  });
});
