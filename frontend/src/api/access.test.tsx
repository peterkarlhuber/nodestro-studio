import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { retryQuery } from "./retry";
import { PermissionNote, ReadOnlyNotice, UserMenu } from "../components/Access";
import { ApiError } from "./client";
import { accessOf, fetchMe, profileOf, recheckSignIn, type Me } from "./access";

const VIEWER: Me = {
  user_id: "usr_1",
  name: "Vera Viewer",
  email: "vera@example.com",
  tenant_id: "acme",
  role: "viewer",
  permissions: ["read"],
  tenants: { acme: "viewer", beta: "editor" },
};

function serve(me: { status: number; body?: unknown }) {
  const fetch = vi.fn(async (url: string) => {
    if (url === "/api/auth/me")
      return new Response(JSON.stringify(me.body ?? { detail: "Not found" }), {
        status: me.status,
        headers: { "Content-Type": "application/json" },
      });
    return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

const wrap = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("profile and permissions (AD-04/AD-05)", () => {
  it("treats a missing /api/auth/me as the desktop, where everything is allowed", async () => {
    serve({ status: 404 });
    expect(await fetchMe()).toBeNull();
    const access = accessOf(profileOf(undefined, null, false), null);
    expect(access.profile).toBe("desktop");
    expect(access.can("install")).toBe(true);
  });

  it("knows the server from the user and allows only the user's permissions", () => {
    const access = accessOf(profileOf(undefined, VIEWER, false), VIEWER);
    expect(access.profile).toBe("server");
    expect(access.can("read")).toBe(true);
    expect(access.can("edit")).toBe(false);
  });

  it("makes no claim while it is not known, and prefers a profile from /api/meta", () => {
    expect(profileOf(undefined, undefined, false)).toBe("unknown");
    expect(profileOf(undefined, undefined, true)).toBe("unknown");
    expect(profileOf({ profile: "desktop" } as never, undefined, false)).toBe("desktop");
    expect(profileOf({ profile: "server" } as never, null, false)).toBe("server");
    expect(profileOf({ profile: "local-container" } as never, null, false)).toBe("local-container");
  });

  it("never retries a refused query (401/403), but retries other failures once", () => {
    expect(retryQuery(0, new ApiError("forbidden", 403, "access.forbidden"))).toBe(false);
    expect(retryQuery(0, new ApiError("login", 401, "access.login_required"))).toBe(false);
    expect(retryQuery(0, new ApiError("boom", 500))).toBe(true);
    expect(retryQuery(1, new ApiError("boom", 500))).toBe(false);
  });

  it("re-checks the session and keeps a still valid one", async () => {
    serve({ status: 200, body: VIEWER });
    const client = new QueryClient();
    expect(await recheckSignIn(client)).toBe(true);
    expect(client.getQueryData(["auth", "me"])).toEqual(VIEWER);
  });
});

describe("access components", () => {
  it("shows the user, the role, a workspace switch and sign-out on a server", async () => {
    serve({ status: 200, body: VIEWER });
    render(wrap(<UserMenu />));
    expect(await screen.findByTestId("user-menu")).toHaveTextContent("Vera Viewer");
    expect(screen.getByTestId("user-role")).toHaveTextContent("Betrachter");
    expect(screen.getByRole("combobox", { name: "Arbeitsbereich wechseln" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abmelden" })).toBeInTheDocument();
  });

  it("explains a missing permission with the role, and says that a viewer can only look", async () => {
    serve({ status: 200, body: VIEWER });
    render(
      wrap(
        <>
          <ReadOnlyNotice />
          <PermissionNote permission="edit" />
        </>,
      ),
    );
    expect(await screen.findByTestId("permission-note-edit")).toHaveTextContent("Deine Rolle (Betrachter)");
    expect(screen.getByTestId("permission-note-edit")).toHaveTextContent("„Bearbeiten“");
    expect(screen.getByTestId("read-only-notice")).toHaveTextContent("nichts ändern oder ausführen");
  });

  it("renders nothing of this on the desktop", async () => {
    const fetch = serve({ status: 404 });
    const { container } = render(
      wrap(
        <>
          <UserMenu />
          <ReadOnlyNotice />
          <PermissionNote permission="admin" />
        </>,
      ),
    );
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/auth/me", expect.anything()));
    expect(container).toBeEmptyDOMElement();
  });
});
