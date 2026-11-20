// The administration of grants and denies (access model v2, N-06): every permission and block of the tenant, who
// gave it and until when, with revoke; and the fixed safety limits no permission lifts. Only while the access model is
// switched on (off by default) and for administrators; the API checks both again.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useAccess } from "../api/access";
import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { AccessDeny, AccessGrant } from "../api/types";
import { PermissionNote } from "../components/Access";
import { Badge, Callout, ConfirmIconButton, PageHeader, Spinner } from "../components/ui";
import { toast } from "../components/toast";
import { ErrorText } from "../lib/errors";
import { formatDate } from "../lib/format";

export type RecordState = "active" | "used" | "revoked" | "expired";

/** What a record does now; the server checks it again at every access. */
export function recordState(record: AccessGrant | AccessDeny, at = Date.now()): RecordState {
  if (record.status === "revoked" || record.revoked_at) return "revoked";
  if (record.status === "used") return "used";
  if (record.expires_at && new Date(record.expires_at).getTime() <= at) return "expired";
  return "active";
}

export function AccessRulesPage() {
  const { t } = useTranslation();
  const state = useQuery({ queryKey: keys.accessState, queryFn: api.accessState, retry: false });
  const admin = useAccess().can("admin");
  return (
    <div className="page">
      <PageHeader title={t("approvals.access.title")} doc="verzweigungen#erlaubnisse" description={t("approvals.access.description")} />
      <div className="page__body stack">
        <p className="small">
          <Link to="/approvals">{t("approvals.access.back")}</Link>
        </p>
        {state.isLoading ? <Spinner /> : null}
        {state.data && !state.data.enabled ? (
          <Callout tone="info">
            <span data-testid="access-off">{t("approvals.access.off")}</span>
          </Callout>
        ) : null}
        {state.data?.enabled ? (
          admin ? (
            <>
              <Records kind="denies" />
              <Records kind="grants" />
              <SafetyLimits limits={state.data.safety_limits} />
            </>
          ) : (
            <PermissionNote permission="admin" />
          )
        ) : null}
      </div>
    </div>
  );
}

function SafetyLimits({ limits }: { limits: Record<string, string> }) {
  const { t } = useTranslation();
  return (
    <section className="stack-sm" aria-labelledby="access-limits-title" data-testid="access-limits">
      <h2 className="panel__title" id="access-limits-title">
        {t("approvals.access.limitsTitle")}
      </h2>
      <p className="muted small">{t("approvals.access.limitsText")}</p>
      <ul className="small">
        {Object.keys(limits).map((name) => (
          <li key={name}>
            <code>{name}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Records({ kind }: { kind: "grants" | "denies" }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const queryKey = kind === "grants" ? keys.accessGrants : keys.accessDenies;
  const records = useQuery<Array<AccessGrant | AccessDeny>>({
    queryKey,
    queryFn: kind === "grants" ? api.accessGrants : api.accessDenies,
    retry: false,
  });
  const revoke = useMutation<AccessGrant | AccessDeny, Error, string>({
    mutationFn: (id) => (kind === "grants" ? api.revokeAccessGrant(id) : api.revokeAccessDeny(id)),
    onSuccess: () => {
      toast.success(t("approvals.access.revoked"));
      void queryClient.invalidateQueries({ queryKey });
    },
  });
  const titleId = `access-${kind}-title`;
  return (
    <section className="stack-sm" aria-labelledby={titleId} data-testid={`access-${kind}`}>
      <h2 className="panel__title" id={titleId}>
        {kind === "grants" ? t("approvals.access.grantsTitle") : t("approvals.access.deniesTitle")}
      </h2>
      <p className="muted small">{kind === "grants" ? t("approvals.access.grantsText") : t("approvals.access.deniesText")}</p>
      {records.isLoading ? <Spinner /> : null}
      {records.error ? <ErrorText error={records.error} /> : null}
      {records.data?.length ? (
        <div className="table-wrap">
          <table className="table table--compact small">
            <thead>
              <tr>
                <th>{t("approvals.access.resource")}</th>
                <th>{t("approvals.access.actions")}</th>
                <th>{t("approvals.access.forWhom")}</th>
                <th>{t("approvals.access.by")}</th>
                <th>{t("approvals.access.state")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {records.data.map((record) => {
                const state = recordState(record);
                const by = "granted_by" in record ? record.granted_by : record.denied_by;
                return (
                  <tr key={record.id}>
                    <td>
                      {t(`approvals.access.resourceTypes.${record.resource.type}`)} <code>{record.resource.id}</code>
                    </td>
                    <td>{record.actions.map((action) => t(`approvals.access.actionNames.${action}`)).join(", ")}</td>
                    <td>
                      {record.scope === "all" ? t("approvals.access.allAgents") : record.agents.map((agent) => <code key={agent}>{agent} </code>)}
                    </td>
                    <td>{t("approvals.access.byLine", { name: by, time: formatDate(record.created_at) })}</td>
                    <td>
                      <Badge tone={state === "active" ? (kind === "grants" ? "success" : "danger") : "idle"}>
                        {t(`approvals.access.states.${state}`)}
                      </Badge>{" "}
                      <span className="muted">
                        {state === "revoked"
                          ? t("approvals.access.revokedBy", { name: record.revoked_by ?? "", time: formatDate(record.revoked_at) })
                          : record.expires_at
                            ? t("approvals.access.expires", { time: formatDate(record.expires_at) })
                            : t("approvals.access.untilRevoked")}
                      </span>
                    </td>
                    <td>
                      {state === "active" ? (
                        <ConfirmIconButton
                          icon={Ban}
                          label={t("approvals.access.revoke")}
                          confirmLabel={t("approvals.access.revokeConfirm")}
                          busy={revoke.isPending && revoke.variables === record.id}
                          onConfirm={() => revoke.mutate(record.id)}
                        />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : records.data ? (
        <p className="small">{kind === "grants" ? t("approvals.access.grantsNone") : t("approvals.access.deniesNone")}</p>
      ) : null}
      {revoke.error ? (
        <Callout tone="danger">
          <ErrorText error={revoke.error} />
        </Callout>
      ) : null}
    </section>
  );
}

/** The way from the Approvals page to this page: only while the access model is on and for administrators. */
export function AccessRulesLink() {
  const { t } = useTranslation();
  const state = useQuery({ queryKey: keys.accessState, queryFn: api.accessState, retry: false, staleTime: 60_000 });
  const admin = useAccess().can("admin");
  if (!state.data?.enabled || !admin) return null;
  return (
    <p className="small" data-testid="access-rules-link">
      <KeyRound size={14} aria-hidden /> <Link to="/approvals/access">{t("approvals.access.link")}</Link>
    </p>
  );
}
