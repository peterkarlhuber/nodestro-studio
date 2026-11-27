import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ExtensionStoreView, StoredExtension } from "../api/types";
import { refineProblem } from "../lib/errors";
import { ExtensionsLink, ExtensionsPage, lockReason, shortHash } from "./ExtensionsPage";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const HASH = "a".repeat(64);
const PACKAGE: StoredExtension = {
  sha256: HASH,
  distribution: "acme-store",
  version: "1.0",
  entries: [["acme", "acme_store_tools:integration"]],
  origin: "https://example.org/acme",
  installed_at: "2026-11-27T10:00:00Z",
  installed_by: "local",
  replaces: null,
  files: 4,
  bytes: 1200,
  state: "locked",
  reason: "off",
  detail: null,
  tools: [],
};
const VIEW: ExtensionStoreView = {
  enabled: true,
  tools_switch: false,
  max_bytes: 8 * 1048576,
  packages: [PACKAGE],
  revoked: [{ sha256: "b".repeat(64), revoked_at: "2026-11-26T10:00:00Z", revoked_by: "usr_alice" }],
  host_refused: [],
};

function serve(view: ExtensionStoreView = VIEW, profile = "desktop", upload?: Response) {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/auth/me") return json({ detail: "x", code: "not_found", params: {} }, 404);
    if (url === "/api/meta") return json({ profile });
    if (url === "/api/extensions" && (!init?.method || init.method === "GET")) return json(view);
    if (url === "/api/extensions" && init?.method === "POST") return upload ?? json({ ...PACKAGE, reason: "pending" }, 201);
    if (url === `/api/extensions/${HASH}/revoke` && init?.method === "POST") return json({ ...view, packages: [] });
    if (url === `/api/extensions/${HASH}` && init?.method === "DELETE") return json({ ...view, packages: [] });
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

describe("ExtensionsPage", () => {
  it("lists packages as locked while the switch is off, with the reason and the revoked hashes", async () => {
    serve();
    show(<ExtensionsPage />);
    const row = await screen.findByTestId("extension-row");
    expect(within(row).getByText("acme-store 1.0")).toBeInTheDocument();
    expect(within(row).getByText("Gesperrt")).toBeInTheDocument();
    expect(within(row).getByText(/Erweiterungswerkzeuge sind ausgeschaltet/)).toBeInTheDocument();
    expect(within(row).getByText(shortHash(HASH))).toHaveAttribute("title", HASH);
    expect(screen.getByTestId("extensions-locked")).toHaveTextContent("nicht eingeschaltet");
    expect(screen.getByTestId("extensions-revoked")).toHaveTextContent("usr_alice");
  });

  it("sends nothing until the file, a valid hash and the origin are given", async () => {
    const fetch = serve({ ...VIEW, packages: [] });
    show(<ExtensionsPage />);
    expect(await screen.findByTestId("extensions-empty")).toBeInTheDocument();
    const submit = screen.getByTestId("extension-submit");
    expect(submit).toBeDisabled();
    await userEvent.upload(screen.getByTestId("extension-file"), new File(["wheel"], "acme.whl"));
    await userEvent.type(screen.getByTestId("extension-sha256"), "not-a-hash");
    await userEvent.type(screen.getByTestId("extension-origin"), "https://example.org/acme");
    expect(submit).toBeDisabled();
    await userEvent.clear(screen.getByTestId("extension-sha256"));
    await userEvent.type(screen.getByTestId("extension-sha256"), HASH.toUpperCase());
    expect(submit).toBeEnabled();
    await userEvent.click(submit);
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/extensions", expect.objectContaining({ method: "POST" })));
    const body = fetch.mock.calls.find(([url, init]) => url === "/api/extensions" && init?.method === "POST")![1]!.body as FormData;
    expect(body.get("sha256")).toBe(HASH);
    expect(body.get("origin")).toBe("https://example.org/acme");
    expect(body.get("replaces")).toBeNull();
  });

  it("explains a refused upload by its reason", async () => {
    serve({ ...VIEW, packages: [] }, "desktop", json({ detail: "x", code: "extension_store.refused", params: { reason: "revoked" } }, 422));
    show(<ExtensionsPage />);
    await screen.findByTestId("extensions-empty");
    await userEvent.upload(screen.getByTestId("extension-file"), new File(["wheel"], "acme.whl"));
    await userEvent.type(screen.getByTestId("extension-sha256"), HASH);
    await userEvent.type(screen.getByTestId("extension-origin"), "https://example.org/acme");
    await userEvent.click(screen.getByTestId("extension-submit"));
    expect(await screen.findByText(/wurde widerrufen und wird nie wieder angenommen/)).toBeInTheDocument();
  });

  it("refuses a file larger than the store accepts before sending it", async () => {
    serve({ ...VIEW, packages: [], max_bytes: 4 });
    show(<ExtensionsPage />);
    await screen.findByTestId("extensions-empty");
    await userEvent.upload(screen.getByTestId("extension-file"), new File(["too large"], "acme.whl"));
    expect(screen.getByRole("alert")).toHaveTextContent("größer");
    expect(screen.getByTestId("extension-submit")).toBeDisabled();
  });

  it("revokes a package only after a confirmation", async () => {
    const fetch = serve();
    show(<ExtensionsPage />);
    const row = await screen.findByTestId("extension-row");
    await userEvent.click(within(row).getByRole("button", { name: "acme-store widerrufen" }));
    expect(fetch.mock.calls.map(([url]) => url)).not.toContain(`/api/extensions/${HASH}/revoke`);
    await userEvent.click(await within(row).findByRole("button", { name: "acme-store widerrufen: Endgültig widerrufen?" }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(`/api/extensions/${HASH}/revoke`, expect.objectContaining({ method: "POST" })),
    );
  });
});

describe("ExtensionsLink", () => {
  it("is not offered on a server, which has no store", async () => {
    serve(VIEW, "server");
    show(<ExtensionsLink />);
    await waitFor(() => expect(screen.queryByTestId("extensions-link")).not.toBeInTheDocument());
  });
});

describe("helpers", () => {
  it("know the lock reasons and the refusal reasons", () => {
    expect(lockReason("not_secured")).toBe("not_secured");
    expect(lockReason("something")).toBeUndefined();
    expect(refineProblem("extension_store.refused", { reason: "dependency" }, "").code).toBe("extension_store.refused_dependency");
    expect(refineProblem("extension_store.refused", { reason: "unknown" }, "").code).toBe("extension_store.refused");
  });
});
