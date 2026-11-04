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
import type { ExportJob, ExportOptions, PortableCheck } from "../api/types";
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
    expect(summary.textContent).toContain("anthropic");
    expect(summary.textContent).not.toContain("ollama,");
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
