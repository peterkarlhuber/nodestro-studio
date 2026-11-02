import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SandboxBackendStatus, SandboxSelection, Settings } from "../api/types";
import { isolationAvailable, untrustedBackend } from "../api/types";

import { SandboxPanel } from "./SettingsSandbox";

afterEach(cleanup);

function backend(name: string, state: SandboxBackendStatus["state"], reason = "", detail = ""): SandboxBackendStatus {
  return { name, available: state === "approved", state, reason, detail, isolation: "none", maturity: "stable", memory: "none", notes: [] };
}

function selection(fields: Partial<SandboxSelection>): SandboxSelection {
  return {
    mode: "auto",
    profile: "desktop",
    os: "macos",
    arch: "arm64",
    untrusted: "",
    user_authored: "subprocess",
    blocked: true,
    reason: "no-isolation",
    detail: "",
    ...fields,
  };
}

function settings(fields: Partial<Settings>): Settings {
  return { sandbox: "auto", docker_available: false, ...fields } as Settings;
}

function show(value: Settings, onMode = vi.fn(), admin = true) {
  render(
    <MemoryRouter>
      <SandboxPanel settings={value} admin={admin} onMode={onMode} />
    </MemoryRouter>,
  );
  return onMode;
}

const MAC_BACKENDS = [
  backend("macos-seatbelt", "experimental", "not-released"),
  backend("docker", "unavailable", "unreachable"),
  backend("subprocess", "not-isolating"),
];

describe("Settings → Sandbox", () => {
  it("shows the runtime's macOS, the blocked state and every backend without using the experimental one", () => {
    show(settings({ sandbox_selection: selection({}), sandbox_backends: MAC_BACKENDS }));
    expect(screen.getByTestId("sandbox-runtime").textContent).toContain("macOS (arm64)");
    expect(screen.getByTestId("sandbox-untrusted").textContent).toBe("Gesperrt");
    expect(screen.getByTestId("sandbox-user-authored").textContent).toBe("Python-Prozess");
    expect(screen.getByTestId("sandbox-blocked").textContent).toContain("Installiere und starte Docker");
    const mac = screen.getByTestId("sandbox-backend-macos-seatbelt");
    expect(mac.textContent).toContain("Experimentell, nicht verwendet");
    expect(mac.textContent).toContain("nicht unabhängig geprüft");
    expect(screen.getByTestId("sandbox-backend-docker").textContent).toContain("läuft nicht");
    expect(screen.getByTestId("sandbox-backend-subprocess").textContent).toContain("Nicht isoliert");
  });

  it("names Docker as the backend of AI-created tools in automatic mode", () => {
    const value = settings({
      docker_available: true,
      sandbox_selection: selection({ os: "windows", arch: "x86_64", untrusted: "docker", blocked: false, reason: "" }),
      sandbox_backends: [backend("windows-native", "unavailable", "not-implemented"), backend("docker", "approved")],
    });
    show(value);
    expect(screen.getByTestId("sandbox-runtime").textContent).toContain("Windows (x86_64)");
    expect(screen.getByTestId("sandbox-untrusted").textContent).toBe("Docker");
    expect(screen.queryByTestId("sandbox-blocked")).toBeNull();
    expect(screen.getByTestId("sandbox-backend-windows-native").textContent).toContain("noch keine eigene Sandbox");
    expect(isolationAvailable(value)).toBe(true);
    expect(untrustedBackend(value)).toBe("docker");
  });

  it("offers the automatic mode and saves a change", async () => {
    const onMode = show(settings({ sandbox: "subprocess", sandbox_selection: selection({ mode: "subprocess" }) }));
    expect(screen.getByTestId("sandbox-blocked").textContent).toContain("Wähle Automatisch oder Docker");
    const group = screen.getByRole("radiogroup", { name: "Sandbox" });
    await userEvent.click(within(group).getByRole("radio", { name: "Automatisch" }));
    expect(onMode).toHaveBeenCalledWith("auto");
  });

  it("explains on a server that tools run only in containers", () => {
    show(
      settings({
        sandbox: "docker",
        docker_available: true,
        sandbox_selection: selection({ profile: "server", os: "linux", untrusted: "docker", user_authored: "docker", blocked: false }),
      }),
    );
    expect(screen.getByTestId("sandbox-containers-only")).toBeTruthy();
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });

  it("keeps the earlier view for a runtime without a selection report", () => {
    const value = settings({
      sandbox: "subprocess",
      builtin_sandbox: { available: false, reason: "landlock", detail: "abi 0", system: "ubuntu 22.04" },
    });
    show(value);
    expect(screen.getByTestId("builtin-sandbox").textContent).toContain("nicht verfügbar");
    expect(screen.getByTestId("builtin-sandbox-reason").textContent).toContain("Landlock");
    expect(screen.queryByRole("radio", { name: "Automatisch" })).toBeNull();
    expect(isolationAvailable(value)).toBe(false);
  });
});
