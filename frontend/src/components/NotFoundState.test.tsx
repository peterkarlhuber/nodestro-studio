import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../api/client";
import { ProviderSetupLink, needsProviderSetup } from "../lib/errors";
import { SuitePage } from "../pages/TestsPage";
import { NotFoundState } from "./NotFoundState";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("NotFoundState", () => {
  it("names the missing object and leads back to its list", () => {
    render(
      <MemoryRouter>
        <NotFoundState kind="run" error={new ApiError("'run_x' was not found", 404, "not_found")} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Ausführung nicht gefunden" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Zurück zu den Ausführungen/ })).toHaveAttribute("href", "/executions");
  });

  it("shows other failures as such, still with the way back", () => {
    render(
      <MemoryRouter>
        <NotFoundState kind="workflow" error={new ApiError("boom", 500, null)} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Diese Seite ließ sich nicht laden" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Zurück zu den Workflows/ })).toHaveAttribute("href", "/");
  });

  it("ends the spinner of a missing test series", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.startsWith("/api/benchmarks/s_missing")
          ? new Response(JSON.stringify({ detail: "not found", code: "not_found" }), { status: 404, headers: { "Content-Type": "application/json" } })
          : new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } }),
      ),
    );
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={["/tests/s_missing"]}>
          <Routes>
            <Route path="/tests/:id" element={<SuitePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole("heading", { name: "Testreihe nicht gefunden" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Zurück zu den Testreihen/ })).toHaveAttribute("href", "/tests");
  });
});

describe("ProviderSetupLink", () => {
  it("recognises the missing-provider codes of every area", () => {
    expect(needsProviderSetup({ code: "api_key_missing" })).toBe(true);
    expect(needsProviderSetup({ code: "check.api_key_missing" })).toBe(true);
    expect(needsProviderSetup({ code: "check.provider_not_configured" })).toBe(true);
    expect(needsProviderSetup({ code: "provider.not_configured" })).toBe(true);
    expect(needsProviderSetup({ code: "run.failed" })).toBe(false);
    expect(needsProviderSetup(null)).toBe(false);
  });

  it("links to the settings only for such a problem", () => {
    const { rerender } = render(
      <MemoryRouter>
        <ProviderSetupLink item={{ code: "api_key_missing", params: { provider: "anthropic" } }} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "KI-Anbieter einrichten" })).toHaveAttribute("href", "/settings");
    rerender(
      <MemoryRouter>
        <ProviderSetupLink item={{ code: "run.failed" }} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("link")).toBeNull();
  });
});
