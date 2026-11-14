// The shipped agent library, template versions and import on the agents page (NAL-B1).

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AgentConfig, AgentTemplate, AgentTemplateVersion, LibraryAgentSummary, TemplateMeta } from "../../api/types";
import { useToasts } from "../../components/toast";
import { defaultAgent } from "../../lib/defaults";
import { AgentsPage } from "../AgentsPage";
import { differences, originOf } from "./TemplateHistory";

vi.mock("../../components/CodeEditor", () => ({ CodeEditor: () => null }));

const META: TemplateMeta = {
  category: "text",
  summary: "Fasst Texte zusammen",
  requirements: { capabilities: [], min_tier: "fast", tools: [], services: [], offline_capable: true },
  origin: "user",
  examples: ["Fasse diesen Bericht zusammen"],
  tests: [{ name: "kurz", input: "x", expectations: ["kurz"] }],
  locale: "de",
};

const LIBRARY: LibraryAgentSummary[] = [
  {
    id: "summary",
    number: 2,
    category: "text",
    name: "Zusammenfasser",
    description: "Fasst zusammen",
    icon: "bot",
    version: "0.3.0+r1",
    meta: META,
  },
];

function agent(prompt: string): AgentConfig {
  return { ...defaultAgent({ name: "Prüfer" }), system_prompt: prompt };
}

let templates: AgentTemplate[] = [];
let versions: AgentTemplateVersion[] = [];
const requests: { method: string; path: string; body: unknown }[] = [];

beforeEach(() => {
  requests.length = 0;
  templates = [];
  versions = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = url.replace(/\?.*$/, "");
      const method = init?.method ?? "GET";
      const sent = init?.body ? (JSON.parse(String(init.body)) as unknown) : null;
      requests.push({ method, path, body: sent });
      let body: unknown = [];
      if (path.endsWith("/library/agents")) body = LIBRARY;
      else if (path.endsWith("/library/agents/summary")) body = { ...LIBRARY[0], help: "Hilfe zum Zusammenfasser", agent: agent("p") };
      else if (path.endsWith("/library/agents/summary/copy")) {
        const copy = {
          id: "tpl_copy",
          agent: { ...agent("p"), name: "Zusammenfasser" },
          meta: { ...META, origin: "builtin:nodestro-examples@0.3.0+r1/summary" },
          version: 1,
          created_at: "2026-11-14T10:00:00Z",
          updated_at: "2026-11-14T10:00:00Z",
        } as unknown as AgentTemplate;
        templates = [copy];
        body = copy;
      } else if (path.endsWith("/agents/templates/import")) {
        const imported = {
          id: "tpl_imp",
          agent: agent("imp"),
          meta: { ...META, origin: `import:${"a".repeat(64)}` },
          version: 1,
          created_at: "2026-11-14T10:00:00Z",
          updated_at: "2026-11-14T10:00:00Z",
        } as unknown as AgentTemplate;
        templates = [imported];
        body = { template: imported, check: { issues: [] }, removed: ["tool_policies"] };
      } else if (path.endsWith("/versions")) body = versions;
      else if (path.endsWith("/agents/templates")) body = templates;
      else if (path.endsWith("/meta")) body = { providers: [], capabilities: [], models: [] };
      else if (path.endsWith("/settings")) body = { providers: [], default_model: "claude-sonnet-5-5", assistant_model: "claude-opus-5-5" };
      else if (path.endsWith("/organize")) body = { items: {}, tags: [] };
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function showPage() {
  const router = createMemoryRouter([{ path: "/agents", element: <AgentsPage /> }], { initialEntries: ["/agents"] });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("origin and comparison", () => {
  it("reads the origin", () => {
    expect(originOf("builtin:nodestro-examples@0.3.0+r2/summary")).toEqual({ kind: "builtin", version: "0.3.0+r2" });
    expect(originOf(`import:${"0".repeat(64)}`)).toEqual({ kind: "import" });
    expect(originOf(undefined)).toEqual({ kind: "user" });
  });

  it("names only the fields that differ", () => {
    expect(differences(agent("a"), agent("a"))).toEqual([]);
    expect(differences(agent("a"), agent("b"))).toEqual(["system_prompt"]);
  });
});

describe("shipped agents (NAL-B1)", () => {
  it("copies a shipped agent into an own template", async () => {
    showPage();
    await userEvent.click(await screen.findByText("Mitgelieferte Agenten"));
    await userEvent.click(await screen.findByTestId("library-agent-summary"));
    expect(await screen.findByText("Hilfe zum Zusammenfasser")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Als eigene Vorlage übernehmen" }));
    await waitFor(() => expect(requests.some((item) => item.path.endsWith("/library/agents/summary/copy"))).toBe(true));
    const copy = requests.find((item) => item.path.endsWith("/copy"));
    expect(copy?.body).toEqual({ language: "de", services: {} });
    expect(await screen.findAllByText("Aus der Bibliothek (0.3.0+r1)")).not.toHaveLength(0);
  });
});

describe("versions and import (NAL-B1)", () => {
  it("compares a version and loads it into the form", async () => {
    templates = [
      {
        id: "tpl_1",
        agent: agent("neu"),
        meta: { ...META, examples: [], tests: [] },
        version: 2,
        created_at: "2026-11-14T10:00:00Z",
        updated_at: "2026-11-14T11:00:00Z",
      } as unknown as AgentTemplate,
    ];
    versions = [
      { template_id: "tpl_1", version: 2, agent: agent("neu"), meta: templates[0].meta!, note: "", created_at: "2026-11-14T11:00:00Z", created_by: "" },
      { template_id: "tpl_1", version: 1, agent: agent("alt"), meta: templates[0].meta!, note: "erste", created_at: "2026-11-14T10:00:00Z", created_by: "" },
    ];
    showPage();
    await userEvent.click((await screen.findByRole("heading", { name: "Prüfer" })).closest("button")!);
    await userEvent.click(await screen.findByText("Herkunft und Versionen"));
    const older = await screen.findByTestId("template-version-1");
    await userEvent.click(within(older).getByRole("button", { name: "Vergleichen" }));
    const table = await screen.findByTestId("template-compare");
    expect(within(table).getByText("alt")).toBeInTheDocument();
    expect(within(table).getByText("neu")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "In das Formular übernehmen" }));
    // The form now differs from the saved version: Save is possible and makes a new version.
    await waitFor(() => expect(screen.getByRole("button", { name: "Speichern" })).toBeEnabled());
  });

  it("imports a file and tells what was left out", async () => {
    showPage();
    const input = await screen.findByTestId("template-import-file");
    const file = new File([JSON.stringify({ format: "nodestro-agent/1", agent: { name: "Prüfer" } })], "a.json", {
      type: "application/json",
    });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(requests.some((item) => item.path.endsWith("/agents/templates/import"))).toBe(true));
    await waitFor(() =>
      expect(useToasts.getState().toasts.map((toast) => toast.message)).toContain(
        "„Prüfer“ importiert. Aus Sicherheitsgründen nicht übernommen: Freigaberegeln für Tools",
      ),
    );
  });
});
