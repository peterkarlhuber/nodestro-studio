import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "../i18n";
import { CheckRow, DiagnosticsPanel } from "./SettingsMaintenance";

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

describe("CheckRow", () => {
  it("names the Docker check's reason and points to Settings → Sandbox", () => {
    const { container } = render(
      <CheckRow
        check={{
          id: "docker",
          status: "ok",
          code: "unavailable",
          params: { state: "unavailable", reason: "docker-seccomp", checks: [{ name: "preflight", ok: false, detail: "x" }] },
          message: "No seccomp filter",
        }}
      />,
    );
    expect(container.textContent).toContain(i18n.t("diagnostics.checks.docker.unavailable"));
    expect(screen.getByTestId("diagnostic-reason").textContent).toBe(` ${i18n.t("settings.sandbox.docker.reason.seccomp")}`);
    expect(container.textContent).toContain(i18n.t("diagnostics.checks.docker.fix.unavailable"));
  });

  it("says that Docker is still being checked", () => {
    const { container } = render(
      <CheckRow
        check={{
          id: "docker",
          status: "warning",
          code: "checking",
          params: { state: "checking", reason: "docker-checking", checks: [] },
          message: "",
        }}
      />,
    );
    expect(container.textContent).toContain("Nodestro prüft Docker noch im Hintergrund.");
    expect(screen.queryByTestId("diagnostic-reason")).toBeNull();
  });
});
