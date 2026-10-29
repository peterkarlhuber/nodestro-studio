import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Layers, Pause, Play, Plus, Square, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { api } from "../api/client";
import { keys, useBatches } from "../api/hooks";
import type { Batch } from "../api/types";
import { BatchDialog } from "../automation/BatchDialog";
import { ProgressBar } from "../automation/shared";
import { BATCH_TONE, ITEM_TONE } from "../automation/status";
import { Output } from "../components/Markdown";
import { toast } from "../components/toast";
import { Badge, Button, Callout, EmptyState, IconButton, PageHeader, Spinner, Stat } from "../components/ui";
import { progress } from "../lib/batch";
import { ErrorText, ProblemText, problemText } from "../lib/errors";
import { formatCost, formatDate, formatTokens } from "../lib/format";

export function BatchesPage() {
  const { t } = useTranslation();
  const batches = useBatches();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const remove = useMutation({
    mutationFn: api.deleteBatch,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.batches }),
    onError: toast.error,
  });
  const list = (batches.data ?? []).filter((batch) => batch.kind === "batch");
  return (
    <div className="page">
      <PageHeader
        title={t("nav.batches")}
        doc="automatisierung#stapel"
        description={t("automation.batch.description")}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>
            {t("automation.batch.new")}
          </Button>
        }
      />
      <div className="page__body">
        {batches.isLoading ? <Spinner /> : null}
        {batches.error ? (
          <Callout tone="danger">
            <ErrorText error={batches.error} />
          </Callout>
        ) : null}
        {batches.data && !list.length ? (
          <EmptyState
            icon={Layers}
            title={t("automation.batch.empty")}
            action={
              <Button icon={Plus} onClick={() => setCreating(true)}>
                {t("automation.batch.new")}
              </Button>
            }
          >
            {t("automation.batch.emptyText")}
          </EmptyState>
        ) : null}
        {list.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("automation.columns.name")}</th>
                  <th>{t("automation.columns.status")}</th>
                  <th>{t("automation.columns.progress")}</th>
                  <th>{t("automation.columns.created")}</th>
                  <th className="num">{t("automation.columns.cost")}</th>
                  <th>
                    <span className="sr-only">{t("automation.columns.actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((batch) => (
                  <tr key={batch.id}>
                    <td>
                      <Link to={`/batches/${batch.id}`} className="table__primary">
                        {batch.name || batch.workflow_name}
                      </Link>
                      <div className="muted small">{batch.workflow_name}</div>
                    </td>
                    <td>
                      <Badge tone={BATCH_TONE[batch.status]}>{t(`automation.batchStatus.${batch.status}`)}</Badge>
                    </td>
                    <td>
                      <ProgressBar value={progress(batch.counts)} label={t("automation.columns.progress")} />
                      <div className="muted small">
                        {t("automation.batch.counts", {
                          succeeded: batch.counts.succeeded,
                          failed: batch.counts.failed,
                          total: batch.counts.total,
                        })}
                      </div>
                    </td>
                    <td>{formatDate(batch.created_at)}</td>
                    <td className="num">{formatCost(batch.cost_usd)}</td>
                    <td>
                      {batch.status === "running" || batch.status === "paused" ? null : (
                        <IconButton icon={Trash2} label={t("automation.batch.delete")} onClick={() => remove.mutate(batch.id)} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
      {creating ? <BatchDialog open onClose={() => setCreating(false)} /> : null}
    </div>
  );
}

export function BatchDetailPage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const batch = useQuery({
    queryKey: keys.batch(id),
    queryFn: () => api.batch(id),
    refetchInterval: (query) => (query.state.data?.status === "running" ? 1500 : false),
  });
  const action = useMutation({
    mutationFn: (kind: "pause" | "resume" | "cancel") =>
      kind === "pause" ? api.pauseBatch(id) : kind === "resume" ? api.resumeBatch(id) : api.cancelBatch(id),
    onSuccess: (result: Batch) => {
      queryClient.setQueryData(keys.batch(id), result);
      void queryClient.invalidateQueries({ queryKey: keys.batches });
    },
    onError: toast.error,
  });
  if (batch.isLoading) return <Spinner />;
  if (batch.error || !batch.data)
    return (
      <div className="page">
        <Callout tone="danger">{batch.error ? <ErrorText error={batch.error} /> : null}</Callout>
      </div>
    );
  const data = batch.data;
  const active = data.status === "running" || data.status === "paused";
  return (
    <div className="page">
      <PageHeader
        title={data.name || data.workflow_name}
        doc="automatisierung#stapel"
        crumbs={
          <>
            <Link to="/batches">{t("nav.batches")}</Link> / <span>{formatDate(data.created_at)}</span>
          </>
        }
        actions={
          <>
            {data.status === "running" ? (
              <Button icon={Pause} onClick={() => action.mutate("pause")}>
                {t("automation.batch.pause")}
              </Button>
            ) : null}
            {data.status === "paused" || data.status === "interrupted" || data.status === "stopped" ? (
              <Button icon={Play} onClick={() => action.mutate("resume")}>
                {t("automation.batch.resume")}
              </Button>
            ) : null}
            {active ? (
              <Button icon={Square} onClick={() => action.mutate("cancel")}>
                {t("common.cancel")}
              </Button>
            ) : null}
            <a className="nd-button nd-button--default nd-button--md" href={api.batchExportUrl(id, "csv")} download>
              <Download size={15} aria-hidden /> CSV
            </a>
            <a className="nd-button nd-button--ghost nd-button--md" href={api.batchExportUrl(id, "json")} download>
              <Download size={15} aria-hidden /> JSON
            </a>
          </>
        }
      />
      <div className="page__body stack">
        <div className="stats">
          <Stat
            label={t("automation.columns.status")}
            value={<Badge tone={BATCH_TONE[data.status]}>{t(`automation.batchStatus.${data.status}`)}</Badge>}
            hint={<Link to={`/workflows/${data.workflow_id}`}>{data.workflow_name}</Link>}
          />
          <Stat
            label={t("automation.columns.progress")}
            value={`${data.counts.succeeded + data.counts.failed + data.counts.invalid + data.counts.cancelled + data.counts.skipped} / ${data.counts.total}`}
            hint={<ProgressBar value={progress(data.counts)} label={t("automation.columns.progress")} />}
          />
          <Stat
            label={t("automation.batch.failed")}
            value={data.counts.failed}
            hint={data.counts.invalid ? t("automation.batch.invalid", { count: data.counts.invalid }) : undefined}
          />
          <Stat label={t("runs.stats.cost")} value={formatCost(data.cost_usd)} hint={t("runs.tokens", { value: formatTokens(data.tokens) })} tip="runs.cost" />
        </div>
        {data.stop_code ? (
          <Callout tone={data.status === "stopped" || data.status === "interrupted" ? "danger" : "warning"}>
            <ProblemText item={{ code: data.stop_code, params: data.stop_params }} />
          </Callout>
        ) : null}
        {data.counts.paused ? <Callout tone="warning">{t("automation.batch.pausedItems", { count: data.counts.paused })}</Callout> : null}
        <div className="table-wrap">
          <table className="table table--compact">
            <thead>
              <tr>
                <th>#</th>
                <th>{t("automation.columns.input")}</th>
                <th>{t("automation.columns.status")}</th>
                <th>{t("automation.columns.result")}</th>
                <th className="num">{t("automation.columns.cost")}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.index}>
                  <td>{item.index + 1}</td>
                  <td className="small">
                    {Object.entries(item.values)
                      .map(([key, value]) => `${key}: ${String(value)}`)
                      .join(" · ") || <span className="truncate">{item.input}</span>}
                  </td>
                  <td>
                    <Badge tone={ITEM_TONE[item.status]}>{t(`automation.itemStatus.${item.status}`)}</Badge>
                    {item.run_id ? (
                      <div className="small">
                        <Link to={`/executions/${item.run_id}`}>{t("automation.openRun")}</Link>
                      </div>
                    ) : null}
                  </td>
                  <td className="small">
                    {item.errors.length
                      ? item.errors.map((error) => `${error.field}: ${problemText(t, error)}`).join("; ")
                      : item.error_code || item.error
                        ? problemText(t, { code: item.error_code, params: item.error_params, message: item.error })
                        : item.output !== null && item.output !== undefined
                          ? (
                              <details>
                                <summary>{t("automation.showResult")}</summary>
                                <Output value={item.output} />
                              </details>
                            )
                          : "–"}
                  </td>
                  <td className="num">{formatCost(item.cost_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
