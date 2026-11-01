import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ExampleDetail } from "../api/types";
import i18n from "../i18n";
import { problemText } from "../lib/errors";
import { ExampleCard } from "./ExampleCard";
import { ExamplePreview } from "./ExamplePreview";
import { OFFLINE, copyRequest } from "./examples";

// The read-only canvas needs a real layout; the preview's other parts are what these tests look at.
vi.mock("@xyflow/react", async (original) => ({
  ...(await original<typeof import("@xyflow/react")>()),
  ReactFlow: () => <div data-testid="graph" />,
}));

const agent = {
  role: null,
  model: "anthropic:claude-sonnet-5-5",
  tools: [],
  structured: false,
  judge: false,
  receives: ["Start"],
  kind: "agent" as const,
  knowledge: [],
  integrations: [],
  memory: false,
};

const EXAMPLE: ExampleDetail = {
  id: "supplier-comparison",
  number: 3,
  language: "de",
  category: "industry",
  field: "Einkauf",
  name: "Lieferantenangebote vergleichen",
  description: "Vergleicht Angebote.",
  level: "advanced",
  pattern: "adaptive",
  featured: true,
  sensitive: false,
  agents: 2,
  features: ["orchestrator", "integration", "knowledge", "budget"],
  tools: [],
  teams: 1,
  guide: {
    problem: "Problem",
    flow: "Ablauf",
    input: "Eingabe",
    result: "Ergebnis",
    adapt: "Anpassen",
    control: "Der Orchestrator entscheidet, eine Person gibt frei.",
    why: "Weil die Aufgabe offen ist.",
  },
  agent_details: [
    { ...agent, node_id: "lead", name: "Einkaufsleitung", description: "Verteilt die Arbeit.", kind: "orchestrator" },
    {
      ...agent,
      node_id: "risk",
      name: "Risikoanalyse",
      description: "Prüft Lieferanten.",
      knowledge: ["Einkaufsrichtlinie"],
      integrations: ["ERP-System"],
      memory: true,
    },
  ],
  input: "Testaufgabe",
  workflow: { name: "x", description: "", nodes: [], edges: [] } as unknown as ExampleDetail["workflow"],
  samples: [],
  tests: ["Normalfall"],
  team_details: [
    {
      part_id: "quality-check",
      name: "Qualitätsprüfung",
      description: "Prüft Qualitätsdaten.",
      capabilities: ["Audit", "PPM"],
      agents: [{ ...agent, node_id: "qa", name: "Qualitätsprüfer", description: "" }],
      approval: true,
      contract: ["Befund"],
      parameters: ["Lieferant"],
    },
  ],
  integrations: [
    {
      id: "erp",
      kind: "mcp",
      name: "ERP-System",
      description: "Lesender Zugriff auf Lieferantendaten.",
      setup: "Server hinzufügen und Tools freigeben.",
      tools: ["list_suppliers", "supplier_scorecard"],
      offline: "Offline-Modus: Es ist kein ERP-System verbunden.",
    },
  ],
  knowledge: [{ id: "policy", name: "Einkaufsrichtlinie", description: "Regeln für den Einkauf." }],
  budget_usd: 2,
};

const SERVER = { id: "mcp_1", name: "ERP", enabled: true };

type Route = (method: string, url: string, body: unknown) => unknown;

