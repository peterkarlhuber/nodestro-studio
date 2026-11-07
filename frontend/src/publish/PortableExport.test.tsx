import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../api/client";
import { type Language, setLanguage } from "../i18n";
import type { ExportJob, ExportOptions, PortableCheck } from "../api/types";
import { shownProblems } from "./ApiExport";
import { ExportJobs, PortableOptions, PortableSummary } from "./PortableExport";

const OPTIONS = {
  kind: "portable",
  web_ui: true,
  platform: null,
  local_models: false,
  offline: false,
  confirm_models: false,
  confirm_distribution: false,
  allow_downloads: true,
  output_dir: "",
} as unknown as ExportOptions;

const PORTABLE = {
  platform: "linux-x86_64",
  platforms: [
    { id: "linux-x86_64", label: "Linux x86-64" },
    { id: "windows-x86_64", label: "Windows x64" },
  ],
  local_models: [
    {
      name: "qwen3.5:4b",
      roles: ["agent"],
      installed: true,
      size: 3_400_000_000,
      memory_bytes: 5_000_000_000,
      capabilities: ["tools"],
      license: null,
      redistribution: "unknown",
    },
  ],
  bundled_models: ["qwen3.5:4b"],
  memory_bytes: 5_000_000_000,
  providers: ["ollama", "anthropic"],
  network_needs: [
    { kind: "cloud_model", name: "anthropic:claude-haiku-4-5", detail: "" },
  ],
  downloads: [],
  offline_capable: false,
  estimated_bytes: 3_600_000_000,
} as unknown as PortableCheck;

function wrap(node: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{node}</QueryClientProvider>,
  );
}

