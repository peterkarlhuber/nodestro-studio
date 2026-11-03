import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CatalogModel, Hardware, InstalledModel, LocalOverview } from "../api/localModels";
import type { Settings } from "../api/types";
import { ReasoningReducedBadge } from "../components/ReasoningReducedBadge";
import { Toaster } from "../components/toast";
import { withNodeNames } from "../editor/CheckList";
import i18n from "../i18n";
import { problemText } from "../lib/errors";
import { modelFit } from "./LocalModelsHardware";
import { LocalModelsPanel } from "./SettingsLocalModels";

const GB = 1_000_000_000;
const CPU: Hardware = { system: "Linux", machine: "x86_64", cpus: 4, ram_bytes: 16 * GB, gpu: "none", gpu_memory_bytes: null };

const MODEL: CatalogModel = {
  name: "qwen3.5:4b",
  kind: "chat",
  family: "qwen3.5",
  download_bytes: 3.3 * GB,
  digest: "d8b0",
  listed_capabilities: ["completion", "tools", "thinking"],
  min_ollama: "0.30.0",
  license: "Apache-2.0",
  memory_bytes: 6 * GB,
  rank: 1,
  cpu_friendly: true,
  context: 262144,
  dimensions: null,
  notes: "",
  installed: true,
  verified: true,
};

const INSTALLED: InstalledModel = {
  name: "qwen3.5:4b",
  size: 3.3 * GB,
  digest: "d8b0",
  kind: "chat",
  capabilities: ["completion", "tools", "thinking"],
  context_length: 262144,
  embedding_length: null,
  catalog: true,
  verified: true,
  speed: null,
};

function overview(patch: Partial<LocalOverview> = {}, status: Partial<LocalOverview["status"]> = {}): LocalOverview {
  return {
    status: {
      mode: "managed",
      running: true,
      base_url: "http://127.0.0.1:11435",
      version: "0.40.14",
      pinned_version: "0.40.14",
      runtime_installed: true,
      runtime_bundled: false,
      runtime_path: null,
      autostart: true,
      models_dir: "/data/models",
      free_bytes: 100 * GB,
      models: [INSTALLED],
      detected_external: null,
      offline: false,
      error_code: null,
      error: null,
      context_length: 32768,
      context_source: "configured",
      accelerated: false,
      ...status,
    },
    catalog: [
      MODEL,
      { ...MODEL, name: "qwen3.6:27b", memory_bytes: 20 * GB, cpu_friendly: false, rank: 3, installed: false, verified: false },
      { ...MODEL, name: "qwen3.5:9b", memory_bytes: 9 * GB, rank: 2, installed: false, verified: false },
    ],
    hardware: CPU,
    recommendations: [],
    manageable: true,
    advice: [],
    ...patch,
  };
}