function serve(route: Route) {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const answer = route(init?.method ?? "GET", url, body);
    if (answer instanceof Response) return answer;
    return new Response(JSON.stringify(answer), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

const routes =
  (servers: unknown[], copy: (body: unknown) => unknown = () => ({ id: "wf_1", name: "Kopie" })): Route =>
  (method, url, body) => {
    if (url.startsWith("/api/library/supplier-comparison/copy")) return copy(body);
    if (url.startsWith("/api/library/supplier-comparison")) return EXAMPLE;
    if (url === "/api/mcp/servers") return servers;
    if (url === "/api/meta") return { models: [] };
    if (url === "/api/workflows") return [];
    throw new Error(`unexpected ${method} ${url}`);
  };

const renderPreview = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ExamplePreview id="supplier-comparison" onClose={() => undefined} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("copyRequest", () => {
  it("sends no connection and keeps the test series in offline mode", () => {
    expect(copyRequest(EXAMPLE, "de", true, {})).toEqual({ language: "de", tests: true });
    expect(copyRequest(EXAMPLE, "de", true, { erp: OFFLINE })).toEqual({ language: "de", tests: true });
  });

  it("sends the chosen server and never the test series with it", () => {
    expect(copyRequest(EXAMPLE, "en", true, { erp: "mcp_1" })).toEqual({
      language: "en",
      tests: false,
      integrations: { erp: "mcp_1" },
    });
  });

  it("drops integrations the example does not have and asks for tests only when there are some", () => {
    expect(copyRequest({ ...EXAMPLE, tests: [] }, "de", true, { other: "mcp_1" })).toEqual({ language: "de", tests: false });
  });
});

describe("example library errors", () => {
  it("are explained from their code although errors.library is the agent library's sentence", () => {
    expect(problemText(i18n.t, { code: "library.integration_unknown", params: { integration: "crm" } })).toBe(
      "Das Beispiel hat keine Verbindung „crm“. Lade die Seite neu und versuche es noch einmal.",
    );
    expect(problemText(i18n.t, { code: "library.tests_need_offline" })).toMatch(/^Testreihen laufen ohne Person/);
  });
});

describe("ExampleCard", () => {
  it("shows the adaptive pattern, the teams and the new building blocks", () => {
    render(
      <MemoryRouter>
        <ExampleCard example={EXAMPLE} onOpen={() => undefined} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Adaptiv")).toBeInTheDocument();
    expect(screen.getByText(/1 Team\b/)).toBeInTheDocument();
    expect(screen.getByText("Orchestrator")).toBeInTheDocument();
    expect(screen.getByText("Optionale Verbindung")).toBeInTheDocument();
  });
});

describe("ExamplePreview", () => {
  it("explains control, architecture, teams, knowledge and the optional connection", async () => {
    serve(routes([SERVER]));
    renderPreview();
    const preview = await screen.findByTestId("example-preview");
    expect(within(preview).getAllByText("Adaptiv").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Wer entscheidet was" })).toBeInTheDocument();
    expect(screen.getByText("Der Orchestrator entscheidet, eine Person gibt frei.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Warum diese Architektur" })).toBeInTheDocument();
    expect(screen.getByText(/Budget pro Ausführung/)).toBeInTheDocument();

    // The orchestrator is marked as such.
    const lead = screen.getByText("Einkaufsleitung").closest("li")!;
    expect(within(lead).getByText("Orchestrator")).toBeInTheDocument();

    const team = screen.getByTestId("example-team-quality-check");
    expect(within(team).getByText("Qualitätsprüfung")).toBeInTheDocument();
    expect(within(team).getByText("Hält für eine Freigabe an")).toBeInTheDocument();
    expect(within(team).getByText("Audit")).toBeInTheDocument();
    expect(within(team).getByText(/Lieferant/)).toBeInTheDocument();

    expect(within(screen.getByTestId("example-knowledge")).getByText("Einkaufsrichtlinie")).toBeInTheDocument();
    expect(screen.getByText(/in deiner Wissensbasis angelegt/)).toBeInTheDocument();

    const box = screen.getByTestId("example-integration-erp");
    expect(within(box).getByText("ERP-System")).toBeInTheDocument();
    expect(within(box).getByText(/list_suppliers, supplier_scorecard/)).toBeInTheDocument();
    expect(within(box).getByText("Server hinzufügen und Tools freigeben.")).toBeInTheDocument();
    expect(within(box).getByText("Offline-Modus: Es ist kein ERP-System verbunden.")).toBeInTheDocument();
    // Offline is the default.
    expect(await within(box).findByRole("option", { name: "MCP-Server: ERP" })).toBeInTheDocument();
    expect(within(box).getByRole("combobox")).toHaveValue(OFFLINE);
  });

  it("copies offline with the test series by default", async () => {
    const fetch = serve(routes([SERVER]));
    renderPreview();
    await screen.findByTestId("example-preview");
    await userEvent.click(screen.getByRole("button", { name: "Als Kopie übernehmen" }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith("/api/library/supplier-comparison/copy", expect.objectContaining({ method: "POST" })),
    );
    const call = fetch.mock.calls.find(([url]) => url === "/api/library/supplier-comparison/copy")!;
    expect(JSON.parse(String(call[1]!.body))).toEqual({ language: "de", tests: true });
  });

  it("connects a chosen server and switches the test series off with a reason", async () => {
    const fetch = serve(routes([SERVER, { id: "mcp_2", name: "Aus", enabled: false }]));
    renderPreview();
    const box = await screen.findByTestId("example-integration-erp");
    await within(box).findByRole("option", { name: "MCP-Server: ERP" });
    // Disabled servers are not offered.
    expect(within(box).queryByRole("option", { name: "MCP-Server: Aus" })).toBeNull();
    await userEvent.selectOptions(within(box).getByRole("combobox"), "mcp_1");

    const toggle = screen.getByRole("switch");
    expect(toggle).toBeDisabled();
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText(/Mit Verbindung nicht möglich/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Als Kopie übernehmen" }));
    await waitFor(() => expect(fetch.mock.calls.some(([url]) => url === "/api/library/supplier-comparison/copy")).toBe(true));
    const call = fetch.mock.calls.find(([url]) => url === "/api/library/supplier-comparison/copy")!;
    expect(JSON.parse(String(call[1]!.body))).toEqual({ language: "de", tests: false, integrations: { erp: "mcp_1" } });
  });

  it("shows why the server cannot serve the connection", async () => {
    serve(
      routes([SERVER], () =>
        new Response(
          JSON.stringify({
            detail: "the server cannot serve the integration erp",
            code: "library.integration_unavailable",
            params: { integration: "erp", server: "mcp_1", missing: "supplier_scorecard", not_read_only: "" },
          }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    renderPreview();
    const box = await screen.findByTestId("example-integration-erp");
    await within(box).findByRole("option", { name: "MCP-Server: ERP" });
    await userEvent.selectOptions(within(box).getByRole("combobox"), "mcp_1");
    await userEvent.click(screen.getByRole("button", { name: "Als Kopie übernehmen" }));
    const alert = await within(box).findByRole("alert");
    expect(alert).toHaveTextContent("Der gewählte MCP-Server kann diese Verbindung nicht bedienen");
    expect(alert).toHaveTextContent("Fehlt oder nicht freigegeben: supplier_scorecard");
    expect(alert).not.toHaveTextContent("Nicht als nur lesend freigegeben");
  });

  it("points to the connected services when no MCP server is set up", async () => {
    serve(routes([]));
    renderPreview();
    const link = await screen.findByRole("link", { name: "Verbundene Dienste einrichten" });
    expect(link).toHaveAttribute("href", "/tools?tab=services");
    expect(screen.getByText(/noch kein MCP-Server eingerichtet/)).toBeInTheDocument();
    expect(within(screen.getByTestId("example-integration-erp")).getByRole("combobox")).toBeDisabled();
  });
});
