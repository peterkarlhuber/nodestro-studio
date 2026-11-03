// A run that waits for a budget decision (BUDGET-1): what the run has spent against which limit, which model request
// waits and what it can cost at most, and the two ways on: raise exactly that limit (to a new total, checked here and
// by the server) and continue, or end the run. Nothing is decided automatically, a chat message never decides it, and
// the decision applies to this run only; the workflow and the settings stay as they are.
//
// Everything shown comes from the API (GET /runs/{id}/budget), so the decision is found again after leaving the page.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleDollarSign, History, PlayCircle, Square } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useAccess } from "../api/access";
import { ApiError, api } from "../api/client";
import { isRunBudget, keys, useRunBudget } from "../api/hooks";
import type { BudgetDecisionIn, BudgetRaise, BudgetRequest, Run, RunBudgetOut } from "../api/types";
import { toast } from "../components/toast";
import { Badge, Button, Callout, Field, HelpTip, StatusBadge, TextInput } from "../components/ui";
import { useEditor } from "../editor/store";
import type { HelpId } from "../lib/help";
import { ErrorText, problemText } from "../lib/errors";
import { formatDate } from "../lib/format";
import { compareMoney, formatMoney, moneyDifference, normalizeMoneyInput, parseMoney } from "../lib/money";
import { newClientId } from "./runChatModel";
import { CONFIRM_MS } from "./CancelRunButton";

/** When pages that show a decided run read it again (it continues a moment after the decision). */
const FOLLOW_UP_MS = [700, 2000];

/** The id the API knows the person by: the signed-in user, or "local" on the desktop; null while unknown. */
export function useMyPrincipal(): string | null {
  const access = useAccess();
  if (access.me) return access.me.user_id;
  return access.profile === "desktop" || access.profile === "local-container" ? "local" : null;
}

export type LimitProblem = "empty" | "invalid" | "notHigher" | "overPolicy";

/**
 * The new total limit as the API takes it ("2.50"), or why it cannot be sent. A decimal above the current limit and
 * not above the policy's maximum; the server checks again and has the last word.
 */
export function checkNewLimit(
  input: string,
  current: string | null,
  max: string | null,
): { value: string | null; problem: LimitProblem | null } {
  if (!input.trim()) return { value: null, problem: "empty" };
  const value = normalizeMoneyInput(input);
  if (value === null || parseMoney(value) === 0n) return { value: null, problem: "invalid" };
  if (current !== null && compareMoney(value, current) !== 1) return { value, problem: "notHigher" };
  if (max !== null && compareMoney(value, max) === 1) return { value, problem: "overPolicy" };
  return { value, problem: null };
}

/** The suggested limit as the input's first value: only when it is above the current limit. */
export function initialLimitInput(request: Pick<BudgetRequest, "suggested_limit_usd" | "limit_usd">): string {
  const suggested = request.suggested_limit_usd;
  return suggested && compareMoney(suggested, request.limit_usd) === 1 ? suggested : "";
}

/** One fact of the card with its help: a term and its value. */
function Fact({ label, help, testId, children }: { label: string; help: HelpId; testId: string; children: ReactNode }) {
  return (
    <div>
      <dt>
        {label} <HelpTip id={help} label={label} />
      </dt>
      <dd data-testid={testId}>{children}</dd>
    </div>
  );
}

