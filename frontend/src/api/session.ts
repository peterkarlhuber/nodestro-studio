// The desktop app's launch session (NS-002 of nodestro-api; every switch is off by default).
//
// With NODESTRO_LAUNCH_CSRF or NODESTRO_DESKTOP_LOGOUT the backend's launch page leaves the session's values in this
// window's sessionStorage (scoped to the origin, port included) before it moves on to the studio:
// - csrf: sent in X-Nodestro-CSRF with every change. Another program on another local port receives the session
//   cookie from the browser (cookies are not port-scoped), but never this value, so it cannot change anything.
// - logout: whether the backend offers the sign-out of this window (POST /api/logout).
// Without these switches nothing is stored, no header is sent and no sign-out is offered: the studio works as before.

import { useSyncExternalStore } from "react";

export const SESSION_STORAGE_KEY = "nodestro.session";
export const CSRF_HEADER = "X-Nodestro-CSRF";

export interface LaunchSession {
  csrf: string | null;
  logout: boolean;
}

const NONE: LaunchSession = { csrf: null, logout: false };
// The backend's values are 256-bit URL-safe base64; anything else is ignored (never sent as a header).
const CSRF_FORM = /^[A-Za-z0-9_-]{32,128}$/;
const CHANGES = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function storage(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null; // storage switched off
  }
}

/** What the launch page left for this window; nothing (the default) without the switches. */
export function launchSession(): LaunchSession {
  try {
    const text = storage()?.getItem(SESSION_STORAGE_KEY);
    if (!text) return NONE;
    const data = JSON.parse(text) as { csrf?: unknown; logout?: unknown };
    if (!data || typeof data !== "object") return NONE;
    return {
      csrf: typeof data.csrf === "string" && CSRF_FORM.test(data.csrf) ? data.csrf : null,
      logout: data.logout === true,
    };
  } catch {
    return NONE;
  }
}

/** The CSRF header for a request with ``method``: only for changes, and only when the launch page left a value. */
export function csrfHeaders(method: string): Record<string, string> {
  if (!CHANGES.has(method.toUpperCase())) return {};
  const csrf = launchSession().csrf;
  return csrf ? { [CSRF_HEADER]: csrf } : {};
}

let signedOut = false;
const listeners = new Set<() => void>();

/** The window's session ended (sign-out): forget its values and show the signed-out screen instead of the studio. */
export function markSignedOut(): void {
  try {
    storage()?.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // nothing stored
  }
  signedOut = true;
  for (const listener of listeners) listener();
}

export function useSignedOut(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => signedOut,
    () => false,
  );
}
