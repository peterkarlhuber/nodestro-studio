// Two stored runs side by side: totals, final result, and every agent with what differs.
// Only stored data is shown; nothing is executed again.

import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Columns2 } from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";

import { api } from "../api/client";
import { useMeta } from "../api/hooks";
import type { Run } from "../api/types";
import { TextDiff } from "../components/TextDiff";
import { Badge, Callout, EmptyState, PageHeader, Spinner, StatusBadge } from "../components/ui";
import { compareRuns, type AgentPair, type AgentSide, type RunTotals } from "../lib/compare";
import { ErrorText, ProblemText, runProblem } from "../lib/errors";
import { formatCost, formatDate, formatNumber, formatTokens } from "../lib/format";
import { findModel } from "../lib/providers";

function seconds(ms: number | null): string {
  return ms === null ? "–" : `${formatNumber(ms / 1000, { maximumFractionDigits: 1 })} s`;
}

/** The difference b − a with sign, or "" when equal or unknown. */
function delta(a: number | null, b: number | null, format: (value: number) => string): string {
  if (a === null || b === null || a === b) return "";
  return `${b > a ? "+" : "−"}${format(Math.abs(b - a))}`;
}

function Row({ label, a, b, differs, change }: { label: string; a: ReactNode; b: ReactNode; differs: boolean; change?: string }) {
  return (
    <tr className={differs ? "compare__row--differs" : undefined} data-differs={differs || undefined}>
      <th scope="row">{label}</th>
      <td>{a}</td>
      <td>
        {b} {change ? <span className="compare__delta">{change}</span> : null}
      </td>
    </tr>
  );
}

function Totals({ a, b }: { a: RunTotals; b: RunTotals }) {
  const { t } = useTranslation();
  return (
    <tbody>
      <Row label={t("compare.status")} a={<StatusBadge status={a.status} />} b={<StatusBadge status={b.status} />} differs={a.status !== b.status} />
      <Row
        label={t("compare.duration")}
        a={seconds(a.durationMs)}
        b={seconds(b.durationMs)}
        differs={a.durationMs !== b.durationMs}
        change={delta(a.durationMs, b.durationMs, (value) => seconds(value))}
      />
      <Row
        label={t("compare.requests")}
        a={formatNumber(a.requests)}
        b={formatNumber(b.requests)}
        differs={a.requests !== b.requests}
        change={delta(a.requests, b.requests, formatNumber)}
      />
      <Row
        label={t("compare.inputTokens")}
        a={formatTokens(a.inputTokens)}
        b={formatTokens(b.inputTokens)}
        differs={a.inputTokens !== b.inputTokens}
        change={delta(a.inputTokens, b.inputTokens, formatTokens)}
      />
      <Row
        label={t("compare.outputTokens")}
        a={formatTokens(a.outputTokens)}
        b={formatTokens(b.outputTokens)}
        differs={a.outputTokens !== b.outputTokens}
        change={delta(a.outputTokens, b.outputTokens, formatTokens)}
      />
      <Row
        label={t("compare.cost")}
        a={formatCost(a.cost)}
        b={formatCost(b.cost)}
        differs={a.cost !== b.cost}
        change={delta(a.cost, b.cost, formatCost)}
      />
      <Row
        label={t("compare.toolCalls")}
        a={formatNumber(a.toolCalls)}
        b={formatNumber(b.toolCalls)}
        differs={a.toolCalls !== b.toolCalls}
        change={delta(a.toolCalls, b.toolCalls, formatNumber)}
      />
      <Row label={t("compare.failedAgents")} a={formatNumber(a.failedAgents)} b={formatNumber(b.failedAgents)} differs={a.failedAgents !== b.failedAgents} />
    </tbody>
  );
}

function SideSummary({ side, modelLabel }: { side: AgentSide | null; modelLabel: (id: string) => string }) {
  const { t } = useTranslation();
  if (!side) return <span className="muted">{t("compare.notInRun")}</span>;
  const state = side.state;
  return (
    <div className="stack-sm small">
      <div className="row-gap">
        {state ? <StatusBadge status={state.status} /> : <Badge>{t("compare.notRun")}</Badge>}
        <span>{modelLabel(side.model)}</span>
      </div>
      <span className="muted">
        {seconds(side.durationMs)} · {formatTokens(state?.usage.total_tokens ?? 0)} {t("compare.tokensUnit")} ·{" "}
        {formatCost(state?.usage.estimated_cost_usd ?? 0)}
      </span>
      <span>
        {t("compare.tools")}: {side.tools.length ? side.tools.join(", ") : t("common.none")}
      </span>
      {state?.evaluation ? (
        <span>
          {t("compare.evaluation")}:{" "}
          {state.evaluation.passed
            ? t("compare.evaluationPassed", { count: state.evaluation.attempts })
            : t("compare.evaluationFailed", { count: state.evaluation.attempts })}
        </span>
      ) : null}
      {state?.error ? (
        <span className="text-danger">
          <ProblemText item={{ code: state.error_code, params: state.error_params, message: state.error }} compact />
        </span>
      ) : null}
    </div>
  );
}

