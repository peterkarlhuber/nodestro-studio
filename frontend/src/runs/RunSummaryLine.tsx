// What happened in a run, in a few lines above the details (UX-6b). Built only from the stored run (runSummary.ts).

import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Run } from "../api/types";
import { Button } from "../components/ui";
import { summarizeRun } from "./runSummary";

export function RunSummaryLine({ run, onOpenStep }: { run: Run; onOpenStep: (nodeId: string) => void }) {
  const { t } = useTranslation();
  const summary = summarizeRun(run);
  if (!summary.total) return null;
  return (
    <section className="panel run-summary" aria-label={t("runs.summary.title")}>
      <dl className="form-values">
        <div>
          <dt>{t("runs.summary.steps")}</dt>
          <dd>
            {t("runs.summary.stepsDone", { done: summary.done, total: summary.total })}
            {summary.skipped ? ` · ${t("runs.summary.skipped", { count: summary.skipped })}` : ""}
          </dd>
        </div>
        {summary.decisions.length ? (
          <div>
            <dt>{t("runs.summary.path")}</dt>
            <dd>
              {summary.decisions
                .map((step) => `${step.label} → ${step.branches ? step.branches.join(", ") : t("runs.summary.notRecorded")}`)
                .join(" · ")}
            </dd>
          </div>
        ) : null}
        {summary.approvals.length ? (
          <div>
            <dt>{t("runs.summary.approvals")}</dt>
            <dd>
              {summary.approvals
                .map((step) => `${step.label}: ${t(`runs.summary.approval.${step.decision ?? "waiting"}`)}`)
                .join(" · ")}
            </dd>
          </div>
        ) : null}
        <div>
          <dt>{t("runs.summary.tools")}</dt>
          <dd>
            {summary.tools.length
              ? summary.tools
                  .map(
                    (tool) =>
                      `${tool.name} (${tool.calls}${tool.errors ? `, ${t("runs.summary.toolErrors", { count: tool.errors })}` : ""})`,
                  )
                  .join(", ")
              : t("runs.summary.noTools")}
          </dd>
        </div>
        {summary.failed ? (
          <div>
            <dt>{t("runs.summary.failedAt")}</dt>
            <dd className="row-gap">
              <span className="text-danger">
                <AlertTriangle size={13} aria-hidden /> {summary.failed.label}
              </span>
              <Button size="sm" variant="ghost" onClick={() => onOpenStep(summary.failed!.nodeId)}>
                {t("runs.summary.openStep")}
              </Button>
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
