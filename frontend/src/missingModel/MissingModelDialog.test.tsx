import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../api/client";
import type { LocalJob } from "../api/localModels";
import type { ModelAlternative, ModelProblem } from "../api/modelReadiness";
import { problemModel, unavailableModel } from "../api/modelReadiness";
import { Toaster } from "../components/toast";
import i18n from "../i18n";
import { MissingModelHost } from "./MissingModelDialog";
import { askMissingModel, fixMissingModel, useMissingModel, withLocalModel } from "./store";

const GB = 1_000_000_000;

function problem(patch: Partial<ModelProblem> = {}): ModelProblem {
  return {
    cause: "model_missing",
    model: "ollama:qwen3.5:9b",
    name: "qwen3.5:9b",
    action: "architect",
    mode: "managed",
    location: "this_computer",
    actions: ["download", "choose_model"],
    blocked: null,
    offline: false,
    catalog: true,
    download_bytes: 6.6 * GB,
    memory_bytes: 8 * GB,
    free_bytes: 200 * GB,
    partial_bytes: 0,
    fits: true,
    missing_capabilities: [],
    job: null,
    previous_job: null,
    host: null,
    ...patch,
  };
}

const ALTERNATIVE: ModelAlternative = {
  model: "ollama:qwen3.5:4b",
  provider: "ollama",
  local: true,
  context_window: 32768,
  max_output_tokens: null,
  limited: false,
};

function refused(found: ModelProblem, alternatives: ModelAlternative[] = [ALTERNATIVE]): ApiError {
  return new ApiError("not ready", 409, "model.local_unavailable", {
    model: found.model,
    cause: found.cause,
    problem: found,
    alternatives,
  });
}

function job(patch: Partial<LocalJob> = {}): LocalJob {
  return {
    id: "pull-1",
    kind: "pull",
    target: "qwen3.5:9b",
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

/** A backend double: the download job is done when the jobs are listed; the readiness check then says ready. */
function serve(options: { jobState?: LocalJob["state"]; ready?: boolean } = {}) {
  const calls: { method: string; url: string; body: unknown }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ method, url, body });
      const reply = (value: unknown) => new Response(JSON.stringify(value), { status: 200, headers: { "Content-Type": "application/json" } });
      if (url.endsWith("/local-models/pull")) return reply(job());
      if (url.endsWith("/local-models/jobs")) return reply([job({ state: options.jobState ?? "done" })]);
      if (url.endsWith("/local-models/readiness"))
        return reply(
          options.ready === false
            ? { model: "ollama:qwen3.5:9b", ready: false, problem: problem(), alternatives: [] }
            : { model: "ollama:qwen3.5:9b", ready: true, problem: null, alternatives: [] },
        );
      return reply({});
    }),
  );
  return calls;
}

function host() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MissingModelHost />
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

afterEach(() => {
  act(() => useMissingModel.getState().request?.resolve(null));
  useMissingModel.setState({ request: null });
  cleanup();
  vi.unstubAllGlobals();
});

describe("reading a refused action", () => {
  it("recognizes only model.local_unavailable with a problem", () => {
    expect(unavailableModel(new ApiError("x", 400, "api_key_missing"))).toBeNull();
    expect(unavailableModel(new Error("x"))).toBeNull();
    expect(unavailableModel(refused(problem()))?.problem?.cause).toBe("model_missing");
    expect(askMissingModel(new ApiError("x", 400, "api_key_missing"), { action: "architect" })).toBeNull();
  });

  it("names the model of problems that runs, schedules and checks report", () => {
    expect(problemModel({ code: "run.local_model_missing", params: { model: "qwen3.5:9b" } })).toBe("ollama:qwen3.5:9b");
    expect(problemModel({ code: "check.local_model_missing", params: { model: "ollama:qwen3.5:9b" } })).toBe("ollama:qwen3.5:9b");
    expect(problemModel({ code: "run.api_error", params: { model: "x" } })).toBeNull();
    // A refused scheduled start lists the check's problems.
    const blocked = {
      code: "workflow.blocked",
      params: { problems: [{ code: "check.tool_missing", params: {} }, { code: "check.local_model_missing", params: { model: "ollama:qwen3.5:9b" } }] },
    };
    expect(problemModel(blocked)).toBe("ollama:qwen3.5:9b");
    expect(problemModel({ code: "workflow.blocked", params: { problems: [{ code: "check.tool_missing" }] } })).toBeNull();
  });
});

