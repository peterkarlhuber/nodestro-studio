// Where a run came from: a schedule, a batch, a test series, a parent workflow or a failed run it continues.

import { CalendarClock, FlaskConical, History, Layers, Plug, Workflow } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import type { Run } from "../api/types";
import { Callout } from "../components/ui";

export function RunOrigin({ run }: { run: Run }) {
  const { t } = useTranslation();
  const trigger = run.trigger ?? "manual";
  const parts: ReactElement[] = [];
  if (run.parent_run_id)
    parts.push(
      <span key="parent">
        <Workflow size={13} aria-hidden /> {t("flow.origin.subworkflow")}{" "}
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
