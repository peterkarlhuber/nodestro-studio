import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Columns2, FileDown, FileUp, Rows3, Trash2 } from "lucide-react";
import type { TFunction } from "i18next";
import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { api } from "../api/client";
import { RUNS_MAX, RUNS_PAGE, useRunList, useWorkflows } from "../api/hooks";
import type { RunStatus } from "../api/types";
import { toast } from "../components/toast";
import { ListProblemsChip } from "../runs/RunProblems";
import { Badge, Button, Callout, ConfirmIconButton, EmptyState, Hint, PageHeader, Select, Spinner, StatusBadge } from "../components/ui";
import { ErrorText, ProblemText, runProblem } from "../lib/errors";
import { formatCost, formatDate, formatDuration, formatNumber, formatTokens } from "../lib/format";

const STATUS_FILTER: ("" | RunStatus)[] = ["", "running", "paused", "succeeded", "failed", "cancelled"];

type Origin = "" | "own" | "imported";

const ORIGIN_FILTER: Origin[] = ["", "own", "imported"];

/** The filters as the address keeps them (?workflow=…&status=…&origin=…), so a filtered list can be linked to and
 * survives the way back from a run. Unknown values count as no filter. */
export function runFilters(params: URLSearchParams): { workflowId: string; status: "" | RunStatus; origin: Origin } {
  const status = params.get("status") ?? "";
  const origin = params.get("origin") ?? "";
  return {
    workflowId: params.get("workflow") ?? "",
    status: (STATUS_FILTER as string[]).includes(status) ? (status as RunStatus) : "",
    origin: (ORIGIN_FILTER as string[]).includes(origin) ? (origin as Origin) : "",
  };
}

/** Import trace files one by one; returns the id to open when exactly one file was given. */
async function importTraces(t: TFunction, files: File[]): Promise<string | null> {
  let opened: string | null = null;
  let added = 0;
  for (const file of files) {
    try {
      const result = await api.importTrace(file);
      opened = result.run.id;
      if (result.duplicate) toast.info(t("executions.duplicate", { name: file.name }));
      else added += 1;
    } catch (error) {
      toast.errorAbout(file.name, error);
    }
  }
  if (added) toast.success(t("executions.imported", { count: added }));
  return files.length === 1 ? opened : null;
}

