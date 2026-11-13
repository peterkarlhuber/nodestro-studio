import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AgentConfig } from "../api/types";
import { defaultAgent } from "../lib/defaults";
import { AgentForm } from "./AgentInspector";
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

const CATALOG = [
  { name: "calculator", description: "", origin: "nodestro", spec: spec("calculator", null) },
  { name: "send_mail", description: "", origin: "integration", spec: spec("send_mail", "smtp") },
];

const connection = (id: string, type: string, name: string) => ({ id, type, name, provider: "generic", check: { status: "ok" } });
const CONNECTIONS = [connection("conn_mail", "smtp", "Office mail"), connection("conn_hook", "webhook", "Alerts hook")];

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
