import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { KnowledgeIndexStatus, LocalJob, LocalOverview } from "../api/localModels";
import type { Settings } from "../api/types";
import { Toaster } from "../components/toast";
import i18n, { LANGUAGES } from "../i18n";
import { KnowledgeSearchPanel, LocalModelsPanel, embeddingChoices, licenseName, licenseSource } from "./SettingsLocalModels";

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
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const setup = await screen.findByTestId("local-runtime-setup");
    expect(setup).toHaveTextContent("Ollama 0.40.14");
    const table = screen.getByTestId("local-recommendations");
    expect(within(table).getByText("qwen3.5:9b")).toBeInTheDocument();
    expect(table).toHaveTextContent("Ohne Grafikkarte sind große Modelle zu langsam.");
    await userEvent.click(within(setup).getByRole("button", { name: "Herunterladen und installieren" }));
    // One job sets the server up step by step (download, verify, install, start, check).
    await waitFor(() => expect(calls.some((call) => call.method === "POST" && call.url === "/api/local-models/setup")).toBe(true));
    expect(calls.find((call) => call.url === "/api/local-models/setup")?.body).toEqual({ download: true });
  });

  it("finds a running setup and running downloads again after a reload", async () => {
    const step = (id: string, state: string) => ({ id, state });
    serve({
      "GET /api/local-models": overview(),
      "GET /api/local-models/jobs": [
        {
          id: "s1", kind: "setup", target: "server", state: "running", completed: 10, total: 100, message: "", error_code: null,
          error: null, started_at: "2026-11-06T08:00:00Z", finished_at: null, phase: "download", progress_step: "download",
          steps: [step("check", "done"), step("prerequisites", "done"), step("download", "running"), step("verify", "pending")],
        },
        {
          id: "p1", kind: "pull", target: "qwen3.5:9b", state: "running", completed: 0, total: null, message: "pulling manifest",
          error_code: null, error: null, started_at: "2026-11-06T08:00:00Z", finished_at: null, phase: "manifest",
          steps: [step("check", "done"), step("manifest", "running"), step("download", "pending")],
        },
      ],
    });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const progress = await screen.findByTestId("local-setup-progress");
    expect(progress).toHaveTextContent("Schritt 3 von 4: Ollama herunterladen");
    expect(within(progress).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "10");
    // While the setup runs, it is not offered again.
    expect(screen.queryByTestId("local-runtime-setup")).toBeNull();
    // The model downloads in the list: its step instead of the button, without a percentage (not measurable yet).
    const inline = await screen.findByTestId("local-inline-qwen3.5:9b");
    expect(inline).toHaveTextContent("Dateiliste des Modells abrufen");
    expect(within(inline).getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
  });

  it("offers downloads only with a running model server and says why", async () => {
    serve({ "GET /api/local-models": overview() });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const status = await screen.findByTestId("local-status");
    expect(status).toHaveTextContent("Nicht installiert");
    expect(screen.getByTestId("local-needs-server")).toHaveTextContent("Installiere oben die Laufzeit und starte sie dann.");
    const table = screen.getByTestId("local-recommendations");
    // Sizes as the catalog states them (decimal GB), not as thousands of MB.
    expect(within(table).getByRole("button", { name: /^Herunterladen \(3,4\sGB\): qwen3.5:4b$/ })).toBeDisabled();
    expect(within(screen.getByTestId("local-catalog")).getByRole("button", { name: /^Herunterladen: / })).toBeDisabled();
    cleanup();
    serve({ "GET /api/local-models": overview({ runtime_installed: true }) });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    expect(await screen.findByTestId("local-needs-server")).toHaveTextContent("Starte ihn oben.");
    expect(screen.getByTestId("local-status")).toHaveTextContent("Gestoppt");
    cleanup();
    serve({ "GET /api/local-models": overview({ runtime_installed: true, running: true, version: "0.40.14" }) });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const running = await screen.findByTestId("local-recommendations");
    expect(screen.queryByTestId("local-needs-server")).toBeNull();
    expect(within(running).getByRole("button", { name: /^Herunterladen \(3,4\sGB\): qwen3.5:4b$/ })).toBeEnabled();
  });

  it("shows the license name without the catalog's provenance note", () => {
    expect(licenseName("Apache-2.0 (upstream; the Ollama manifest has no license layer)")).toBe("Apache-2.0");
    expect(licenseName("MIT")).toBe("MIT");
  });

  it("names where the license was read, also for older APIs with the note", () => {
    expect(licenseSource({ license: "Apache-2.0", license_source: "ollama" })).toBe("ollama");
    expect(licenseSource({ license: "Apache-2.0", license_source: "upstream" })).toBe("upstream");
    expect(licenseSource({ license: "Apache-2.0 (Mistral AI's model card; the Ollama manifest has no license layer)" })).toBe("upstream");
    expect(licenseSource({ license: "MIT" })).toBeNull();
    for (const language of LANGUAGES)
      for (const source of ["ollama", "upstream"])
        expect(i18n.exists(`localModels.licenseSource.${source}`, { lng: language }), `${language} ${source}`).toBe(true);
  });

  it("refuses downloads in the strict offline mode and leaves a server's models to its operator", async () => {
    serve({ "GET /api/local-models": overview({ offline: true }) });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const setup = await screen.findByTestId("local-runtime-setup");
    expect(within(setup).getByRole("button", { name: "Herunterladen und installieren" })).toBeDisabled();
    cleanup();
    serve({ "GET /api/local-models": overview({ mode: "external", running: true, runtime_installed: true }, false) });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    expect(await screen.findByText(/betreibt der Betreiber den lokalen Modellserver/)).toBeInTheDocument();
    expect(screen.queryByTestId("local-import")).toBeNull();
    expect(within(screen.getByTestId("local-catalog")).getByRole("button", { name: /^Herunterladen: / })).toBeDisabled();
  });
});

