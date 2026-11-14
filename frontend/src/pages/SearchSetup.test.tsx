// "Set up search service" (NAL-A2): honest cards, no preselection, providers the mode does not offer are hidden,
// and the result is a normal search connection created through the connections API.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { type ConnectionTypeInfo, needsSecret, offersProvider } from "../api/connections";
import { offeredSearchProviders } from "./SearchSetup";
import { ConnectionsTab } from "./ToolsConnections";

const SEARCH: ConnectionTypeInfo = {
  name: "search",
  providers: ["test", "ddgs", "brave", "tavily", "mojeek", "searxng"],
  secret_required: true,
  secret_label: "api_key",
  settings_schema: {
    type: "object",
    properties: {
      endpoint: { anyOf: [{ type: "string" }, { type: "null" }], default: null },
      price_per_request_usd: { anyOf: [{ type: "number" }, { type: "string" }, { type: "null" }], default: null },
    },
  },
  modes: ["desktop", "local-container", "server"],
  checkable: true,
  keyless_providers: ["ddgs", "searxng"],
  provider_modes: { ddgs: ["desktop", "local-container"] },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const created = (body: Record<string, unknown>) => ({
  id: "conn_new",
  contract: 1,
  description: "",
  settings: {},
  egress: [],
  secret_set: false,
  secret_storage: "none",
  check: { status: "unchecked", checked_at: null, code: null, kind: null },
  created_at: "2026-11-14T10:00:00Z",
  updated_at: "2026-11-14T10:00:00Z",
  used_by: [],
  ...body,
});

function serve(mode: string) {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    if (url === "/api/meta" || url === "/api/auth/me") return json({ detail: "not here" }, 404);
    if (url === "/api/connections/status") return json({ secret_vault: true, mode, contract: 1 });
    if (url === "/api/connections/types") return json([SEARCH]);
    if (url === "/api/connections" && method === "GET") return json([]);
    if (url === "/api/connections" && method === "POST") return json(created(body));
    if (url === "/api/connections/conn_new/secret") return json(created({ type: "search", name: "x", provider: "brave", secret_set: true }));
    if (url.startsWith("/api/connections/events")) return json([]);
    throw new Error(`unexpected ${method} ${url}`);
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

const renderTab = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ConnectionsTab />
      </MemoryRouter>
    </QueryClientProvider>,
  );

async function openDialog() {
  await userEvent.click(await screen.findByRole("button", { name: "Suchdienst einrichten" }));
  return within(await screen.findByTestId("search-setup"));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("search providers of the installation", () => {
  it("follow provider_modes and the keyless list", () => {
    expect(offersProvider(SEARCH, "ddgs", "desktop")).toBe(true);
    expect(offersProvider(SEARCH, "ddgs", "server")).toBe(false);
    expect(offersProvider(SEARCH, "brave", "server")).toBe(true);
    expect(needsSecret(SEARCH, "brave")).toBe(true);
    expect(needsSecret(SEARCH, "ddgs")).toBe(false);
    expect(offeredSearchProviders(SEARCH, "desktop")).toEqual(["ddgs", "brave", "tavily", "mojeek", "searxng", "test"]);
    expect(offeredSearchProviders(SEARCH, "server")).toEqual(["brave", "tavily", "mojeek", "searxng", "test"]);
  });

  it("are all offered by an older API without provider_modes", () => {
    const older = { ...SEARCH, provider_modes: undefined, keyless_providers: undefined };
    expect(offeredSearchProviders(older, "server")).toContain("ddgs");
    expect(needsSecret(older, "ddgs")).toBe(true);
  });
});

describe("set up search service", () => {
  it("shows every provider with its note and preselects none", async () => {
    serve("desktop");
    renderTab();
    const dialog = await openDialog();
    const radios = dialog.getAllByRole("radio");
    expect(radios).toHaveLength(6);
    for (const radio of radios) expect(radio).not.toBeChecked();
    expect(dialog.getByTestId("search-provider-ddgs")).toHaveTextContent("ohne Gewähr");
    expect(dialog.getByTestId("search-provider-brave")).toHaveTextContent("nicht gespeichert");
    expect(dialog.getByTestId("search-provider-mojeek")).toHaveTextContent("Europa");
    expect(dialog.getByTestId("search-provider-test")).toHaveTextContent("Offline");
    // Nothing chosen: nothing to set up yet.
    expect(screen.getByRole("button", { name: "Einrichten" })).toBeDisabled();
  });

  it("hides DDGS on a server", async () => {
    serve("server");
    renderTab();
    const dialog = await openDialog();
    expect(dialog.queryByTestId("search-provider-ddgs")).not.toBeInTheDocument();
    expect(dialog.getByTestId("search-provider-brave")).toBeInTheDocument();
  });

  it("creates a search connection and then sets its key", async () => {
    const fetch = serve("desktop");
    renderTab();
    const dialog = await openDialog();
    await userEvent.click(within(dialog.getByTestId("search-provider-brave")).getByRole("radio"));
    expect(dialog.getByLabelText("Name")).toHaveValue("Brave Search");
    const save = screen.getByRole("button", { name: "Einrichten" });
    expect(save).toBeDisabled(); // the key is missing
    await userEvent.type(dialog.getByLabelText("API-Schlüssel *"), "secret-key");
    await userEvent.click(save);
    await waitFor(() => expect(screen.queryByTestId("search-setup")).not.toBeInTheDocument());
    const calls = fetch.mock.calls.filter(([, init]) => init?.method === "POST" || init?.method === "PUT");
    expect(calls.map(([url, init]) => [init?.method, url, JSON.parse(String(init?.body))])).toEqual([
      ["POST", "/api/connections", { type: "search", name: "Brave Search", provider: "brave", settings: {} }],
      ["PUT", "/api/connections/conn_new/secret", { secret: "secret-key" }],
    ]);
  });

  it("asks a plan-priced provider for its price and SearXNG for its address, without a key", async () => {
    const fetch = serve("desktop");
    renderTab();
    const dialog = await openDialog();
    await userEvent.click(within(dialog.getByTestId("search-provider-tavily")).getByRole("radio"));
    expect(dialog.getByLabelText("Preis pro Anfrage (USD) *")).toBeInTheDocument();
    await userEvent.click(within(dialog.getByTestId("search-provider-searxng")).getByRole("radio"));
    expect(dialog.queryByLabelText("Preis pro Anfrage (USD) *")).not.toBeInTheDocument();
    expect(dialog.queryByLabelText("API-Schlüssel *")).not.toBeInTheDocument();
    expect(dialog.getByLabelText("Name")).toHaveValue("SearXNG");
    await userEvent.type(dialog.getByLabelText(/Adresse deines Servers/), "https://search.example.org");
    await userEvent.click(screen.getByRole("button", { name: "Einrichten" }));
    await waitFor(() => expect(screen.queryByTestId("search-setup")).not.toBeInTheDocument());
    const posts = fetch.mock.calls.filter(([, init]) => init?.method === "POST");
    expect(JSON.parse(String(posts[0][1]?.body))).toEqual({
      type: "search",
      name: "SearXNG",
      provider: "searxng",
      settings: { endpoint: "https://search.example.org" },
    });
    expect(fetch.mock.calls.some(([url]) => String(url).endsWith("/secret"))).toBe(false);
  });
});
