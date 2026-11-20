import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AccessDeny, AccessGrant } from "../api/types";
import { AccessRulesLink, AccessRulesPage, recordState } from "./AccessRulesPage";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const GRANT: AccessGrant = {
  id: "agr_1",
  resource: { type: "tool", id: "mailer" },
  actions: ["execute"],
  scope: "agent",
  agents: ["wf_1/writer"],
  created_at: "2026-11-20T10:00:00Z",
  expires_at: null,
  revoked_at: null,
  revoked_by: null,
  duration: "until_revoked",
  mode: "supervised",
  conversation_id: null,
  status: "active",
  tool: { version: 2, access: "write", reach: "external" },
  granted_by: "usr_alice",
};
const DENY: AccessDeny = {
  id: "adn_1",
  resource: { type: "cloud_provider", id: "anthropic" },
  actions: ["submit"],
  scope: "all",
  agents: [],
  created_at: "2026-11-20T11:00:00Z",
  expires_at: null,
  revoked_at: "2026-11-20T12:00:00Z",
  revoked_by: "usr_bob",
  duration: "until_revoked",
  mode: null,
  status: "revoked",
  denied_by: "usr_alice",
};

function serve(enabled: boolean, me: unknown = null) {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/auth/me") return me ? json(me) : json({ detail: "x", code: "not_found", params: {} }, 404);
    if (url === "/api/meta") return json({ profile: "desktop" });
    if (url === "/api/access/state") return json({ enabled, safety_limits: { strict_offline: "Offline", protected_folders: "Data" } });
    if (url === "/api/access/grants") return json([GRANT]);
    if (url === "/api/access/denies") return json([DENY]);
    if (url === "/api/access/grants/agr_1" && init?.method === "DELETE") return json({ ...GRANT, status: "revoked" });
    return json({ detail: "unexpected", code: "not_found", params: {} }, 404);
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function show(element: React.ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>{element}</MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AccessRulesPage", () => {
  it("lists grants and denies with who gave them, and the safety limits", async () => {
    serve(true);
    show(<AccessRulesPage />);
    const grants = await screen.findByTestId("access-grants");
    expect(await within(grants).findByText("mailer")).toBeInTheDocument();
    expect(within(grants).getByText(/wf_1\/writer/)).toBeInTheDocument();
    expect(within(grants).getByText(/usr_alice/)).toBeInTheDocument();
    expect(within(grants).getByText("Aktiv")).toBeInTheDocument();
    const denies = await screen.findByTestId("access-denies");
    expect(await within(denies).findByText("anthropic")).toBeInTheDocument();
    expect(within(denies).getByText("Widerrufen")).toBeInTheDocument();
    expect(within(denies).getByText(/Widerrufen von usr_bob/)).toBeInTheDocument();
    // A revoked record has nothing left to revoke.
    expect(within(denies).queryByRole("button", { name: "Widerrufen" })).not.toBeInTheDocument();
    expect(screen.getByTestId("access-limits")).toHaveTextContent("strict_offline");
  });

  it("revokes an active grant after a confirmation", async () => {
    const fetch = serve(true);
    show(<AccessRulesPage />);
    const grants = await screen.findByTestId("access-grants");
    await within(grants).findByText("mailer");
    await userEvent.click(within(grants).getByRole("button", { name: "Widerrufen" }));
    await userEvent.click(await within(grants).findByRole("button", { name: "Widerrufen: Jetzt widerrufen" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/access/grants/agr_1", expect.objectContaining({ method: "DELETE" })));
  });

  it("says the access model is off and reads no records then", async () => {
    const fetch = serve(false);
    show(<AccessRulesPage />);
    expect(await screen.findByTestId("access-off")).toBeInTheDocument();
    expect(fetch.mock.calls.map(([url]) => url)).not.toContain("/api/access/grants");
  });

  it("explains the permission to someone who is not an administrator", async () => {
    const fetch = serve(true, { user_id: "usr_v", tenant_id: "acme", role: "viewer", permissions: ["read"], tenants: { acme: "viewer" } });
    fetch.mockImplementation(async (url: string) => {
      if (url === "/api/auth/me") return json({ user_id: "usr_v", tenant_id: "acme", role: "viewer", permissions: ["read"], tenants: { acme: "viewer" } });
      if (url === "/api/meta") return json({ profile: "server" });
      if (url === "/api/access/state") return json({ enabled: true, safety_limits: {} });
      return json({ detail: "x", code: "access.forbidden", params: { permission: "admin" } }, 403);
    });
    show(<AccessRulesPage />);
    await screen.findByText(/admin/i);
    await waitFor(() => expect(fetch.mock.calls.map(([url]) => url)).not.toContain("/api/access/grants"));
  });
});

describe("AccessRulesLink", () => {
  it("is shown only while the access model is on", async () => {
    serve(false);
    const { unmount } = show(<AccessRulesLink />);
    await waitFor(() => expect(screen.queryByTestId("access-rules-link")).not.toBeInTheDocument());
    unmount();
    serve(true);
    show(<AccessRulesLink />);
    expect(await screen.findByTestId("access-rules-link")).toHaveTextContent("Erlaubnisse und Sperren");
  });
});

describe("recordState", () => {
  it("knows active, used, revoked and expired records", () => {
    expect(recordState(GRANT)).toBe("active");
    expect(recordState({ ...GRANT, status: "used" })).toBe("used");
    expect(recordState(DENY)).toBe("revoked");
    expect(recordState({ ...GRANT, expires_at: "2020-01-01T00:00:00Z" })).toBe("expired");
  });
});
