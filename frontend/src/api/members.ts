// Members and roles of the signed-in workspace, for its administrators (server profile only; nodestro-api API-019).
// The API decides every change: only owners touch the owner role, the last owner stays, other workspaces are out of
// reach. The interface only offers what the person's own role allows, so a refusal is the exception.

import { request } from "./client";

export const MEMBER_ROLES = ["owner", "admin", "editor", "operator", "viewer"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

/** One member (nodestro_api.api_members.Member). */
export interface Member {
  user_id: string;
  name?: string | null;
  email?: string | null;
  role: MemberRole;
  /** Whether this member is the person asking. */
  you: boolean;
}

export const memberKeys = { all: ["members"] as const };

export const membersApi = {
  list: () => request<Member[]>("GET", "/members"),
  setRole: (userId: string, role: MemberRole) => request<Member>("PUT", `/members/${encodeURIComponent(userId)}/role`, { role }),
  remove: (userId: string) => request<void>("DELETE", `/members/${encodeURIComponent(userId)}`),
};

/** A member's name as shown: their name, else their e-mail address, else their user id. */
export function memberName(member: Pick<Member, "name" | "email" | "user_id">): string {
  return member.name || member.email || member.user_id;
}

/**
 * The roles the asking person may give this member, and whether they may change or remove the member at all: only an
 * owner gives, takes or changes the owner role (an administrator manages everyone below it).
 */
export function memberActions(ownRole: string | null | undefined, member: Pick<Member, "role">): { roles: MemberRole[]; manageable: boolean } {
  const owner = ownRole === "owner";
  if (!owner && member.role === "owner") return { roles: [member.role], manageable: false };
  return { roles: owner ? [...MEMBER_ROLES] : MEMBER_ROLES.filter((role) => role !== "owner"), manageable: true };
}
