// The shared library gallery with the kinds Examples · Building blocks · Agents · Skills (NAL-B3).

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LibrarySkill, PartSummary } from "../api/skills";
import { ExamplesPage } from "../pages/ExamplesPage";
import { filterParts } from "./LibraryParts";
import { filterSkills } from "./LibrarySkills";

const PARTS: PartSummary[] = [
  {
    id: "idea-market",
    language: "de",
    name: "Marktteam",
    description: "Prüft Markt und Zielgruppen",
    capabilities: ["Marktanalyse", "Zielgruppen"],
    agents: 1,
    parts: [],
    templates: ["business-idea"],
  },
  {
    id: "quality-check",
    language: "de",
    name: "Qualitätsprüfung",
    description: "Prüft ein Ergebnis",
    capabilities: [],
    agents: 2,
    parts: [],
    templates: ["production-downtime"],
  },
];

const SKILLS: LibrarySkill[] = [
  {
    name: "research-method-de",
    family: "research-method",
    language: "de",
    description: "Recherchiert im Web mit Quellen",
    version: "0.3.0+r1",
    files: [{ path: "SKILL.md", size: 900, text: true, script: false }],
  },
];

const EXAMPLES = [
  {
    id: "business-idea",
    number: 1,
    language: "de",
    category: "business",
    field: "Gründung",
    name: "Geschäftsidee prüfen",
    description: "Prüft eine Idee",
    level: "advanced",
    pattern: "adaptive",
    featured: false,
    sensitive: false,
    agents: 3,
    features: [],
    tools: [],
    teams: 5,
  },
];

const requests: { method: string; path: string; body: unknown }[] = [];

beforeEach(() => {
  requests.length = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = url.replace(/\?.*$/, "");
      const method = init?.method ?? "GET";
      requests.push({ method, path, body: init?.body ? (JSON.parse(String(init.body)) as unknown) : null });
      let body: unknown = [];
      if (path.endsWith("/library/parts")) body = PARTS;
      else if (path.endsWith("/library/parts/idea-market"))
        body = {
          ...PARTS[0],
          workflow: {
            name: "Marktteam",
            nodes: [{ id: "a", type: "agent", label: "Marktanalyst", position: { x: 0, y: 0 }, agent: null }],
            edges: [],
          },
        };
      else if (path.endsWith("/library/parts/idea-market/copy")) body = { id: "wf_part", name: "Marktteam" };
      else if (path.endsWith("/library/skills")) body = SKILLS;
      else if (path.endsWith("/library/skills/research-method-de")) body = { ...SKILLS[0], body: "# Methode\n<b>kein HTML</b>" };
      else if (path.endsWith("/library/skills/research-method-de/copy")) body = { id: "skl_1", name: "research-method-de" };
      else if (path.endsWith("/library")) body = EXAMPLES;
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function showGallery(entry = "/workflows/examples") {
  const router = createMemoryRouter(
    [
      { path: "/workflows/examples", element: <ExamplesPage /> },
      { path: "/workflows/:id", element: <p>Workflow geöffnet</p> },
      { path: "/skills", element: <p>Skills geöffnet</p> },
    ],
    { initialEntries: [entry] },
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe("filters", () => {
  it("finds building blocks by capability and skills by description", () => {
    expect(filterParts(PARTS, "zielgr").map((part) => part.id)).toEqual(["idea-market"]);
    expect(filterParts(PARTS, "").length).toBe(2);
    expect(filterSkills(SKILLS, "quellen").length).toBe(1);
    expect(filterSkills(SKILLS, "nichts").length).toBe(0);
  });
});

describe("the shared library gallery", () => {
  it("shows the four kinds with examples first, as before", async () => {
    showGallery();
    for (const kind of ["examples", "parts", "agents", "skills"]) expect(screen.getByTestId(`library-kind-${kind}`)).toBeInTheDocument();
    expect(await screen.findByTestId("example-business-idea")).toBeInTheDocument();
    // The category filter of the examples is still there.
    expect(screen.getByText("Alle")).toBeInTheDocument();
  });

  it("copies a building block as a workflow", async () => {
    const router = showGallery("/workflows/examples?kind=parts");
    expect(await screen.findByTestId("library-part-idea-market")).toBeInTheDocument();
    expect(await screen.findByText(/Genutzt in: Geschäftsidee prüfen/)).toBeInTheDocument();
    await userEvent.click(screen.getByText("Marktteam"));
    expect(await screen.findByText("Marktanalyst")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Als Workflow übernehmen" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/workflows/wf_part"));
    expect(requests.find((item) => item.path.endsWith("/copy"))?.body).toEqual({ language: "de" });
  });

  it("previews a skill as text and takes it over", async () => {
    const router = showGallery("/workflows/examples?kind=skills");
    await userEvent.click(await screen.findByText("research-method"));
    const body = await screen.findByText(/kein HTML/);
    expect(body.tagName).toBe("PRE");
    await userEvent.click(screen.getByRole("button", { name: "Als Skill übernehmen" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/skills"));
    expect(router.state.location.search).toBe("?skill=skl_1");
  });

  it("shows the shipped agents open", async () => {
    showGallery("/workflows/examples?kind=agents");
    expect(await screen.findByTestId("library-agents")).toBeInTheDocument();
  });
});
