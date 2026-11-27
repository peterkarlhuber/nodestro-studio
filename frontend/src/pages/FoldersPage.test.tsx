// Granted folders (N-10): the page says when they are off and reads nothing then; lists grants, grants a folder with
// the server's own refusal shown, revokes, shows an access log, and explains the permission to a non-administrator.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { FolderGrantView } from "../api/types";
import { EMPTY_DRAFT, FoldersLink, FoldersPage, grantBody, lines } from "./FoldersPage";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const LIMITS = {
  max_file_bytes: 10485760,
  max_entries: 2000,
  max_search_files: 2000,
  max_results: 50,
  max_chars: 50000,
  pdf_pages: 200,
  pdf_seconds: 20,
  pdf_memory_mb: 256,
};

const VIEW: FolderGrantView = {
  folder: {
    id: "fld_1",
    name: "Contracts",
    path: "/Users/alex/Contracts",
    access: "read",
    include: [],
    exclude: [],
    limits: LIMITS,
    default_excludes: true,
    index: false,
    grant_id: "agr_9",
    created_by: "usr_alice",
    created_at: "2026-11-20T10:00:00Z",
  },
  status: "active",
  scope: "all",
  agents: [],
  mode: "supervised",
  expires_at: null,
  revoked_at: null,
  revoked_by: null,
};

