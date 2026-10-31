import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../api/client";
import type { CaseProposal, Run, Suite } from "../api/types";
import { TestCaseFromRunDialog } from "./TestCaseFromRunDialog";

const RUN = {
  id: "run_1",
  workflow_id: "wf_1",
  workflow_name: "Anfragen",
  status: "failed",
  created_at: "2026-10-31T10:00:00Z",
  workflow: { nodes: [{ id: "start", type: "start", start: { fields: [{ name: "kunde", label: "Kunde", type: "text" }] } }] },
} as unknown as Run;

const proposal = (personal: boolean): CaseProposal => ({
  workflow_id: "wf_1",
  case: {
    id: "case_new",
    name: "",
    input: "Key [API_KEY_1]",
    values: { kunde: personal ? "[EMAIL_1]" : "anna@example.com" },
    file_ids: [],
    checks: [],
    judge_criteria: "",
    expected: "",
    origin: {
      run_id: "run_1",
      run_status: "failed",
      run_at: "2026-10-31T10:00:00Z",
      workflow_version: 2,
      error_code: "run.max_tokens",
      personal_data: personal,
      replaced: personal ? { api_key: 1, email: 1 } : { api_key: 1 },
      proposed_at: "2026-10-31T11:00:00Z",
    },
  },
  missing_files: [],
  problems: [],
});

const SUITE = { id: "suite_1", name: "Regression", description: "", workflow_id: "wf_1", cases: [{ id: "case_old" }], judge_model: null } as unknown as Suite;

function wrap() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <TestCaseFromRunDialog run={RUN} open onClose={() => undefined} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("test case from a failed run", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows the redacted proposal and adds it to an existing series only on confirmation", async () => {
    vi.spyOn(api, "suites").mockResolvedValue([SUITE, { ...SUITE, id: "suite_other", workflow_id: "wf_2" }]);
    const propose = vi.spyOn(api, "proposeTestCase").mockImplementation(async (_id, personal) => proposal(personal ?? true));
    vi.spyOn(api, "suite").mockResolvedValue(SUITE);
    const update = vi.spyOn(api, "updateSuite").mockResolvedValue(SUITE);
    wrap();
    await screen.findByText("[EMAIL_1]");
    expect(screen.getByTestId("case-from-run-replaced").textContent).toMatch(/API-Schlüssel/);
    expect(update).not.toHaveBeenCalled();
    // Only series of the run's workflow are offered, plus a new one.
    await waitFor(() => expect(screen.getByTestId("case-from-run-suite").querySelectorAll("option")).toHaveLength(2));

    // Personal data can be kept; the proposal is asked for again.
    fireEvent.click(screen.getByRole("switch", { name: /Personenbezogene Daten ersetzen/ }));
    await screen.findByText("anna@example.com");
    expect(propose).toHaveBeenLastCalledWith("run_1", false);

    fireEvent.click(screen.getByTestId("case-from-run-add"));
    await waitFor(() => expect(update).toHaveBeenCalled());
    const [id, body] = update.mock.calls[0];
    expect(id).toBe("suite_1");
    expect(body.cases.map((item) => item.id)).toEqual(["case_old", "case_new"]);
    expect(body.cases[1].origin?.run_id).toBe("run_1");
    expect(body.cases[1].name).toMatch(/^Fehler vom /);
  });

  it("creates a new series when the workflow has none", async () => {
    vi.spyOn(api, "suites").mockResolvedValue([]);
    vi.spyOn(api, "proposeTestCase").mockResolvedValue(proposal(true));
    const create = vi.spyOn(api, "createSuite").mockResolvedValue({ ...SUITE, id: "suite_new" });
    wrap();
    await screen.findByText("[EMAIL_1]");
    fireEvent.click(screen.getByTestId("case-from-run-add"));
    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][0]).toMatchObject({ name: "Anfragen: Fehlerfälle", workflow_id: "wf_1" });
  });
});
