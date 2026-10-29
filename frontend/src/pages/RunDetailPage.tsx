import { useQuery } from "@tanstack/react-query";
import { Download, FileDown, History, Pencil, ShieldCheck, Square } from "lucide-react";
import { useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { Run, WorkflowNode } from "../api/types";
import { DiscussButton } from "../assistant/DiscussButton";
import type { ContextOffer } from "../assistant/store";
import { useContextOffer } from "../assistant/useContextOffer";
import { Output } from "../components/Markdown";
import { toast } from "../components/toast";
import { Button, Callout, HelpTip, Hint, PageHeader, Spinner, Stat, StatusBadge } from "../components/ui";
import { NodeRunDetails, startFiles } from "../editor/RunDetails";
import { liveUsage } from "../editor/store";
import { TraceExportDialog, sanitizeSummary } from "../editor/TraceExportDialog";
import { ErrorText, ProblemText, runProblem } from "../lib/errors";
import { RunApprovals } from "../runs/ApprovalCard";
import { ResultFiles } from "../runs/ResultFiles";
import { RunInputs, useRunInputs } from "../runs/RunInputs";
import { ResumeDialog } from "../runs/ResumeDialog";
import { RunOrigin } from "../runs/RunOrigin";
import { STATUS_TONE, formatCost, formatDate, formatDuration, formatTokens, tokenBreakdown } from "../lib/format";

function ordered(run: Run): WorkflowNode[] {
  // Agents in the order they started; those that never ran at the end.
  const agents = run.workflow.nodes.filter((node) => node.type !== "start" && node.type !== "output");
  const started = (node: WorkflowNode) => run.nodes[node.id]?.started_at ?? "~";
  return [...agents].sort((a, b) => started(a).localeCompare(started(b)));
}

/** A waterfall of the agents' run times: where the time went and what ran in parallel. */
function Trace({ run, selected, onSelect }: { run: Run; selected: string | null; onSelect: (id: string) => void }) {
  const { t } = useTranslation();
  const nodes = ordered(run);
  const begin = run.started_at ? new Date(run.started_at).getTime() : Date.now();
  const end = run.finished_at ? new Date(run.finished_at).getTime() : Date.now();
  const span = Math.max(end - begin, 1);
  return (
    <ol className="trace" aria-label={t("runs.detail.timeline")}>
      {nodes.map((node) => {
        const state = run.nodes[node.id];
        const from = state?.started_at ? new Date(state.started_at).getTime() : null;
        const to = state?.finished_at ? new Date(state.finished_at).getTime() : from !== null ? Date.now() : null;
        const left = from !== null ? ((from - begin) / span) * 100 : 0;
        const width = from !== null && to !== null ? Math.max(((to - from) / span) * 100, 1.5) : 0;
        const tone = state ? STATUS_TONE[state.status] : "idle";
        return (
          <li key={node.id}>
            <button
              type="button"
              className={`trace__row ${selected === node.id ? "selected" : ""}`}
              onClick={() => onSelect(node.id)}
              aria-pressed={selected === node.id}
            >
              <span className="trace__label">
                <strong>{node.label}</strong>
                <span className="muted small">
                  {state
                    ? `${formatDuration(state.started_at, state.finished_at)} · ${t("runs.tokens", { value: formatTokens(state.usage.total_tokens) })} · ${t("editor.nodes.tools", { count: state.tool_calls.length })}`
                    : ""}
                </span>
              </span>
              <span className="trace__track">
                {width ? (
                  <span className={`trace__bar trace__bar--${tone}`} style={{ left: `${left}%`, width: `${width}%` }} />
                ) : null}
              </span>
              {state ? <StatusBadge status={state.status} /> : null}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function RunDetailPage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const run = useQuery({
    queryKey: keys.run(id),
    queryFn: () => api.run(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "running" || status === "queued" ? 1000 : status === "paused" ? 4000 : false;
    },
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const data = run.data;
  const offer: ContextOffer | null = data ? { kind: "run", refId: data.id, label: `${data.workflow_name} · ${formatDate(data.created_at)}` } : null;
  useContextOffer("run", offer);
  const node = useMemo(() => {
    if (!data) return null;
    const id = selected ?? ordered(data)[0]?.id;
    return data.workflow.nodes.find((item) => item.id === id) ?? null;
  }, [data, selected]);
  const inputs = useRunInputs(data);
  const fileNames = new Map((inputs.data ?? []).map((item) => [item.id, item.name ?? item.id]));

  if (run.isLoading) return <Spinner />;
  if (run.error || !data)
    return (
      <div className="page">
        <Callout tone="danger">{run.error ? <ErrorText error={run.error} /> : t("runs.detail.notFound")}</Callout>
      </div>
    );
  const usage = liveUsage(data);
  const imported = Boolean(data.imported_at);
  const live = !imported && (data.status === "running" || data.status === "queued");
  const paused = !imported && data.status === "paused";
  const resumable = !imported && !data.parent_run_id && (data.status === "failed" || data.status === "cancelled");

  return (
    <div className="page">
      <PageHeader
        title={data.workflow_name}
        crumbs={
          <>
            <Link to="/executions">{t("nav.executions")}</Link> / <span>{formatDate(data.created_at)}</span>
          </>
        }
        actions={
          <>
            <DiscussButton offer={offer} />
            {resumable ? (
              <Hint id="flow.resume">
                <Button variant="primary" icon={History} onClick={() => setResumeOpen(true)}>
                  {t("flow.resume.button")}
                </Button>
              </Hint>
            ) : null}
            {live || paused ? (
              <Hint id="runs.cancel">
                <Button icon={Square} onClick={() => api.cancelRun(data.id).catch(toast.error)}>
                  {t("common.cancel")}
                </Button>
              </Hint>
            ) : null}
            <Hint id="runs.exportTrace">
              <Button variant="ghost" icon={Download} onClick={() => setExportOpen(true)}>
                {t("runs.detail.exportTrace")}
              </Button>
            </Hint>
            {imported ? null : (
              <Link className="nd-button nd-button--default nd-button--md" to={`/workflows/${data.workflow_id}`}>
                <Pencil size={15} aria-hidden /> {t("runs.detail.openInEditor")}
              </Link>
            )}
          </>
        }
      />
      <div className="page__body stack">
        <div className="stats">
          <Stat label={t("runs.stats.status")} value={<StatusBadge status={data.status} />} hint={formatDuration(data.started_at ?? data.created_at, data.finished_at)} />
          <Stat label={t("runs.stats.requests")} value={usage.requests} tip="runs.requests" />
          <Stat
            label={t("runs.stats.tokens")}
            tip="runs.tokens"
            value={formatTokens(usage.total_tokens)}
            hint={tokenBreakdown(usage)}
          />
          <Stat label={t("runs.stats.cost")} value={formatCost(usage.estimated_cost_usd)} tip="runs.cost" />
        </div>
        {imported ? (
          <Callout tone="brand">
            <strong>
              <FileDown size={13} aria-hidden /> {t("runs.detail.importedTrace")}
            </strong>{" "}
            <HelpTip id="runs.imported" label={t("runs.detail.importedTrace")} />
            <div className="small">
              {t("runs.detail.importedAt", { date: formatDate(data.imported_at) })}
              {data.source_run_id ? (
                <>
                  {" · "}
                  <Trans i18nKey="runs.detail.sourceId" values={{ id: data.source_run_id }} components={{ code: <code /> }} />
                </>
              ) : null}
              {". "}
              {t("runs.detail.importedNote")}
            </div>
          </Callout>
        ) : null}
        <RunOrigin run={data} />
        {paused ? <RunApprovals run={data} /> : null}
        {data.sanitized ? (
          <Callout tone="info">
            <ShieldCheck size={13} aria-hidden /> {t("export.importedSanitized", { summary: sanitizeSummary(t, data.sanitized) })}
          </Callout>
        ) : null}
        {data.error ? (
          <Callout tone={data.status === "failed" ? "danger" : "warning"}>
            <ProblemText item={runProblem(data)} />
          </Callout>
        ) : null}
        <div className="two-column">
          <section className="panel stack" aria-label={t("runs.detail.input")}>
            <h2 className="panel__title">{t("runs.detail.input")}</h2>
            {data.values && Object.keys(data.values).length ? (
              <dl className="form-values">
                {Object.entries(data.values).map(([name, value]) => (
                  <div key={name}>
                    <dt>{data.workflow.nodes.find((item) => item.type === "start")?.start?.fields?.find((field) => field.name === name)?.label || name}</dt>
                    <dd>{Array.isArray(value) ? value.map((item) => fileNames.get(String(item)) ?? String(item)).join(", ") : typeof value === "boolean" ? t(value ? "common.yes" : "common.no") : String(value ?? "–")}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <pre className="code-block code-block--prose">{data.input || "–"}</pre>
          </section>
          <section className="panel stack" aria-label={t("runs.tabs.result")}>
            <h2 className="panel__title">{t("runs.tabs.result")}</h2>
            {data.output !== null && data.output !== undefined ? (
              <Output value={data.output} />
            ) : (
              <p className="muted small">{live ? t("runs.detail.stillRunning") : t("runs.detail.noResult")}</p>
            )}
          </section>
        </div>
        <RunInputs run={data} />
        <section className="panel stack" aria-label={t("runs.detail.trace")}>
          <h2 className="panel__title">
            {t("runs.detail.trace")} <HelpTip id="runs.trace" label={t("runs.detail.trace")} />
          </h2>
          <Trace run={data} selected={node?.id ?? null} onSelect={setSelected} />
        </section>
        {node && data.nodes[node.id] ? (
          <section className="panel" aria-label={t("runs.detail.nodeDetails", { name: node.label })}>
            <NodeRunDetails node={node} state={data.nodes[node.id]} runFiles={startFiles(data, node.id)} run={data} />
          </section>
        ) : null}
        <ResultFiles run={data} />
      </div>
      <TraceExportDialog open={exportOpen} onClose={() => setExportOpen(false)} run={data} />
      {resumable ? <ResumeDialog runId={data.id} open={resumeOpen} onClose={() => setResumeOpen(false)} /> : null}
    </div>
  );
}
