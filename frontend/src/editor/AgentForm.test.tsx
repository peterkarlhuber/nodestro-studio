import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AgentConfig, ConfigIssue } from "../api/types";
import { defaultAgent } from "../lib/defaults";
import { AgentForm } from "./AgentInspector";

// CodeMirror needs a real layout engine; the form's request options editor is not under test here.
vi.mock("../components/CodeEditor", () => ({ CodeEditor: () => null }));

const QUALITY_ERROR: ConfigIssue = {
  level: "error",
  field: "quality",
  code: "config.quality_no_criteria",
  params: {},
  message: "The quality check needs at least one criterion",
};

/** The studio API as far as the form needs it: validation answers with `issues`, every list is empty. */
function stubApi(issues: ConfigIssue[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const path = url.replace(/\?.*$/, "");
      const body = path.endsWith("/agents/validate")
        ? issues
        : path.endsWith("/meta")
          ? { providers: [], capabilities: [], models: [] }
          : path.endsWith("/settings")
            ? { providers: [], default_model: "claude-sonnet-5-5", assistant_model: "claude-opus-5-5" }
            : [];
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
}

function show(agent: AgentConfig) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AgentForm agent={agent} onChange={() => undefined} onReplace={() => undefined} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const section = (container: HTMLElement, id: string) => container.querySelector<HTMLDetailsElement>(`[data-section="${id}"]`)!;

describe("AgentForm sections", () => {
  beforeEach(() => {
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    };
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows a problem of the closed quality section and opens it on request", async () => {
    stubApi([QUALITY_ERROR]);
    const { container } = show({ ...defaultAgent(), quality: { enabled: true, criteria: [], max_revisions: 1, judge_model: "x" } });
    const quality = section(container, "quality");
    expect(quality.open).toBe(false);
    await waitFor(() => expect(quality.querySelector("summary")).toHaveTextContent("1 Fehler"));
    await userEvent.click(screen.getByRole("button", { name: /Qualitätsprüfung: 1 Fehler/ }));
    expect(quality.open).toBe(true);
  });

  it("shows no problem links for a valid agent", async () => {
    stubApi([]);
    const { container } = show(defaultAgent());
    await waitFor(() => expect(section(container, "advanced").querySelector("summary")).toHaveTextContent("Standard"));
    expect(container.querySelector(".section-problems")).toBeNull();
  });
});
