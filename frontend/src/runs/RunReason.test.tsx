// The run-level failure cause in lists and the banner (ST-003, UX audit AD-02; runtime RT-012, API-018).

import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";

import type { Run, RunCause } from "../api/types";
import i18n, { LANGUAGES, loadLanguage } from "../i18n";
import { RunProblem } from "./RunProblem";
import { RunReason, stepCause } from "./RunReason";

const budgetStop: RunCause = { node_id: "writer", label: "Writer", code: "run.budget_exceeded", params: { limit_usd: 1 } };

const failed = (extra: Partial<Run> = {}) =>
  ({
    id: "run_1",
    workflow_id: "wf_1",
    status: "failed",
    error: "Failed: Writer",
    error_code: "run.nodes_failed",
    error_params: { nodes: "Writer" },
    workflow: { nodes: [], edges: [] },
    nodes: {},
    cause: budgetStop,
    ...extra,
  }) as unknown as Run;

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(cleanup);

describe("run cause (ST-003)", () => {
  it("names the step and its reason in the list instead of only the step", () => {
    render(<RunReason run={failed()} />);
    expect(screen.getByTestId("run-cause")).toHaveTextContent("Writer: Das Budget für diesen Lauf ist aufgebraucht; der Lauf wurde gestoppt.");
  });

  it("falls back to the node id and keeps older runs without a cause readable", () => {
    render(<RunReason run={failed({ cause: { ...budgetStop, label: "" } })} />);
    expect(screen.getByTestId("run-cause")).toHaveTextContent(/^writer: /);
    cleanup();
    render(<RunReason run={failed({ cause: null })} />);
    expect(screen.queryByTestId("run-cause")).toBeNull();
    expect(screen.getByText("Fehlgeschlagen: Writer")).toBeInTheDocument();
  });

  it("uses the cause only for a run that failed because of a step", () => {
    expect(stepCause(failed())).toEqual(budgetStop);
    expect(stepCause(failed({ status: "cancelled" }))).toBeNull();
    expect(stepCause(failed({ error_code: "run.time_limit" }))).toBeNull();
  });

  it("shows the cause in the banner when the step's data is not at hand", () => {
    render(wrap(<RunProblem run={failed()} />));
    const banner = screen.getByTestId("run-failure");
    expect(banner).toHaveTextContent("Fehlgeschlagen bei Writer");
    expect(banner).toHaveTextContent("Das Budget für diesen Lauf ist aufgebraucht");
  });

  it("has the line in every language", async () => {
    for (const language of LANGUAGES) {
      await loadLanguage(language);
      const line = i18n.t("runs.failure.cause", { lng: language, step: "S", reason: "R" });
      expect(line).toMatch(/^S\s?: R$/);
    }
  });
});