describe("PortableExport", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("asks for the license confirmation only when a model's license is not confirmed", () => {
    const set = vi.fn();
    wrap(
      <PortableOptions
        options={OPTIONS}
        setOptions={set}
        portable={PORTABLE}
      />,
    );
    fireEvent.click(screen.getByTestId("api-export-confirm-models"));
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ confirm_models: true }),
    );
    cleanup();
    const permitted = {
      ...PORTABLE,
      local_models: [
        { ...PORTABLE.local_models[0], redistribution: "permitted" },
      ],
    } as PortableCheck;
    wrap(
      <PortableOptions
        options={OPTIONS}
        setOptions={set}
        portable={permitted}
      />,
    );
    expect(screen.queryByTestId("api-export-confirm-models")).toBeNull();
  });

  it("summarizes models, providers and network needs", () => {
    wrap(<PortableSummary portable={PORTABLE} options={OPTIONS} />);
    const summary = screen.getByTestId("api-export-summary");
    expect(summary.textContent).toContain("qwen3.5:4b");
    expect(summary.textContent).toContain("Anthropic");
    expect(summary.textContent).not.toContain("ollama,");
    // Open from the start: size and needs are what the person decides on; sizes in GB.
    expect(summary).toBeVisible();
    expect(summary.textContent).toMatch(/3,6\sGB/);
    expect(summary.textContent).toMatch(/3,4\sGB/);
  });

  it("keeps the local models in the package while it must work offline", () => {
    wrap(<PortableOptions options={{ ...OPTIONS, offline: true, local_models: true }} setOptions={() => undefined} portable={PORTABLE} />);
    expect(screen.getByRole("switch", { name: /Lokale Modelle beilegen/ })).toBeDisabled();
  });

  it("leaves out the source project's Git choice and the raw download list in a portable package", () => {
    const problem = (code: string) => ({ code, params: {}, message: code, level: "info", node_id: null, edge_id: null });
    const problems = [problem("export.distribution_unconfirmed"), problem("export.portable_distribution"), problem("export.downloads"), problem("export.provider")] as never;
    expect(shownProblems(problems, true).map((item) => item.code)).toEqual(["export.portable_distribution", "export.provider"]);
    expect(shownProblems(problems, false)).toHaveLength(4);
    // Without the portable confirmation the general one stays, so a disabled build always has its reason.
    expect(shownProblems([problem("export.distribution_unconfirmed")] as never, true)).toHaveLength(1);
  });

  it("shows a running build with progress and cancels it", async () => {
    const running = {
      id: "job_1",
      state: "running",
      step: "libraries",
      progress: 0.4,
      message: null,
      bytes_done: 0,
      bytes_total: 0,
      created_at: "2026-11-04T12:00:00Z",
    } as unknown as ExportJob;
    vi.spyOn(api, "exportJobs").mockResolvedValue([running]);
    const cancel = vi
      .spyOn(api, "cancelExportJob")
      .mockResolvedValue({ ...running, state: "cancelled" } as never);
    wrap(<ExportJobs publicationId="pub_1" onDone={() => undefined} />);
    await waitFor(() =>
      expect(screen.getByTestId("api-export-job-running")).toBeTruthy(),
    );
    expect(screen.getByRole("progressbar")).toBeTruthy();
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(cancel).toHaveBeenCalledWith("job_1"));
  });

  it("shows a job that waits for a server worker, without progress, and withdraws it", async () => {
    await setLanguage("en", false);
    const queued = {
      id: "job_3",
      state: "running",
      queued: true,
      step: "check",
      progress: 0,
      message: "",
      bytes_done: 0,
      bytes_total: 0,
      created_at: "2026-11-04T12:00:00Z",
    } as unknown as ExportJob;
    const jobs = vi.spyOn(api, "exportJobs").mockResolvedValue([queued]);
    const cancel = vi
      .spyOn(api, "cancelExportJob")
      .mockResolvedValue({ ...queued, queued: false, state: "cancelled" } as never);
    wrap(<ExportJobs publicationId="pub_1" onDone={() => undefined} />);
    const row = await screen.findByTestId("api-export-job-queued");
    expect(row.textContent).toContain("Waiting for a worker");
    expect(row.textContent).toContain("one package at a time");
    expect(screen.queryByTestId("api-export-job-running")).toBeNull();
    expect(screen.queryByRole("progressbar")).toBeNull();
    // The job list keeps polling while the job waits (its state is running).
    expect(jobs).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(cancel).toHaveBeenCalledWith("job_3"));
  });

  it("says waiting for a worker in every language", async () => {
    vi.spyOn(api, "exportJobs").mockResolvedValue([
      { id: "job_4", state: "running", queued: true, progress: 0, created_at: "2026-11-04T12:00:00Z" } as never,
    ]);
    const expected: Record<string, string> = {
      de: "Wartet auf einen Worker",
      es: "Esperando a un proceso de trabajo",
      fr: "En attente d’un processus de travail",
      it: "In attesa di un processo di lavoro",
      "pt-BR": "Aguardando um processo de trabalho",
    };
    for (const [language, text] of Object.entries(expected)) {
      await setLanguage(language as Language, false);
      const view = wrap(<ExportJobs publicationId="pub_1" onDone={() => undefined} />);
      expect((await screen.findByTestId("api-export-job-queued")).textContent).toContain(text);
      view.unmount();
    }
  });

  it("names the size and the limit of a package the server refused", async () => {
    await setLanguage("en", false);
    vi.spyOn(api, "exportJobs").mockResolvedValue([
      {
        id: "job_5",
        state: "failed",
        progress: 0.2,
        error_code: "export.server_too_large",
        error: "too large",
        error_params: { size: 9_000_000_000, limit: 2_000_000_000 },
        created_at: "2026-11-04T12:00:00Z",
      } as never,
    ]);
    wrap(<ExportJobs publicationId="pub_1" onDone={() => undefined} />);
    const jobs = await screen.findByTestId("api-export-jobs");
    expect(jobs.textContent).toContain("more than this server allows (");
    expect(jobs.textContent).not.toContain("{{");
  });

  it("offers the download of a finished package", async () => {
    vi.spyOn(api, "exportJobs").mockResolvedValue([
      {
        id: "job_2",
        state: "done",
        export_id: "exp_1",
        progress: 1,
        created_at: "2026-11-04T12:00:00Z",
      } as never,
    ]);
    wrap(<ExportJobs publicationId="pub_1" onDone={() => undefined} />);
    const link = await screen.findByTestId("api-export-job-download");
    expect(link.getAttribute("href")).toBe(api.exportUrl("exp_1"));
  });
});
