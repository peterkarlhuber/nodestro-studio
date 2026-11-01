// What the signed-in user may do, shown before they try (AD-04/AD-05). The desktop app has no logins and no roles:
// there everything here renders nothing and every control stays as it is.

import { useQueryClient } from "@tanstack/react-query";
import { Lock, LogOut, UserRound } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { type Access, type Permission, logout, useAccess } from "../api/access";
import { request, startLogin } from "../api/client";
import { problemText } from "../lib/errors";
import { toast } from "./toast";
import { Button, Select } from "./ui";

/** The role in the interface language ("viewer" → "Viewer"); unknown roles as they are. */
export function roleName(t: (key: string, options?: Record<string, unknown>) => string, role: string | null | undefined): string {
  if (!role) return t("admin.roles.none");
  return t(`admin.roles.${role}`, { defaultValue: role });
}

/** The permission in the interface language ("edit" → "Edit"). */
export function permissionName(t: (key: string, options?: Record<string, unknown>) => string, permission: string): string {
  return t(`admin.permissions.${permission}`, { defaultValue: permission });
}

/** Why a control is not offered, or null when it is (always null on the desktop). */
export function deniedReason(
  t: (key: string, options?: Record<string, unknown>) => string,
  access: Access,
  permission: Permission,
): string | null {
  if (access.can(permission)) return null;
  return t("admin.denied", { role: roleName(t, access.me?.role), permission: permissionName(t, permission) });
}

/** The reason as a visible line next to the controls it concerns; nothing when the permission is held. */
export function PermissionNote({ permission, access: given }: { permission: Permission; access?: Access }) {
  const { t } = useTranslation();
  const own = useAccess();
  const access = given ?? own;
  const reason = deniedReason(t, access, permission);
  if (!reason) return null;
  return (
    <p className="muted small permission-note" data-testid={`permission-note-${permission}`}>
      <Lock size={12} aria-hidden /> {reason}
    </p>
  );
}

/** Who is signed in on a server: name, role, workspace switch and logout. Nothing on the desktop. */
export function UserMenu() {
  const { t } = useTranslation();
  const access = useAccess();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const me = access.me;
  if (access.profile !== "server" || !me) return null;
  const who = me.name || me.email || me.user_id;
  const tenants = Object.entries(me.tenants ?? {});
  const signOut = async () => {
    setBusy(true);
    try {
      await logout();
      queryClient.clear();
      // The start page asks for a new login (the server answers access.login_required).
      window.location.assign("/");
    } catch (error) {
      setBusy(false);
      toast.error(error);
    }
  };
  const switchTenant = async (tenant: string) => {
    if (tenant === me.tenant_id) return;
    try {
      await request<void>("POST", "/auth/switch", { tenant_id: tenant });
      window.location.assign("/");
    } catch (error) {
      toast.error(error);
    }
  };
  return (
    <details className="user-menu" data-testid="user-menu">
      <summary aria-label={t("admin.user.menu", { name: who })}>
        <UserRound size={14} aria-hidden />
        <span className="user-menu__name">{who}</span>
        <span className="nd-badge nd-badge--idle user-menu__role">{roleName(t, me.role)}</span>
      </summary>
      <div className="user-menu__panel" role="group" aria-label={t("admin.user.title")}>
        <p className="small">
          <strong>{who}</strong>
          {me.email && me.email !== who ? <span className="muted"> · {me.email}</span> : null}
        </p>
        <p className="muted small" data-testid="user-role">
          {t("admin.user.role", { role: roleName(t, me.role), tenant: me.tenant_id })}
        </p>
        <p className="muted small">{t("admin.user.permissions", { list: me.permissions.map((item) => permissionName(t, item)).join(", ") || "–" })}</p>
        {access.can("admin") ? <p className="muted small">{t("admin.user.members")}</p> : null}
        {tenants.length > 1 ? (
          <Select
            aria-label={t("admin.user.switch")}
            value={me.tenant_id}
            onChange={(value) => void switchTenant(value)}
            options={tenants.map(([id, role]) => ({ value: id, label: `${id} (${roleName(t, role)})` }))}
          />
        ) : null}
        <Button variant="ghost" size="sm" icon={LogOut} busy={busy} onClick={() => void signOut()}>
          {t("admin.user.logout")}
        </Button>
      </div>
    </details>
  );
}

/** A line for roles that may only look: shown once at the top of every page on a server. */
export function ReadOnlyNotice() {
  const { t } = useTranslation();
  const access = useAccess();
  if (access.profile !== "server" || !access.me || access.can("edit")) return null;
  return (
    <div className="read-only-notice" role="note" data-testid="read-only-notice">
      <Lock size={13} aria-hidden />{" "}
      {t(access.can("run") ? "admin.readOnly.run" : "admin.readOnly.look", { role: roleName(t, access.me.role) })}
    </div>
  );
}

/**
 * A login that failed and came back to the studio with ``?login_error=<code>`` (for example identity.login_expired
 * when two login tabs raced): the sentence and a way to sign in again. Today the server answers the callback itself;
 * this shows the problem once the server sends the browser back here with the code.
 */
export function LoginProblemNotice() {
  const { t } = useTranslation();
  const code = new URLSearchParams(window.location.search).get("login_error");
  if (!code || !/^identity\.[a-z_]+$/.test(code)) return null;
  return (
    <div className="read-only-notice" role="alert" data-testid="login-problem">
      <Lock size={13} aria-hidden /> {problemText(t, { code })}{" "}
      <Button size="sm" variant="ghost" onClick={() => startLogin()}>
        {t("admin.user.signInAgain")}
      </Button>
    </div>
  );
}
