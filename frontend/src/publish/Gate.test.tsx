import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../api/client";
import type { ApiOverview, GateReport, Publication } from "../api/types";
import { ApiOverviewPanel } from "./ApiOverviewPanel";
import { GateReportView } from "./GateReportView";

const item = (kind: "critical" | "deterministic" | "judge", code: string, passed: boolean, extra = {}) => ({
  kind,
  code,
  passed,
  suite_id: "suite_1",
  suite_name: "Kunden",
  run_id: "bench_1",
  value: null,
  threshold: null,
  probabilistic: kind === "judge",
  params: {},
  ...extra,
});

const OVERRIDABLE: GateReport = {
  status: "overridable",
  workflow_version: 2,
  gate: { suite_ids: ["suite_1"], min_pass_rate: 1, judge_min_score: 0.8 },
  items: [
    item("critical", "gate.tested", true),
    item("deterministic", "gate.pass_rate", false, { value: 0.5, threshold: 1, params: { clean: 1, cases: 2 } }),
    item("judge", "gate.judge_score", false, { value: 0.6, threshold: 0.8 }),
  ],
};

function wrap(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>,
  );
}

const overview = (gate: Publication["gate"]) =>
  ({
    workflow_id: "wf_1",
    current_version: 2,
    publication: { id: "pub_1", name: "API", enabled: true, active_release: 1, gate, history: [] },
    releases: [{ id: "rel_1", number: 1, workflow_version: 1, note: "", created_at: "2026-10-31T10:00:00Z", active: true, runs: 0, gate: "overridden" }],
    local_url: null,
    network_urls: [],
    keys: 1,
    runs: [],
    pending_approvals: 0,
    missing_resources: [],
  }) as unknown as ApiOverview;

describe("release gate", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("keeps blocking checks, check results and AI verdicts apart", () => {
    wrap(<GateReportView report={OVERRIDABLE} />);
    expect(screen.getByTestId("gate-report").dataset.status).toBe("overridable");
    expect(within(screen.getByTestId("gate-group-critical")).getAllByTestId("gate-item")).toHaveLength(1);
    expect(within(screen.getByTestId("gate-group-deterministic")).getByTestId("gate-item").dataset.code).toBe("gate.pass_rate");
    const judge = screen.getByTestId("gate-group-judge");
    // AI verdicts carry the probabilistic label; the deterministic group does not.
    expect(within(judge).getByText(/KI-Urteil/)).toBeTruthy();
    expect(within(screen.getByTestId("gate-group-deterministic")).queryByText(/KI-Urteil/)).toBeNull();
  });

  it("shows nothing without a gate", () => {
    wrap(<GateReportView report={{ status: "off", workflow_version: 2, gate: null, items: [] }} />);
    expect(screen.queryByTestId("gate-report")).toBeNull();
  });

  it("publishes past failed non-critical items only with a reason", async () => {
    vi.spyOn(api, "apiCheck").mockResolvedValue({ ok: true, errors: 0, warnings: 0, problems: [], agents: {}, approvals: 0, subworkflows: [], tools: [], libraries: [] } as never);
    vi.spyOn(api, "releaseGate").mockResolvedValue(OVERRIDABLE);
    const publish = vi.spyOn(api, "publishApi").mockResolvedValue({ publication: {}, release: { number: 2 } } as never);
    wrap(<ApiOverviewPanel overview={overview(OVERRIDABLE.gate)} dirty={false} save={async () => null} onChanged={() => undefined} onTab={() => undefined} />);
    const button = await screen.findByTestId("api-publish");
    await waitFor(() => expect(screen.getByTestId("gate-reason")).toBeTruthy());
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByTestId("gate-reason"), { target: { value: "zu kurz" } });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByTestId("gate-reason"), { target: { value: "  Wortlaut geprüft, Team einverstanden  " } });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    await waitFor(() =>
      expect(publish).toHaveBeenCalledWith("wf_1", expect.objectContaining({ override: { reason: "Wortlaut geprüft, Team einverstanden" } })),
    );
    expect(screen.getByText("mit Begründung freigegeben")).toBeTruthy();
  });

  it("cannot publish a blocked version, not even with a reason", async () => {
    vi.spyOn(api, "apiCheck").mockResolvedValue({ ok: true, errors: 0, warnings: 0, problems: [], agents: {}, approvals: 0, subworkflows: [], tools: [], libraries: [] } as never);
    vi.spyOn(api, "releaseGate").mockResolvedValue({ ...OVERRIDABLE, status: "blocked", items: [item("critical", "gate.suite_untested", false)] });
    wrap(<ApiOverviewPanel overview={overview(OVERRIDABLE.gate)} dirty={false} save={async () => null} onChanged={() => undefined} onTab={() => undefined} />);
    await waitFor(() => expect(screen.getByTestId("gate-report").dataset.status).toBe("blocked"));
    expect(screen.queryByTestId("gate-reason")).toBeNull();
    expect(screen.getByTestId("api-publish")).toBeDisabled();
  });
});