describe("local models wording (ST-048, ST-056)", () => {
  const failedSetup = {
    id: "s1", kind: "setup", target: "server", state: "failed", retryable: true, completed: 0, total: null, message: "", error_code: "local.download_failed",
    error: "connection refused", started_at: "2026-11-06T08:00:00Z", finished_at: "2026-11-06T08:01:00Z", phase: "download",
    steps: [{ id: "check", state: "done" }, { id: "download", state: "failed" }],
  };

  it("calls an external server that does not answer not reachable, not stopped", async () => {
    serve({ "GET /api/local-models": overview({ mode: "external", running: false, runtime_installed: false, base_url: "http://gpu-box:11434" }) });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const status = await screen.findByTestId("local-status");
    expect(status).toHaveTextContent("Nicht erreichbar");
    expect(status).not.toHaveTextContent("Gestoppt");
  });

  it("says once that the CPU saving mode is active", async () => {
    serve({
      "GET /api/local-models": { ...overview(), advice: [{ code: "local.cpu_only", severity: "info" }, { code: "local.reasoning_saving", severity: "info" }] },
    });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    await screen.findByTestId("local-advice-cpu_only");
    expect(screen.queryByTestId("local-advice-reasoning_saving")).toBeNull();
    expect(screen.getAllByText(/Auf diesem Computer aktiv\./)).toHaveLength(1);
  });

  it("names the same tool task as an example's model plan", () => {
    for (const language of LANGUAGES)
      expect(i18n.t("localModels.tasks.tool_agent", { lng: language }), language).toBe(i18n.t("library.models.tasks.tool_agent", { lng: language }));
  });

  it("speaks of the server, not of this computer, to a server's tenants", async () => {
    serve({ "GET /api/local-models": { ...overview({ mode: "external", running: true, runtime_installed: true }, false), hardware: null, advice: [{ code: "local.reasoning_saving", severity: "info" }] } });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const table = await screen.findByTestId("local-recommendations");
    const panel = screen.getByTestId("settings-local-models");
    expect(panel).toHaveTextContent("lokalen Modellen (Ollama) dieses Servers");
    expect(table).toHaveTextContent("Für ein größeres Modell hat der Server zu wenig Speicher.");
    expect(panel).toHaveTextContent("Auf diesem Server aktiv.");
    expect(panel).not.toHaveTextContent(/diese[mn]? Computer/);
    expect(screen.getByRole("region", { name: "Empfohlen für diesen Server" })).toBeInTheDocument();
  });

  it("offers no second download next to a failed setup's Try again, but keeps the release archive", async () => {
    serve({ "GET /api/local-models": overview(), "GET /api/local-models/jobs": [failedSetup] });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const progress = await screen.findByTestId("local-setup-progress");
    expect(within(progress).getByRole("button", { name: /Erneut versuchen/ })).toBeInTheDocument();
    const setup = screen.getByTestId("local-runtime-setup");
    expect(within(setup).queryByTestId("local-setup-start")).toBeNull();
    expect(within(setup).getByRole("textbox")).toBeInTheDocument();
  });
});