describe("the missing model dialog", () => {
  it("explains the missing model with size and space, downloads once and continues after the check", async () => {
    const calls = serve();
    const user = userEvent.setup();
    host();
    let resolution: unknown = "pending";
    act(() => {
      void askMissingModel(refused(problem()), { action: "architect" })!.then((value) => (resolution = value));
    });
    expect(await screen.findByRole("dialog", { name: "Required model not installed" })).toBeInTheDocument();
    expect(screen.getByTestId("missing-model-cause")).toHaveTextContent("The local model qwen3.5:9b is not available on this computer yet.");
    expect(screen.getByTestId("missing-model-facts")).toHaveTextContent("Download size: 6.6 GB");
    expect(screen.getByTestId("missing-model-facts")).toHaveTextContent("Free space in the model folder: 200.0 GB");
    expect(screen.getByTestId("missing-model-keep")).toHaveTextContent("Your name, description and options are kept");
    const download = screen.getByTestId("missing-model-download");
    await user.click(download);
    await user.click(download); // a second click starts nothing
    expect(await screen.findByTestId("missing-model-ready")).toHaveTextContent("Continue to start the Workflow Architect.");
    expect(calls.filter((call) => call.url.endsWith("/local-models/pull"))).toEqual([
      { method: "POST", url: "/api/local-models/pull", body: { model: "qwen3.5:9b", attach: true } },
    ]);
    expect(calls.some((call) => call.url.endsWith("/local-models/readiness"))).toBe(true);
    const next = screen.getByTestId("missing-model-continue");
    await user.click(next);
    expect(resolution).toEqual({ model: "ollama:qwen3.5:9b", switched: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lets the person choose another ready model for this action only", async () => {
    serve();
    const user = userEvent.setup();
    host();
    let resolution: unknown = "pending";
    act(() => {
      void askMissingModel(refused(problem()), { action: "architect" })!.then((value) => (resolution = value));
    });
    await user.click(await screen.findByTestId("missing-model-choose"));
    expect(screen.getByTestId("missing-model-alternatives")).toHaveTextContent("Your settings are not changed.");
    expect(screen.getByRole("radio", { name: /qwen3.5:4b/ })).toBeChecked();
    await user.click(screen.getByTestId("missing-model-use"));
    expect(resolution).toEqual({ model: "ollama:qwen3.5:4b", switched: true });
  });

  it("offers no download without permission, only the exact model for an administrator", async () => {
    serve();
    host();
    act(() => {
      void askMissingModel(refused(problem({ blocked: "permission", actions: ["ask_admin"] }), []), { action: "assistant" });
    });
    expect(await screen.findByTestId("missing-model-blocked")).toHaveTextContent("Ask an administrator to install qwen3.5:9b.");
    expect(screen.queryByTestId("missing-model-download")).not.toBeInTheDocument();
    expect(screen.queryByTestId("missing-model-choose")).not.toBeInTheDocument();
    expect(screen.getByTestId("missing-model-copy")).toBeInTheDocument();
  });

  it("never offers a download to this computer for a server's model", async () => {
    serve();
    host();
    act(() => {
      void askMissingModel(refused(problem({ location: "server", mode: "external", blocked: "operator", actions: ["ask_admin"], fits: null }), []), {
        action: "assistant",
      });
    });
    expect(await screen.findByTestId("missing-model-cause")).toHaveTextContent("is not installed on this Nodestro server");
    expect(screen.getByTestId("missing-model-blocked")).toHaveTextContent("not on your computer");
    expect(screen.queryByTestId("missing-model-download")).not.toBeInTheDocument();
  });

  it("follows a download of the same model that runs already instead of starting another", async () => {
    const calls = serve({ jobState: "running" });
    host();
    act(() => {
      void askMissingModel(refused(problem({ job: job() })), { action: "assistant" });
    });
    expect(await screen.findByText(/already being downloaded/)).toBeInTheDocument();
    expect(screen.getByTestId("missing-model-job")).toBeInTheDocument();
    expect(screen.queryByTestId("missing-model-download")).not.toBeInTheDocument();
    expect(calls.some((call) => call.url.endsWith("/local-models/pull"))).toBe(false);
  });

  it("continues on its own only after the opt-in, and only once", async () => {
    let finish!: () => void;
    const done = new Promise<void>((resolve) => (finish = resolve));
    serve({ jobState: "running" });
    const user = userEvent.setup();
    host();
    let resolutions = 0;
    act(() => {
      void askMissingModel(refused(problem({ job: job() })), { action: "run" })!.then(() => {
        resolutions += 1;
        finish();
      });
    });
    await user.click(await screen.findByTestId("missing-model-auto"));
    serve({ jobState: "done" }); // the download ends; the next poll sees it
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1300));
    });
    await done;
    expect(resolutions).toBe(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("checks an unreachable server again instead of downloading", async () => {
    const calls = serve({ ready: false });
    const user = userEvent.setup();
    host();
    act(() => {
      void askMissingModel(refused(problem({ cause: "server_unreachable", mode: "container", location: "container", actions: ["retry", "open_settings"] }), []), {
        action: "architect",
      });
    });
    expect(await screen.findByRole("dialog", { name: "The model server does not answer" })).toBeInTheDocument();
    expect(screen.queryByTestId("missing-model-download")).not.toBeInTheDocument();
    expect(screen.getByTestId("missing-model-settings")).toHaveAttribute("href", expect.stringContaining("#settings-local-models"));
    await user.click(screen.getByTestId("missing-model-retry"));
    await waitFor(() => expect(calls.filter((call) => call.url.endsWith("/local-models/readiness")).length).toBe(1));
    // The server answers now, without the model: the dialog shows that cause and its download.
    expect(await screen.findByTestId("missing-model-download")).toBeInTheDocument();
  });

  it("reads in German and keeps the inputs promise", async () => {
    await i18n.changeLanguage("de");
    serve();
    host();
    act(() => {
      void askMissingModel(refused(problem({ action: "assistant" })), { action: "assistant" });
    });
    expect(await screen.findByRole("dialog", { name: "Benötigtes Modell nicht installiert" })).toBeInTheDocument();
    expect(screen.getByTestId("missing-model-keep")).toHaveTextContent("Deine Nachricht und ihre Dateien bleiben im Eingabefeld.");
  });
});

describe("repeating an action", () => {
  it("repeats it with the chosen model, and ends with the error when the person cancels", async () => {
    const seen: (string | undefined)[] = [];
    const attempt = vi.fn(async (model?: string) => {
      seen.push(model);
      if (!model) throw refused(problem());
      return "answered";
    });
    const pending = withLocalModel(attempt, { action: "assistant" });
    await waitFor(() => expect(useMissingModel.getState().request).not.toBeNull());
    const request = useMissingModel.getState().request!;
    useMissingModel.getState().finish(request.id, { model: "ollama:qwen3.5:4b", switched: true });
    useMissingModel.getState().finish(request.id, { model: "ollama:other", switched: true }); // a second answer counts not
    await expect(pending).resolves.toBe("answered");
    expect(seen).toEqual([undefined, "ollama:qwen3.5:4b"]);

    const error = refused(problem());
    const cancelled = withLocalModel(async () => Promise.reject(error), { action: "assistant" });
    await waitFor(() => expect(useMissingModel.getState().request).not.toBeNull());
    useMissingModel.getState().finish(useMissingModel.getState().request!.id, null);
    await expect(cancelled).rejects.toBe(error);
  });

  it("fixes a model a problem names without continuing anything", async () => {
    serve({ ready: false });
    const user = userEvent.setup();
    host();
    let fixed: boolean | null = null;
    act(() => {
      void fixMissingModel("ollama:qwen3.5:9b").then((value) => (fixed = value));
    });
    expect(await screen.findByTestId("missing-model")).toBeInTheDocument();
    expect(screen.queryByTestId("missing-model-keep")).not.toBeInTheDocument();
    serve();
    await user.click(screen.getByTestId("missing-model-download"));
    expect(await screen.findByTestId("missing-model-ready")).toHaveTextContent("Start the action again when you are ready.");
    expect(screen.queryByTestId("missing-model-auto")).not.toBeInTheDocument();
    await user.click(screen.getByTestId("missing-model-continue"));
    expect(fixed).toBe(true);
  });
});