function serve(enabled: boolean, overrides: (url: string, init?: RequestInit) => Response | undefined = () => undefined) {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    const special = overrides(url, init);
    if (special) return special;
    if (url === "/api/auth/me") return json({ detail: "x", code: "not_found", params: {} }, 404);
    if (url === "/api/meta") return json({ profile: "desktop" });
    if (url === "/api/folders/state") return json({ enabled, limits: LIMITS, bounds: {} });
    if (url === "/api/folders" && (init?.method ?? "GET") === "GET") return json([VIEW]);
    if (url === "/api/folders/fld_1" && init?.method === "DELETE") return json({ ...VIEW, status: "revoked" });
    if (url.startsWith("/api/folders/fld_1/accesses"))
      return json([
        { at: "2026-11-21T09:00:00Z", action: "folder.read", agent: "wf_1/writer", outcome: "success", code: null, run_id: "run_7", conversation_id: null },
        { at: "2026-11-21T08:00:00Z", action: "folder.searched", agent: "wf_1/writer", outcome: "denied", code: "fs.too_large", run_id: null, conversation_id: null },
      ]);
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

const urls = (fetch: ReturnType<typeof vi.fn>) => fetch.mock.calls.map(([url]) => url);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("FoldersPage", () => {
  it("says granted folders are off, offers no way to switch them on and reads no grants", async () => {
    const fetch = serve(false);
    show(<FoldersPage />);
    expect(await screen.findByTestId("folders-off")).toHaveTextContent("Freigegebene Ordner sind aus.");
    expect(screen.queryByTestId("folder-grant-open")).not.toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(urls(fetch)).not.toContain("/api/folders");
    expect(fetch.mock.calls.some(([, init]) => init?.method && init.method !== "GET")).toBe(false);
  });

  it("lists the grants with path, who granted them and their state", async () => {
    serve(true);
    show(<FoldersPage />);
    const list = await screen.findByTestId("folders-list");
    expect(await within(list).findByText("Contracts")).toBeInTheDocument();
    expect(within(list).getByText("/Users/alex/Contracts")).toBeInTheDocument();
    expect(within(list).getByText(/usr_alice/)).toBeInTheDocument();
    expect(within(list).getByText("Aktiv")).toBeInTheDocument();
    expect(within(list).getByText("Alle Agenten")).toBeInTheDocument();
  });

  it("grants a folder and shows the server's reason when it refuses the path", async () => {
    let refuse = true;
    const fetch = serve(true, (url, init) => {
      if (url !== "/api/folders" || init?.method !== "POST") return undefined;
      if (refuse) return json({ detail: "This folder cannot be granted", code: "folder.not_grantable", params: { reason: "protected_root" } }, 422);
      return json(VIEW, 201);
    });
    show(<FoldersPage />);
    await userEvent.click(await screen.findByTestId("folder-grant-open"));
    await userEvent.type(screen.getByTestId("folder-name"), "Contracts");
    await userEvent.type(screen.getByTestId("folder-path"), "/etc");
    await userEvent.click(screen.getByTestId("folder-grant-submit"));
    expect(await screen.findByTestId("folder-grant-error")).toHaveTextContent("Dieser Ordner ist geschützt");
    const posted = fetch.mock.calls.find(([url, init]) => url === "/api/folders" && init?.method === "POST");
    expect(JSON.parse(String(posted?.[1]?.body))).toMatchObject({ name: "Contracts", path: "/etc", scope: "all", default_excludes: true, expires_at: null });

    refuse = false;
    await userEvent.clear(screen.getByTestId("folder-path"));
    await userEvent.type(screen.getByTestId("folder-path"), "/Users/alex/Contracts");
    await userEvent.click(screen.getByTestId("folder-grant-submit"));
    await waitFor(() => expect(screen.queryByTestId("folder-grant-form")).not.toBeInTheDocument());
  });

  it("chooses the path in the folder browser: sub-folders only, up a level, and the chosen folder fills the path", async () => {
    const listing = (path: string, parent: string | null, folders: string[]) =>
      json({
        path,
        parent,
        folders: folders.map((name) => ({ name, path: `${path}/${name}`, link: false })),
        truncated: false,
        places: [{ kind: "home", path: "/Users/alex" }],
        separator: "/",
      });
    const fetch = serve(true, (url, init) => {
      if (url !== "/api/folders/browse") return undefined;
      const { path } = JSON.parse(String(init?.body)) as { path: string | null };
      if (path === null || path === "/Users/alex") return listing("/Users/alex", "/Users", ["Contracts", "Photos"]);
      if (path === "/Users/alex/Contracts") return listing("/Users/alex/Contracts", "/Users/alex", ["2026"]);
      return json({ detail: "hidden", code: "folder.not_browsable", params: { reason: "hidden" } }, 422);
    });
    show(<FoldersPage />);
    await userEvent.click(await screen.findByTestId("folder-grant-open"));
    // The browser opens at the typed path; a hidden place says so and offers the way home.
    await userEvent.type(screen.getByTestId("folder-path"), "/etc");
    await userEvent.click(screen.getByTestId("folder-browse"));
    const browser = await screen.findByTestId("folder-browser");
    expect(await within(browser).findByTestId("folder-browse-error")).toHaveTextContent("Dieser Ort ist geschützt");
    await userEvent.click(within(browser).getByRole("button", { name: "Zurück zum Benutzerordner" }));
    expect(await within(browser).findByTestId("folder-browse-path")).toHaveTextContent("/Users/alex");
    await userEvent.click(within(browser).getByRole("button", { name: /Contracts/ }));
    expect(await within(browser).findByText("2026")).toBeInTheDocument();
    expect(within(browser).getByTestId("folder-browse-path")).toHaveTextContent("/Users/alex/Contracts");
    // One level up is the parent the server named.
    await userEvent.click(within(browser).getByTestId("folder-browse-up"));
    expect(await within(browser).findByText("Photos")).toBeInTheDocument();
    await userEvent.click(within(browser).getByRole("button", { name: /Contracts/ }));
    await within(browser).findByText("2026");
    await userEvent.click(screen.getByTestId("folder-browse-choose"));
    expect(screen.getByTestId("folder-path")).toHaveValue("/Users/alex/Contracts");
    expect(screen.queryByTestId("folder-browser")).not.toBeInTheDocument();
    // Browsing never grants anything: only POSTs to the browser so far.
    expect(fetch.mock.calls.filter(([url, init]) => init?.method === "POST" && url !== "/api/folders/browse")).toEqual([]);
  });

  it("keeps the typed path when the browser needs the window's own session", async () => {
    serve(true, (url) =>
      url === "/api/folders/browse" ? json({ detail: "session", code: "folder.session_required", params: {} }, 403) : undefined,
    );
    show(<FoldersPage />);
    await userEvent.click(await screen.findByTestId("folder-grant-open"));
    await userEvent.type(screen.getByTestId("folder-path"), "/Users/alex/Contracts");
    await userEvent.click(screen.getByTestId("folder-browse"));
    expect(await screen.findByTestId("folder-browse-error")).toHaveTextContent("Gib stattdessen den vollständigen Pfad");
    expect(screen.getByTestId("folder-browse-choose")).toBeDisabled();
    const dialog = screen.getByTestId("folder-browser").closest("dialog")!;
    await userEvent.click(within(dialog as HTMLElement).getByRole("button", { name: "Abbrechen" }));
    expect(screen.getByTestId("folder-path")).toHaveValue("/Users/alex/Contracts");
  });

  it("shows the state of each grant's search index, never a file name", async () => {
    const indexed = (id: string, index_state: FolderGrantView["index_state"]): FolderGrantView => ({
      ...VIEW,
      folder: { ...VIEW.folder, id, name: `Folder ${id}`, index: true },
      index_state,
    });
    serve(true, (url, init) =>
      url === "/api/folders" && (init?.method ?? "GET") === "GET"
        ? json([
            VIEW,
            indexed("fld_r", { state: "ready", files: 12, chunks: 40, skipped: 1, last_indexed_at: "2026-11-27T08:00:00Z", code: null }),
            indexed("fld_i", { state: "indexing", files: 0, chunks: 0, skipped: 0, last_indexed_at: null, code: null }),
            indexed("fld_b", { state: "budget_exceeded", files: 2000, chunks: 50000, skipped: 0, last_indexed_at: "2026-11-27T08:00:00Z", code: null }),
            indexed("fld_f", { state: "failed", files: 0, chunks: 0, skipped: 0, last_indexed_at: null, code: "fs.root_changed" }),
            { ...indexed("fld_x", { state: "off" }), status: "revoked" },
          ])
        : undefined,
    );
    show(<FoldersPage />);
    const ready = await screen.findByTestId("folder-index-fld_r");
    expect(ready).toHaveTextContent("Index bereit");
    expect(ready).toHaveTextContent("12 Dateien indexiert (40 Abschnitte)");
    expect(ready).toHaveTextContent("1 Datei übersprungen");
    expect(screen.getByTestId("folder-index-fld_i")).toHaveTextContent("Wird indexiert");
    expect(screen.getByTestId("folder-index-fld_b")).toHaveTextContent("Index unvollständig");
    expect(screen.getByTestId("folder-index-fld_b")).toHaveTextContent("an einer Grenze ausgelassen");
    expect(screen.getByTestId("folder-index-fld_f")).toHaveTextContent("Index fehlgeschlagen");
    expect(screen.getByTestId("folder-index-fld_f")).toHaveTextContent("verschoben oder durch einen anderen Ordner ersetzt");
    expect(screen.getByTestId("folder-index-fld_x")).toHaveTextContent("Kein Index");
    // A grant without an index shows nothing about one.
    expect(screen.queryByTestId("folder-index-fld_1")).not.toBeInTheDocument();
  });

  it("grants a folder with a search index only when it is turned on", async () => {
    const fetch = serve(true, (url, init) => (url === "/api/folders" && init?.method === "POST" ? json(VIEW, 201) : undefined));
    show(<FoldersPage />);
    await userEvent.click(await screen.findByTestId("folder-grant-open"));
    const index = screen.getByRole("switch", { name: /Suchindex anlegen/ });
    expect(index).toHaveAttribute("aria-checked", "false");
    await userEvent.click(index);
    await userEvent.type(screen.getByTestId("folder-name"), "Contracts");
    await userEvent.type(screen.getByTestId("folder-path"), "/Users/alex/Contracts");
    await userEvent.click(screen.getByTestId("folder-grant-submit"));
    await waitFor(() => expect(fetch.mock.calls.some(([url, init]) => url === "/api/folders" && init?.method === "POST")).toBe(true));
    const posted = fetch.mock.calls.find(([url, init]) => url === "/api/folders" && init?.method === "POST");
    expect(JSON.parse(String(posted?.[1]?.body)).index).toBe(true);
  });

  it("revokes an active grant after a confirmation", async () => {
    const fetch = serve(true);
    show(<FoldersPage />);
    const list = await screen.findByTestId("folders-list");
    await within(list).findByText("Contracts");
    await userEvent.click(within(list).getByRole("button", { name: "Widerrufen" }));
    await userEvent.click(await within(list).findByRole("button", { name: "Widerrufen: Jetzt widerrufen" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/folders/fld_1", expect.objectContaining({ method: "DELETE" })));
  });

  it("shows the access log of a grant with outcomes and a link to the run", async () => {
    serve(true);
    show(<FoldersPage />);
    const toggle = await screen.findByTestId("folder-log-toggle-fld_1");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const log = await screen.findByTestId("folder-log-fld_1");
    expect(within(log).getByText(/Datei gelesen/)).toBeInTheDocument();
    expect(within(log).getByText("Abgelehnt")).toBeInTheDocument();
    expect(within(log).getByRole("link", { name: "Ausführung öffnen" })).toHaveAttribute("href", "/executions/run_7");
  });

  it("explains the permission to someone who is not an administrator", async () => {
    const me = { user_id: "usr_v", tenant_id: "acme", role: "viewer", permissions: ["read"], tenants: { acme: "viewer" } };
    const fetch = serve(true, (url) => {
      if (url === "/api/auth/me") return json(me);
      // A backend that does not name its profile: the signed-in user decides.
      if (url === "/api/meta") return json({});
      return undefined;
    });
    show(<FoldersPage />);
    expect(await screen.findByTestId("permission-note-admin")).toBeInTheDocument();
    expect(urls(fetch)).not.toContain("/api/folders");
  });
});

describe("FoldersLink", () => {
  it("leads administrators to the page, also while the feature is off", async () => {
    serve(false);
    show(<FoldersLink />);
    expect(await screen.findByTestId("folders-link")).toHaveTextContent("Freigegebene Ordner");
  });

  it("is not offered on a server, which has no folders of a person", async () => {
    serve(false, (url) => (url === "/api/meta" ? json({ profile: "server" }) : url === "/api/auth/me" ? json({ user_id: "u", tenant_id: "t", role: "owner", permissions: ["admin"], tenants: {} }) : undefined));
    show(<FoldersLink />);
    await waitFor(() => expect(screen.queryByTestId("folders-link")).not.toBeInTheDocument());
  });
});

describe("grantBody", () => {
  it("sends one pattern or agent per line and names agents only for that scope", () => {
    expect(lines(" *.pdf \n\nreports/**\n")).toEqual(["*.pdf", "reports/**"]);
    expect(grantBody({ ...EMPTY_DRAFT, name: " A ", path: " /x ", agents: "wf_1/a" })).toMatchObject({ name: "A", path: "/x", agents: [], expires_at: null, index: false });
    expect(grantBody({ ...EMPTY_DRAFT, scope: "agents", agents: "wf_1/a\nwf_2/b" }).agents).toEqual(["wf_1/a", "wf_2/b"]);
    expect(grantBody({ ...EMPTY_DRAFT, expires: "2030-01-02T03:04" }).expires_at).toMatch(/^2030-01-0[12]T\d\d:04:00\.000Z$/);
  });
});