describe("offline import", () => {
  it("offers offline packages only for a model server Nodestro manages", async () => {
    serve({ "GET /api/local-models": overview({ mode: "managed", running: true, runtime_installed: true }) });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const managed = await screen.findByTestId("local-import");
    expect(within(managed).getByTestId("import-package")).toBeEnabled();
    expect(within(managed).getByTestId("import-package")).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByTestId("import-package-external")).toBeNull();
    cleanup();
    // Your own Ollama refuses packages (local.not_managed): only the GGUF file is offered, and the page says why.
    serve({ "GET /api/local-models": overview({ mode: "external", running: true, runtime_installed: true }) });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const external = await screen.findByTestId("local-import");
    expect(within(external).getByTestId("import-package")).toBeDisabled();
    expect(within(external).getByRole("radio", { name: "GGUF-Datei" })).toHaveAttribute("aria-checked", "true");
    expect(within(external).getByRole("textbox", { name: /^GGUF-Datei/ })).toBeInTheDocument();
    expect(screen.getByTestId("import-package-external")).toHaveTextContent(/nur in einen Modellserver importieren, den Nodestro verwaltet/);
  });
});

describe("embedding model choice", () => {
  const embedding = (name: string, installed: boolean) => ({ ...MDENSEON, name, source: undefined, installed });

  it("lists installed models first and marks the others", () => {
    const base = overview();
    const data = {
      ...base,
      catalog: [embedding("catalog:a", false), embedding("catalog:b", true)],
      status: { ...base.status, models: [{ name: "own:c", kind: "embedding" } as never] },
    };
    expect(embeddingChoices(data, "saved:d")).toEqual([
      { name: "own:c", installed: true },
      { name: "catalog:b", installed: true },
      { name: "catalog:a", installed: false },
      { name: "saved:d", installed: false },
    ]);
    // Still loading: nothing is known to be missing.
    expect(embeddingChoices(undefined, "saved:d")).toEqual([{ name: "saved:d", installed: true }]);
  });

  it("warns before an index is built with a model that is not installed", async () => {
    const base = overview();
    const data = { ...base, catalog: [embedding("qwen3-embedding:0.6b", false), embedding("bge-m3", true)] };
    serve({ "GET /api/knowledge/index": INDEX, "GET /api/local-models": data });
    const settings = { ...SETTINGS, knowledge_retrieval: "vector", embedding_model: "qwen3-embedding:0.6b" } as Settings;
    show(<KnowledgeSearchPanel settings={settings} admin onSave={() => {}} />);
    expect(await screen.findByTestId("embedding-not-installed")).toHaveTextContent(
      "qwen3-embedding:0.6b ist noch nicht installiert",
    );
    const select = screen.getByLabelText("Embedding-Modell", { exact: false });
    const groups = [...select.querySelectorAll("optgroup")].map((group) => group.getAttribute("label"));
    expect(groups).toEqual(["Installiert", "Nicht installiert"]);
    cleanup();
    serve({ "GET /api/knowledge/index": INDEX, "GET /api/local-models": data });
    show(<KnowledgeSearchPanel settings={{ ...settings, embedding_model: "bge-m3" } as Settings} admin onSave={() => {}} />);
    await screen.findByTestId("knowledge-index");
    expect(screen.queryByTestId("embedding-not-installed")).toBeNull();
  });
});

