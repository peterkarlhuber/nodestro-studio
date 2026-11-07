import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LocalJob, LocalJobStep } from "../api/localModels";
import { Toaster } from "../components/toast";
import i18n from "../i18n";
import { JobCard, jobsEnded, LocalJobsList, SetupProgress, setupJob } from "./LocalModelJobs";

const MB = 1_000_000; // decimal megabytes, as formatBytes shows them
const SETUP_STEPS = ["check", "prerequisites", "download", "verify", "install", "configure", "start", "reachable", "hardware", "ready"];

function steps(ids: string[], running: string, patch: Partial<Record<string, Partial<LocalJobStep>>> = {}): LocalJobStep[] {
  const at = ids.indexOf(running);
  return ids.map((id, index) => ({ id, state: index < at ? "done" : index === at ? "running" : "pending", ...patch[id] }));
}

function job(patch: Partial<LocalJob>): LocalJob {
  return {
    id: "j1",
    kind: "setup",
    target: "server",
    state: "running",
    completed: 0,
    total: null,
    message: "",
    error_code: null,
    error: null,
    started_at: "2026-11-06T08:00:00Z",
    finished_at: null,
    steps: [],
    log: [],
    layers: [],
    ...patch,
  };
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

function serve() {
  const calls: { method: string; url: string; body: unknown }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      calls.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      return new Response(JSON.stringify(method === "GET" ? [] : job({ id: "j2" })), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
  return calls;
}

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("setting up the local model server", () => {
  it("shows the running step with a measured bar, rate and remaining time, and that nothing is needed", () => {
    show(
      <JobCard
        canAct
        onCancel={() => {}}
        job={job({
          phase: "download",
          progress_step: "download",
          steps: steps(SETUP_STEPS, "download", { check: { note: "missing" } }),
          completed: 400 * MB,
          total: 1_525 * MB,
          rate: 19.5 * MB,
          eta_seconds: 58,
          eta_scope: "job",
          resumed_bytes: 282 * MB,
        })}
      />,
    );
    expect(screen.getByTestId("local-job-now").textContent).toContain("Step 3 of 10: Download Ollama");
    expect(screen.getByTestId("local-job-now").textContent).toContain("No action needed");
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("26");
    const facts = screen.getByTestId("local-job-facts").textContent ?? "";
    expect(facts).toContain("400.0 MB of 1.5 GB");
    expect(facts).toContain("26%");
    expect(facts).toContain("MB/s");
    expect(facts).toContain("about 58 seconds left");
    expect(screen.getByText(/Continued: 282.0 MB were already there/)).toBeTruthy();
    const current = screen.getAllByRole("listitem").find((item) => item.getAttribute("aria-current") === "step");
    expect(current?.textContent).toContain("Download Ollama");
    expect(screen.getByText("Not installed yet: Nodestro installs the pinned version.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel: Set up the local model server" })).toBeTruthy();
  });

  it("has no percentage for a step that cannot be measured", () => {
    show(
      <JobCard
        canAct
        onCancel={() => {}}
        job={job({ phase: "start", progress_step: "verify", completed: 100, total: 100, steps: steps(SETUP_STEPS, "start") })}
      />,
    );
    const bar = screen.getByRole("progressbar");
    expect(bar.hasAttribute("aria-valuenow")).toBe(false);
    expect(screen.queryByTestId("local-job-facts")).toBeNull();
  });

  it("names a failure, what to do and offers to try again; details stay closed", async () => {
    const calls = serve();
    show(
      <SetupProgress
        canAct
        job={job({
          state: "failed",
          error_code: "local.network",
          error: "https://github.com/... cannot be reached: [Errno 111] Connection refused",
          retryable: true,
          finished_at: "2026-11-06T08:01:00Z",
          steps: steps(SETUP_STEPS, "download", { download: { state: "failed" } }),
          log: ["08:00:01 download: started"],
        })}
      />,
    );
    const problem = screen.getByTestId("local-job-problem");
    expect(problem.getAttribute("role")).toBe("alert");
    expect(problem.textContent).toContain("Action needed");
    expect(problem.textContent).toContain("The internet could not be reached.");
    expect(problem.textContent).toContain("A download continues where it stopped.");
    expect(screen.getByTestId("local-job-details").hasAttribute("open")).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: "Try again: Set up the local model server" }));
    expect(calls.find((call) => call.method === "POST")).toEqual({ method: "POST", url: "/api/local-models/setup", body: { download: true } });
  });

  it("stays in view while it runs or failed, and briefly after it finished", () => {
    expect(setupJob([job({ state: "running" })])?.id).toBe("j1");
    expect(setupJob([job({ state: "done", finished_at: new Date().toISOString() })])?.id).toBe("j1");
    expect(setupJob([job({ state: "done", finished_at: "2026-01-01T00:00:00Z" })])).toBeNull();
    expect(setupJob([job({ kind: "pull" })])).toBeNull();
  });

  it("is in the interface language", async () => {
    await i18n.changeLanguage("de");
    show(<JobCard canAct onCancel={() => {}} job={job({ phase: "start", steps: steps(SETUP_STEPS, "start") })} />);
    expect(screen.getByTestId("local-job-now").textContent).toContain("Schritt 7 von 10: Server starten");
  });
});

