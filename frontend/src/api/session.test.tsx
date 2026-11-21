import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DesktopSignOut } from "../components/Access";
import { SessionGate } from "../components/SignedOut";
import { CSRF_HEADER, SESSION_STORAGE_KEY, csrfHeaders, launchSession } from "./session";

const CSRF = "c".repeat(43);

function serve(meta: Record<string, unknown> = { profile: "desktop" }) {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    const body = url === "/api/meta" ? meta : url === "/api/logout" ? { ended: 1 } : {};
    void init;
    return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

const headersOf = (fetch: ReturnType<typeof serve>, url: string) =>
  (fetch.mock.calls.find(([called]) => called === url)?.[1]?.headers ?? {}) as Record<string, string>;

const wrap = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

beforeEach(() => sessionStorage.clear());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.resetModules();
  sessionStorage.clear();
});

describe("the desktop launch session (NS-002)", () => {
  it("is empty without the backend's switches: no header, no sign-out", () => {
    expect(launchSession()).toEqual({ csrf: null, logout: false });
    expect(csrfHeaders("POST")).toEqual({});
  });

  it("sends the CSRF value with changes only", () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ csrf: CSRF, logout: false }));
    for (const method of ["POST", "PUT", "PATCH", "DELETE", "post"]) expect(csrfHeaders(method)).toEqual({ [CSRF_HEADER]: CSRF });
    for (const method of ["GET", "HEAD", "OPTIONS"]) expect(csrfHeaders(method)).toEqual({});
  });

  it("ignores what does not look like the backend's value", () => {
    for (const stored of ["{", "null", "[]", JSON.stringify({ csrf: "short" }), JSON.stringify({ csrf: "a\r\nb".repeat(20) }), JSON.stringify({ csrf: 5, logout: "yes" })]) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, stored);
      expect(launchSession()).toEqual({ csrf: null, logout: false });
    }
  });

  it("puts the header on the requests of the API client and leaves reads alone", async () => {
    const fetch = serve();
    const { request } = await import("./client");
    await request("GET", "/workflows");
    expect(headersOf(fetch, "/api/workflows")[CSRF_HEADER]).toBeUndefined();
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ csrf: CSRF, logout: false }));
    await request("POST", "/workflows", { name: "x" });
    const sent = fetch.mock.calls.at(-1)?.[1]?.headers as Record<string, string>;
    expect(sent[CSRF_HEADER]).toBe(CSRF);
    expect(sent["Content-Type"]).toBe("application/json");
  });

  it("sends an imported trace as JSON", async () => {
    const fetch = serve();
    const { api } = await import("./client");
    await api.importTrace(new Blob(["{}"], { type: "" }));
    expect(headersOf(fetch, "/api/runs/import")["Content-Type"]).toBe("application/json");
  });
});

describe("the desktop sign-out (NS-002)", () => {
  it("is not offered unless the launch page said so", async () => {
    serve();
    render(wrap(<DesktopSignOut />));
    await act(async () => {});
    expect(screen.queryByTestId("desktop-sign-out")).toBeNull();
  });

  it("is not offered outside the desktop", async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ csrf: null, logout: true }));
    serve({ profile: "local-container" });
    render(wrap(<DesktopSignOut />));
    await act(async () => {});
    expect(screen.queryByTestId("desktop-sign-out")).toBeNull();
  });

  it("ends the session and replaces the studio by the signed-out page", async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ csrf: CSRF, logout: true }));
    const fetch = serve();
    render(
      wrap(
        <SessionGate>
          <p data-testid="studio">studio</p>
          <DesktopSignOut />
        </SessionGate>,
      ),
    );
    fireEvent.click(await screen.findByTestId("desktop-sign-out"));
    await waitFor(() => expect(screen.getByTestId("signed-out")).toBeTruthy());
    expect(screen.queryByTestId("studio")).toBeNull();
    const call = fetch.mock.calls.find(([url]) => url === "/api/logout");
    expect(call?.[1]?.method).toBe("POST");
    expect((call?.[1]?.headers as Record<string, string>)[CSRF_HEADER]).toBe(CSRF);
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });
});
