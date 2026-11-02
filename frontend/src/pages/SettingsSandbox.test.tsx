import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SandboxBackendStatus, SandboxCheck, SandboxSelection, Settings } from "../api/types";
import { DOCKER_REASONS, isolationAvailable, untrustedBackend } from "../api/types";
import i18n, { loadLanguage } from "../i18n";

import { SandboxPanel } from "./SettingsSandbox";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  setHidden(false);
});

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
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <SandboxPanel settings={value} admin={admin} onMode={onMode} pollInterval={10} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return onMode;
}

/** The Docker row of a runtime that reports its checks (2026-11-02 and later). */
function docker(
  state: SandboxBackendStatus["state"],
  reason = "",
  checks: SandboxCheck[] = [],
  fields: Partial<SandboxBackendStatus> = {},
): SandboxBackendStatus {
  return {
    ...backend("docker", state, reason),
    isolation: "container",
    engine: "docker",
    rootless: true,
    cgroup_version: "2",
    checks,
    tested_at: null,
    ...fields,
  };
}

const ok = (name: string, detail = ""): SandboxCheck => ({ name, ok: true, detail });
const failed = (name: string, detail = ""): SandboxCheck => ({ name, ok: false, detail });
const PASSED = ["cli", "daemon", "preflight", "image", "self-test"].map((name) => ok(name));

/** The check that fails for each reason, as the runtime reports it (checks stop at the first failure). */
const FAILED_CHECK: Record<string, SandboxCheck[]> = {
  "docker-missing": [failed("cli", "docker not on PATH")],
  "docker-unreachable": [ok("cli"), failed("daemon", "Cannot connect to the Docker daemon")],
  "docker-limits": [ok("cli"), ok("daemon"), failed("preflight", "no pids limit")],
  "docker-seccomp": [ok("cli"), ok("daemon"), failed("preflight", "no seccomp")],
  "docker-rootless-cgroup": [ok("cli"), ok("daemon"), failed("preflight", "no cpu delegation")],
  "docker-os-type": [ok("cli"), ok("daemon"), failed("preflight", "OSType windows")],
  "docker-image": [ok("cli"), ok("daemon"), ok("preflight"), failed("image", "image missing")],
  "docker-selftest": [ok("cli"), ok("daemon"), ok("preflight"), ok("image"), failed("self-test", "uid 0")],
};

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
}

