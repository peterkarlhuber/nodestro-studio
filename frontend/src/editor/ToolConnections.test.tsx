import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AgentConfig } from "../api/types";
import { defaultAgent } from "../lib/defaults";
import { AgentForm } from "./AgentInspector";
import { paramValue } from "./ToolBindings";
import { useAgentSections } from "./sectionState";

vi.mock("../components/CodeEditor", () => ({ CodeEditor: () => null }));

const spec = (id: string, connection_type: string | null) => ({
  id,
  version: 1,
  ref: `${id}@1`,
  category: connection_type ? "communication" : "compute",
  capability: { access: "read", reach: connection_type ? "external" : "internal", source: "nodestro" },
  network: connection_type ? "external" : "none",
  offline: !connection_type,
  connection_type,
  params_schema: {},
  cost_unit: null,
  modes: ["desktop"],
  timeout_seconds: 30,
  max_calls_per_run: null,
  i18n_key: `tools.builtin.${id}`,
});

const HOSTS = { type: "array", items: { type: "string", minLength: 1, maxLength: 253 }, maxItems: 100 };
// The binding parameters of the runtime's SEARCH_WEB_SPEC and FETCH_WEB_PAGE_SPEC (NAL-A2).
const SEARCH_PARAMS = {
  type: "object",
  additionalProperties: false,
  properties: {
    max_results: { type: "integer", minimum: 1, maximum: 20 },
    region: { type: "string", pattern: "^[A-Za-z]{2}$" },
    language: { type: "string", pattern: "^[A-Za-z]{2}$" },
    time_range: { enum: ["day", "week", "month", "year"] },
    allow_hosts: HOSTS,
    deny_hosts: HOSTS,
    max_calls: { type: "integer", minimum: 1, maximum: 10 },
  },
};
const FETCH_PARAMS = {
  type: "object",
  additionalProperties: false,
  properties: {
    allow_hosts: HOSTS,
    deny_hosts: HOSTS,
    max_chars: { type: "integer", minimum: 500, maximum: 50000 },
    max_calls: { type: "integer", minimum: 1, maximum: 20 },
  },
};
const web = (id: string, connection_type: string | null, params_schema: unknown) => ({
  ...spec(id, connection_type),
  category: "web",
  network: "external",
  offline: false,
  params_schema,
});

const CATALOG = [
  { name: "calculator", description: "", origin: "nodestro", spec: spec("calculator", null) },
  { name: "send_mail", description: "", origin: "integration", spec: spec("send_mail", "smtp") },
  { name: "search_web", description: "", origin: "nodestro", spec: web("search_web", "search", SEARCH_PARAMS) },
  { name: "fetch_web_page", description: "", origin: "nodestro", spec: web("fetch_web_page", null, FETCH_PARAMS) },
];

const connection = (id: string, type: string, name: string) => ({ id, type, name, provider: "generic", check: { status: "ok" } });
const CONNECTIONS = [
  connection("conn_mail", "smtp", "Office mail"),
  connection("conn_hook", "webhook", "Alerts hook"),
  connection("conn_search", "search", "Brave"),
];

function stubApi(connections: unknown[] = CONNECTIONS) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const path = url.replace(/\?.*$/, "");
      const body = path.endsWith("/tools/builtin")
        ? CATALOG
        : path.endsWith("/api/connections")
          ? connections
          : path.endsWith("/meta")
            ? { providers: [], capabilities: [], models: [] }
            : path.endsWith("/settings")
              ? { providers: [], default_model: "claude-sonnet-5-5", assistant_model: "claude-opus-5-5" }
              : [];
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
}