describe("european models", () => {
  it("marks European alternatives in the catalog and stores the preference", async () => {
    const base = overview();
    const devstral = {
      ...base.catalog[0],
      name: "devstral-small-2:24b",
      family: "devstral-small-2",
      vendor: "Mistral AI",
      region: "eu",
      tasks: ["coding"],
      alternative: true,
    };
    serve({ "GET /api/local-models": { ...base, catalog: [...base.catalog, devstral] } });
    const europe = vi.fn();
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={europe} />);
    const row = await screen.findByTestId("local-model-devstral-small-2:24b");
    expect(row).toHaveTextContent("Mistral AI");
    expect(row).toHaveTextContent("Europäisch");
    expect(row).toHaveTextContent("Nur für: Programmieren");
    expect(screen.getByTestId("local-model-qwen3.5:4b")).not.toHaveTextContent("Europäisch");
    await userEvent.click(screen.getByRole("switch", { name: /^Europäische Modelle bevorzugen/ }));
    expect(europe).toHaveBeenCalledWith(true);
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

const MDENSEON = {
  name: "mdenseon:307m",
  kind: "embedding" as const,
  family: "mdenseon",
  download_bytes: 1_233_808_704,
  digest: "4e2c",
  listed_capabilities: ["embedding"],
  min_ollama: "0.40.14",
  license: "Apache-2.0",
  vendor: "LightOn",
  region: "eu",
  memory_bytes: 1 * GB,
  rank: 0,
  cpu_friendly: true,
  context: 8192,
  dimensions: 768,
  notes: "",
  alternative: true,
  source: "build" as const,
  installed: false,
  verified: false,
};

const BUILD_INPUTS = [
  {
    role: "template" as const,
    url: "https://huggingface.co/mykor/mmBERT-base-GGUF/resolve/66e31bd2787f6b5fe9b762a664f4899af38b0605/mmBERT-Base-307M-F16.gguf",
    sha256: "a224ccdee4310594e73c9907934a1520405bfc4467a3577d3dcf418e7c017901",
    size: 6_036_928,
  },
  {
    role: "weights" as const,
    url: "https://huggingface.co/lightonai/mDenseOn/resolve/a5fdb000f7a21da96c3bddde3a782ef777316df3/model.safetensors",
    sha256: "a336c49fc679aeb23969114b12fb7317804da3cc7d8bc214818009dea39d545c",
    size: 1_227_771_776,
  },
];

function buildJob(patch: Partial<LocalJob>): LocalJob {
  return {
    id: "b1",
    kind: "build",
    target: "mdenseon:307m",
    state: "running",
    completed: 0,
    total: null,
    message: "",
    error_code: null,
    error: null,
    started_at: "2026-11-03T10:00:00Z",
    finished_at: null,
    ...patch,
  };
}

function withBuild(patch: Partial<typeof MDENSEON> & { build_inputs?: typeof BUILD_INPUTS } = {}, status: Partial<LocalOverview["status"]> = {}) {
  const base = overview({ runtime_installed: true, running: true, ...status });
  return { ...base, catalog: [...base.catalog, { ...MDENSEON, ...patch }] };
}

describe("build from local files", () => {
  it("lists the expected files and starts an offline build with both paths", async () => {
    const calls = serve({
      "GET /api/local-models": withBuild({ build_inputs: BUILD_INPUTS }, { offline: true }),
      "POST /api/local-models/import": buildJob({}),
    });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const build = await screen.findByTestId("local-build");
    // Air-gapped: no download is offered for the built model, only the build.
    const row = screen.getByTestId("local-model-mdenseon:307m");
    expect(within(row).queryByRole("button", { name: /^Herunterladen: / })).toBeNull();
    expect(within(row).getByRole("button", { name: /^Aus Dateien bauen: / })).toBeEnabled();
    const weights = within(build).getByTestId("local-build-input-weights");
    expect(weights).toHaveTextContent("model.safetensors");
    expect(weights).toHaveTextContent("lightonai/mDenseOn");
    expect(weights).toHaveTextContent("Revision a5fdb00");
    expect(weights).toHaveTextContent("a336c49fc679aeb23969114b12fb7317804da3cc7d8bc214818009dea39d545c");
    expect(within(build).getByTestId("local-build-input-template")).toHaveTextContent("die ersten 6,0 MB werden geprüft");
    const start = within(build).getByRole("button", { name: "Bauen und prüfen" });
    expect(start).toBeDisabled();
    await userEvent.type(within(build).getByLabelText("Gewichtsdatei (safetensors)"), " /media/usb/model.safetensors ");
    await userEvent.type(within(build).getByLabelText("Vorlagendatei (GGUF)"), "/media/usb/template.gguf");
    await userEvent.click(start);
    await waitFor(() => expect(calls.some((call) => call.method === "POST" && call.url === "/api/local-models/import")).toBe(true));
    expect(calls.find((call) => call.url === "/api/local-models/import")?.body).toEqual({
      kind: "build",
      name: "mdenseon:307m",
      path: "/media/usb/model.safetensors",
      template: "/media/usb/template.gguf",
    });
    expect(calls.some((call) => call.url === "/api/local-models/pull")).toBe(false);
  });

  it("leaves out a size the API does not know", async () => {
    serve({ "GET /api/local-models": withBuild({ build_inputs: BUILD_INPUTS.map((input) => ({ ...input, size: null })) as unknown as typeof BUILD_INPUTS }) });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const template = await screen.findByTestId("local-build-input-template");
    expect(template).toHaveTextContent("mykor/mmBERT-base-GGUF · Revision 66e31bd");
    expect(template).not.toHaveTextContent("werden geprüft");
  });

  it("keeps the download when online and explains the files when the API does not list them", async () => {
    serve({ "GET /api/local-models": withBuild() });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const row = await screen.findByTestId("local-model-mdenseon:307m");
    expect(within(row).getByRole("button", { name: /^Herunterladen: / })).toBeEnabled();
    expect(screen.getByTestId("local-build-expected")).toHaveTextContent("Das Handbuch nennt ihre Quellen und Prüfsummen.");
  });

  it("shows the running step and cancels the build", async () => {
    const calls = serve({
      "GET /api/local-models": withBuild(),
      "GET /api/local-models/jobs": [buildJob({ message: "write gguf" })],
      "POST /api/local-models/jobs/b1/cancel": buildJob({ state: "cancelled" }),
    });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const progress = await screen.findByTestId("local-build-progress");
    expect(progress).toHaveTextContent("Schritt 3 von 5: Modelldatei wird geschrieben");
    await userEvent.click(within(screen.getByTestId("local-build")).getByRole("button", { name: "Abbrechen" }));
    await waitFor(() => expect(calls.some((call) => call.url === "/api/local-models/jobs/b1/cancel")).toBe(true));
  });

  it.each([
    ["local.checksum_mismatch", "verify weights", "Die Gewichtsdatei stimmt nicht mit der festgelegten Prüfsumme überein."],
    ["local.checksum_mismatch", "verify template", "Die Vorlagendatei stimmt nicht mit der festgelegten Prüfsumme überein."],
    ["local.source_missing", "verify template", "Die Vorlagendatei wurde nicht gefunden."],
    ["local.invalid_weights", "write gguf", "Die Gewichtsdatei passt nicht zu diesem Modell."],
    ["local.invalid_template", "write gguf", "Die Vorlagendatei ist keine passende GGUF-Datei für dieses Modell."],
    ["local.reference_mismatch", "check reference vectors", "reproduziert die Referenzvektoren nicht und wurde wieder entfernt"],
  ])("explains %s (%s) and offers a retry", async (code, step, text) => {
    const calls = serve({
      "GET /api/local-models": withBuild(),
      "GET /api/local-models/jobs": [buildJob({ state: "failed", message: step, error_code: code, error: "technical" })],
      "POST /api/local-models/import": buildJob({ id: "b2" }),
    });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const error = await screen.findByTestId("local-build-error");
    expect(error).toHaveTextContent(text);
    const retry = within(error).getByRole("button", { name: "Erneut versuchen" });
    expect(retry).toBeDisabled();
    const build = screen.getByTestId("local-build");
    await userEvent.type(within(build).getByLabelText("Gewichtsdatei (safetensors)"), "/w");
    await userEvent.type(within(build).getByLabelText("Vorlagendatei (GGUF)"), "/t");
    await userEvent.click(retry);
    await waitFor(() => expect(calls.filter((call) => call.url === "/api/local-models/import")).toHaveLength(1));
  });

  it("reports a cancelled build and a missing file before the start", async () => {
    serve({
      "GET /api/local-models": withBuild(),
      "GET /api/local-models/jobs": [buildJob({ state: "cancelled", message: "verify weights" })],
    });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    expect(await screen.findByTestId("local-build-error")).toHaveTextContent("Der Bau wurde abgebrochen. Es wurde nichts installiert.");
    cleanup();
    vi.unstubAllGlobals();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url === "/api/local-models/import" && init?.method === "POST")
          return new Response(JSON.stringify({ detail: "/w does not exist", code: "local.file_missing", params: { path: "/w" } }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        const body = url === "/api/local-models" ? withBuild() : [];
        return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
      }),
    );
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const build = await screen.findByTestId("local-build");
    await userEvent.type(within(build).getByLabelText("Gewichtsdatei (safetensors)"), "/w");
    await userEvent.type(within(build).getByLabelText("Vorlagendatei (GGUF)"), "/t");
    await userEvent.click(within(build).getByRole("button", { name: "Bauen und prüfen" }));
    expect(await within(build).findByText("/w existiert nicht.")).toBeInTheDocument();
  });

  it("points to the index after a successful build", async () => {
    serve({
      "GET /api/local-models": withBuild({ installed: true, verified: true }),
      "GET /api/local-models/jobs": [buildJob({ state: "done", message: "done" })],
    });
    const settings = { ...SETTINGS, embedding_model: "mdenseon:307m" } as Settings;
    show(<LocalModelsPanel settings={settings} admin onOffline={() => {}} onEurope={() => {}} />);
    const hint = await screen.findByTestId("local-build-reindex");
    expect(hint).toHaveTextContent("mdenseon:307m wurde gebaut und geprüft.");
    expect(hint).toHaveTextContent("Baue den Index unter Wissenssuche neu auf");
    expect(within(hint).getByRole("button", { name: "Zur Wissenssuche" })).toBeEnabled();
  });
});