function serve(answers: Record<string, unknown>) {
  const calls: { method: string; url: string; body: unknown }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      calls.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
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

describe("model fit", () => {
  it("mirrors the runtime: GPU memory first, then RAM for CPU-friendly models", () => {
    expect(modelFit(MODEL, CPU)).toBe("cpu");
    expect(modelFit({ memory_bytes: 20 * GB, cpu_friendly: false }, CPU)).toBe("too_large");
    expect(modelFit({ memory_bytes: 10 * GB, cpu_friendly: false }, CPU)).toBe("too_slow");
    expect(modelFit({ memory_bytes: 20 * GB, cpu_friendly: false }, { ...CPU, gpu: "nvidia", gpu_memory_bytes: 24 * GB })).toBe("gpu");
    expect(modelFit({ memory_bytes: 12 * GB, cpu_friendly: true }, { ...CPU, ram_bytes: null })).toBe("cpu");
  });
});

describe("this computer", () => {
  it("shows the hardware, the runtime and the context window", async () => {
    serve({ "GET /api/local-models": overview() });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const machine = await screen.findByTestId("local-hardware");
    expect(machine).toHaveTextContent("Linux · x86_64");
    expect(machine).toHaveTextContent("CPU-Kerne4");
    expect(machine).toHaveTextContent("keine (nur CPU)");
    expect(machine).toHaveTextContent("Arbeitsspeicher16,0 GB");
    expect(screen.getByTestId("local-runtime-state")).toHaveTextContent("läuft (Ollama 0.40.14) · Modelle laufen auf der CPU");
    expect(screen.getByTestId("local-context")).toHaveTextContent("32.768 Tokens (von Nodestro eingestellt)");
    const catalog = screen.getByTestId("local-catalog");
    expect(within(screen.getByTestId("local-model-qwen3.5:4b")).getByText("Läuft auf der CPU (langsamer)")).toBeInTheDocument();
    expect(within(screen.getByTestId("local-model-qwen3.6:27b")).getByText("Zu groß für diesen Computer")).toBeInTheDocument();
    expect(catalog).toHaveTextContent("Auf diesem Computer");
  });

  it("says when the context window of an external server is unknown", async () => {
    serve({ "GET /api/local-models": overview({}, { mode: "external", context_length: null, context_source: "unknown", accelerated: null }) });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    expect(await screen.findByTestId("local-context")).toHaveTextContent("noch nicht bekannt");
    expect(screen.getByTestId("local-runtime-state")).toHaveTextContent("GPU-Nutzung unbekannt");
  });

  it("works with an API without the new fields", async () => {
    const old = overview();
    delete old.advice;
    delete old.status.context_length;
    delete old.status.context_source;
    delete old.status.accelerated;
    serve({ "GET /api/local-models": old });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    await screen.findByTestId("local-hardware");
    expect(screen.queryByTestId("local-context")).toBeNull();
    expect(screen.queryByTestId("local-advice")).toBeNull();
  });
});

describe("advice", () => {
  it("explains each code, the external fix for a small context first", async () => {
    serve({
      "GET /api/local-models": overview(
        {
          advice: [
            { code: "local.cpu_only", severity: "info", model: null, value: null, recommended: null },
            { code: "local.context_small", severity: "warning", model: null, value: 4096, recommended: 32768 },
            { code: "local.model_slow", severity: "info", model: "ollama:qwen3.5:9b", value: 23, recommended: null },
            { code: "local.model_too_large", severity: "warning", model: "qwen3.5:9b", value: 9 * GB, recommended: null },
            { code: "local.memory_low", severity: "warning", model: null, value: 8 * GB, recommended: 16 * GB },
            { code: "local.reasoning_saving", severity: "info", model: null, value: null, recommended: null },
            { code: "local.context_unknown", severity: "info", model: null, value: null, recommended: null },
            { code: "local.something_new", severity: "info", model: null, value: null, recommended: null },
          ],
        },
        { mode: "external", context_length: 4096, context_source: "server" },
      ),
    });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const advice = await screen.findByTestId("local-advice");
    expect(advice.firstElementChild).toHaveTextContent("nur 4.096 Tokens Kontext");
    expect(screen.getByTestId("local-advice-context_small")).toHaveTextContent("OLLAMA_CONTEXT_LENGTH=32768");
    expect(screen.getByTestId("local-advice-cpu_only")).toHaveTextContent("Keine Grafikkarte gefunden");
    expect(screen.getByTestId("local-advice-model_slow")).toHaveTextContent("qwen3.5:9b erzeugte auf diesem Computer 2,3 Tokens pro Sekunde (gemessen)");
    expect(screen.getByTestId("local-advice-model_too_large")).toHaveTextContent(`qwen3.5:9b braucht etwa 9,0 GB Speicher`);
    expect(screen.getByTestId("local-advice-memory_low")).toHaveTextContent(`Dieser Computer hat 8,0 GB Arbeitsspeicher`);
    expect(screen.getByTestId("local-advice-reasoning_saving")).toHaveTextContent("Der CPU-Sparmodus ist an");
    expect(screen.getByTestId("local-advice-something_new")).toHaveTextContent("local.something_new");
    // The advice wins over the computed fit.
    expect(within(screen.getByTestId("local-model-qwen3.5:9b")).getByText("Zu groß für diesen Computer")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /^CPU-Sparmodus für Denkmodelle.*Auf diesem Computer aktiv/ })).toBeInTheDocument();
  });
});