/** Earlier raises of the run: previous → new limit, who, when. */
export function BudgetRaiseHistory({ raises }: { raises: BudgetRaise[] }) {
  const { t } = useTranslation();
  if (!raises.length) return null;
  const label = t("budget.history.title");
  return (
    <div className="budget-history" data-testid="budget-history">
      <span className="nd-field-label">
        <History size={13} aria-hidden /> {label} <HelpTip id="budget.history" label={label} />
      </span>
      <ol className="budget-history__list small">
        {raises.map((raise) => (
          <li key={raise.request_id}>
            {t("budget.history.item", {
              previous: formatMoney(raise.previous_limit_usd),
              next: formatMoney(raise.new_limit_usd),
              who: raise.decided_by || t("budget.history.unknownPerson"),
              when: formatDate(raise.decided_at),
            })}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The limit that blocks, by name: the run's own, or a sub-workflow's or team's own limit. */
function blockText(t: (key: string, options?: Record<string, unknown>) => string, request: BudgetRequest): string {
  const scope = request.block?.scope ?? "run";
  if (scope === "run") return t("budget.card.block.run");
  return t(`budget.card.block.${scope}`, { label: request.block.label || request.block.node_id || request.block.run_id });
}

/** The "decided elsewhere" message: who decided, and how. */
function decidedText(
  t: (key: string, options?: Record<string, unknown>) => string,
  status: string | undefined,
  who: string | null | undefined,
): string {
  const outcome = t(`budget.status.${status ?? "decided"}`, { defaultValue: t("budget.status.decided") });
  return who ? t("budget.card.decidedBy", { who, outcome }) : t("budget.card.decidedElsewhere", { outcome });
}

export function BudgetDecisionForm({
  budget,
  request,
  showContext = false,
}: {
  budget: RunBudgetOut;
  request: BudgetRequest;
  showContext?: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const runId = budget.run_id;
  const [input, setInput] = useState(() => initialLimitInput(request));
  const [touched, setTouched] = useState(false);
  const [armed, setArmed] = useState(false);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const endRef = useRef<HTMLButtonElement | null>(null);
  // One key per open card: the same decision sent twice (a retry, a double click that got through) is stored once.
  const cardKey = useRef(newClientId());
  const [conflict, setConflict] = useState<ApiError | null>(null);
  const deadlinePassed = request.deadline ? new Date(request.deadline).getTime() <= Date.now() : false;
  const max = budget.policy?.max_limit_usd ?? null;
  const check = checkNewLimit(input, request.limit_usd, max);
  const difference = check.value && !check.problem ? moneyDifference(check.value, request.limit_usd) : null;
  const scope = request.block?.scope ?? "run";

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: keys.runBudget(runId) });
    void queryClient.invalidateQueries({ queryKey: keys.budgetRequests });
    void queryClient.invalidateQueries({ queryKey: keys.run(runId) });
    void queryClient.invalidateQueries({ queryKey: ["runs"] });
  };
  const decide = useMutation({
    mutationFn: (body: BudgetDecisionIn) => api.decideRunBudget(runId, body),
    onSuccess: (answer, body) => {
      toast.success(body.action === "raise" ? t("budget.card.raisedToast", { limit: formatMoney(body.limit_usd) }) : t("budget.card.endedToast"));
      if (isRunBudget(answer)) queryClient.setQueryData(keys.runBudget(runId), answer);
      // The editor reads its run again until it continues (also when the decision belongs to one of its child runs).
      const editor = useEditor.getState();
      if (editor.run && (editor.run.id === runId || editor.run.id === request.run_id)) editor.nudgeRun();
      refresh();
      for (const delay of FOLLOW_UP_MS) window.setTimeout(refresh, delay);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "budget.not_pending") {
        setConflict(error);
        refresh();
      }
    },
  });
  const busy = decide.isPending;
  const canDecide = budget.policy?.can_decide !== false && !deadlinePassed && !conflict;

  useEffect(() => {
    if (!armed) return;
    confirmRef.current?.focus();
    const timer = window.setTimeout(() => setArmed(false), CONFIRM_MS);
    return () => window.clearTimeout(timer);
  }, [armed]);

  const raise = () => {
    setTouched(true);
    if (busy || !canDecide || check.problem || !check.value) return;
    decide.mutate({
      request_id: request.id,
      action: "raise",
      limit_usd: check.value,
      idempotency_key: `${cardKey.current}:raise:${check.value}`,
    });
  };
  const end = () => {
    setArmed(false);
    if (busy || !canDecide) return;
    decide.mutate({ request_id: request.id, action: "end", idempotency_key: `${cardKey.current}:end` });
  };

  const inputId = `budget-limit-${request.id}`;
  const errorId = `${inputId}-error`;
  const showProblem = touched ? check.problem : null;
  const workflow = request.workflow_name || budget.run_id;
  const unbounded = (request.requests ?? []).some((item) => !item.bounded || item.max_cost_usd === null);

  return (
    <article
      className="approval-card budget-card"
      aria-label={t("budget.card.label", { name: showContext ? `${workflow} · ${formatDate(request.created_at)}` : workflow })}
      data-testid="budget-decision"
      data-request={request.id}
    >
      <header className="approval-card__head">
        <CircleDollarSign size={15} aria-hidden />
        <div>
          <strong>{t("budget.card.title")}</strong>
          <div className="muted small">
            {showContext ? (
              <>
                <Link to={`/executions/${request.run_id}`} data-testid="budget-run-link">
                  {workflow}
                </Link>
                {" · "}
              </>
            ) : (
              <>{workflow} · </>
            )}
            {t("approvals.waitingSince", { time: formatDate(request.created_at) })}
          </div>
        </div>
        <HelpTip id="budget.decision" label={t("budget.card.title")} />
      </header>
      <div className="row-gap">
        <StatusBadge status="awaiting_budget" />
        {request.reason === "request_too_large" ? (
          <Badge tone="warning">{t("budget.card.reason.request_too_largeBadge")}</Badge>
        ) : null}
      </div>
      <p className="small" data-testid="budget-reason">
        {t(`budget.card.reason.${request.reason}`, {
          next: formatMoney((request.requests?.find((item) => item.refused) ?? request.requests?.[0])?.max_cost_usd ?? null),
          left: formatMoney(clampZero(moneyDifference(request.limit_usd, request.spent_usd))),
        })}{" "}
        <HelpTip id="budget.reason" label={t("budget.card.reasonLabel")} />
      </p>
      <p className="small" data-testid="budget-block">
        <strong>{blockText(t, request)}</strong> {t("budget.card.block.appliesExactly")} <HelpTip id="budget.block" label={t("budget.card.blockLabel")} />
      </p>
      <dl className="form-values budget-facts">
        {scope === "run" && budget.initial_limit_usd !== null ? (
          <Fact label={t("budget.card.initialLimit")} help="budget.initialLimit" testId="budget-initial">
            {formatMoney(budget.initial_limit_usd)}
          </Fact>
        ) : null}
        <Fact label={t("budget.card.currentLimit")} help="budget.currentLimit" testId="budget-current">
          {formatMoney(request.limit_usd)}
        </Fact>
        <Fact label={t("budget.card.knownCost")} help="budget.knownCost" testId="budget-spent">
          {formatMoney(request.spent_usd)}
          {request.unknown_cost ? (
            <>
              {" "}
              <Badge tone="warning">{t("budget.card.plusUnknown")}</Badge>
            </>
          ) : null}
        </Fact>
        <Fact label={t("budget.card.remaining")} help="budget.remaining" testId="budget-remaining">
          {formatMoney(
            scope === "run" && budget.remaining_usd !== null ? budget.remaining_usd : clampZero(moneyDifference(request.limit_usd, request.spent_usd)),
          )}
          {request.unknown_cost ? <span className="muted small"> · {t("budget.card.remainingUnknown")}</span> : null}
        </Fact>
        {parseMoney(request.reserved_usd) ? (
          <Fact label={t("budget.card.reserved")} help="budget.reserved" testId="budget-reserved">
            {formatMoney(request.reserved_usd)}
          </Fact>
        ) : null}
        {request.deadline ? (
          <Fact label={t("budget.card.deadline")} help="budget.deadline" testId="budget-deadline">
            <span className={deadlinePassed ? "text-danger" : undefined}>
              {deadlinePassed ? t("budget.card.deadlinePassed") : t("budget.card.deadlineAt", { time: formatDate(request.deadline) })}
            </span>
          </Fact>
        ) : null}
      </dl>
      <div className="stack-sm">
        <span className="nd-field-label">
          {t("budget.card.blocked", { count: request.requests?.length ?? 0 })}{" "}
          <HelpTip id="budget.blockedRequest" label={t("budget.card.blockedLabel")} />
        </span>
        <ul className="budget-requests small" data-testid="budget-blocked">
          {(request.requests ?? []).map((item, index) => (
            <li key={`${item.run_id}:${item.node_id ?? ""}:${index}`}>
              <code>{item.model}</code>
              {item.label || item.agent || item.node_id ? <span className="muted"> · {item.label || item.agent || item.node_id}</span> : null}
              {" · "}
              {item.bounded && item.max_cost_usd !== null
                ? t("budget.card.canCostUpTo", { cost: formatMoney(item.max_cost_usd) })
                : t("budget.card.unbounded")}
            </li>
          ))}
        </ul>
        {unbounded ? <p className="muted small">{t("budget.card.unboundedHint")}</p> : null}
      </div>
      <p className="small" data-testid="budget-suggested">
        <strong>{t("budget.card.suggestedLabel")}</strong>{" "}
        {request.suggested_limit_usd
          ? t("budget.card.suggested", { limit: formatMoney(request.suggested_limit_usd) })
          : t("budget.card.noSuggestion")}{" "}
        <HelpTip id="budget.suggested" label={t("budget.card.suggestedLabel")} />
      </p>
      {conflict ? (
        <div role="status" data-testid="budget-conflict">
          <Callout tone="warning">
            {decidedText(t, conflict.params.request_status as string | undefined, conflict.params.decided_by as string | undefined)}
          </Callout>
        </div>
      ) : null}
      {budget.policy?.can_decide === false ? (
        <div data-testid="budget-cannot-decide">
          <Callout tone="info">
            {t("budget.card.cannotDecide")}
            {budget.policy.reason ? ` ${problemText(t, { code: budget.policy.reason })}` : ""}
          </Callout>
        </div>
      ) : null}
      {canDecide ? (
        <>
          <Field
            label={t("budget.card.newLimit")}
            htmlFor={inputId}
            tip="budget.newLimit"
            hint={max ? t("budget.card.newLimitHintMax", { max: formatMoney(max) }) : t("budget.card.newLimitHint")}
          >
            <TextInput
              id={inputId}
              inputMode="decimal"
              autoComplete="off"
              value={input}
              disabled={busy}
              aria-invalid={showProblem ? true : undefined}
              aria-describedby={showProblem ? errorId : undefined}
              onChange={(event) => {
                setInput(event.target.value);
                setTouched(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  raise();
                }
              }}
              data-testid="budget-limit-input"
            />
          </Field>
          {showProblem ? (
            <p className="small text-danger" id={errorId} role="alert" data-testid="budget-limit-error">
              {t(`budget.card.validation.${showProblem}`, { current: formatMoney(request.limit_usd), max: formatMoney(max) })}
            </p>
          ) : null}
          <p className="small" aria-live="polite" data-testid="budget-difference">
            {difference ? (
              <>
                {t("budget.card.difference", { amount: formatMoney(difference) })}{" "}
                <HelpTip id="budget.difference" label={t("budget.card.differenceLabel")} />
              </>
            ) : null}
          </p>
        </>
      ) : null}
      <p className="muted small" data-testid="budget-scope-note">
        {t("budget.card.thisRunOnly")} {t("budget.card.chatNever")}
      </p>
      {decide.error && !conflict ? (
        <Callout tone="danger">
          <ErrorText error={decide.error} />
        </Callout>
      ) : null}
      {canDecide ? (
        <div className="row-gap approval-card__actions">
          <Button
            variant="primary"
            icon={PlayCircle}
            busy={busy && decide.variables?.action === "raise"}
            disabled={busy}
            aria-disabled={busy || undefined}
            onClick={raise}
            data-testid="budget-raise"
          >
            {t("budget.card.raise")}
          </Button>
          {armed ? (
            <Button
              ref={confirmRef}
              variant="danger"
              icon={Square}
              disabled={busy}
              onClick={end}
              onBlur={() => setArmed(false)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.stopPropagation();
                  setArmed(false);
                  endRef.current?.focus();
                }
              }}
              data-testid="budget-end-confirm"
            >
              {t("budget.card.endConfirm")}
            </Button>
          ) : (
            <Button
              ref={endRef}
              variant="danger"
              icon={Square}
              busy={busy && decide.variables?.action === "end"}
              disabled={busy}
              onClick={() => setArmed(true)}
              data-testid="budget-end"
            >
              {t("budget.card.end")}
            </Button>
          )}
          <HelpTip id="budget.end" label={t("budget.card.end")} />
        </div>
      ) : null}
      <BudgetRaiseHistory raises={budget.raises ?? []} />
    </article>
  );
}

