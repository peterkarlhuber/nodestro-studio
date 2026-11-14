import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DiagnosticCheck } from "../api/types";
import i18n from "../i18n";
import { type RepairPlan, startMode, symbolicMode } from "./api";
import { DatabasePermissionsAction } from "./DatabasePermissionsAction";
import { RecoveryScreen } from "./RecoveryScreen";

const PLAN: RepairPlan = {
  origin: "refused",
  files: [
    { name: "nodestro.db", path: "/data/nodestro.db", status: "not_confirmed", old_mode: "0664", new_mode: "0600", reason: null },
    { name: "nodestro.db-wal", path: "/data/nodestro.db-wal", status: "unchanged", old_mode: "0600", new_mode: "0600", reason: null },
  ],
  repairable: true,
  plan: "f".repeat(64),
  command: "chmod 600 /data/nodestro.db",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** A backend that answers the routes in ``answers`` in order of the calls to each route. */
function backend(answers: Record<string, Response[]>) {
  const calls: { method: string; path: string; body: unknown }[] = [];
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    const method = init?.method ?? "GET";
    calls.push({ method, path, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const queue = answers[`${method} ${path}`];
    if (!queue?.length) return json({ status: "ok", mode: "recovery" });
    return queue.length > 1 ? queue.shift()! : queue[0].clone();
  });
  vi.stubGlobal("fetch", fetch);
  return calls;
}

const GET_PLAN = "GET /api/recovery/database-permissions";
const REPAIR = "POST /api/recovery/database-permissions/repair";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("symbolicMode", () => {
  it("shows the permissions as a file manager does", () => {
    expect(symbolicMode("0664")).toBe("rw-rw-r--");
    expect(symbolicMode("0600")).toBe("rw-------");
    expect(symbolicMode("0400")).toBe("r--------");
    expect(symbolicMode(null)).toBe("");
    expect(symbolicMode("x")).toBe("");
  });
});

describe("startMode", () => {
  it("tells recovery mode from the regular API and a stopped backend", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ status: "ok", mode: "recovery" })));
    expect(await startMode()).toBe("recovery");
    vi.stubGlobal("fetch", vi.fn(async () => json({ status: "ok" })));
    expect(await startMode()).toBe("normal");
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("offline"))));
    expect(await startMode()).toBe("down");
  });
});

