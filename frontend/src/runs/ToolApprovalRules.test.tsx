import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ToolInfo, ToolPreGrant } from "../api/types";
import { ToolApprovalRules, grantState, grantableTools } from "./ToolApprovalRules";

const GRANT: ToolPreGrant = {
  id: "tpg_1",
  tool: "mailer",
  version: 2,
  scope: "schedule",
  scope_id: "sch_1",
  granted_by: "usr_admin",
  granted_at: "2026-10-31T10:00:00Z",
  expires_at: null,
  revoked_at: null,
  revoked_by: null,
};

const tool = (name: string, kind: ToolInfo["kind"], access: string, version = 2) =>
  ({
    name,
    kind,
    version,
    capability: { access, reach: "external", source: "declared" },
  }) as ToolInfo;

const TOOLS = [
  tool("mailer", "custom", "write"),
  tool("wipe", "custom", "destructive"),
  tool("lookup", "builtin", "read"),
  tool("mcp__crm__update", "mcp", "write"),
];

type Answer = (method: string, url: string, body: unknown) => unknown;

function serve(override: Answer = () => undefined) {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const special = override(method, url, body);
    const answer =
      special !== undefined
        ? special
        : url === "/api/tool-approvals/legacy"
          ? { enabled: false, legacy: null }
          : url === "/api/tool-pre-grants"
            ? [GRANT]
            : url.startsWith("/api/tool-approvals/audit")
              ? [
                  {
                    id: "tae_1",
                    at: "2026-10-31T10:00:00Z",
                    kind: "decision_refused",
                    actor: "usr_2",
                    tool: "mailer",
                    run_id: "run_1",
                    request_id: "tap_1",
                    pre_grant_id: null,
                    outcome: "tool.approval_stale",
                    arguments_hash: "h",
                    details: {},
                  },
                ]
              : url === "/api/tools"
                ? TOOLS
                : url === "/api/schedules"
                  ? [{ id: "sch_1", name: "Morgenbericht" }]
                  : url === "/api/batches"
                    ? []
                    : null;
    if (answer instanceof Response) return answer;
    return new Response(JSON.stringify(answer), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

async function openRules() {
  await userEvent.click(screen.getByText("Regeln für Tool-Aufrufe"));
}

/** The rules with approvals off: open the folded preparation too. */
async function openPreparation() {
  await openRules();
  await userEvent.click(await screen.findByText("Vorbereitung für Administratoren"));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("grantState", () => {
  it("tells active, revoked, expired and outdated grants apart", () => {
    expect(grantState(GRANT, 2)).toBe("active");
    expect(grantState({ ...GRANT, revoked_at: "2026-10-31T11:00:00Z" }, 2)).toBe("revoked");
    expect(grantState({ ...GRANT, expires_at: "2026-10-31T11:00:00Z" }, 2, Date.parse("2026-10-31T12:00:00Z"))).toBe(
      "expired",
    );
    expect(grantState(GRANT, 3)).toBe("outdated");
  });
});

describe("grantableTools", () => {
  it("offers only changing tools: never reading-only, destructive or MCP tools", () => {
    expect(grantableTools(TOOLS).map((item) => item.name)).toEqual(["mailer"]);
  });
});

describe("ToolApprovalRules", () => {
  it("shows that approvals are off, that the activation step has not run, the grants and the audit trail", async () => {
    serve();
    render(wrap(<ToolApprovalRules />));
    await openRules();
    // While approvals are off, one sentence; the preparation is folded away (AD-14).
    const off = await screen.findByTestId("tool-approvals-off");
    expect(within(off).getByText(/nicht eingeschaltet/)).toBeInTheDocument();
    expect(screen.getAllByText("Aus").length).toBeGreaterThan(0);
    await userEvent.click(screen.getByText("Vorbereitung für Administratoren"));
    expect(screen.getByTestId("legacy-not-run")).toBeInTheDocument();
    const grants = await screen.findByTestId("pre-grants");
    expect(within(grants).getByText("mailer")).toBeInTheDocument();
    expect(within(grants).getByText("Aktiv")).toBeInTheDocument();
    const audit = await screen.findByTestId("tool-approval-audit");
    expect(within(audit).getByText("Entscheidung abgelehnt")).toBeInTheDocument();
    expect(within(audit).getByText(/hat sich seit der Anzeige geändert/)).toBeInTheDocument();
  });

  it("phrases the activation step for approvals that are already on", async () => {
    serve((_method, url) => (url === "/api/tool-approvals/legacy" ? { enabled: true, legacy: null } : undefined));
    render(wrap(<ToolApprovalRules />));
    await openRules();
    expect(await screen.findByTestId("legacy-not-run")).toHaveTextContent(/wie neue nachgefragt/);
  });

  it("hides granting and the audit trail from a server role without admin", async () => {
    serve((_method, url) =>
      url === "/api/auth/me"
        ? { user_id: "u", tenant_id: "acme", role: "viewer", permissions: ["read"], tenants: { acme: "viewer" } }
        : url === "/api/tool-approvals/legacy"
          ? { enabled: true, legacy: null }
          : undefined,
    );
    render(wrap(<ToolApprovalRules />));
    await openRules();
    expect(await screen.findByTestId("permission-note-admin")).toHaveTextContent(/Betrachter/);
    expect(screen.queryByTestId("pre-grants")).toBeNull();
    expect(screen.queryByRole("button", { name: "Bestehende Zuweisungen markieren" })).toBeNull();
  });

  it("lists the exceptions from before once the activation step ran", async () => {
    serve((_method, url) =>
      url === "/api/tool-approvals/legacy"
        ? {
            enabled: true,
            legacy: {
              bindings: [
                {
                  workflow_id: "wf_1",
                  workflow_version: null,
                  release: null,
                  node_id: "writer",
                  tool: "mailer",
                  bound_version: 2,
                },
              ],
              workflows: 1,
              versions: 0,
            },
          }
        : undefined,
    );
    render(wrap(<ToolApprovalRules />));
    await openRules();
    const table = await screen.findByTestId("legacy-bindings");
    expect(within(table).getByText("Workflow wf_1")).toBeInTheDocument();
    expect(within(table).getByText("writer")).toBeInTheDocument();
    expect(screen.getAllByText("Ein").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("tool-approvals-off")).toBeNull();
  });

  it("revokes a grant after a second click", async () => {
    const fetch = serve((method) =>
      method === "DELETE" ? { ...GRANT, revoked_at: "2026-10-31T12:00:00Z", revoked_by: "local" } : undefined,
    );
    render(wrap(<ToolApprovalRules />));
    await openPreparation();
    const grants = await screen.findByTestId("pre-grants");
    await userEvent.click(within(grants).getByRole("button", { name: "Widerrufen" }));
    await userEvent.click(within(grants).getByRole("button", { name: /Widerrufen\?/ }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/tool-pre-grants/schedule/sch_1/tpg_1",
        expect.objectContaining({ method: "DELETE" }),
      ),
    );
  });

  it("grants one tool in advance for one schedule", async () => {
    const fetch = serve((method, url) => (method === "POST" && url === "/api/tool-pre-grants" ? GRANT : undefined));
    render(wrap(<ToolApprovalRules />));
    await openPreparation();
    const form = await screen.findByRole("form", {
      name: "Neue Vorab-Freigabe",
    });
    const [toolSelect, scopeSelect] = within(form).getAllByRole("combobox");
    await waitFor(() => expect(within(toolSelect).getAllByRole("option")).toHaveLength(2));
    await userEvent.selectOptions(toolSelect, "mailer");
    await waitFor(() => expect(within(scopeSelect).getAllByRole("option")).toHaveLength(2));
    await userEvent.selectOptions(scopeSelect, "schedule:sch_1");
    await userEvent.click(within(form).getByRole("button", { name: "Vorab freigeben" }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/tool-pre-grants",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            tool: "mailer",
            scope: "schedule",
            scope_id: "sch_1",
            expires_at: null,
          }),
        }),
      ),
    );
  });
});
