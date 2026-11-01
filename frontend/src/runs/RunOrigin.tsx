// Where a run came from: a schedule, a batch, a test series, a parent workflow or a failed run it continues.

import { CalendarClock, FlaskConical, History, Layers, Plug, Workflow } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { Run } from "../api/types";
import { Callout } from "../components/ui";
import { teamRunsOf } from "../editor/orchestrationModel";

/** The orchestrator step of the parent run that started this run as a team, and in which decision. */
export function teamRunOrigin(parent: Run | undefined, runId: string): { label: string; decision: number } | null {
  if (!parent) return null;
  for (const node of parent.workflow.nodes) {
    const state = parent.nodes[node.id];
    if (node.type !== "orchestrator" || !state?.orchestration) continue;
    const entry = teamRunsOf(state.orchestration, state.child_run_ids ?? []).find((item) => item.ref === runId);
    if (entry) return { label: node.label || node.id, decision: entry.round + 1 };
    if (state.child_run_ids?.includes(runId)) return { label: node.label || node.id, decision: 0 };
  }
  return null;
}

export function RunOrigin({ run }: { run: Run }) {
  const { t } = useTranslation();
  const trigger = run.trigger ?? "manual";
  const parts: ReactElement[] = [];
  // A team run of an orchestrator says so, with the decision that started it (nested teams link up level by level).
  const parent = useQuery({
    queryKey: keys.run(run.parent_run_id ?? ""),
    queryFn: () => api.run(run.parent_run_id ?? ""),
    enabled: Boolean(run.parent_run_id) && !run.imported_at,
    retry: false,
  });
  const team = teamRunOrigin(parent.data, run.id);
  if (run.parent_run_id)
    parts.push(
      <span key="parent" data-testid="run-origin-parent">
        <Workflow size={13} aria-hidden />{" "}
        {team
          ? team.decision
            ? t("orchestration.origin.teamRun", { name: team.label, n: team.decision })
            : t("orchestration.origin.teamRunPlain")
          : t("flow.origin.subworkflow")}{" "}
        <Link to={`/executions/${run.parent_run_id}`}>{t("flow.origin.openParent")}</Link>
      </span>,
    );
  if (run.resumed_from)
    parts.push(
      <span key="resumed">
        <History size={13} aria-hidden /> {t("flow.origin.resumed")}{" "}
        <Link to={`/executions/${run.resumed_from}`}>{t("flow.origin.openEarlier")}</Link>
      </span>,
    );
  if (trigger === "schedule")
    parts.push(
      <span key="schedule">
        <CalendarClock size={13} aria-hidden /> {t("flow.origin.schedule")} <Link to="/schedules">{t("nav.schedules")}</Link>
      </span>,
    );
  if (trigger === "batch" && run.trigger_ref)
    parts.push(
      <span key="batch">
        <Layers size={13} aria-hidden /> {t("flow.origin.batch")} <Link to={`/batches/${run.trigger_ref}`}>{t("flow.origin.openBatch")}</Link>
      </span>,
    );
  if (trigger === "benchmark")
    parts.push(
      <span key="benchmark">
        <FlaskConical size={13} aria-hidden /> {t("flow.origin.benchmark")} <Link to="/tests">{t("nav.tests")}</Link>
      </span>,
    );
  if (trigger === "api")
    parts.push(
      <span key="api">
        <Plug size={13} aria-hidden />{" "}
        {run.api_key_id === "studio"
          ? t("flow.origin.apiStudio", { number: run.release_number ?? "?" })
          : t("flow.origin.api", { number: run.release_number ?? "?", key: run.api_key_id ?? "?" })}{" "}
        <Link to={`/workflows/${run.workflow_id}`}>{t("flow.origin.openWorkflow")}</Link>
      </span>,
    );
  if (run.workflow_version)
    parts.push(
      <span key="version" className="muted">
        {t("editor.subworkflow.versionN", { n: run.workflow_version })}
      </span>,
    );
  if (!parts.length) return null;
  return (
    <Callout tone="info">
      <span className="row-gap">{parts}</span>
    </Callout>
  );
}
