import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { KnowledgeIndexStatus, LocalOverview } from "../api/localModels";
import type { Settings } from "../api/types";
import { Toaster } from "../components/toast";
import { KnowledgeSearchPanel, LocalModelsPanel } from "./SettingsLocalModels";

const GB = 1_000_000_000;

function overview(patch: Partial<LocalOverview["status"]> = {}, manageable = true): LocalOverview {
  return {
    status: {
      mode: "managed",
      running: false,
      base_url: null,
      version: null,
      pinned_version: "0.40.14",
      runtime_installed: false,
      runtime_bundled: false,
      runtime_path: null,
      autostart: true,
      models_dir: "/data/local-models/models",
      free_bytes: 100 * GB,
      models: [],
      detected_external: null,
      offline: false,
      error_code: null,
      error: null,
      ...patch,
    },
    catalog: [
      {
        name: "qwen3.5:4b",
        kind: "chat",
        family: "qwen3.5",
        download_bytes: 3.4 * GB,
        digest: "d8b0",
        listed_capabilities: ["completion", "tools"],
        min_ollama: "0.17.1",
        license: "Apache-2.0",
        memory_bytes: 6 * GB,
        rank: 1,
        cpu_friendly: true,
        context: 262144,
        dimensions: null,
        notes: "",
        installed: false,
        verified: false,
      },
    ],
    hardware: { system: "Linux", machine: "x86_64", cpus: 8, ram_bytes: 16 * GB, gpu: "none", gpu_memory_bytes: null },
    recommendations: [
      {
        task: "classify",
        model: "ollama:qwen3.5:4b",
        quality: "recommended",
        installed: false,
        download_bytes: 3.4 * GB,
        reasons: ["needs_download"],
        better: null,
        alternatives: [],
      },
      {
        task: "analysis",
        model: "ollama:qwen3.5:9b",
        quality: "acceptable",
        installed: false,
        download_bytes: 6.6 * GB,
        reasons: ["needs_download", "below_ideal", "hardware_limit", "no_gpu"],
        better: "ollama:qwen3.6:35b-a3b",
        alternatives: [],
      },
    ],
    manageable,
  };
}

const INDEX: KnowledgeIndexStatus = {
  mode: "fts",
  embedding_model: null,
  state: "off",
  chunks: 12,
  embedded: 0,
  active: null,
  building: null,
  building_embedded: 0,
  job: null,
  pgvector: null,
  detail: "",
};

function serve(answers: Record<string, unknown>) {
  const calls: { method: string; url: string; body: unknown }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ method, url, body });
      const answer = answers[`${method} ${url}`] ?? (method === "GET" ? [] : {});
      return new Response(JSON.stringify(answer), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
  return calls;
}

function show(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        {node}
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const SETTINGS = { strict_offline: false, knowledge_retrieval: "fts", embedding_model: null } as unknown as Settings;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("local models", () => {
  it("offers the runtime install and explains the recommendations", async () => {
    const calls = serve({ "GET /api/local-models": overview() });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} />);
    const setup = await screen.findByTestId("local-runtime-setup");
    expect(setup).toHaveTextContent("Ollama 0.40.14");
    const table = screen.getByTestId("local-recommendations");
    expect(within(table).getByText("qwen3.5:9b")).toBeInTheDocument();
    expect(table).toHaveTextContent("Ohne Grafikkarte sind große Modelle zu langsam.");
    await userEvent.click(within(setup).getByRole("button", { name: "Herunterladen und installieren" }));
    await waitFor(() => expect(calls.some((call) => call.method === "POST" && call.url === "/api/local-models/runtime")).toBe(true));
    expect(calls.find((call) => call.url === "/api/local-models/runtime")?.body).toEqual({ download: true });
  });

  it("refuses downloads in the strict offline mode and leaves a server's models to its operator", async () => {
    serve({ "GET /api/local-models": overview({ offline: true }) });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} />);
    const setup = await screen.findByTestId("local-runtime-setup");
    expect(within(setup).getByRole("button", { name: "Herunterladen und installieren" })).toBeDisabled();
    cleanup();
    serve({ "GET /api/local-models": overview({ mode: "external", running: true, runtime_installed: true }, false) });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} />);
    expect(await screen.findByText(/betreibt der Betreiber den lokalen Modellserver/)).toBeInTheDocument();
    expect(screen.queryByTestId("local-import")).toBeNull();
    expect(within(screen.getByTestId("local-catalog")).getByRole("button", { name: "Herunterladen" })).toBeDisabled();
  });
});

describe("knowledge search", () => {
  it("needs an embedding model before the index can be built", async () => {
    serve({ "GET /api/knowledge/index": INDEX, "GET /api/local-models": overview() });
    const save = vi.fn();
    show(<KnowledgeSearchPanel settings={SETTINGS} admin onSave={save} />);
    const index = await screen.findByTestId("knowledge-index");
    expect(index).toHaveTextContent("Noch kein semantischer Index. Abschnitte: 12.");
    expect(within(index).getByRole("button", { name: "Index aufbauen" })).toBeDisabled();
    await userEvent.selectOptions(screen.getByLabelText("Suchverfahren"), "hybrid");
    expect(save).toHaveBeenCalledWith({ knowledge_retrieval: "hybrid" });
  });

  it("rebuilds the index with the chosen model and warns while semantic search cannot run", async () => {
    const calls = serve({
      "GET /api/knowledge/index": { ...INDEX, mode: "hybrid", embedding_model: "qwen3-embedding:0.6b" },
      "POST /api/knowledge/index/rebuild": { ...INDEX, state: "building", job: { model: "qwen3-embedding:0.6b", state: "running", completed: 0, total: 12 } },
      "GET /api/local-models": overview(),
    });
    const settings = { ...SETTINGS, knowledge_retrieval: "hybrid", embedding_model: "qwen3-embedding:0.6b" } as Settings;
    show(<KnowledgeSearchPanel settings={settings} admin onSave={() => {}} />);
    const index = await screen.findByTestId("knowledge-index");
    expect(screen.getByText(/brauchen einen vollständigen Index/)).toBeInTheDocument();
    await userEvent.click(within(index).getByRole("button", { name: "Index aufbauen" }));
    await waitFor(() => expect(calls.some((call) => call.url === "/api/knowledge/index/rebuild")).toBe(true));
    expect(await screen.findByText("Aufbau: 0 von 12 Abschnitten")).toBeInTheDocument();
  });
});
