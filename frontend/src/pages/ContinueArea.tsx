// "Continue" on the workflow start page for returning users (OB-05): what waits for a decision, the latest runs with
// their status and (with more workflows than the grid shows at a glance) the recently edited ones. Built from the
// existing lists (/runs, /approvals, /tool-approvals, /workflows); a part without data is left out, and without any
// data the area is not shown at all, so the page stays as uncluttered as before (D3).

import { ArrowRight, History, Inbox, PenLine } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useApprovals, useRuns, useToolApprovals } from "../api/hooks";
import type { RunSummary, WorkflowSummary } from "../api/types";
import { StatusBadge } from "../components/ui";
import { changedText, relativeTime } from "../lib/format";

const RUNS = 4;
const EDITED = 3;
/** Up to this many workflows the grid below is the overview; recently edited ones would only repeat it. */
const GRID_AT_A_GLANCE = 6;

/** The latest runs a person started (imported traces are not "where they left off"). */
export function recentRuns(runs: RunSummary[] | undefined, count = RUNS): RunSummary[] {
  return [...(runs ?? [])]
    .filter((run) => !run.imported_at)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, count);
}

export function recentlyEdited(workflows: WorkflowSummary[], count = EDITED): WorkflowSummary[] {
  if (workflows.length <= GRID_AT_A_GLANCE) return [];
  return [...workflows].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, count);
}

export function ContinueArea({ workflows }: { workflows: WorkflowSummary[] }) {
  const { t } = useTranslation();
  const runs = useRuns();
  const approvals = useApprovals();
  const toolApprovals = useToolApprovals();
  const latest = recentRuns(runs.data);
  const edited = recentlyEdited(workflows);
  const waiting = (approvals.data ?? []).length + (toolApprovals.data ?? []).filter((item) => item.status === "pending").length;
  if (!latest.length && !edited.length && !waiting) return null;
  return (
    <section className="continue" aria-labelledby="continue-title" data-testid="continue">
      <h2 id="continue-title" className="continue__title">
        {t("workflows.continue.title")}
      </h2>
      <div className="continue__grid">
        {waiting ? (
          <Link to="/approvals" className="continue__waiting" data-testid="continue-approvals">
            <Inbox size={16} aria-hidden />
            <span>
              <strong>{t("workflows.continue.waiting", { count: waiting })}</strong>
              <span className="muted small">
                {(approvals.data ?? [])
                  .slice(0, 2)
                  .map((item) => `${item.workflow_name} · ${item.label}`)
                  .join(", ")}
              </span>
            </span>
            <ArrowRight size={14} aria-hidden />
          </Link>
        ) : null}
        {latest.length ? (
          <div className="continue__group" data-testid="continue-runs">
            <h3 className="continue__heading">
              <History size={13} aria-hidden /> {t("workflows.continue.runs")}
              <Link to="/executions" className="continue__all small">
                {t("workflows.continue.allRuns")}
              </Link>
            </h3>
            <ul className="continue__list">
              {latest.map((run) => (
                <li key={run.id}>
                  <Link to={`/executions/${run.id}`} className="continue__item">
                    <span className="continue__name">{run.workflow_name}</span>
                    <span className="muted small">{relativeTime(run.created_at)}</span>
                  </Link>
                  <StatusBadge status={run.status} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {edited.length ? (
          <div className="continue__group" data-testid="continue-edited">
            <h3 className="continue__heading">
              <PenLine size={13} aria-hidden /> {t("workflows.continue.edited")}
            </h3>
            <ul className="continue__list">
              {edited.map((workflow) => (
                <li key={workflow.id}>
                  <Link to={`/workflows/${workflow.id}`} className="continue__item">
                    <span className="continue__name">{workflow.name}</span>
                    <span className="muted small">{changedText(t, workflow.updated_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
