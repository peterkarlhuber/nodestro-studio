// "Used in" for knowledge files, tools and memory spaces (UX-7): which saved workflows, library agents and published
// APIs use an object, from GET /api/used-by. Read only; deleting stays as it was, only the warning names the users.

import { useQuery } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { ReferenceKind, ReferenceUser } from "../api/types";
import { Button, ConfirmIconButton, IconButton, Modal } from "./ui";

const NONE: ReferenceUser[] = [];

/** The users of every object of ``kind``; ``usersOf(ref)`` is empty while loading and for unused objects. */
export function useUsedBy(kind: ReferenceKind) {
  const query = useQuery({ queryKey: keys.usedBy(kind), queryFn: () => api.usedBy(kind) });
  const byRef = useMemo(() => new Map((query.data ?? []).map((item) => [item.ref, item.users])), [query.data]);
  return { usersOf: (ref: string) => byRef.get(ref) ?? NONE, loaded: query.isSuccess };
}

export function userLabel(t: TFunction, user: ReferenceUser): string {
  if (user.kind === "template") return t("usedBy.template", { name: user.name });
  if (user.kind === "publication") return t("usedBy.publication", { name: user.name, release: user.release ?? "–" });
  if (user.role === "start") return t("usedBy.start", { workflow: user.name });
  return t("usedBy.agent", { workflow: user.name, agent: user.node_label ?? "" });
}

export function userLink(user: ReferenceUser): string {
  if (user.kind === "template") return `/agents?template=${encodeURIComponent(user.id)}`;
  if (user.kind === "publication") return `/workflows/${encodeURIComponent(user.workflow_id ?? "")}`;
  return `/workflows/${encodeURIComponent(user.id)}?node=${encodeURIComponent(user.node_id ?? "")}`;
}

/** The users as links, or "not used" once the answer is there. */
export function UsedByList({ users, loaded }: { users: ReferenceUser[]; loaded: boolean }) {
  const { t } = useTranslation();
  if (!loaded) return null;
  if (!users.length) return <p className="muted small used-by">{t("usedBy.none")}</p>;
  return (
    <div className="used-by small">
      <span className="muted">{t("usedBy.label")}</span>
      <ul className="used-by__list">
        {users.map((user) => (
          <li key={`${user.kind}:${user.id}:${user.node_id ?? ""}:${user.role}`}>
            <Link to={userLink(user)}>{userLabel(t, user)}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** What the delete warning says about the users; nothing for an unused object. ``effect``: what deleting does to them. */
export function UsedByWarning({ users, effect }: { users: ReferenceUser[]; effect?: "knowledge" | "tool" }) {
  const { t } = useTranslation();
  if (!users.length) return null;
  return (
    <div className="stack-sm">
      <p>{t("usedBy.warning", { count: users.length })}</p>
      <ul className="used-by__list used-by__list--block">
        {users.map((user) => (
          <li key={`${user.kind}:${user.id}:${user.node_id ?? ""}:${user.role}`}>{userLabel(t, user)}</li>
        ))}
      </ul>
      {effect ? <p className="muted small">{t(`usedBy.effect.${effect}`)}</p> : null}
    </div>
  );
}

/**
 * The delete button of an object. Unused: the usual two-step button. Used: a dialog that names the users first; the
 * deletion itself is the same.
 */
export function DeleteUsed({
  kind,
  icon,
  label,
  title,
  users,
  busy,
  onConfirm,
}: {
  kind: "knowledge" | "tool";
  icon: LucideIcon;
  label: string;
  title: string;
  users: ReferenceUser[];
  busy?: boolean;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (!users.length) return <ConfirmIconButton icon={icon} label={label} busy={busy} onConfirm={onConfirm} />;
  return (
    <>
      <IconButton icon={icon} label={label} disabled={busy} onClick={() => setOpen(true)} />
      <Modal
        title={title}
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              busy={busy}
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              {t("usedBy.deleteAnyway")}
            </Button>
          </>
        }
      >
        <UsedByWarning users={users} effect={kind} />
      </Modal>
    </>
  );
}