/** A fetch stand-in for /api/sandbox/*: answers the given statuses in turn (the last one again and again). */
function stubStatus(...answers: SandboxBackendStatus[]) {
  let next = 0;
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    void init;
    if (!url.startsWith("/api/sandbox/")) return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
    const answer = answers[Math.min(next++, answers.length - 1)];
    return new Response(JSON.stringify(answer), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

const sandboxCalls = (fetch: ReturnType<typeof stubStatus>) =>
  fetch.mock.calls
    .filter(([url]) => String(url).startsWith("/api/sandbox/"))
    .map(([url, init]) => `${init?.method ?? "GET"} ${String(url)}`);

const MAC_BACKENDS = [
  backend("macos-seatbelt", "unavailable", "removed"),
  backend("docker", "unavailable", "unreachable"),
  backend("subprocess", "not-isolating"),
];

describe("Settings → Sandbox", () => {
  it("shows the runtime's macOS, the blocked state and every backend, the native macOS sandbox as removed", () => {
    show(settings({ sandbox_selection: selection({}), sandbox_backends: MAC_BACKENDS }));
    expect(screen.getByTestId("sandbox-runtime").textContent).toContain("macOS (arm64)");
    expect(screen.getByTestId("sandbox-untrusted").textContent).toBe("Gesperrt");
    expect(screen.getByTestId("sandbox-user-authored").textContent).toBe("Python-Prozess");
    expect(screen.getByTestId("sandbox-blocked").textContent).toContain("Installiere und starte Docker");
    const mac = screen.getByTestId("sandbox-backend-macos-seatbelt");
    expect(mac.textContent).toContain("Native macOS-Sandbox");
    expect(mac.textContent).toContain("Nicht verfügbar");
    expect(mac.textContent).toContain("Entfernt: Nodestro verwendet unter macOS Docker.");
    expect(screen.getByTestId("sandbox-backend-docker").textContent).toContain("läuft nicht");
    expect(screen.getByTestId("sandbox-backend-subprocess").textContent).toContain("Nicht isoliert");
  });

  it("still explains the experimental macOS sandbox of an older runtime", () => {
    const backends = [backend("macos-seatbelt", "experimental", "not-released"), ...MAC_BACKENDS.slice(1)];
    show(settings({ sandbox_selection: selection({}), sandbox_backends: backends }));
    const mac = screen.getByTestId("sandbox-backend-macos-seatbelt");
    expect(mac.textContent).toContain("Experimentell, nicht verwendet");
    expect(mac.textContent).toContain("nicht unabhängig geprüft");
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

describe("Settings → Sandbox: the Docker checks", () => {
  const blockedDocker = (row: SandboxBackendStatus) =>
    settings({ sandbox_selection: selection({ os: "macos" }), sandbox_backends: [MAC_BACKENDS[0], row, MAC_BACKENDS[2]] });

  it.each(DOCKER_REASONS.filter((reason) => reason !== "docker-checking"))(
    "explains %s and marks the failed check with its reason",
    (reason) => {
      const checks = FAILED_CHECK[reason];
      show(blockedDocker(docker("unavailable", reason, checks)));
      const sentence = i18n.t(`settings.sandbox.docker.reason.${reason.slice("docker-".length)}`);
      expect(sentence).not.toContain("settings.sandbox");
      expect(screen.getByTestId("sandbox-docker-reason").textContent).toBe(sentence);
      expect(screen.getByTestId("sandbox-backend-docker").textContent).toContain(sentence);
      const bad = checks.find((check) => !check.ok)!;
      const row = screen.getByTestId(`sandbox-check-${bad.name}`);
      expect(row.textContent).toContain("Fehlgeschlagen");
      expect(row.textContent).toContain(bad.detail);
      expect(screen.getByTestId(`sandbox-check-${bad.name}-reason`).textContent).toBe(sentence);
      for (const good of checks.filter((check) => check.ok)) {
        expect(screen.getByTestId(`sandbox-check-${good.name}`).textContent).toContain("Bestanden");
        expect(screen.queryByTestId(`sandbox-check-${good.name}-reason`)).toBeNull();
      }
      // Blocked secure execution names the reason.
      expect(screen.getByTestId("sandbox-blocked-reason").textContent).toBe(sentence);
      const lead = screen.getByTestId("sandbox-blocked").textContent;
      if (reason === "docker-missing" || reason === "docker-unreachable") expect(lead).toContain("Installiere und starte Docker");
      else expect(lead).toBe(i18n.t("settings.sandbox.blocked.dockerRefused"));
    },
  );

  it("has a sentence for every Docker reason in every language", async () => {
    for (const language of ["de", "en", "es", "fr", "it", "pt-BR"] as const) {
      await loadLanguage(language);
      const t = i18n.getFixedT(language);
      for (const reason of DOCKER_REASONS) {
        const key = `settings.sandbox.docker.reason.${reason.slice("docker-".length)}`;
        expect(i18n.exists(key, { lng: language }), `${language}: ${key}`).toBe(true);
        expect(t(key)).not.toBe(key);
      }
    }
  });

  it("shows the engine, rootless and cgroup badges and the passed checks of an approved engine", () => {
    const tested = "2026-11-02T12:00:00Z";
    show(
      settings({
        docker_available: true,
        sandbox_selection: selection({ untrusted: "docker", blocked: false, reason: "" }),
        sandbox_backends: [docker("approved", "", PASSED, { engine: "podman", tested_at: tested })],
      }),
    );
    expect(screen.getByTestId("sandbox-docker-ready")).toBeTruthy();
    expect(screen.getByTestId("sandbox-docker-engine").textContent).toContain("podman");
    expect(screen.getByTestId("sandbox-docker-rootless").textContent).toBe("Ohne Root-Rechte (rootless)");
    expect(screen.getByTestId("sandbox-docker-cgroup").textContent).toBe("Ressourcengrenzen (cgroup v2)");
    expect(screen.getAllByText("Bestanden")).toHaveLength(5);
    expect(screen.queryByText("Fehlgeschlagen")).toBeNull();
    expect(screen.getByTestId("sandbox-docker-tested")).toBeTruthy();
    expect(screen.queryByTestId("sandbox-docker-rootful")).toBeNull();
    expect(screen.queryByTestId("sandbox-blocked")).toBeNull();
  });

  it("warns about the docker group of a rootful daemon", () => {
    const note =
      "This Docker daemon runs as root: membership in the docker group (or access to its socket) is equivalent to root access on this computer.";
    show(settings({ sandbox_backends: [docker("approved", "", PASSED, { rootless: false, cgroup_version: "1", notes: [note] })] }));
    expect(screen.getByTestId("sandbox-docker-rootless").textContent).toBe("Mit Root-Rechten (rootful)");
    expect(screen.getByTestId("sandbox-docker-cgroup").textContent).toBe("Ressourcengrenzen (cgroup v1)");
    expect(screen.getByTestId("sandbox-docker-rootful").textContent).toContain("Gruppe docker");
  });

  it("polls the status while Docker is being checked, then shows the result", async () => {
    const fetch = stubStatus(docker("checking", "docker-checking"), docker("approved", "", PASSED));
    show(blockedDocker(docker("checking", "docker-checking")));
    expect(screen.getByTestId("sandbox-docker-checking")).toBeTruthy();
    expect(screen.getByTestId("sandbox-blocked").textContent).toBe(i18n.t("settings.sandbox.blocked.checking"));
    expect(screen.getByRole("button", { name: "Erneut prüfen" })).toBeDisabled();
    await screen.findByTestId("sandbox-docker-ready");
    expect(sandboxCalls(fetch)).toEqual(["GET /api/sandbox/status?wait=2", "GET /api/sandbox/status?wait=2"]);
    const calls = sandboxCalls(fetch).length;
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(sandboxCalls(fetch)).toHaveLength(calls); // no polling once the check settled
  });

  it("stops polling while the page is hidden", async () => {
    setHidden(true);
    const fetch = stubStatus(docker("checking", "docker-checking"), docker("approved", "", PASSED));
    show(blockedDocker(docker("checking", "docker-checking")));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(sandboxCalls(fetch)).toEqual([]);
    act(() => {
      setHidden(false);
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await screen.findByTestId("sandbox-docker-ready");
    expect(sandboxCalls(fetch).length).toBeGreaterThan(0);
  });

  it("checks again on request and follows the check until it settles", async () => {
    const fetch = stubStatus(docker("checking", "docker-checking"), docker("approved", "", PASSED));
    show(blockedDocker(docker("unavailable", "docker-unreachable", FAILED_CHECK["docker-unreachable"])));
    expect(sandboxCalls(fetch)).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: "Erneut prüfen" }));
    await screen.findByTestId("sandbox-docker-ready");
    expect(sandboxCalls(fetch)[0]).toBe("GET /api/sandbox/status?refresh=1");
    expect(sandboxCalls(fetch)[1]).toBe("GET /api/sandbox/status?wait=2");
    expect(screen.getByTestId("sandbox-backend-docker").textContent).toContain("Freigegeben");
  });

  it("offers the self-test to administrators only", async () => {
    const row = docker("unavailable", "docker-selftest", FAILED_CHECK["docker-selftest"]);
    show(blockedDocker(row), vi.fn(), false);
    expect(screen.queryByRole("button", { name: "Selbsttest ausführen" })).toBeNull();
    expect(screen.getByRole("button", { name: "Erneut prüfen" })).toBeEnabled();
    cleanup();
    const fetch = stubStatus(docker("approved", "", PASSED));
    show(blockedDocker(row), vi.fn(), true);
    await userEvent.click(screen.getByRole("button", { name: "Selbsttest ausführen" }));
    await screen.findByTestId("sandbox-docker-ready");
    expect(sandboxCalls(fetch)).toEqual(["POST /api/sandbox/self-test"]);
  });

  it("names the self-test after the sandbox preparation when the image is missing", () => {
    show(blockedDocker(docker("unavailable", "docker-image", FAILED_CHECK["docker-image"])));
    expect(screen.getByRole("button", { name: "Sandbox vorbereiten" })).toBeTruthy();
  });

  it("keeps the earlier view for a runtime without the Docker checks", () => {
    const fetch = stubStatus(docker("approved"));
    show(settings({ sandbox_selection: selection({}), sandbox_backends: MAC_BACKENDS }));
    expect(screen.queryByTestId("sandbox-docker")).toBeNull();
    expect(screen.queryByRole("button", { name: "Erneut prüfen" })).toBeNull();
    expect(screen.queryByTestId("sandbox-blocked-reason")).toBeNull();
    expect(screen.getByTestId("sandbox-blocked").textContent).toContain("Installiere und starte Docker");
    expect(screen.getByTestId("sandbox-backend-docker").textContent).toContain("läuft nicht");
    expect(sandboxCalls(fetch)).toEqual([]);
  });
});
