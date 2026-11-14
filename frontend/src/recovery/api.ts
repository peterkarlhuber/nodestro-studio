// Recovery mode of the desktop (TABRION MIG-NOD-9): the backend could not open the database because other users of
// this computer may change it, or the user asked for the repair in the diagnosis. The backend then answers only the
// health check, the dry run and the confirmed repair (nodestro_api.recovery); the interface shows RecoveryScreen.

import { request } from "../api/client";

export type RecoveryFileStatus = "changed" | "unchanged" | "not_confirmed" | "skipped" | "failed";

/** One file of the database as the runtime reports it; modes in octal ("0664"). */
export interface RecoveryFile {
  name: string;
  path: string;
  status: RecoveryFileStatus;
  old_mode: string | null;
  new_mode: string | null;
  /** Why a file is left alone or failed: symlink, hard_link, other_owner, not_a_file, changed_during_repair, … */
  reason: string | null;
}

/** The dry run: what a confirmed repair would change. Nothing was changed. */
export interface RepairPlan {
  origin: "refused" | "requested";
  files: RecoveryFile[];
  repairable: boolean;
  /** The fingerprint of the files shown; the repair is refused when the files changed since. */
  plan: string;
  /** The manual alternative, quoted for a shell. */
  command: string | null;
}

export interface RepairResult {
  repaired: boolean;
  files: RecoveryFile[];
  restart: boolean;
}

export const recoveryApi = {
  plan: () => request<RepairPlan>("GET", "/recovery/database-permissions"),
  /** The repair the user confirmed for exactly the files of ``plan``. */
  repair: (plan: string) =>
    request<RepairResult>("POST", "/recovery/database-permissions/repair", { confirm: true, plan }),
  /** From the diagnosis: restart into recovery mode, where the user confirms the repair itself. */
  restartIntoRecovery: () =>
    request<{ restart: boolean }>("POST", "/diagnostics/database-permissions/recovery", { confirm: true }),
};

export type StartMode = "recovery" | "normal" | "down";

/** What the backend runs as: recovery mode, the regular API, or nothing (it is restarting). */
export async function startMode(): Promise<StartMode> {
  try {
    const response = await fetch("/api/health", { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) return "down";
    const data = (await response.json()) as { mode?: unknown };
    return data?.mode === "recovery" ? "recovery" : "normal";
  } catch {
    return "down";
  }
}

/** ``rw-rw-r--`` for "0664": the permissions as a file manager shows them. */
export function symbolicMode(mode: string | null): string {
  if (!mode || !/^[0-7]{3,4}$/.test(mode)) return "";
  const digits = mode.slice(-3);
  return [...digits]
    .map((digit) => {
      const value = Number(digit);
      return `${value & 4 ? "r" : "-"}${value & 2 ? "w" : "-"}${value & 1 ? "x" : "-"}`;
    })
    .join("");
}

/**
 * After a repair or a restart into recovery mode the backend stops and the desktop app starts it again (and opens
 * the window on it). Started from a terminal there is nobody to do that: once a backend answers again, reload.
 */
export function reloadWhenBack(from: StartMode, every = 1000, reload: () => void = () => window.location.reload()) {
  let seenDown = false;
  const timer = window.setInterval(() => {
    void startMode().then((mode) => {
      if (mode === "down") seenDown = true;
      else if (seenDown || mode !== from) {
        window.clearInterval(timer);
        reload();
      }
    });
  }, every);
  return () => window.clearInterval(timer);
}
