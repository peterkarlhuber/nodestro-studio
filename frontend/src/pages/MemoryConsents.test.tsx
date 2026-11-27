// The owner's consents for private memory spaces (RT-089d): only on a server, review before allowing, the digest
// shown is the one granted, a stale review is explained with the way to review again, and withdrawing a consent.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { MemoryConsent } from "../api/types";
import { MemoryConsents } from "./MemoryConsents";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const ME = { user_id: "usr_ana", tenant_id: "acme", role: "member", permissions: ["read", "edit", "run"], tenants: { acme: "member" } };
const DIGEST_1 = "a".repeat(64);
const DIGEST_2 = "b".repeat(64);
const CONSENT: MemoryConsent = {
  id: "mcs_1",
  space: "customer-notes",
  owner: "usr_ana",
  subject: "workflow",
  digest: DIGEST_1,
  workflow_id: "wf_1",
  workflow_version: 3,
  workflow_name: "Reply drafts",
  at: "2026-11-26T10:00:00Z",
};

function serve(profile: string, overrides: (url: string, init?: RequestInit) => Response | undefined = () => undefined) {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    const special = overrides(url, init);
    if (special) return special;
    if (url === "/api/meta") return json({ profile });
    if (url === "/api/auth/me") return json(ME);
    if (url === "/api/memory") return json([{ name: "customer-notes", files: 2, size: 100 }]);
    if (url === "/api/workflows") return json([{ id: "wf_1", name: "Reply drafts", description: "", agents: 1, updated_at: "", last_run_status: null }]);
    if (url === "/api/memory-consents" && (init?.method ?? "GET") === "GET") return json([CONSENT]);
    if (url === "/api/memory-consents/mcs_1" && init?.method === "DELETE") return new Response(null, { status: 204 });
    return json({ detail: "unexpected", code: "not_found", params: {} }, 404);
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function show() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <MemoryConsents space="customer-notes" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const urls = (fetch: ReturnType<typeof vi.fn>) => fetch.mock.calls.map(([url]) => url as string);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("MemoryConsents", () => {
  it("is not shown, and not asked for, on the desktop", async () => {
    const fetch = serve("desktop");
    const { container } = show();
    await waitFor(() => expect(urls(fetch)).toContain("/api/meta"));
    expect(container).toBeEmptyDOMElement();
    expect(urls(fetch)).not.toContain("/api/memory-consents");
  });

  it("is not shown when the server offers no consents", async () => {
    const fetch = serve("server", (url) =>
      url === "/api/memory-consents" ? json({ detail: "x", code: "memory.consent_unavailable", params: {} }, 404) : undefined,
    );
    const { container } = show();
    await waitFor(() => expect(urls(fetch)).toContain("/api/memory-consents"));
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("lists the consents and withdraws one after a confirmation", async () => {
    const fetch = serve("server");
    show();
    const list = await screen.findByTestId("consent-list");
    expect(within(list).getByText("customer-notes")).toBeInTheDocument();
    expect(within(list).getByRole("link", { name: "Reply drafts" })).toHaveAttribute("href", "/workflows/wf_1");
    expect(within(list).getByText("(Version 3)")).toBeInTheDocument();
    await userEvent.click(within(list).getByRole("button", { name: "Zustimmung zurückziehen" }));
    await userEvent.click(await within(list).findByRole("button", { name: /Zurückziehen\?/ }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/memory-consents/mcs_1", expect.objectContaining({ method: "DELETE" })));
  });

  it("grants exactly what was reviewed, and asks for a new review when the workflow changed meanwhile", async () => {
    let digest = DIGEST_1;
    let stale = true;
    const fetch = serve("server", (url, init) => {
      if (url.startsWith("/api/memory-consents/preview"))
        return json({
          workflow_id: "wf_1",
          digest,
          targets: [
            { workflow_id: "wf_1", name: "Reply drafts", version: 3, digest: "c".repeat(64) },
            { workflow_id: "wf_2", name: "Lookup", version: null, digest: "d".repeat(64) },
          ],
        });
      if (url === "/api/memory-consents" && init?.method === "POST") {
        if (stale) return json({ detail: "changed", code: "memory.consent_stale", params: { space: "customer-notes" } }, 409);
        return json([CONSENT], 201);
      }
      return undefined;
    });
    show();
    const grant = await screen.findByTestId("consent-grant");
    await screen.findByRole("option", { name: "Reply drafts" });
    await userEvent.selectOptions(within(grant).getByTestId("consent-workflow"), "wf_1");
    await userEvent.click(within(grant).getByTestId("consent-review"));
    const preview = await screen.findByTestId("consent-preview");
    expect(preview).toHaveTextContent("diese 2 Workflows");
    expect(within(preview).getByRole("link", { name: "Lookup" })).toHaveAttribute("href", "/workflows/wf_2");
    expect(urls(fetch)).toContain("/api/memory-consents/preview?workflow_id=wf_1");

    await userEvent.click(within(preview).getByTestId("consent-allow"));
    expect(await within(preview).findByTestId("consent-stale")).toHaveTextContent("Prüfe erneut");
    const posted = fetch.mock.calls.find(([url, init]) => url === "/api/memory-consents" && init?.method === "POST");
    expect(JSON.parse(String(posted?.[1]?.body))).toEqual({ space: "customer-notes", workflow_id: "wf_1", digest: DIGEST_1 });
    expect(within(preview).queryByTestId("consent-allow")).not.toBeInTheDocument();

    // The re-consent path: review again, then allow the content shown now.
    digest = DIGEST_2;
    stale = false;
    await userEvent.click(within(preview).getByTestId("consent-review-again"));
    await userEvent.click(await within(screen.getByTestId("consent-preview")).findByTestId("consent-allow"));
    await waitFor(() => expect(screen.queryByTestId("consent-preview")).not.toBeInTheDocument());
    const last = fetch.mock.calls.filter(([url, init]) => url === "/api/memory-consents" && init?.method === "POST").at(-1);
    expect(JSON.parse(String(last?.[1]?.body)).digest).toBe(DIGEST_2);
  });
});
