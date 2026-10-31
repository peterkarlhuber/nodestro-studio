import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DiagnosticsPanel } from "./SettingsMaintenance";

const DIAGNOSTICS = {
  versions: { studio: "0.2.0", runtime: "0.2.0" },
  checks: [{ id: "database", status: "ok", code: "diagnostics.database_ok", params: {}, message: "ok" }],
  status: "ok",
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("DiagnosticsPanel", () => {
  it("lists the versions in a closed section that stays open across a new check", async () => {
    const fetch = vi.fn(
      async () => new Response(JSON.stringify(DIAGNOSTICS), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetch);
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <DiagnosticsPanel />
      </QueryClientProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Diagnose starten" }));
    const versions = await waitFor(() => {
      const found = [...container.querySelectorAll<HTMLDetailsElement>("details.section")].find((item) =>
        item.querySelector(".section__title")?.textContent?.includes("Versionen"),
      );
      expect(found).toBeDefined();
      return found!;
    });
    expect(versions.open).toBe(false);
    versions.open = true;
    fireEvent(versions, new Event("toggle"));
    await userEvent.click(screen.getByRole("button", { name: "Erneut prüfen" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(versions.open).toBe(true);
  });
});
