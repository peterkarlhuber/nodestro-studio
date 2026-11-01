// What a workflow or a tool needs from PyPI: state, packages, actions and history.

import { useMutation, useQuery } from "@tanstack/react-query";
import { Package, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { mcpApi } from "../api/mcp";
import type { DependencyPlan, DependencyScope, DependencyState, DependencyStatus, WorkflowIn } from "../api/types";
import { toast } from "../components/toast";
import { Badge, Button, HelpTip } from "../components/ui";
import { ProblemText } from "../lib/errors";
import { relativeTime } from "../lib/format";
import { DependencyDialog, InstallProgress, useDependencyRefresh, useInstallation } from "./DependencyDialog";

const STATE_TONE: Record<DependencyState, "success" | "warning" | "danger" | "running" | "idle"> = {
  none: "idle",
  ready: "success",
  approval_needed: "warning",
  install_needed: "warning",
  installing: "running",
  failed: "danger",
  unresolved: "danger",
  unsupported: "danger",
};

function StatusBody({
  status,
  kind,
  refName,
  label,
  loadPlan,
  onDone,
}: {
  status: DependencyStatus;
  kind: DependencyScope;
  refName: string;
  label: string;
  loadPlan: () => Promise<DependencyPlan>;
  onDone?: () => void;
}) {
  const { t } = useTranslation();
  const refresh = useDependencyRefresh();
  const [dialog, setDialog] = useState(false);
  const installing = status.state === "installing";
  const installation = useInstallation(kind, refName, installing);
  const install = useMutation({
    mutationFn: () => api.reinstallEnvironment(kind, refName),
    onSuccess: refresh,
    onError: toast.error,
  });
  const locked = new Map(status.packages.map((item) => [item.key, item]));
  const ended = installing && installation.data !== undefined && installation.data.install.status !== "installing";
  useEffect(() => {
    if (ended) refresh();
  }, [ended, refresh]);
  return (
    <div className="stack-sm">
      <div className="row-gap">
        <Badge tone={STATE_TONE[status.state]}>{t(`python.state.${status.state}`)}</Badge>
        {status.approved_at ? <span className="muted small">{t("python.panel.approvedAt", { when: relativeTime(status.approved_at) })}</span> : null}
      </div>
      {status.needed.length ? (
        <ul className="dep-list" aria-label={t("python.panel.needed")}>
          {status.needed.map((item) => {
            const version = locked.get(item.key)?.version;
            return (
              <li key={item.key} data-package={item.key}>
                <code>{item.name}</code>
                {item.spec ? <span className="muted small"> {item.spec}</span> : null}
                <span className="dep-list__version">{version ? version : t("python.panel.notInstalled")}</span>
                <span className="muted small dep-list__tools">{t("python.panel.usedBy", { names: item.required_by.join(", ") })}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
      {status.state === "approval_needed" && status.reasons.length ? (
        <p className="small">
          {status.reasons.map((reason) => t(`python.reason.${reason}`, { names: status.pending.join(", ") })).join(" ")}
        </p>
      ) : null}
      {status.issues.filter((issue) => issue.blocking).map((issue, index) => (
        <p key={index} className="small dep-issue">
          <code>{issue.tool}</code>: <ProblemText item={issue} compact />
        </p>
      ))}
      {status.problem ? (
        <p className="small dep-issue">
          <ProblemText item={status.problem} />
        </p>
      ) : null}
      {status.state === "failed" && status.install.error ? (
        <p className="small dep-issue">
          <ProblemText item={status.install.error} />
        </p>
      ) : null}
      {installing ? <InstallProgress env={installation.data} /> : null}
      <div className="row-gap">
        {status.state === "approval_needed" ? (
          <Button size="sm" variant="primary" icon={ShieldCheck} onClick={() => setDialog(true)} data-testid="review-dependencies">
            {t("python.panel.review")}
          </Button>
        ) : null}
        {status.state === "install_needed" || status.state === "failed" ? (
          <Button size="sm" icon={RefreshCw} busy={install.isPending} onClick={() => install.mutate()}>
            {t("python.panel.install")}
          </Button>
        ) : null}
        {status.state === "ready" ? (
          <Button size="sm" variant="ghost" icon={Package} onClick={() => setDialog(true)}>
            {t("python.panel.check")}
          </Button>
        ) : null}
      </div>
      {status.history.length ? (
        <details>
          <summary className="small">{t("python.panel.history")}</summary>
          <ul className="dep-history small">
            {[...status.history].reverse().map((change, index) => (
              <li key={index}>
                <span className="muted">{relativeTime(change.at)}</span> {t(`python.change.${change.kind}`)}
                {change.details.length ? <span className="muted"> · {change.details.join(", ")}</span> : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <DependencyDialog
        open={dialog}
        onClose={() => setDialog(false)}
        kind={kind}
        refName={refName}
        label={label}
        loadPlan={loadPlan}
        onDone={onDone}
      />
    </div>
  );
}

/** The workflow inspector's section; hidden for workflows that only use the standard library. */
export function WorkflowDependencies({ workflowId, workflow }: { workflowId: string; workflow: WorkflowIn }) {
  const { t } = useTranslation();
  const tools = workflow.nodes.flatMap((node) => node.agent?.tools ?? []).sort();
  const status = useQuery({
    queryKey: ["dependencies", "workflow", workflowId, tools.join(",")],
    queryFn: () => api.workflowDependencies(workflowId, workflow),
    refetchInterval: (query) => (query.state.data?.state === "installing" ? 1500 : false),
  });
  const data = status.data;
  if (!data || (data.state === "none" && !data.packages.length)) return null;
  return (
    <section className="check-panel dep-panel" aria-labelledby="workflow-dependencies" data-testid="workflow-dependencies">
      <h3 className="check-panel__title" id="workflow-dependencies">
        <Package size={13} aria-hidden /> {t("python.panel.title")} <HelpTip id="python.workflow" label={t("python.panel.title")} />
      </h3>
      {data.state === "none" ? (
        <p className="muted small">{t("python.panel.unused", { count: data.packages.length })}</p>
      ) : (
        <StatusBody
          status={data}
          kind="workflow"
          refName={workflowId}
          label={workflow.name}
          loadPlan={() => api.workflowDependencyPlan(workflowId, workflow)}
        />
      )}
    </section>
  );
}

/** A tool's libraries and its test environment (tool editor, tool detail, tool drafts). */
export function ToolDependencies({
  name,
  code,
  tests,
  onDone,
}: {
  name: string;
  code: string;
  tests: string;
  onDone?: () => void;
}) {
  const { t } = useTranslation();
  const status = useQuery({
    queryKey: ["dependencies", "tool", name, code, tests],
    queryFn: () => api.toolDependencies(name, code, tests),
    refetchInterval: (query) => (query.state.data?.state === "installing" ? 1500 : false),
  });
  const data = status.data;
  if (!data || data.state === "none") return null;
  return (
    <section className="dep-panel stack-sm" aria-labelledby={`tool-deps-${name}`} data-testid="tool-dependencies">
      <h3 className="check-panel__title" id={`tool-deps-${name}`}>
        <Package size={13} aria-hidden /> {t("python.panel.toolTitle")} <HelpTip id="python.tool" label={t("python.panel.toolTitle")} />
      </h3>
      <StatusBody
        status={data}
        kind="tool"
        refName={name}
        label={name}
        loadPlan={() => api.toolDependencyPlan(name, code, tests)}
        onDone={onDone}
      />
    </section>
  );
}

/** A local MCP server's packages (WP-8): planned hash-pinned, approved like a tool's, installed into its container. */
export function McpServerDependencies({ serverId, name }: { serverId: string; name: string }) {
  const { t } = useTranslation();
  const status = useQuery({
    queryKey: ["dependencies", "mcp", serverId],
    queryFn: () => mcpApi.environment(serverId),
    refetchInterval: (query) => (query.state.data?.state === "installing" ? 1500 : false),
  });
  const data = status.data;
  if (status.error) return <ProblemText item={{ code: "deps.unavailable", message: String(status.error) }} compact />;
  if (!data) return null;
  return (
    <section className="dep-panel stack-sm" aria-labelledby={`mcp-deps-${serverId}`} data-testid="mcp-dependencies">
      <h3 className="check-panel__title" id={`mcp-deps-${serverId}`}>
        <Package size={13} aria-hidden /> {t("python.panel.mcpTitle")} <HelpTip id="tools.servicesLocal" label={t("python.panel.mcpTitle")} />
      </h3>
      <StatusBody status={data} kind="mcp" refName={serverId} label={name} loadPlan={() => mcpApi.environmentPlan(serverId)} />
    </section>
  );
}
