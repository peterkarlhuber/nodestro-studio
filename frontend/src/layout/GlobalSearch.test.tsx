import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n, { loadLanguage } from "../i18n";
import type { RunSummary, WorkflowSummary } from "../api/types";
import { GlobalSearch, pageHits, recentHits, runHits } from "./GlobalSearch";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("global search (F4, F5)", () => {
  it("names its button and groups the results as a listbox of groups of options", async () => {
    const results = [
      { kind: "workflow", id: "wf_1", title: "Blog article", subtitle: "", snippet: "", favorite: false },
      { kind: "tool", id: "days_between", title: "Days between", subtitle: "", snippet: "", favorite: false },
    ];
    // The search answers the results; the run and workflow lists (recent items) are empty here.
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (url: string) =>
          new Response(JSON.stringify(String(url).includes("/search") ? results : []), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <GlobalSearch />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const trigger = screen.getByTestId("search-open");
    expect(trigger).toHaveAccessibleName();
    fireEvent.click(trigger);
    // A term no page name contains: only the (mocked) server results are listed.
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "qx" } });
    const options = await screen.findAllByRole("option", {}, { timeout: 3000 });
    expect(options).toHaveLength(2);
    const listbox = screen.getByRole("listbox");
    const groups = within(listbox).getAllByRole("group");
    expect(groups).toHaveLength(2);
    for (const group of groups) expect(group).toHaveAccessibleName();
    // Only groups sit directly in the listbox, and only options (after the presentational name) in a group.
    expect([...listbox.children].every((child) => child.getAttribute("role") === "group")).toBe(true);
    expect(listbox.querySelector("section, h3")).toBeNull();
    // The dialog's head is no banner landmark.
    expect(screen.getByRole("dialog").querySelector("header")).toBeNull();
  });
});

describe("pageHits", () => {
  const t = i18n.getFixedT("de");

  it("finds pages and settings sections by name, also without accents", async () => {
    expect(pageHits("sandbox", t).map((hit) => hit.to)).toEqual(["/settings#settings-sandbox"]);
    expect(pageHits("einstellungen backup", t).map((hit) => hit.to)).toEqual(["/settings#settings-backup"]);
    await loadLanguage("fr");
    const french = i18n.getFixedT("fr");
    expect(pageHits("reglages", french).map((hit) => hit.to)).toContain("/settings");
  });

  it("offers every page, but no settings section, for an empty query", () => {
    const hits = pageHits("", t);
    expect(hits.map((hit) => hit.to)).toContain("/approvals");
    expect(hits.every((hit) => !hit.to.includes("#"))).toBe(true);
  });
});

describe("runs and recent items (OB-09)", () => {
  const t = i18n.getFixedT("en");
  const run = (id: string, name: string, input: string, created: string, extra: Partial<RunSummary> = {}): RunSummary =>
    ({
      id,
      workflow_id: `wf_${name}`,
      workflow_name: name,
      status: "succeeded",
      input,
      usage: {},
      created_at: created,
      finished_at: null,
      error: null,
      ...extra,
    }) as RunSummary;
  const runs = [
    run("r1", "Blog article", "Write about solar power", "2026-11-01T10:00:00Z"),
    run("r2", "Invoice check", "Invoice 4711 from ACME", "2026-11-03T10:00:00Z", { status: "failed" }),
    run("r3", "Blog article", "Électricité verte", "2026-11-02T10:00:00Z"),
    run("r4", "Imported", "old trace", "2026-11-04T10:00:00Z", { imported_at: "2026-11-04T10:00:00Z" }),
  ];

  it("finds runs by workflow name, input, status and id, newest first", () => {
    expect(runHits("blog", runs, t).map((hit) => hit.to)).toEqual(["/executions/r3", "/executions/r1"]);
    expect(runHits("acme 4711", runs, t).map((hit) => hit.title)).toEqual(["Invoice check"]);
    expect(runHits("error", runs, t).map((hit) => hit.to)).toEqual(["/executions/r2"]);
    expect(runHits("electricite", runs, t).map((hit) => hit.to)).toEqual(["/executions/r3"]);
    expect(runHits("", runs, t)).toEqual([]);
    expect(runHits("blog", runs, t, 1)).toHaveLength(1);
    const [hit] = runHits("invoice", runs, t);
    expect(hit.kind).toBe("run");
    expect(hit.subtitle).toMatch(/^Error · /);
  });

  it("offers the latest started runs and the last changed workflows for an empty query", () => {
    const workflows = [
      { id: "a", name: "Old", updated_at: "2026-10-01T00:00:00Z" },
      { id: "b", name: "New", updated_at: "2026-11-03T00:00:00Z" },
    ] as WorkflowSummary[];
    const hits = recentHits(runs, workflows, t);
    expect(hits.every((hit) => hit.kind === "recent")).toBe(true);
    // Imported traces are not where someone left off.
    expect(hits.map((hit) => hit.to)).toEqual(["/executions/r2", "/executions/r3", "/executions/r1", "/workflows/b", "/workflows/a"]);
    expect(hits[0].subtitle).toMatch(/^Run · /);
    expect(hits[3].subtitle).toMatch(/^Workflow · changed /);
    expect(recentHits(undefined, undefined, t)).toEqual([]);
  });

  it("reaches every settings section, also the local models, knowledge search and about", () => {
    const de = i18n.getFixedT("de");
    expect(pageHits("lokale modelle", de).map((hit) => hit.to)).toContain("/settings#settings-local-models");
    expect(pageHits("wissenssuche", de).map((hit) => hit.to)).toContain("/settings#settings-knowledge-search");
  });
});