function show(agent: AgentConfig, onChange: (patch: Partial<AgentConfig>) => void) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <AgentForm agent={agent} onChange={onChange} onReplace={() => undefined} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("connection picker of a built-in tool", () => {
  beforeEach(() => {
    localStorage.clear();
    useAgentSections.setState({ open: {} });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("offers the connections of the tool's type and writes tool_settings", async () => {
    stubApi();
    const onChange = vi.fn();
    show({ ...defaultAgent(), tools: ["calculator", "send_mail"] }, onChange);
    const pickers = within(await screen.findByTestId("tool-connections"));
    // Only send_mail needs a connection, and only smtp connections are offered.
    const select = pickers.getByLabelText("Verbindung für send_mail");
    expect(pickers.queryByLabelText("Verbindung für calculator")).not.toBeInTheDocument();
    await within(select).findByRole("option", { name: "Office mail" });
    expect(within(select).getAllByRole("option").map((option) => option.textContent)).toEqual(["Keine Verbindung gewählt", "Office mail"]);
    await userEvent.selectOptions(select, "conn_mail");
    expect(onChange).toHaveBeenLastCalledWith({ tool_settings: { send_mail: { connection_id: "conn_mail", params: {} } } });
  });

  it("points to the Tools page when no connection of the type exists, and drops the binding with the tool", async () => {
    stubApi([]);
    const onChange = vi.fn();
    show(
      { ...defaultAgent(), tools: ["send_mail"], tool_settings: { send_mail: { connection_id: "conn_gone", params: {} } } },
      onChange,
    );
    const pickers = within(await screen.findByTestId("tool-connections"));
    const link = await pickers.findByRole("link", { name: "Tools → Verbindungen" });
    expect(link).toHaveAttribute("href", "/tools?tab=connections");
    await userEvent.click(screen.getByRole("button", { name: /send_mail.*entfernen/i }));
    expect(onChange).toHaveBeenLastCalledWith({ tools: [], tool_settings: {} });
  });
});

describe("web tools in the inspector (NAL-A2)", () => {
  beforeEach(() => {
    localStorage.clear();
    useAgentSections.setState({ open: {} });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("marks both web tools with the Internet badge; only search_web picks a connection", async () => {
    stubApi();
    show({ ...defaultAgent(), tools: ["search_web", "fetch_web_page"] }, vi.fn());
    const search = within(await screen.findByTestId("tool-binding-search_web"));
    const fetch = within(screen.getByTestId("tool-binding-fetch_web_page"));
    expect(search.getByText("Mit Internet")).toBeInTheDocument();
    expect(fetch.getByText("Mit Internet")).toBeInTheDocument();
    const select = search.getByLabelText("Verbindung für search_web");
    await within(select).findByRole("option", { name: "Brave" });
    expect(within(select).getAllByRole("option").map((option) => option.textContent)).toEqual(["Keine Verbindung gewählt", "Brave"]);
    expect(fetch.queryByLabelText(/Verbindung für/)).not.toBeInTheDocument();
  });

  it("writes valid search_web parameters and keeps the connection", async () => {
    stubApi();
    const onChange = vi.fn();
    const base = { ...defaultAgent(), tools: ["search_web"], tool_settings: { search_web: { connection_id: "conn_search", params: {} } } };
    show(base, onChange);
    const params = within(await screen.findByTestId("tool-params-search_web"));
    await userEvent.type(params.getByLabelText("Höchstens Treffer pro Suche"), "5");
    expect(onChange).toHaveBeenLastCalledWith({ tool_settings: { search_web: { connection_id: "conn_search", params: { max_results: 5 } } } });
    await userEvent.selectOptions(params.getByLabelText("Zeitraum"), "week");
    expect(onChange).toHaveBeenLastCalledWith({ tool_settings: { search_web: { connection_id: "conn_search", params: { time_range: "week" } } } });
    await userEvent.type(params.getByLabelText("Gesperrte Domains"), "spam.example, ads.example");
    expect(onChange).toHaveBeenLastCalledWith({
      tool_settings: { search_web: { connection_id: "conn_search", params: { deny_hosts: ["spam.example", "ads.example"] } } },
    });
  });

  it("does not write a value the schema refuses", async () => {
    stubApi();
    const onChange = vi.fn();
    show({ ...defaultAgent(), tools: ["fetch_web_page"] }, onChange);
    const params = within(await screen.findByTestId("tool-params-fetch_web_page"));
    await userEvent.type(params.getByLabelText("Höchstens Zeichen pro Seite"), "100");
    // 1, 10 and 100 are below the minimum of 500: nothing is written, and the field says so.
    expect(onChange).not.toHaveBeenCalled();
    expect(params.getByText("Kein gültiger Wert; er wird nicht gespeichert.")).toBeInTheDocument();
    await userEvent.type(params.getByLabelText("Höchstens Zeichen pro Seite"), "0");
    expect(onChange).toHaveBeenLastCalledWith({ tool_settings: { fetch_web_page: { connection_id: null, params: { max_chars: 1000 } } } });
  });

  it("checks values against the params schema", () => {
    const { properties } = SEARCH_PARAMS;
    expect(paramValue(properties.max_results, "21")).toBeNull();
    expect(paramValue(properties.max_results, "2.5")).toBeNull();
    expect(paramValue(properties.max_results, "")).toBeUndefined();
    expect(paramValue(properties.region, "AT")).toBe("AT");
    expect(paramValue(properties.region, "AUT")).toBeNull();
    expect(paramValue(properties.time_range, "decade")).toBeNull();
    expect(paramValue(properties.allow_hosts, "a.example\nb.example")).toEqual(["a.example", "b.example"]);
  });
});
