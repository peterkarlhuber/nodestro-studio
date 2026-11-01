// Pieces shared by batches, test series and schedules: limits, the cost estimate and the
// confirmation for tools that reach outside Nodestro.

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import type { CostEstimate, Problem } from "../api/types";
import { Callout, Field, HelpTip, TextInput, Toggle } from "../components/ui";
import { ProblemText } from "../lib/errors";
import { formatCost } from "../lib/format";

/** Whether a finding is a warning about a tool call the per-call approval rules would refuse (R1). */
export function isToolWarning(item: Problem): boolean {
  return item.code.startsWith("tool.unattended_");
}

/**
 * Tool calls the per-call approval rules would refuse in unattended runs (schedules, batches, test series, published
 * APIs), found before the start. Each line names the tool, why and how to fix it; nothing is granted from here.
 */
export function ToolWarnings({ items }: { items: Problem[] }) {
  const { t } = useTranslation();
  if (!items.length) return null;
  return (
    <Callout tone="warning">
      <div className="stack-sm" data-testid="tool-warnings">
        <strong>
          {t("automation.toolWarnings.title")} <HelpTip id="tools.callApproval" label={t("automation.toolWarnings.title")} />
        </strong>
        <ul className="small">
          {items.map((item, index) => (
            <li key={`${item.code}-${index}`} data-code={item.code}>
              <ProblemText item={item} />
            </li>
          ))}
        </ul>
        <div className="small">
          {t("automation.toolWarnings.hint")} <Link to="/approvals">{t("automation.toolWarnings.open")}</Link>
        </div>
      </div>
    </Callout>
  );
}

export interface Limits {
  concurrency: number;
  max_cost_usd: number | null;
  max_failures: number | null;
}

export function LimitFields({ value, onChange }: { value: Limits; onChange: (value: Limits) => void }) {
  const { t } = useTranslation();
  return (
    <div className="grid-3">
      <Field label={t("automation.limits.concurrency")} hint={t("automation.limits.concurrencyHint")} tip="automation.concurrency">
        <TextInput
          type="number"
          min={1}
          max={8}
          value={value.concurrency}
          onChange={(e) => onChange({ ...value, concurrency: Math.min(8, Math.max(1, Number(e.target.value) || 1)) })}
        />
      </Field>
      <Field label={t("automation.limits.maxCost")} hint={t("automation.limits.maxCostHint")} tip="automation.batchLimits">
        <TextInput
          type="number"
          min={0}
          step={0.1}
          value={value.max_cost_usd ?? ""}
          onChange={(e) => onChange({ ...value, max_cost_usd: e.target.value === "" ? null : Number(e.target.value) })}
        />
      </Field>
      <Field label={t("automation.limits.maxFailures")} hint={t("automation.limits.maxFailuresHint")}>
        <TextInput
          type="number"
          min={1}
          value={value.max_failures ?? ""}
          onChange={(e) => onChange({ ...value, max_failures: e.target.value === "" ? null : Math.max(1, Number(e.target.value)) })}
        />
      </Field>
    </div>
  );
}

/** What a series of runs will probably cost, and what it calls outside Nodestro. */
export function EstimateView({
  estimate,
  externalTools,
  approvals,
  toolWarnings = [],
  confirmed,
  onConfirm,
}: {
  estimate: CostEstimate;
  externalTools: string[];
  approvals: number;
  toolWarnings?: Problem[];
  confirmed: boolean;
  onConfirm: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="stack-sm">
      <Callout tone="info">
        <strong>
          {t("automation.estimate.title")} <HelpTip id="automation.estimate" label={t("automation.estimate.title")} />
        </strong>
        <div>
          {estimate.total_usd !== null
            ? t("automation.estimate.total", {
                runs: estimate.runs,
                total: formatCost(estimate.total_usd),
                perRun: formatCost(estimate.per_run_usd),
                count: estimate.based_on,
              })
            : t("automation.estimate.unknown", { runs: estimate.runs })}
        </div>
        {estimate.max_total_usd !== null ? (
          <div className="small">{t("automation.estimate.max", { max: formatCost(estimate.max_total_usd) })}</div>
        ) : null}
      </Callout>
      {approvals ? <Callout tone="warning">{t("automation.estimate.approvals", { count: approvals })}</Callout> : null}
      <ToolWarnings items={toolWarnings} />
      {externalTools.length ? (
        <Callout tone="warning">
          <div>{t("automation.external.text", { tools: externalTools.join(", ") })}</div>
          <Toggle
            checked={confirmed}
            onChange={onConfirm}
            label={t("automation.external.confirm")}
            tip="automation.external"
          />
        </Callout>
      ) : null}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={label}>
      <span className="progress__bar" style={{ width: `${percent}%` }} />
    </div>
  );
}