describe("RecoveryScreen", () => {
  it("shows the old and new modes and repairs only after the explicit confirmation", async () => {
    const calls = backend({
      [GET_PLAN]: [json(PLAN)],
      [REPAIR]: [
        json({ outcome: "repaired", repaired: true, restart: true, files: [{ ...PLAN.files[0], status: "changed" }] }),
      ],
    });
    render(<RecoveryScreen />);
    const rows = await screen.findByTestId("recovery-files");
    expect(rows.textContent).toContain("rw-rw-r--");
    expect(rows.textContent).toContain("(0664)");
    expect(rows.textContent).toContain("rw-------");
    expect(rows.textContent).toContain(i18n.t("recovery.unchanged"));
    expect(screen.getByTestId("recovery-manual").textContent).toContain("chmod 600 /data/nodestro.db");
    const repair = screen.getByTestId("recovery-repair");
    expect(repair).toBeDisabled();
    await userEvent.click(repair);
    expect(calls.some((call) => call.method === "POST")).toBe(false);
    await userEvent.click(screen.getByTestId("recovery-confirm"));
    await userEvent.click(repair);
    expect(await screen.findByTestId("recovery-done")).toHaveTextContent(i18n.t("recovery.repaired"));
    expect(calls.filter((call) => call.method === "POST")).toEqual([
      { method: "POST", path: "/api/recovery/database-permissions/repair", body: { confirm: true, plan: PLAN.plan } },
    ]);
  });

  it("changes nothing on cancel and names the manual alternative", async () => {
    const calls = backend({ [GET_PLAN]: [json(PLAN)] });
    render(<RecoveryScreen />);
    await screen.findByTestId("recovery-files");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("recovery.cancel") }));
    expect(screen.getByTestId("recovery-cancelled")).toHaveTextContent(i18n.t("recovery.cancelled"));
    expect(screen.getByTestId("recovery-manual").textContent).toContain("chmod 600 /data/nodestro.db");
    expect(calls.every((call) => call.method === "GET")).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: i18n.t("recovery.showAgain") }));
    expect(await screen.findByTestId("recovery-repair")).toBeDisabled();
  });

  it("returns to the studio unchanged on cancel when the diagnosis asked for the repair", async () => {
    const calls = backend({
      [GET_PLAN]: [json({ ...PLAN, origin: "requested" })],
      [REPAIR]: [json({ outcome: "returned", repaired: false, restart: true, files: [] })],
    });
    render(<RecoveryScreen />);
    await screen.findByTestId("recovery-files");
    await userEvent.click(screen.getByTestId("recovery-cancel"));
    expect(await screen.findByTestId("recovery-done")).toHaveTextContent(i18n.t("recovery.returning"));
    expect(calls.filter((call) => call.method === "POST")).toEqual([
      { method: "POST", path: "/api/recovery/database-permissions/repair", body: { action: "return", confirm: false } },
    ]);
  });

  it("only restarts when the files are private already (repaired by hand)", async () => {
    const calls = backend({
      [GET_PLAN]: [
        json({
          ...PLAN,
          repairable: false,
          private: true,
          command: null,
          files: [{ ...PLAN.files[0], status: "unchanged", old_mode: "0600" }],
        }),
      ],
      [REPAIR]: [json({ outcome: "already_private", repaired: false, restart: true, files: [] })],
    });
    render(<RecoveryScreen />);
    expect(await screen.findByTestId("recovery-private")).toHaveTextContent(i18n.t("recovery.alreadyPrivate"));
    expect(screen.queryByTestId("recovery-repair")).toBeNull();
    expect(screen.queryByText(i18n.t("recovery.notRepairable"))).toBeNull();
    await userEvent.click(screen.getByTestId("recovery-continue"));
    expect(await screen.findByTestId("recovery-done")).toHaveTextContent(i18n.t("recovery.alreadyPrivateRestarting"));
    expect(calls.filter((call) => call.method === "POST")[0].body).toEqual({ confirm: true, plan: PLAN.plan });
  });

  it("is a page region whose heading takes the focus, not a modal dialog", async () => {
    backend({ [GET_PLAN]: [json(PLAN)] });
    render(<RecoveryScreen />);
    await screen.findByTestId("recovery-files");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("region", { name: i18n.t("recovery.title") })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
  });

  it("names a generic manual command when the files cannot be checked", async () => {
    backend({ [GET_PLAN]: [json({ code: "internal", detail: "boom", params: {} }, 500)] });
    render(<RecoveryScreen />);
    expect(await screen.findByTestId("recovery-manual")).toHaveTextContent('chmod 600 "DATA_FOLDER"/nodestro.db*');
    expect(screen.getByText(i18n.t("recovery.genericManual"))).toBeInTheDocument();
  });

  it("names the files whose old permissions could not be set back", async () => {
    backend({
      [GET_PLAN]: [json(PLAN)],
      [REPAIR]: [
        json(
          {
            code: "recovery.repair_failed",
            detail: "failed",
            params: {
              reason: "not_changed",
              not_restored: ["nodestro.db"],
              command: "chmod 600 /data/nodestro.db",
              files: [{ ...PLAN.files[0], status: "rollback_failed", reason: "Operation not permitted" }],
            },
          },
          500,
        ),
      ],
    });
    render(<RecoveryScreen />);
    await userEvent.click(await screen.findByTestId("recovery-confirm"));
    await userEvent.click(screen.getByTestId("recovery-repair"));
    expect(await screen.findByTestId("recovery-error")).toHaveTextContent(
      i18n.t("recovery.failedNotRestored", { files: "nodestro.db" }),
    );
    expect(screen.getByTestId("recovery-files").textContent).toContain(
      i18n.t("recovery.notSetBack", { mode: "0600", reason: "Operation not permitted" }),
    );
  });

  it("says nothing was changed when the repaired database did not open and the modes were set back", async () => {
    backend({
      [GET_PLAN]: [json(PLAN)],
      [REPAIR]: [
        json(
          {
            code: "recovery.repair_failed",
            detail: "failed",
            params: {
              reason: "does_not_open",
              cause: "storage.damaged",
              not_restored: [],
              command: "chmod 600 /data/nodestro.db",
              files: [{ ...PLAN.files[0], status: "restored", new_mode: "0664" }],
            },
          },
          500,
        ),
      ],
    });
    render(<RecoveryScreen />);
    await userEvent.click(await screen.findByTestId("recovery-confirm"));
    await userEvent.click(screen.getByTestId("recovery-repair"));
    expect(await screen.findByTestId("recovery-error")).toHaveTextContent(
      i18n.t("recovery.failedDoesNotOpen", { cause: "storage.damaged" }),
    );
    expect(screen.getByTestId("recovery-files").textContent).toContain(i18n.t("recovery.setBack"));
  });

  it("shows the files again when they changed since they were shown", async () => {
    backend({
      [GET_PLAN]: [json(PLAN), json({ ...PLAN, plan: "e".repeat(64) })],
      [REPAIR]: [json({ code: "recovery.plan_changed", detail: "changed", params: {} }, 409)],
    });
    render(<RecoveryScreen />);
    await userEvent.click(await screen.findByTestId("recovery-confirm"));
    await userEvent.click(screen.getByTestId("recovery-repair"));
    expect(await screen.findByText(i18n.t("recovery.planChanged"))).toBeInTheDocument();
    expect(screen.getByTestId("recovery-confirm")).not.toBeChecked(); // confirmed again for the new files
  });

  it("reports a failed repair with the per-file result and the manual command", async () => {
    backend({
      [GET_PLAN]: [json(PLAN)],
      [REPAIR]: [
        json(
          {
            code: "recovery.repair_failed",
            detail: "failed",
            params: {
              command: "chmod 600 '/data/my data/nodestro.db'",
              files: [{ ...PLAN.files[0], status: "failed", reason: "Operation not permitted" }],
            },
          },
          500,
        ),
      ],
    });
    render(<RecoveryScreen />);
    await userEvent.click(await screen.findByTestId("recovery-confirm"));
    await userEvent.click(screen.getByTestId("recovery-repair"));
    expect(await screen.findByTestId("recovery-error")).toHaveTextContent(i18n.t("recovery.failedTitle"));
    expect(screen.getByTestId("recovery-files").textContent).toContain(
      i18n.t("recovery.failed", { reason: "Operation not permitted" }),
    );
    expect(screen.getByTestId("recovery-manual").textContent).toContain("chmod 600 '/data/my data/nodestro.db'");
    expect(screen.queryByTestId("recovery-repair")).toBeNull();
  });

  it("offers no repair for files it must leave alone", async () => {
    backend({
      [GET_PLAN]: [
        json({
          ...PLAN,
          origin: "requested",
          repairable: false,
          files: [{ ...PLAN.files[0], status: "skipped", reason: "hard_link", new_mode: null }],
        }),
      ],
    });
    render(<RecoveryScreen />);
    expect(await screen.findByText(i18n.t("recovery.notRepairable"))).toBeInTheDocument();
    expect(screen.getByTestId("recovery-files").textContent).toContain(i18n.t("recovery.skipped.hard_link"));
    expect(screen.queryByTestId("recovery-repair")).toBeNull();
    expect(screen.getByText(i18n.t("recovery.requested"))).toBeInTheDocument();
  });

  it("reloads once a backend answers again after the repair", async () => {
    const { reloadWhenBack } = await import("./api");
    const reload = vi.fn();
    let call = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        call += 1;
        if (call === 1) throw new TypeError("down"); // the old backend has stopped
        return json({ status: "ok" }); // the regular backend answers
      }),
    );
    const stop = reloadWhenBack("recovery", 10, reload);
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    stop();
  });
});