function clampZero(value: string | null): string | null {
  if (value === null) return null;
  return value.startsWith("-") ? "0.00" : value;
}

/**
 * The budget decision of a run, where the run is watched (editor run panel, run details): the open decision, or —
 * once the decision this card showed was made elsewhere — who made it. Read from the API whenever the run says a
 * decision waits, and again when the run's status or its pending decision changes.
 */
export function RunBudgetDecision({ run }: { run: Pick<Run, "id" | "status" | "budget" | "parent_run_id"> }) {
  const { t } = useTranslation();
  const me = useMyPrincipal();
  const pendingId = run.budget?.pending_request_id ?? null;
  const [shown, setShown] = useState<string | null>(null);
  const wanted = Boolean(pendingId) || shown !== null;
  const budget = useRunBudget(run.id, wanted);
  const queryClient = useQueryClient();
  // A change of the run's status or of its pending decision reads the budget again at once.
  useEffect(() => {
    if (wanted) void queryClient.invalidateQueries({ queryKey: keys.runBudget(run.id) });
  }, [run.status, pendingId, run.id, wanted, queryClient]);
  const data = isRunBudget(budget.data) ? budget.data : null;
  const pending = data?.pending ?? null;
  useEffect(() => {
    if (pending) setShown(pending.id);
  }, [pending]);
  if (budget.error && pendingId) {
    return (
      <Callout tone="danger">
        <ErrorText error={budget.error} />
      </Callout>
    );
  }
  if (data && pending) return <BudgetDecisionForm key={pending.id} budget={data} request={pending} />;
  if (data && shown) {
    const decided = data.history?.find((item) => item.id === shown);
    if (!decided || decided.status === "pending") return null;
    const mine = Boolean(me && decided.decided_by === me);
    return (
      <div role="status" data-testid={mine ? "budget-decided" : "budget-decided-elsewhere"}>
        <Callout tone={mine ? "brand" : "info"}>
          {mine
            ? t(`budget.card.youDecided.${decided.status}`, { defaultValue: t("budget.status.decided"), limit: formatMoney(decided.new_limit_usd) })
            : decidedText(t, decided.status, decided.decided_by)}
          {decided.new_limit_usd && decided.status === "raised" && !mine ? ` ${t("budget.card.newLimitIs", { limit: formatMoney(decided.new_limit_usd) })}` : ""}
        </Callout>
      </div>
    );
  }
  return null;
}

/** A pending decision on the Approvals page: its run's budget is read for the whole card. */
export function BudgetRequestCard({ request }: { request: BudgetRequest }) {
  const budget = useRunBudget(request.run_id);
  const data = isRunBudget(budget.data) ? budget.data : null;
  if (budget.error) {
    return (
      <article className="approval-card" data-testid="budget-decision-error">
        <Link to={`/executions/${request.run_id}`}>{request.workflow_name || request.run_id}</Link>
        <Callout tone="danger">
          <ErrorText error={budget.error} />
        </Callout>
      </article>
    );
  }
  if (!data?.pending) return null;
  return <BudgetDecisionForm key={data.pending.id} budget={data} request={data.pending} showContext />;
}