describe("speed", () => {
  it("shows only measured speeds and measures on request", async () => {
    const calls = serve({
      "GET /api/local-models": overview(),
      "POST /api/local-models/benchmark": {
        id: "j1", kind: "benchmark", target: "qwen3.5:4b", state: "running", completed: 0, total: null, message: "",
        error_code: null, error: null, started_at: "2026-11-03T10:00:00Z", finished_at: null,
      },
    });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const cell = await screen.findByTestId("local-speed-qwen3.5:4b");
    expect(cell).toHaveTextContent("Geschwindigkeit nicht gemessen");
    await userEvent.click(within(cell).getByRole("button", { name: "Geschwindigkeit messen" }));
    await waitFor(() => expect(calls.find((call) => call.url === "/api/local-models/benchmark")?.body).toEqual({ model: "qwen3.5:4b" }));
  });

  it("shows a measurement with where it ran", async () => {
    const measured = { ...INSTALLED, speed: { tokens_per_second: 7.25, measured_at: "2026-11-03T10:00:00Z", context_length: 32768, processor: "cpu" as const } };
    serve({ "GET /api/local-models": overview({}, { models: [measured] }) });
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} />);
    const cell = await screen.findByTestId("local-speed-qwen3.5:4b");
    expect(cell).toHaveTextContent("7,3 Tokens/s · auf der CPU");
    expect(cell).toHaveTextContent("gemessen am 3.11.2026 · Kontext 32.768");
    expect(within(cell).getByRole("button", { name: "Erneut messen" })).toBeEnabled();
  });
});

describe("cpu saving mode", () => {
  it("stores local_reasoning", async () => {
    serve({ "GET /api/local-models": overview() });
    const reasoning = vi.fn();
    show(<LocalModelsPanel settings={SETTINGS} admin onOffline={() => {}} onEurope={() => {}} onReasoning={reasoning} />);
    const toggle = await screen.findByRole("switch", { name: /^CPU-Sparmodus für Denkmodelle/ });
    expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    expect(reasoning).toHaveBeenCalledWith("full");
    cleanup();
    serve({ "GET /api/local-models": overview({}, { accelerated: true }) });
    show(<LocalModelsPanel settings={{ ...SETTINGS, local_reasoning: "full" }} admin onOffline={() => {}} onEurope={() => {}} onReasoning={reasoning} />);
    const off = await screen.findByRole("switch", { name: /^CPU-Sparmodus für Denkmodelle.*Aus: Agenten denken immer wie eingestellt/ });
    expect(off).not.toBeChecked();
  });

  it("marks a step with reduced reasoning", async () => {
    show(<ReasoningReducedBadge reason="cpu_saving" />);
    expect(screen.getByTestId("reasoning-reduced")).toHaveTextContent("Denken verkürzt: CPU-Sparmodus");
    cleanup();
    show(<ReasoningReducedBadge reason={null} />);
    expect(screen.queryByTestId("reasoning-reduced")).toBeNull();
  });
});

describe("workflow checks of local models", () => {
  it("formats token counts and names the agents", () => {
    const t = i18n.t.bind(i18n);
    expect(problemText(t, { code: "check.local_context_small", params: { tokens: 4096, recommended: 32768 } })).toContain(
      "nur 4.096 Tokens Kontext; empfohlen sind mindestens 32.768 Tokens",
    );
    expect(problemText(t, { code: "check.local_max_tokens", params: { tokens: 8192, max_tokens: 16000 } })).toContain("(16.000 Tokens)");
    const item = withNodeNames({ code: "check.local_reasoning_saving", params: { nodes: "a1,a2" } }, (id) => (id === "a1" ? "Sortierer" : ""));
    expect(problemText(t, item)).toContain("(Denkaufwand Mittel): Sortierer, a2.");
  });
});
