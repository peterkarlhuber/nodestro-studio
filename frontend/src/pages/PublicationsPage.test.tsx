import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ExportRecord, PublicationOverviewItem } from "../api/types";
import i18n from "../i18n";
import { AUTOMATE_AND_TEST } from "../layout/AppShell";
import {
  apiDialogHref,
  filterFromParams,
  matchesQuery,
  paramsFromFilter,
  publicationStatus,
  visiblePublications,
} from "../publish/publicationsList";
import { routes } from "../routes";
import { PublicationsPage } from "./PublicationsPage";

const record = (id: string, kind: "standard" | "portable", created: string): ExportRecord => ({
  id,
  publication_id: "pub_a",
  release_id: "rel_1",
  release_number: 1,
  created_at: created,
  options: {
    kind,
    orkexa: "bundle",
    confirm_distribution: true,
    knowledge: [],
    memory: [],
    language: "en",
    guide_id: null,
    web_ui: false,
    platform: kind === "portable" ? "linux-x86_64" : null,
    local_models: false,
    offline: false,
    confirm_models: false,
    allow_downloads: false,
    output_dir: "",
  },
  file_name: `${id}.zip`,
  size: 2048,
  sha256: "x",
  files: 3,
  warnings: [],
  runtime: {},
});

const item = (patch: Partial<PublicationOverviewItem>): PublicationOverviewItem => ({
  id: "pub_x",
  slug: "x",
  name: "X",
  workflow_id: "wf_x",
  enabled: true,
  network: false,
  active_release: 1,
  workflow_name: "X",
  created_at: "2026-11-01T10:00:00Z",
  updated_at: "2026-11-01T10:00:00Z",
  active_version: 1,
  published_at: "2026-11-01T10:00:00Z",
  exports: [],
  ...patch,
});

const OFFERS = item({
  id: "pub_a",
  slug: "angebote",
  name: "Angebote schreiben",
  workflow_id: "wf_a",
  workflow_name: "Angebote (neu)",
  active_release: 2,
  active_version: 7,
  published_at: "2026-11-03T09:00:00Z",
  network: true,
  exports: [record("exp_new", "portable", "2026-11-05T12:00:00Z"), record("exp_old", "standard", "2026-11-04T12:00:00Z")],
});
const INVOICES = item({
  id: "pub_b",
  slug: "rechnungen",
  name: "Rechnungen prüfen",
  workflow_id: "wf_b",
  workflow_name: "Rechnungen",
  enabled: false,
  published_at: "2026-11-05T09:00:00Z",
});
const ZEBRA = item({ id: "pub_c", slug: "zebra", name: "Zebra", workflow_id: "wf_c", workflow_name: "Zoo", published_at: "2026-10-01T09:00:00Z" });

