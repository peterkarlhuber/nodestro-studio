// The administration of per-call tool approvals (decision D10): whether they are on, the exceptions from before
// (assignments that existed when approvals were introduced), advance approvals for unattended runs, and the audit
// trail. Reading needs "read"; the activation step, granting, revoking and the audit trail need "admin".

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys, useBatches, useSchedules, useTools } from "../api/hooks";
import type { ToolApprovalEvent, ToolInfo, ToolPreGrant } from "../api/types";
import {
  Badge,
  Button,
  Callout,
  ConfirmIconButton,
  Field,
  Section,
  Select,
  Spinner,
  TextInput,
} from "../components/ui";
import { toast } from "../components/toast";
import { ErrorText, problemText } from "../lib/errors";
import { formatDate } from "../lib/format";

type Scope = ToolPreGrant["scope"];

/** ``active``, ``revoked``, ``expired`` or ``outdated`` (the tool has a newer version: the grant no longer matches;
 * the server checks all of this again at every call). */
export function grantState(
  grant: ToolPreGrant,
  currentVersion?: number,
  at = Date.now(),
): "active" | "revoked" | "expired" | "outdated" {
  if (grant.revoked_at) return "revoked";
  if (grant.expires_at && new Date(grant.expires_at).getTime() <= at) return "expired";
  if (currentVersion !== undefined && grant.version !== currentVersion) return "outdated";
  return "active";
}

export function ToolApprovalRules() {
  const { t } = useTranslation();
  return (
    <Section title={t("approvals.rules.title")} icon={ShieldCheck} tip="tools.callApproval" id="tool-approval-rules">
      <div className="stack">
        <ActivationPanel />
        <PreGrants />
        <AuditTrail />
      </div>
    </Section>
  );
}

function ActivationPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const state = useQuery({
    queryKey: keys.toolApprovalsState,
    queryFn: api.toolApprovalsState,
    retry: false,
  });
  const stamp = useMutation({
    mutationFn: api.stampLegacyToolBindings,
    onSuccess: (answer) => {
      queryClient.setQueryData(keys.toolApprovalsState, answer);
      void queryClient.invalidateQueries({ queryKey: keys.toolApprovalAudit });
      toast.success(
        t("approvals.rules.stamped", {
          count: answer.legacy?.bindings.length ?? 0,
        }),
      );
    },
  });
  if (state.isLoading) return <Spinner />;
  if (state.error) return <ErrorText error={state.error} />;
  const data = state.data;
  if (!data) return null;
  const bindings = data.legacy?.bindings ?? [];
  return (
    <div className="stack-sm" data-testid="tool-approval-state">
      <p>
        <Badge tone={data.enabled ? "success" : "idle"}>
          {data.enabled ? t("approvals.rules.enabled") : t("approvals.rules.disabled")}
        </Badge>{" "}
        <span className="muted small">
          {data.enabled ? t("approvals.rules.enabledText") : t("approvals.rules.disabledText")}
        </span>
      </p>
      <h3 className="small">{t("approvals.rules.legacyTitle")}</h3>
      <p className="muted small">{t("approvals.rules.legacyText")}</p>
      {data.legacy === null ? (
        <p className="small" data-testid="legacy-not-run">
          {t("approvals.rules.legacyNotRun")}
        </p>
      ) : bindings.length ? (
        <div className="table-wrap">
          <table className="table table--compact small" data-testid="legacy-bindings">
            <thead>
              <tr>
                <th>{t("approvals.rules.where")}</th>
                <th>{t("approvals.rules.step")}</th>
                <th>{t("approvals.rules.tool")}</th>
                <th>{t("approvals.rules.boundVersion")}</th>
              </tr>
            </thead>
            <tbody>
              {bindings.map((item) => (
                <tr
                  key={`${item.release ?? item.workflow_id ?? "studio"}:${item.workflow_version ?? ""}:${item.node_id}:${item.tool}`}
                >
                  <td>
                    {item.release
                      ? t("approvals.rules.release", { id: item.release })
                      : item.workflow_version
                        ? t("approvals.rules.workflowVersion", {
                            id: item.workflow_id ?? "",
                            version: item.workflow_version,
                          })
                        : t("approvals.rules.workflow", {
                            id: item.workflow_id ?? "",
                          })}
                  </td>
                  <td>
                    <code>{item.node_id}</code>
                  </td>
                  <td>
                    <code>{item.tool}</code>
                  </td>
                  <td>{item.bound_version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="small">{t("approvals.rules.legacyNone")}</p>
      )}
      {stamp.error ? (
        <Callout tone="danger">
          <ErrorText error={stamp.error} />
        </Callout>
      ) : null}
      {data.legacy?.stamped_at ? (
        <p className="muted small" data-testid="legacy-ran">
          {t("approvals.rules.ranAt", { time: formatDate(data.legacy.stamped_at), name: data.legacy.stamped_by ?? "" })}
        </p>
      ) : null}
      {data.legacy === null || !data.legacy.publications_stamped_at ? (
        <div className="row-gap">
          <ConfirmIconButton
            icon={ShieldCheck}
            label={data.legacy === null ? t("approvals.rules.stamp") : t("approvals.rules.stampFinish")}
            confirmLabel={t("approvals.rules.stampConfirm")}
            busy={stamp.isPending}
            onConfirm={() => stamp.mutate()}
          />
          <span className="muted small">{t("approvals.rules.stampHint")}</span>
        </div>
      ) : null}
    </div>
  );
}

function PreGrants() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const grants = useQuery({
    queryKey: keys.toolPreGrants,
    queryFn: api.toolPreGrants,
    retry: false,
  });
  const tools = useTools();
  const versions = new Map((tools.data ?? []).map((tool) => [tool.name, tool.version]));
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: keys.toolPreGrants });
    void queryClient.invalidateQueries({ queryKey: keys.toolApprovalAudit });
  };
  const revoke = useMutation({
    mutationFn: api.revokeToolPreGrant,
    onSuccess: () => {
      toast.success(t("approvals.rules.revoked"));
      refresh();
    },
  });
  return (
    <div className="stack-sm">
      <h3 className="small">{t("approvals.rules.preGrantsTitle")}</h3>
      <p className="muted small">{t("approvals.rules.preGrantsText")}</p>
      {grants.error ? <ErrorText error={grants.error} /> : null}
      {grants.data?.length ? (
        <div className="table-wrap">
          <table className="table table--compact small" data-testid="pre-grants">
            <thead>
              <tr>
                <th>{t("approvals.rules.tool")}</th>
                <th>{t("approvals.rules.scope")}</th>
                <th>{t("approvals.rules.granted")}</th>
                <th>{t("approvals.rules.state")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {grants.data.map((grant) => {
                const state = grantState(grant, tools.data ? (versions.get(grant.tool) ?? -1) : undefined);
                return (
                  <tr key={grant.id}>
                    <td>
                      <code>{grant.tool}</code>{" "}
                      {t("approvals.rules.version", {
                        version: grant.version ?? "?",
                      })}
                    </td>
                    <td>
                      {t(`approvals.rules.scopes.${grant.scope}`)} <code>{grant.scope_id}</code>
                    </td>
                    <td>
                      {t("approvals.rules.grantedBy", {
                        name: grant.granted_by,
                        time: formatDate(grant.granted_at),
                      })}
                    </td>
                    <td>
                      <Badge tone={state === "active" ? "success" : "idle"}>
                        {t(`approvals.rules.grantStates.${state}`)}
                      </Badge>{" "}
                      <span className="muted">
                        {state === "revoked"
                          ? t("approvals.rules.revokedBy", {
                              name: grant.revoked_by ?? "",
                              time: formatDate(grant.revoked_at),
                            })
                          : grant.expires_at
                            ? t("approvals.rules.expires", {
                                time: formatDate(grant.expires_at),
                              })
                            : null}
                      </span>
                    </td>
                    <td>
                      {state === "active" || state === "outdated" ? (
                        <ConfirmIconButton
                          icon={Ban}
                          label={t("approvals.rules.revoke")}
                          confirmLabel={t("approvals.rules.revokeConfirm")}
                          busy={revoke.isPending && revoke.variables?.id === grant.id}
                          onConfirm={() => revoke.mutate(grant)}
                        />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : grants.data ? (
        <p className="small">{t("approvals.rules.preGrantsNone")}</p>
      ) : null}
      {revoke.error ? (
        <Callout tone="danger">
          <ErrorText error={revoke.error} />
        </Callout>
      ) : null}
      <NewPreGrant onCreated={refresh} />
    </div>
  );
}

/** Tools an advance approval can cover: not reading-only (nothing to approve), not MCP, never destructive. */
export function grantableTools(tools: ToolInfo[]): ToolInfo[] {
  return tools.filter(
    (tool) => tool.kind !== "mcp" && tool.capability?.access !== "destructive" && tool.capability?.access !== "read",
  );
}

function NewPreGrant({ onCreated }: { onCreated: () => void }) {
  const { t } = useTranslation();
  const tools = useTools();
  const schedules = useSchedules();
  const batches = useBatches();
  const [tool, setTool] = useState("");
  const [target, setTarget] = useState("");
  const [expires, setExpires] = useState("");
  const create = useMutation({
    mutationFn: () => {
      const [scope, scopeId] = target.split(":", 2) as [Scope, string];
      return api.createToolPreGrant({
        tool,
        scope,
        scope_id: scopeId,
        expires_at: expires ? new Date(expires).toISOString() : null,
      });
    },
    onSuccess: () => {
      toast.success(t("approvals.rules.grantedToast"));
      setTool("");
      setTarget("");
      setExpires("");
      onCreated();
    },
  });
  const toolOptions = grantableTools(tools.data ?? []).map((item) => ({
    value: item.name,
    label: `${item.name} (v${item.version})`,
  }));
  const targets = [
    ...(schedules.data ?? []).map((item) => ({
      value: `schedule:${item.id}`,
      label: item.name,
      group: t("approvals.rules.scopes.schedule"),
    })),
    ...(batches.data ?? []).map((item) => ({
      value: `${item.kind === "benchmark" ? "benchmark" : "batch"}:${item.id}`,
      label: `${item.name || item.workflow_name} · ${formatDate(item.created_at)}`,
      group: t(`approvals.rules.scopes.${item.kind === "benchmark" ? "benchmark" : "batch"}`),
    })),
  ];
  return (
    <form
      className="stack-sm"
      aria-label={t("approvals.rules.newGrant")}
      onSubmit={(event) => {
        event.preventDefault();
        create.mutate();
      }}
    >
      <div className="row-gap">
        <Field label={t("approvals.rules.tool")}>
          <Select options={toolOptions} value={tool} onChange={setTool} placeholder={t("approvals.rules.chooseTool")} />
        </Field>
        <Field label={t("approvals.rules.scope")}>
          <Select
            options={targets}
            value={target}
            onChange={setTarget}
            placeholder={t("approvals.rules.chooseScope")}
          />
        </Field>
        <Field label={t("approvals.rules.expiresAt")} hint={t("approvals.rules.expiresHint")}>
          <TextInput type="datetime-local" value={expires} onChange={(event) => setExpires(event.target.value)} />
        </Field>
      </div>
      <p className="muted small">{t("approvals.rules.newGrantHint")}</p>
      {create.error ? (
        <Callout tone="danger">
          <ErrorText error={create.error} />
        </Callout>
      ) : null}
      <div>
        <Button type="submit" icon={Plus} busy={create.isPending} disabled={!tool || !target || create.isPending}>
          {t("approvals.rules.grant")}
        </Button>
      </div>
    </form>
  );
}

function auditOutcome(t: ReturnType<typeof useTranslation>["t"], event: ToolApprovalEvent): string {
  if (event.kind === "decision_refused" && event.outcome) return problemText(t, { code: event.outcome });
  if (event.kind === "decided" && event.outcome)
    return t(`approvals.tool.status.${event.outcome}`, {
      defaultValue: event.outcome,
    });
  if (event.kind === "legacy_stamped" && event.details.repeated) return t("approvals.rules.stampRepeated");
  if (event.kind === "legacy_stamped")
    return t("approvals.rules.stampedCount", {
      count: Number(event.details.bindings ?? 0),
    });
  return "";
}

function AuditTrail() {
  const { t } = useTranslation();
  const audit = useQuery({
    queryKey: keys.toolApprovalAudit,
    queryFn: () => api.toolApprovalAudit(),
    retry: false,
  });
  return (
    <div className="stack-sm">
      <h3 className="small">{t("approvals.rules.auditTitle")}</h3>
      <p className="muted small">{t("approvals.rules.auditText")}</p>
      {audit.error ? <ErrorText error={audit.error} /> : null}
      {audit.data?.length ? (
        <div className="table-wrap">
          <table className="table table--compact small" data-testid="tool-approval-audit">
            <thead>
              <tr>
                <th>{t("approvals.rules.when")}</th>
                <th>{t("approvals.rules.what")}</th>
                <th>{t("approvals.rules.who")}</th>
                <th>{t("approvals.rules.tool")}</th>
                <th>{t("approvals.rules.outcome")}</th>
              </tr>
            </thead>
            <tbody>
              {audit.data.map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.at)}</td>
                  <td>{t(`approvals.rules.auditKinds.${event.kind}`)}</td>
                  <td>{event.actor}</td>
                  <td>{event.tool ? <code>{event.tool}</code> : null}</td>
                  <td>{auditOutcome(t, event)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : audit.data ? (
        <p className="small">{t("approvals.rules.auditNone")}</p>
      ) : null}
    </div>
  );
}
