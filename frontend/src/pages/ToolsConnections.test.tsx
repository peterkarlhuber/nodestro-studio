import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { settingsFields, settingsValues } from "../api/connections";

import { ConnectionsTab } from "./ToolsConnections";

const SMTP_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["host", "from_address"],
  properties: {
    host: { type: "string", title: "Host", minLength: 1 },
    port: { type: "integer", title: "Port", default: 587 },
    security: { enum: ["starttls", "tls"], type: "string", title: "Security", default: "starttls" },
    username: { anyOf: [{ type: "string" }, { type: "null" }], default: null, title: "Username" },
    from_address: { type: "string", title: "From Address" },
    auth: { enum: ["password", "oauth2"], type: "string", default: "password", title: "Auth" },
  },
};

const TYPES = [
  {
    name: "search",
    providers: ["test"],
    secret_required: true,
    secret_label: "api_key",
    settings_schema: {
      type: "object",
      properties: {
        endpoint: { anyOf: [{ type: "string" }, { type: "null" }], default: null, title: "Endpoint" },
        price_per_request_usd: { anyOf: [{ type: "number" }, { type: "string" }, { type: "null" }], default: null },
      },
    },
    modes: ["desktop", "local-container", "server"],
    checkable: true,
  },
  {
    name: "smtp",
    providers: ["generic"],
    secret_required: true,
    secret_label: "password",
    settings_schema: SMTP_SCHEMA,
    modes: ["desktop", "local-container", "server"],
    checkable: true,
  },
];