function AgentRow({ pair, modelLabel }: { pair: AgentPair; modelLabel: (id: string) => string }) {
  const { t } = useTranslation();
  const differs = pair.differs.size > 0;
  return (
    <details className={`section compare-agent ${differs ? "compare-agent--differs" : ""}`} open={differs && pair.differs.has("output")}>
      <summary>
        <span className="section__title">{pair.label}</span>
        <span className="section__summary">
          {differs ? (
            [...pair.differs].map((aspect) => (
              <Badge key={aspect} tone="warning">
                {t(`compare.aspect.${aspect}`)}
              </Badge>
            ))
          ) : (
            <Badge tone="success">{t("compare.same")}</Badge>
          )}
        </span>
      </summary>
      <div className="section__body stack-sm">
        <div className="compare__columns">
          <SideSummary side={pair.a} modelLabel={modelLabel} />
          <SideSummary side={pair.b} modelLabel={modelLabel} />
        </div>
        {pair.a && pair.b ? (
          <>
            <span className="nd-field-label">{t("compare.agentOutput")}</span>
            <TextDiff a={pair.a.output} b={pair.b.output} />
            {pair.a.state?.evaluation?.feedback || pair.b.state?.evaluation?.feedback ? (
              <>
                <span className="nd-field-label">{t("compare.evaluationFeedback")}</span>
                <TextDiff a={pair.a.state?.evaluation?.feedback ?? ""} b={pair.b.state?.evaluation?.feedback ?? ""} />
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </details>
  );
}

function RunHead({ run, letter }: { run: Run; letter: string }) {
  const { t } = useTranslation();
  return (
    <div className="compare__head">
      <Badge tone="running">{letter}</Badge>{" "}
      <Link to={`/executions/${run.id}`} className="table__primary">
        {run.workflow_name}
      </Link>
      <div className="muted small">
        {formatDate(run.created_at)}
        {run.imported_at ? ` · ${t("executions.importedBadge")}` : ""}
      </div>
      {run.error ? (
        <div className="small text-danger">
          <ProblemText item={runProblem(run)} compact />
        </div>
      ) : null}
    </div>
  );
}

export function RunComparePage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const meta = useMeta();
  const idA = params.get("a") ?? "";
  const idB = params.get("b") ?? "";
  const runA = useQuery({ queryKey: ["run", idA], queryFn: () => api.run(idA), enabled: Boolean(idA) });
  const runB = useQuery({ queryKey: ["run", idB], queryFn: () => api.run(idB), enabled: Boolean(idB) });
  const comparison = useMemo(() => (runA.data && runB.data ? compareRuns(runA.data, runB.data) : null), [runA.data, runB.data]);
  const modelLabel = (id: string) => findModel(meta.data?.models, id)?.label ?? id;
  const error = runA.error ?? runB.error;
  const differing = comparison?.agents.filter((pair) => pair.differs.size).length ?? 0;

  return (
    <div className="page">
      <PageHeader
        title={t("compare.title")}
        doc="ausfuehrungen#vergleich"
        description={t("compare.description")}
        crumbs={<Link to="/executions">{t("nav.executions")}</Link>}
        actions={
          idA && idB ? (
            <button type="button" className="nd-button nd-button--ghost nd-button--md" onClick={() => setParams({ a: idB, b: idA })}>
              <ArrowLeftRight size={14} aria-hidden /> {t("compare.swap")}
            </button>
          ) : null
        }
      />
      <div className="page__body stack">
        {!idA || !idB ? (
          <EmptyState icon={Columns2} title={t("compare.pickTwo")}>
            <Link to="/executions">{t("compare.toList")}</Link>
          </EmptyState>
        ) : null}
        {runA.isLoading || runB.isLoading ? <Spinner /> : null}
        {error ? (
          <Callout tone="danger">
            <ErrorText error={error} />
          </Callout>
        ) : null}
        {comparison && runA.data && runB.data ? (
          <>
            <p className="muted small">{t("compare.noRerun")}</p>
            {!comparison.sameWorkflow ? <Callout tone="warning">{t("compare.differentWorkflows")}</Callout> : null}
            {comparison.sameWorkflow && comparison.configChanged ? <Callout tone="info">{t("compare.configChanged")}</Callout> : null}
            <div className="table-wrap">
              <table className="table compare" data-testid="compare-table">
                <thead>
                  <tr>
                    <th />
                    <th>
                      <RunHead run={runA.data} letter="A" />
                    </th>
                    <th>
                      <RunHead run={runB.data} letter="B" />
                    </th>
                  </tr>
                </thead>
                <Totals a={comparison.a} b={comparison.b} />
              </table>
            </div>
            <section className="stack-sm">
              <h2 className="section-title">{t("compare.result")}</h2>
              <TextDiff a={comparison.outputA} b={comparison.outputB} />
            </section>
            <section className="stack-sm">
              <h2 className="section-title">
                {t("compare.agents")}{" "}
                <span className="muted small">{t("compare.agentsDiffer", { count: differing, total: comparison.agents.length })}</span>
              </h2>
              {comparison.agents.map((pair) => (
                <AgentRow key={pair.key} pair={pair} modelLabel={modelLabel} />
              ))}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
