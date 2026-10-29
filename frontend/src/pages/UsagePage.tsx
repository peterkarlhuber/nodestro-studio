import { Activity } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useUsage } from "../api/hooks";
import type { UsageBucket, UsageEntry } from "../api/types";
import { Callout, EmptyState, HelpTip, PageHeader, Segmented, Spinner, Stat } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { formatCost, formatDate, formatDay, formatNumber, formatTokens } from "../lib/format";

function Bars({ buckets, label }: { buckets: UsageBucket[]; label: string }) {
  const { t } = useTranslation();
  const max = Math.max(...buckets.map((bucket) => bucket.estimated_cost_usd), 0.000001);
  return (
    <div className="bars" role="img" aria-label={label}>
      {buckets.map((bucket) => (
        <div key={bucket.key} className="bars__col" title={t("usage.barTitle", { day: formatDay(bucket.label), cost: formatCost(bucket.estimated_cost_usd), count: bucket.runs, runs: formatNumber(bucket.runs) })}>
          <div className="bars__bar" style={{ height: `${(bucket.estimated_cost_usd / max) * 100}%` }} />
          <span className="bars__label">{formatDay(bucket.label)}</span>
        </div>
      ))}
    </div>
  );
}

function BucketTable({
  title,
  buckets,
  first,
  tip,
  labelOf = (bucket) => bucket.label,
  countLabel,
}: {
  title: string;
  buckets: UsageBucket[];
  first: string;
  tip?: "usage.byModel" | "usage.sources";
  labelOf?: (bucket: UsageBucket) => string;
  /** Header of the count column; the count is runs plus other AI operations. */
  countLabel?: string;
}) {
  const { t } = useTranslation();
  const total = buckets.reduce((sum, bucket) => sum + bucket.estimated_cost_usd, 0) || 1;
  return (
    <section className="panel stack" aria-label={title}>
      <h2 className="panel__title">
        {title}
        {tip ? <HelpTip id={tip} label={title} /> : null}
      </h2>
      {!buckets.length ? <p className="muted small">{t("usage.noData")}</p> : null}
      {buckets.length ? (
        <table className="table table--compact">
          <thead>
            <tr>
              <th>{first}</th>
              <th className="num">{countLabel ?? t("usage.runs")}</th>
              <th className="num">{t("runs.stats.tokens")}</th>
              <th className="num">{t("executions.columns.cost")}</th>
              <th>
                {t("usage.share")} <HelpTip id="usage.share" label={t("usage.share")} />
              </th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((bucket) => (
              <tr key={bucket.key}>
                <td>{labelOf(bucket)}</td>
                <td className="num">{formatNumber(bucket.runs + bucket.operations)}</td>
                <td className="num">{formatTokens(bucket.total_tokens)}</td>
                <td className="num">
                  {formatCost(bucket.estimated_cost_usd)}
                  {bucket.unpriced ? <span className="muted small"> {t("usage.unpriced")}</span> : null}
                </td>
                <td>
                  <div className="share">
                    <div className="share__fill" style={{ width: `${(bucket.estimated_cost_usd / total) * 100}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}

/** The latest AI operations outside workflow runs: agent tests, assistants, tool generation. */
function RecentOperations({ entries }: { entries: UsageEntry[] }) {
  const { t, i18n } = useTranslation();
  if (!entries.length) return null;
  return (
    <section className="panel stack" aria-label={t("usage.recent")}>
      <h2 className="panel__title">{t("usage.recent")}</h2>
      <div className="table-wrap">
        <table className="table table--compact" data-testid="usage-recent">
          <thead>
            <tr>
              <th>{t("usage.when")}</th>
              <th>{t("usage.source")}</th>
              <th>{t("usage.operation")}</th>
              <th>{t("agent.model")}</th>
              <th className="num">{t("runs.stats.tokens")}</th>
              <th className="num">{t("executions.columns.cost")}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{formatDate(entry.at)}</td>
                <td>{t(`usage.sources.${entry.source}`)}</td>
                <td className="truncate">
                  {entry.detail && i18n.exists(`usage.detail.${entry.detail}`) ? <strong>{t(`usage.detail.${entry.detail}`)} · </strong> : null}
                  {entry.label}
                </td>
                <td>{entry.model}</td>
                <td className="num">{formatTokens(entry.usage.total_tokens)}</td>
                <td className="num">{formatCost(entry.usage.estimated_cost_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function UsagePage() {
  const { t } = useTranslation();
  const [days, setDays] = useState<"7" | "30" | "90">("30");
  const usage = useUsage(Number(days));
  const data = usage.data;
  return (
    <div className="page">
      <PageHeader
        title={t("nav.usage")}
        doc="nutzung"
        description={t("usage.description")}
        actions={
          <Segmented
            label={t("usage.period")}
            value={days}
            onChange={setDays}
            options={[
              { value: "7", label: t("usage.days", { count: 7 }) },
              { value: "30", label: t("usage.days", { count: 30 }) },
              { value: "90", label: t("usage.days", { count: 90 }) },
            ]}
          />
        }
      />
      <div className="page__body stack">
        {usage.isLoading ? <Spinner /> : null}
        {usage.error ? <Callout tone="danger">
            <ErrorText error={usage.error} />
          </Callout> : null}
        {data && !data.total.runs && !data.total.operations ? (
          <EmptyState icon={Activity} title={t("usage.empty")}>
            {t("usage.emptyText")}
          </EmptyState>
        ) : null}
        {data && (data.total.runs || data.total.operations) ? (
          <>
            <div className="stats">
              <Stat label={t("usage.runs")} value={formatNumber(data.total.runs)} />
              <Stat label={t("usage.operations")} value={formatNumber(data.total.operations)} tip="usage.sources" />
              <Stat label={t("runs.stats.requests")} value={formatNumber(data.total.requests)} tip="runs.requests" />
              <Stat
                label={t("runs.stats.tokens")}
                tip="runs.tokens"
                value={formatTokens(data.total.total_tokens)}
                hint={`${t("usage.breakdown.input", { value: formatTokens(data.total.input_tokens) })} · ${t("usage.breakdown.output", { value: formatTokens(data.total.output_tokens) })}`}
              />
              <Stat label={t("runs.stats.cost")} value={formatCost(data.total.estimated_cost_usd)} tip="runs.cost" />
            </div>
            <section className="panel stack" aria-label={t("usage.perDay")}>
              <h2 className="panel__title">{t("usage.perDay")}</h2>
              <Bars buckets={data.by_day} label={t("usage.perDay")} />
            </section>
            <div className="two-column">
              <BucketTable title={t("usage.byWorkflow")} first={t("executions.columns.workflow")} buckets={data.by_workflow} />
              <BucketTable
                title={t("usage.byModel")}
                first={t("agent.model")}
                buckets={data.by_model}
                tip="usage.byModel"
                countLabel={t("usage.uses")}
              />
            </div>
            <BucketTable
              title={t("usage.bySource")}
              first={t("usage.source")}
              buckets={data.by_source}
              tip="usage.sources"
              labelOf={(bucket) => t(`usage.sources.${bucket.key}`)}
              countLabel={t("usage.count")}
            />
            <RecentOperations entries={data.recent} />
          </>
        ) : null}
      </div>
    </div>
  );
}
