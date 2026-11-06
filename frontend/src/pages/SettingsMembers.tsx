// Settings > Members and roles (server profile, permission "admin"; nodestro-api API-019): who has access to this
// workspace and with which role. Roles change at once (the member's next request uses the new one); removing a member
// ends their sessions here. Only owners are offered the owner role; the API refuses the rest as well.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAccess } from "../api/access";
import { type Member, type MemberRole, memberActions, memberKeys, memberName, membersApi } from "../api/members";
import { roleName } from "../components/Access";
import { toast } from "../components/toast";
import { Badge, Callout, ConfirmIconButton, Select, Spinner } from "../components/ui";
import { ErrorText } from "../lib/errors";

function MemberRow({ member, ownRole }: { member: Member; ownRole: string | null | undefined }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const name = memberName(member);
  const { roles, manageable } = memberActions(ownRole, member);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: memberKeys.all });
  const change = useMutation({
    mutationFn: (role: MemberRole) => membersApi.setRole(member.user_id, role),
    onSuccess: (saved) => {
      toast.success(t("admin.members.changed", { name, role: roleName(t, saved.role) }));
      refresh();
    },
    onError: (error) => {
      toast.error(error);
      refresh();
    },
  });
  const remove = useMutation({
    mutationFn: () => membersApi.remove(member.user_id),
    onSuccess: () => {
      toast.success(t("admin.members.removed", { name }));
      refresh();
    },
    onError: toast.error,
  });
  const selectId = `member-role-${member.user_id}`;
  return (
    <li className="members__row" data-testid="member-row" data-user={member.user_id}>
      <div className="members__who">
        <strong className="members__name">{name}</strong>
        {member.you ? <Badge>{t("admin.members.you")}</Badge> : null}
        {member.email && member.email !== name ? <span className="muted small members__email">{member.email}</span> : null}
      </div>
      <div className="members__actions">
        <Select
          id={selectId}
          aria-label={t("admin.members.roleOf", { name })}
          value={member.role}
          disabled={!manageable || change.isPending}
          onChange={(value) => {
            if (value !== member.role) change.mutate(value as MemberRole);
          }}
          options={roles.map((role) => ({ value: role, label: roleName(t, role) }))}
        />
        {manageable ? (
          <ConfirmIconButton
            icon={Trash2}
            label={t("admin.members.remove", { name })}
            confirmLabel={t("admin.members.confirmRemove")}
            busy={remove.isPending}
            onConfirm={() => remove.mutate()}
            data-testid="member-remove"
          />
        ) : null}
      </div>
    </li>
  );
}

/** The section; renders nothing outside a server or without the permission "admin". */
export function MembersPanel() {
  const { t } = useTranslation();
  const access = useAccess();
  const allowed = access.profile === "server" && Boolean(access.me) && access.can("admin");
  const members = useQuery({ queryKey: memberKeys.all, queryFn: membersApi.list, enabled: allowed });
  if (!allowed) return null;
  return (
    <section className="panel stack" aria-labelledby="settings-members">
      <h2 className="panel__title" id="settings-members">
        <Users size={15} aria-hidden /> {t("admin.members.title")}
      </h2>
      <p className="muted small">{t("admin.members.description", { tenant: access.me?.tenant_id ?? "" })}</p>
      <p className="muted small">{t("admin.members.ownerNote")}</p>
      {members.isPending ? (
        <Spinner />
      ) : members.error ? (
        <Callout tone="danger">
          <ErrorText error={members.error} />
        </Callout>
      ) : members.data?.length ? (
        <ul className="members" aria-label={t("admin.members.title")} data-testid="members">
          {members.data.map((member) => (
            <MemberRow key={member.user_id} member={member} ownRole={access.me?.role} />
          ))}
        </ul>
      ) : (
        <p className="muted small">{t("admin.members.empty")}</p>
      )}
      <p className="muted small">{t("admin.members.invite")}</p>
    </section>
  );
}
