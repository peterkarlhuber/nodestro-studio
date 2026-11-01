// Who is signed in and what they may do (AD-04/AD-05).
//
// A server with logins answers /api/auth/me with the user, the tenant, the role and the permissions. The desktop app
// has no logins: the route does not exist there (404) and its only principal, the local owner, may do everything.
// The interface uses this only to hide or explain controls up front; every request is still checked by the API.

import { type QueryClient, useQuery } from "@tanstack/react-query";

import { ApiError, request, startLogin } from "./client";
import { useMeta } from "./hooks";
import type { Meta } from "./types";

export type Permission = "read" | "edit" | "run" | "admin" | "install";

/** The answer of GET /api/auth/me (nodestro_api.identity.Me). */
export interface Me {
  user_id: string;
  name?: string | null;
  email?: string | null;
  tenant_id: string;
  role: string;
  permissions: string[];
  /** Every tenant the user belongs to, with the role there. */
  tenants: Record<string, string>;
}

/**
 * Where this studio runs:
 * - desktop: the local app, no logins, the local owner may do everything;
 * - local-container: Nodestro in a container the user runs; not "only on your computer" for sure, so no such claim;
 * - server: a server with logins (users, roles, tenants);
 * - unknown: not known yet (still loading, or the question failed): the interface makes no claim either way.
 */
export type Profile = "desktop" | "local-container" | "server" | "unknown";

export const accessKeys = { me: ["auth", "me"] as const };

/** null: this installation has no logins (the desktop app). */
export async function fetchMe(): Promise<Me | null> {
  try {
    const me = await request<Me>("GET", "/auth/me");
    // Only a real answer restricts the interface; anything else (an old server, a test double) changes nothing.
    return me && typeof me === "object" && !Array.isArray(me) && Array.isArray(me.permissions) ? me : null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export function logout(): Promise<void> {
  return request<void>("POST", "/auth/logout");
}

export interface Access {
  profile: Profile;
  /** The signed-in user on a server; null on the desktop and while unknown. */
  me: Me | null;
  /**
   * Whether the principal holds the permission. True on the desktop and while nothing is known yet (the desktop
   * keeps every control); on a server only what the signed-in user holds.
   */
  can: (permission: Permission) => boolean;
}

/** The profile from /api/meta (``profile``), when the backend sends it; otherwise from /api/auth/me. */
export function profileOf(meta: (Meta & { profile?: string; profile_kind?: string }) | undefined, me: Me | null | undefined, failed: boolean): Profile {
  const kind = meta?.profile ?? meta?.profile_kind;
  if (kind === "desktop" || kind === "local-container" || kind === "server") return kind;
  if (me === undefined || failed) return "unknown";
  return me === null ? "desktop" : "server";
}

export function accessOf(profile: Profile, me: Me | null): Access {
  const permissions = new Set(me?.permissions ?? []);
  return {
    profile,
    me,
    // A server whose user is not known (yet) gets nothing offered that needs a permission; elsewhere all of it.
    can: (permission) => (me ? permissions.has(permission) : profile !== "server"),
  };
}

export function useMe(enabled = true) {
  return useQuery({ queryKey: accessKeys.me, queryFn: fetchMe, staleTime: 60_000, retry: false, enabled });
}

export function useAccess(): Access {
  const meta = useMeta();
  // A backend that names its profile and is no server has no logins: nothing to ask (no 404 in the console).
  const stated = (meta.data as (Meta & { profile?: string }) | undefined)?.profile;
  const me = useMe(meta.isFetched && (stated === undefined || stated === "server"));
  const profile = profileOf(meta.data, me.data, me.isError);
  return accessOf(profile, me.data ?? null);
}

/**
 * The session may have ended (e.g. a live stream closed with ``access_ended``): ask the server again. A server whose
 * session ended answers 401 and the browser goes to its login (``startLogin``, also when the 401 carries another
 * code); the desktop (404) and a still valid session change nothing. Resolves to whether the user is still signed in.
 */
export async function recheckSignIn(queryClient: QueryClient): Promise<boolean> {
  try {
    const me = await fetchMe();
    queryClient.setQueryData(accessKeys.me, me);
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      startLogin();
      return false;
    }
    return true;
  }
}