describe("DatabasePermissionsAction", () => {
  const check = (params: Record<string, unknown>): DiagnosticCheck => ({
    id: "database_permissions",
    status: "warning",
    code: "not_private",
    params: { files: [], command: "chmod 600 /data/nodestro.db", restart: true, busy: false, ...params },
    message: "",
  });

  function show(item: DiagnosticCheck) {
    return render(
      <QueryClientProvider client={new QueryClient()}>
        <DatabasePermissionsAction check={item} />
      </QueryClientProvider>,
    );
  }

  it("restarts into repair mode only after the confirmation in its dialog", async () => {
    const calls = backend({ "POST /api/diagnostics/database-permissions/recovery": [json({ restart: true })] });
    show(check({}));
    await userEvent.click(screen.getByTestId("database-permissions-repair"));
    expect(calls).toEqual([]);
    expect(screen.getByText(i18n.t("diagnostics.databasePermissions.restartText"))).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("database-permissions-restart"));
    expect(await screen.findByText(i18n.t("diagnostics.databasePermissions.restarting"))).toBeInTheDocument();
    expect(calls[0]).toEqual({
      method: "POST",
      path: "/api/diagnostics/database-permissions/recovery",
      body: { confirm: true },
    });
  });

  it("is disabled while runs are active and absent outside the desktop app", () => {
    show(check({ busy: true }));
    expect(screen.getByTestId("database-permissions-repair")).toBeDisabled();
    expect(screen.getByText(i18n.t("diagnostics.databasePermissions.busy"))).toBeInTheDocument();
    cleanup();
    show(check({ restart: false }));
    expect(screen.queryByTestId("database-permissions-repair")).toBeNull();
    expect(screen.getByTestId("recovery-manual").textContent).toContain("chmod 600 /data/nodestro.db");
  });
});