export function ExecutionsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const { workflowId, status, origin } = runFilters(params);
  const setFilter = (name: "workflow" | "status" | "origin", value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(name, value);
        else next.delete(name);
        return next;
      },
      { replace: true },
    );
  const filtered = Boolean(workflowId || status || origin);
  // Older servers list only the newest ``limit`` runs (at most RUNS_MAX); "Load older runs" asks
  // for more. Servers that page (X-Has-More) load the next page instead, without an upper bound.
  const [limit, setLimit] = useState(RUNS_PAGE);
  const runs = useRunList(workflowId || undefined, limit);
  const list = useMemo(() => {
    const seen = new Set<string>();
    return (runs.data?.pages ?? []).flatMap((page) => page.runs).filter((run) => !seen.has(run.id) && Boolean(seen.add(run.id)));
  }, [runs.data]);
  const pages = runs.data?.pages ?? [];
  const paging = pages.length > 0 && pages[0].hasMore !== null;
  const loaded = list.length;
  const loadingOlder = paging ? runs.isFetchingNextPage : runs.isPlaceholderData;
  // A full answer (or "more" from the server) means older runs exist; while they load, the current rows stay listed.
  const capped = loaded > 0 && (loadingOlder || (paging ? runs.hasNextPage : loaded >= limit));
  const atMaximum = !paging && loaded >= RUNS_MAX;
  const loadOlder = () => (paging ? void runs.fetchNextPage() : setLimit(Math.min(limit + RUNS_PAGE, RUNS_MAX)));
  const workflows = useWorkflows();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  // Two runs picked for the comparison; picking a third replaces the older pick.
  const [picked, setPicked] = useState<string[]>([]);
  const togglePick = (id: string) =>
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(-2)));
  const remove = useMutation({
    mutationFn: api.deleteRun,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["runs"] }),
    onError: toast.error,
  });
  const importing = useMutation({
    mutationFn: (files: File[]) => importTraces(t, files),
    onSuccess: (opened) => {
      void queryClient.invalidateQueries({ queryKey: ["runs"] });
      if (opened) navigate(`/executions/${opened}`);
    },
  });
  const shown = useMemo(
    () =>
      list.filter(
        (run) =>
          (!status || run.status === status) &&
          (!origin || (origin === "imported") === Boolean(run.imported_at)),
      ),
    [list, status, origin],
  );

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (files.length) importing.mutate(files);
  };

  return (
    <div className="page">
      <PageHeader
        title={t("nav.executions")}
        doc="ausfuehrungen"
        description={t("executions.description")}
        actions={
          <>
            <Select
              aria-label={t("executions.filterWorkflow")}
              value={workflowId}
              onChange={(value) => {
                setFilter("workflow", value);
                setLimit(RUNS_PAGE);
              }}
              placeholder={t("executions.allWorkflows")}
              options={(workflows.data ?? []).map((workflow) => ({ value: workflow.id, label: workflow.name }))}
            />
            <Select
              aria-label={t("executions.filterStatus")}
              value={status}
              onChange={(value) => setFilter("status", value)}
              options={STATUS_FILTER.map((value) => ({ value, label: value ? t(`status.${value}.label`) : t("executions.allStatuses") }))}
            />
            <Select
              aria-label={t("executions.filterOrigin")}
              value={origin}
              onChange={(value) => setFilter("origin", value)}
              options={ORIGIN_FILTER.map((value) => ({ value, label: t(`executions.origin.${value || "all"}`) }))}
            />
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              multiple
              hidden
              data-testid="trace-file"
              onChange={onFiles}
            />
            <Hint id="runs.compare">
              <Button
                icon={Columns2}
                disabled={picked.length !== 2}
                onClick={() => navigate(`/executions/compare?a=${picked[0]}&b=${picked[1]}`)}
              >
                {t("compare.button", { count: picked.length })}
              </Button>
            </Hint>
            <Hint id="runs.importTrace">
              <Button icon={FileUp} busy={importing.isPending} onClick={() => fileInput.current?.click()}>
                {t("executions.import")}
              </Button>
            </Hint>
          </>
        }
      />
      <div className="page__body">
        {runs.isLoading ? <Spinner /> : null}
        {runs.error ? <Callout tone="danger">
            <ErrorText error={runs.error} />
          </Callout> : null}
        {runs.data && !shown.length && filtered ? (
          <EmptyState
            icon={Rows3}
            title={t("executions.noMatch")}
            action={
              <Button onClick={() => setParams({}, { replace: true })} data-testid="runs-clear-filters">
                {t("executions.clearFilters")}
              </Button>
            }
          />
        ) : null}
        {runs.data && !shown.length && !filtered ? (
          <EmptyState
            icon={Rows3}
            title={t("executions.empty")}
            action={
              <Button icon={FileDown} onClick={() => fileInput.current?.click()}>
                {t("executions.import")}
              </Button>
            }
          >
            {t("executions.emptyText")}
          </EmptyState>
        ) : null}
        {shown.length ? (
          <div className="table-wrap">
            <table className="table table--runs">
              <thead>
                <tr>
                  <th>
                    <span className="sr-only">{t("compare.pickColumn")}</span>
                  </th>
                  <th>{t("executions.columns.workflow")}</th>
                  <th>{t("executions.columns.status")}</th>
                  <th>{t("executions.columns.started")}</th>
                  <th>{t("executions.columns.duration")}</th>
                  <th className="num">{t("executions.columns.requests")}</th>
                  <th className="num">{t("executions.columns.tokens")}</th>
                  <th className="num">{t("executions.columns.cost")}</th>
                  <th>
                    <span className="sr-only">{t("executions.columns.actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((run) => (
                  <tr key={run.id} className={picked.includes(run.id) ? "table__row--picked" : undefined}>
                    <td className="table__pick">
                      <input
                        type="checkbox"
                        checked={picked.includes(run.id)}
                        disabled={run.status === "running" || run.status === "queued"}
                        aria-label={t("compare.pick", { name: run.workflow_name, date: formatDate(run.created_at) })}
                        onChange={() => togglePick(run.id)}
                      />
                    </td>
                    <td>
                      <div className="row-gap">
                        <Link to={`/executions/${run.id}`} className="table__primary">
                          {run.workflow_name}
                        </Link>
                        {run.imported_at ? (
                          <Hint id="runs.imported">
                            <span>
                              <Badge icon={FileDown}>{t("executions.importedBadge")}</Badge>
                            </span>
                          </Hint>
                        ) : null}
                        {run.trigger && run.trigger !== "manual" ? <Badge>{t(`flow.trigger.${run.trigger}`)}</Badge> : null}
                      </div>
                      <div className="muted small truncate">
                        {run.error ? <ProblemText item={runProblem(run)} compact /> : run.input}
                      </div>
                    </td>
                    <td>
                      {/* BUDGET-1: a run paused for a budget decision says so in the list too. */}
                      <StatusBadge status={run.budget?.pending_request_id && run.status !== "succeeded" && run.status !== "failed" && run.status !== "cancelled" ? "awaiting_budget" : run.status} />
                      <ListProblemsChip run={run} />
                    </td>
                    {/* data-label names the value where phones show a run as two lines without the header. */}
                    <td data-label={t("executions.columns.started")}>{formatDate(run.created_at)}</td>
                    <td data-label={t("executions.columns.duration")}>
                      {run.finished_at ? formatDuration(run.created_at, run.finished_at) : "–"}
                    </td>
                    <td className="num" data-label={t("executions.columns.requests")}>
                      {formatNumber(run.usage.requests)}
                    </td>
                    <td className="num" data-label={t("executions.columns.tokens")}>
                      {formatTokens(run.usage.total_tokens)}
                    </td>
                    <td className="num" data-label={t("executions.columns.cost")}>
                      {formatCost(run.usage.estimated_cost_usd)}
                    </td>
                    <td>
                      {run.status !== "running" && run.status !== "queued" ? (
                        <ConfirmIconButton icon={Trash2} label={t("executions.delete")} onConfirm={() => remove.mutate(run.id)} />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {capped ? (
          <div className="list-limit" data-testid="runs-limit">
            <p className="muted small" role="status">
              {t("executions.limited", { count: loaded })}
              {status || origin ? <> {t("executions.limitedFilters")}</> : null}
              {atMaximum ? <> {t("executions.limitReached")}</> : null}
            </p>
            {!atMaximum || loadingOlder ? (
              <Button busy={loadingOlder} onClick={loadOlder}>
                {t("executions.loadOlder")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