describe("model downloads", () => {
  const file = "sha256:" + "a".repeat(64);

  it("show the current file while the total is not known yet, and each model separately", async () => {
    const calls = serve();
    show(
      <LocalJobsList
        canAct
        catalog={[]}
        jobs={[
          job({
            id: "p1",
            kind: "pull",
            target: "qwen3.5:4b",
            phase: "download",
            progress_step: "download",
            steps: steps(["check", "manifest", "download", "verify", "finalize"], "download"),
            completed: 900 * MB,
            total: 1_200 * MB,
            total_final: false,
            layers: [
              { digest: "sha256:" + "b".repeat(64), total: 675 * MB, completed: 675 * MB },
              { digest: file, total: 525 * MB, completed: 225 * MB },
            ],
            eta_seconds: 30,
            eta_scope: "file",
          }),
          job({
            id: "p2",
            kind: "pull",
            target: "qwen3-embedding:0.6b",
            state: "cancelled",
            error_code: "local.cancelled",
            retryable: true,
            finished_at: "2026-11-06T08:02:00Z",
            steps: steps(["check", "manifest", "download", "verify", "finalize"], "download", { download: { state: "pending" } }),
          }),
        ]}
      />,
    );
    const [running, cancelled] = screen.getAllByTestId("local-job-pull");
    const bar = within(running).getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("42"); // the current file: 225 of 525 MB, rounded down like the text
    const facts = within(running).getByTestId("local-job-facts").textContent ?? "";
    expect(facts).toContain("File 2: 225.0 MB of 525.0 MB");
    expect(facts).toContain("900.0 MB downloaded");
    expect(facts).toContain("this file: about 30 seconds left");
    expect(cancelled.getAttribute("data-state")).toBe("cancelled");
    expect(within(cancelled).getByText(/what was downloaded so far is kept/)).toBeTruthy();
    await userEvent.click(within(cancelled).getByRole("button", { name: "Continue: Download qwen3-embedding:0.6b" }));
    expect(calls.find((call) => call.method === "POST")).toEqual({
      method: "POST",
      url: "/api/local-models/pull",
      body: { model: "qwen3-embedding:0.6b" },
    });
  });

  it("show only the newest attempt of each model", () => {
    show(
      <LocalJobsList
        canAct
        catalog={[]}
        jobs={[
          job({ id: "new", kind: "pull", target: "qwen3.5:9b", state: "done", finished_at: "2026-11-06T08:05:00Z" }),
          job({ id: "old", kind: "pull", target: "qwen3.5:9b", state: "failed", error_code: "local.interrupted", retryable: true }),
          job({ id: "other", kind: "pull", target: "qwen3-embedding:0.6b", state: "done", finished_at: "2026-11-06T08:01:00Z" }),
        ]}
      />,
    );
    const cards = screen.getAllByTestId("local-job-pull");
    expect(cards.map((card) => card.getAttribute("data-state"))).toEqual(["done", "done"]);
  });

  it("continue after Nodestro was closed during the download", () => {
    show(
      <JobCard
        canAct
        onCancel={() => {}}
        onRetry={() => {}}
        job={job({
          kind: "pull",
          target: "qwen3.5:9b",
          state: "failed",
          error_code: "local.interrupted",
          retryable: true,
          finished_at: "2026-11-06T08:02:00Z",
          steps: steps(["check", "manifest", "download", "verify", "finalize"], "download", { download: { state: "failed" } }),
        })}
      />,
    );
    const problem = screen.getByTestId("local-job-problem").textContent ?? "";
    expect(problem).toContain("Nodestro was closed while this was running.");
    expect(problem.match(/Nodestro was closed/g)).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Continue: Download qwen3.5:9b" })).toBeTruthy();
  });

  it("name a download that receives nothing", () => {
    show(
      <JobCard
        canAct
        onCancel={() => {}}
        job={job({
          kind: "pull",
          target: "qwen3.5:4b",
          phase: "download",
          progress_step: "download",
          steps: steps(["check", "manifest", "download", "verify", "finalize"], "download"),
          completed: 300 * MB,
          total: 400 * MB,
          total_final: true,
          rate: 0,
          stalled_seconds: 12,
        })}
      />,
    );
    expect(screen.getByTestId("local-job-stalled").textContent).toContain("No new data for 12 seconds");
    expect(screen.getByTestId("local-job-facts").textContent).not.toContain("/s");
  });
});

describe("finished jobs refresh the overview", () => {
  it("only remember the jobs of the first look", () => {
    const { ended, now } = jobsEnded(null, [job({ id: "old", state: "done" }), job({ id: "run" })]);
    expect(ended).toBe(false);
    expect([...now.all]).toEqual(["old", "run"]);
    expect([...now.running]).toEqual(["run"]);
  });

  it("see a job that ran before and ended", () => {
    const first = jobsEnded(null, [job({ id: "run" })]).now;
    expect(jobsEnded(first, [job({ id: "run" })]).ended).toBe(false);
    expect(jobsEnded(first, [job({ id: "run", state: "done" })]).ended).toBe(true);
    expect(jobsEnded(first, [job({ id: "run", state: "failed" })]).ended).toBe(true);
    // A job that left the list (the list keeps the newest) counts as ended too.
    expect(jobsEnded(first, []).ended).toBe(true);
  });

  it("see a new job that started and ended between two looks (a quick speed measurement)", () => {
    const first = jobsEnded(null, [job({ id: "old", state: "done" })]).now;
    expect(jobsEnded(first, [job({ id: "old", state: "done" }), job({ id: "quick", kind: "benchmark", state: "done" })]).ended).toBe(true);
    // A new job that still runs is not an end yet.
    expect(jobsEnded(first, [job({ id: "old", state: "done" }), job({ id: "slow", kind: "pull" })]).ended).toBe(false);
    // Nothing new, nothing running: no refresh.
    expect(jobsEnded(first, [job({ id: "old", state: "done" })]).ended).toBe(false);
  });
});