const CONNECTION: Record<string, unknown> = {
  id: "conn_1",
  contract: 1,
  type: "smtp",
  name: "Office mail",
  provider: "generic",
  description: "",
  settings: { host: "mail.example.com", port: 587, security: "starttls", from_address: "bot@example.com", auth: "password" },
  egress: ["mail.example.com:587"],
  secret_set: false,
  secret_storage: "none",
  check: { status: "unchecked", checked_at: null, code: null, kind: null },
  created_at: "2026-11-12T10:00:00Z",
  updated_at: "2026-11-12T10:00:00Z",
  used_by: ["Invoices / Mailer"],
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

type Route = (method: string, url: string, body: unknown) => unknown;

function serve(route: Route) {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const answer = route(init?.method ?? "GET", url, body);
    if (answer instanceof Response) return answer;
    if (answer === undefined) return new Response(null, { status: 204 });
    return json(answer);
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

const routes =
  (overrides: { status?: unknown; connections?: unknown; me?: unknown; route?: Route } = {}): Route =>
  (method, url, body) => {
    const own = overrides.route?.(method, url, body);
    if (own !== undefined) return own;
    if (url === "/api/meta") return json({ detail: "not here" }, 404);
    if (url === "/api/auth/me") return overrides.me ?? json({ detail: "not here" }, 404);
    if (url === "/api/connections/status") return overrides.status ?? { secret_vault: true, mode: "desktop", contract: 1 };
    if (url === "/api/connections/types") return TYPES;
    if (url === "/api/connections" && method === "GET") return overrides.connections ?? [CONNECTION];
    if (url.startsWith("/api/connections/events")) return [];
    throw new Error(`unexpected ${method} ${url}`);
  };

const renderTab = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ConnectionsTab />
      </MemoryRouter>
    </QueryClientProvider>,
  );

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("settings form from the type's schema", () => {
  it("keeps simple fields and sends numbers as numbers, empty fields left out", () => {
    const fields = settingsFields(SMTP_SCHEMA);
    expect(fields.map((field) => [field.name, field.kind, field.required])).toEqual([
      ["host", "string", true],
      ["port", "integer", false],
      ["security", "enum", false],
      ["username", "string", false],
      ["from_address", "string", true],
      ["auth", "enum", false],
    ]);
    expect(settingsFields(TYPES[0].settings_schema).map((field) => field.kind)).toEqual(["string", "number"]);
    expect(settingsValues(fields, { host: " mail.example.com ", port: "465", username: "", security: "tls" })).toEqual({
      host: "mail.example.com",
      port: 465,
      security: "tls",
    });
  });
});

describe("ConnectionsTab", () => {
  it("creates a connection with settings from the type's schema", async () => {
    const created = { ...CONNECTION, id: "conn_2", name: "Alerts" };
    const fetch = serve(routes({ route: (method, url) => (method === "POST" && url === "/api/connections" ? created : undefined) }));
    renderTab();
    await userEvent.click(await screen.findByRole("button", { name: "Verbindung hinzufügen" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.selectOptions(within(dialog).getByLabelText("Art"), "smtp");
    await userEvent.type(within(dialog).getByLabelText("Name"), "Alerts");
    const save = within(dialog).getByRole("button", { name: "Speichern" });
    expect(save).toBeDisabled(); // required settings are empty
    await userEvent.type(within(dialog).getByLabelText("Serveradresse *"), "mail.example.com");
    await userEvent.type(within(dialog).getByLabelText("Absenderadresse *"), "bot@example.com");
    expect(within(dialog).getByLabelText("Port")).toHaveValue(587);
    await userEvent.click(save);
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/connections",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            type: "smtp",
            name: "Alerts",
            provider: "generic",
            description: "",
            settings: { host: "mail.example.com", port: 587, security: "starttls", from_address: "bot@example.com", auth: "password" },
          }),
        }),
      ),
    );
  });

  it("writes the secret only: the value is sent once and never shown again", async () => {
    let stored = CONNECTION;
    const fetch = serve(
      routes({
        connections: undefined,
        route: (method, url) => {
          if (method === "GET" && url === "/api/connections") return [stored];
          if (method === "PUT" && url === "/api/connections/conn_1/secret") {
            stored = { ...CONNECTION, secret_set: true, secret_storage: "vault" };
            return stored;
          }
          return undefined;
        },
      }),
    );
    renderTab();
    const secret = within(await screen.findByTestId("connection-secret"));
    expect(secret.getByText("Kein Geheimnis")).toBeInTheDocument();
    const input = secret.getByLabelText("Passwort");
    expect(input).toHaveAttribute("type", "password");
    await userEvent.type(input, "hunter2-very-secret");
    await userEvent.click(secret.getByRole("button", { name: "Geheimnis speichern" }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/connections/conn_1/secret",
        expect.objectContaining({ method: "PUT", body: JSON.stringify({ secret: "hunter2-very-secret" }) }),
      ),
    );
    expect(await screen.findByText("Geheimnis gesetzt", { selector: ".nd-badge" })).toBeInTheDocument();
    expect(screen.getByText("verschlüsselt gespeichert")).toBeInTheDocument();
    expect(screen.getByLabelText("Passwort")).toHaveValue("");
    expect(document.body.innerHTML).not.toContain("hunter2-very-secret");
    // Removing sends the empty value.
    await userEvent.click(screen.getByRole("button", { name: "Geheimnis entfernen" }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith("/api/connections/conn_1/secret", expect.objectContaining({ body: JSON.stringify({ secret: "" }) })),
    );
  });

  it("says that secrets last for this session only without a key store", async () => {
    serve(routes({ status: { secret_vault: false, mode: "desktop", contract: 1 } }));
    renderTab();
    expect(await screen.findByText(/Geheimnisse gelten nur für diese Sitzung/)).toBeInTheDocument();
    expect(screen.getByText("Kein sicherer Schlüsselspeicher: Das Geheimnis gilt nur für diese Sitzung.")).toBeInTheDocument();
  });

  it("checks the connection and shows status and code", async () => {
    let stored = CONNECTION;
    const fetch = serve(
      routes({
        route: (method, url) => {
          if (method === "GET" && url === "/api/connections") return [stored];
          if (method === "POST" && url === "/api/connections/conn_1/check") {
            stored = {
              ...CONNECTION,
              check: { status: "failed", checked_at: "2026-11-13T10:00:00Z", code: "connection.check_unavailable", kind: "configuration" },
            };
            return stored;
          }
          return undefined;
        },
      }),
    );
    renderTab();
    await userEvent.click(await screen.findByRole("button", { name: "Verbindung prüfen" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/connections/conn_1/check", expect.objectContaining({ method: "POST" })));
    const check = within(screen.getByTestId("connection-check"));
    expect(await check.findByText("Prüfung fehlgeschlagen")).toBeInTheDocument();
    expect(check.getByText("Diese Verbindung kann hier noch nicht geprüft werden.")).toBeInTheDocument();
    expect(check.getByText("connection.check_unavailable")).toBeInTheDocument();
  });

  it("explains a refused delete of a connection in use and deletes it on request", async () => {
    const fetch = serve(
      routes({
        route: (method, url) => {
          if (method === "DELETE" && url === "/api/connections/conn_1")
            return json(
              { detail: "The connection is used by 1 agent(s)", code: "connection.in_use", params: { count: 1, names: "Invoices / Mailer" } },
              409,
            );
          if (method === "DELETE" && url === "/api/connections/conn_1?force=true") return new Response(null, { status: 204 });
          return undefined;
        },
      }),
    );
    renderTab();
    expect(await screen.findByTestId("connection-used-by")).toHaveTextContent("Invoices / Mailer");
    await userEvent.click(screen.getByRole("button", { name: "Verbindung löschen" }));
    await userEvent.click(screen.getByRole("button", { name: "Verbindung löschen: Löschen?" }));
    const inUse = within(await screen.findByTestId("connection-in-use"));
    expect(inUse.getByText("1 Agent nutzt diese Verbindung noch (Invoices / Mailer).")).toBeInTheDocument();
    await userEvent.click(inUse.getByRole("button", { name: "Trotzdem löschen" }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith("/api/connections/conn_1?force=true", expect.objectContaining({ method: "DELETE" })),
    );
  });

  it("hides every write action without the admin permission", async () => {
    serve(
      routes({
        me: { user_id: "u1", tenant_id: "t1", role: "viewer", permissions: ["read"], tenants: { t1: "viewer" } },
      }),
    );
    renderTab();
    expect(await screen.findByTestId("connection-secret")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Verbindung hinzufügen" })).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Verbindung prüfen" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Verbindung löschen" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Passwort")).not.toBeInTheDocument();
  });
});