function stubApi(items: PublicationOverviewItem[]) {
  const fetch = vi.fn(async (url: string) => {
    const body = url.endsWith("/api/publication-overview") ? items : [];
    return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function Address() {
  const location = useLocation();
  return <output data-testid="address">{location.search}</output>;
}

function show(items: PublicationOverviewItem[], path = "/publications") {
  stubApi(items);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <PublicationsPage />
        <Address />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const rowNames = () => screen.getAllByTestId("publication-row").map((row) => row.querySelector("strong")!.textContent);

describe("PublicationsPage", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("lists every publication with workflow, status, active version and publication date", async () => {
    show([ZEBRA, INVOICES, OFFERS]);
    await screen.findByTestId("publications-table");
    expect(rowNames()).toEqual(["Angebote schreiben", "Rechnungen prüfen", "Zebra"]);
    const offers = screen.getAllByTestId("publication-row")[0];
    expect(offers).toHaveTextContent("/api/published/angebote");
    expect(offers).toHaveTextContent("Angebote (neu)");
    expect(offers).toHaveTextContent("Aktiv");
    expect(offers).toHaveTextContent("Netzwerk");
    expect(offers).toHaveTextContent("v2");
    expect(offers).toHaveTextContent("Workflow-Version 7");
    expect(screen.getAllByTestId("publication-row")[1]).toHaveTextContent("Ausgeschaltet");
    expect(screen.getByTestId("publications-count")).toHaveTextContent("3 Veröffentlichungen");
    expect(screen.getByRole("heading", { level: 1, name: "Veröffentlichungen" })).toBeInTheDocument();
  });

  it("shows the export history with date, type and a download link per export", async () => {
    show([OFFERS, INVOICES]);
    await screen.findByTestId("publications-table");
    const history = screen.getByTestId("publication-exports");
    const links = within(history).getAllByRole("link", { hidden: true });
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/api/exports/exp_new/download", "/api/exports/exp_old/download"]);
    expect(links[0]).toHaveAttribute("download", "exp_new.zip");
    expect(links[0]).toHaveAccessibleName("exp_new.zip herunterladen");
    expect(history).toHaveTextContent("Startfertiges Paket");
    expect(history).toHaveTextContent("Quellprojekt (FastAPI)");
    expect(screen.getAllByTestId("publication-row")[0]).toHaveTextContent("2 Exporte");
    expect(screen.getAllByTestId("publication-row")[1]).toHaveTextContent("Noch keine Exporte");
  });

  it("offers exactly one quick link per entry, to the editor with the API & Export dialog open", async () => {
    show([OFFERS, INVOICES]);
    await screen.findByTestId("publications-table");
    const rows = screen.getAllByTestId("publication-row");
    for (const [row, workflow, name] of [
      [rows[0], "wf_a", "Angebote schreiben"],
      [rows[1], "wf_b", "Rechnungen prüfen"],
    ] as const) {
      const links = within(row).getAllByRole("link").filter((link) => !link.hasAttribute("download"));
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute("href", `/workflows/${workflow}?api=1`);
      expect(links[0]).toHaveTextContent("API & Export öffnen");
      expect(links[0]).toHaveAccessibleName(`API & Export öffnen: ${name}`);
    }
    // The workflow's name is plain text, not a second link.
    expect(within(rows[0]).getByText("Angebote (neu)").closest("a")).toBeNull();
  });

  it("searches, filters by status and sorts, and keeps the choice in the address", async () => {
    const user = userEvent.setup();
    show([ZEBRA, INVOICES, OFFERS]);
    await screen.findByTestId("publications-table");
    await user.type(screen.getByTestId("publications-search"), "rechnung");
    expect(rowNames()).toEqual(["Rechnungen prüfen"]);
    expect(screen.getByTestId("address")).toHaveTextContent("?q=rechnung");
    await user.clear(screen.getByTestId("publications-search"));
    await user.selectOptions(screen.getByTestId("publications-status"), "live");
    expect(rowNames()).toEqual(["Angebote schreiben", "Zebra"]);
    await user.selectOptions(screen.getByTestId("publications-status"), "");
    await user.selectOptions(screen.getByTestId("publications-sort"), "published");
    expect(rowNames()).toEqual(["Rechnungen prüfen", "Angebote schreiben", "Zebra"]);
    await user.selectOptions(screen.getByTestId("publications-sort"), "exported");
    expect(rowNames()[0]).toBe("Angebote schreiben");
    expect(screen.getByTestId("address")).toHaveTextContent("sort=exported");
  });

  it("says when nothing matches and resets the filter", async () => {
    const user = userEvent.setup();
    show([OFFERS], "/publications?q=nichts");
    expect(await screen.findByText("Keine Veröffentlichung passt zum Filter")).toBeInTheDocument();
    expect(screen.queryByTestId("publications-table")).toBeNull();
    await user.click(screen.getByTestId("publications-clear-filters"));
    expect(rowNames()).toEqual(["Angebote schreiben"]);
  });

  it("has an empty state without publications", async () => {
    show([]);
    expect(await screen.findByText("Noch keine API veröffentlicht")).toBeInTheDocument();
    expect(screen.queryByTestId("publications-search")).toBeNull();
    expect(screen.queryByTestId("publications-table")).toBeNull();
  });

  it("is translated, e.g. in English", async () => {
    await i18n.changeLanguage("en");
    show([OFFERS]);
    await screen.findByTestId("publications-table");
    expect(screen.getByRole("heading", { level: 1, name: "Publications" })).toBeInTheDocument();
    expect(screen.getByTestId("publication-open-api")).toHaveTextContent("Open API & Export");
    expect(screen.getByTestId("publication-exports")).toHaveTextContent("Ready-to-run package");
  });
});

describe("publication overview logic", () => {
  it("derives the status from switched on and the active version", () => {
    expect(publicationStatus({ enabled: true, active_release: 1 })).toBe("live");
    expect(publicationStatus({ enabled: false, active_release: 1 })).toBe("off");
    expect(publicationStatus({ enabled: true, active_release: null })).toBe("noVersion");
  });

  it("matches name, address and workflow, ignoring case and accents", () => {
    expect(matchesQuery(INVOICES, "PRUFEN")).toBe(true);
    expect(matchesQuery(OFFERS, "/api/published/angebote")).toBe(true);
    expect(matchesQuery(OFFERS, "neu angebote")).toBe(true);
    expect(matchesQuery(OFFERS, "zebra")).toBe(false);
  });

  it("reads only known filter values from the address", () => {
    expect(filterFromParams(new URLSearchParams("status=bogus&sort=bogus"))).toEqual({ query: "", status: null, sort: "name" });
    expect(filterFromParams(new URLSearchParams("q=a&status=off&sort=published"))).toEqual({ query: "a", status: "off", sort: "published" });
    expect(paramsFromFilter({ query: "a b", status: "off", sort: "published" }).toString()).toBe("q=a+b&status=off&sort=published");
    expect(paramsFromFilter({ query: "", status: null, sort: "name" }).toString()).toBe("");
  });

  it("sorts publications without exports after those with exports", () => {
    expect(visiblePublications([ZEBRA, OFFERS], { query: "", status: null, sort: "exported" }).map((entry) => entry.id)).toEqual(["pub_a", "pub_c"]);
  });

  it("links to the editor with the dialog parameter", () => {
    expect(apiDialogHref("wf_1")).toBe("/workflows/wf_1?api=1");
  });
});

describe("Publications navigation", () => {
  it("sits in Automate & test directly before Test series", () => {
    const paths = AUTOMATE_AND_TEST.map((entry) => entry.to);
    expect(paths.indexOf("/publications")).toBe(paths.indexOf("/tests") - 1);
    expect(AUTOMATE_AND_TEST[paths.indexOf("/publications")].label).toBe("publications");
  });

  it("has its own route in the studio frame", () => {
    const frame = routes.find((route) => route.children?.some((child) => child.path === "publications"));
    expect(frame).toBeDefined();
  });
});
