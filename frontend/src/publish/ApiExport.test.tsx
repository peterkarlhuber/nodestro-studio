import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../api/client";
import i18n from "../i18n";
import type { ApiOverview, ExportCheck, ExportRecord, Meta, Publication } from "../api/types";
import { ApiExport } from "./ApiExport";

const RECORD = {
  id: "exp_1",
  publication_id: "pub_1",
  release_id: "rel_1",
  release_number: 1,
  created_at: "2026-11-06T10:00:00Z",
  options: { kind: "standard", orkexa: "git", knowledge: [], memory: [] },
  file_name: "flow-v1.zip",
  size: 12_000,
  sha256: "0".repeat(64),
  files: 3,
  warnings: [],
  runtime: {},
} as unknown as ExportRecord;

function setup(meta: Partial<Meta> & { profile?: string }) {
  vi.spyOn(api, "meta").mockResolvedValue(meta as Meta);
  vi.spyOn(api, "exportCheck").mockResolvedValue({ ok: true, problems: [], resources: [], dependencies: [], tool_libraries: [], runtime_modules: [], runtime: {}, files: [] } as unknown as ExportCheck);
  vi.spyOn(api, "guides").mockResolvedValue([]);
  vi.spyOn(api, "exportJobs").mockResolvedValue([]);
  const records = vi.spyOn(api, "exports").mockResolvedValue([RECORD]);
  const removed = vi.spyOn(api, "deleteExport").mockResolvedValue(undefined);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ApiExport
        overview={{ releases: [] } as unknown as ApiOverview}
        publication={{ id: "pub_1", active_release: 1 } as unknown as Publication}
        onChanged={() => undefined}
      />
    </QueryClientProvider>,
  );
  return { records, removed };
}

describe("ApiExport history", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("deletes an export after a second click and reloads the history (API-048)", async () => {
    const { records, removed } = setup({ profile: "desktop" });
    const button = await screen.findByTestId("api-export-delete");
    expect(button.getAttribute("aria-label")).toBe(i18n.t("publish.export.delete", { file: "flow-v1.zip" }));
    fireEvent.click(button);
    expect(removed).not.toHaveBeenCalled(); // the first click only asks
    records.mockResolvedValue([]);
    fireEvent.click(screen.getByTestId("api-export-delete"));
    await waitFor(() => expect(removed).toHaveBeenCalledWith("exp_1"));
    await waitFor(() => expect(screen.queryByTestId("api-exports")).toBeNull());
  });
});
