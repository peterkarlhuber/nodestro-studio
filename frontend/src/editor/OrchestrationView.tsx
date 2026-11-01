// The decisions of an orchestrator in a run, round by round (ED-26): what it decided and why, the team runs each
// decision started (status, duration, cost, a link to each), how the team changed, who waits for a person, the
// limits it used and what it cost. Only the structured record is shown (no model reasoning).

import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Network, Save } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { keys, useWorkflows } from "../api/hooks";
import type {
  NodeRun,
  OrchestrationOutcome,
  OrchestrationOutcomeStatus,
  OrchestrationRecord,
  OrchestrationStep,
  OrchestratorConfig,
  Run,
  RunStatus,
  Workflow,
  WorkflowIn,
  WorkflowNode,
} from "../api/types";
import { Output } from "../components/Markdown";
import { toast } from "../components/toast";
import { Badge, Button, Callout, HelpTip, Stat, StatusBadge } from "../components/ui";
import { ErrorText, problemText } from "../lib/errors";
import { formatCost, formatDuration, type Tone } from "../lib/format";
import { useModelName } from "../components/ModelPicker";
import {
  accepted,
  assignmentsOf,
  limitUse,
  nestedRunCount,
  roundsOf,
  STATE_KEY,
  teamRunCounts,
  teamRunsOf,
  type TeamRun,
} from "./orchestrationModel";

export { assignmentsOf, childRuns } from "./orchestrationModel";

const DELEGATING = new Set(["delegate", "parallel"]);

export interface TeamChange {
  index: number;
  added: string[];
  removed: string[];
  team: string[];
  reason: string;
}

/** How the orchestrator's own team changed (``staffing``): one entry per accepted ``staff`` decision. */
export function teamChanges(record: OrchestrationRecord): TeamChange[] {
  const changes: TeamChange[] = [];
  let team: string[] = [];
  for (const step of record.steps) {
    const decision = step.decision;
    if (decision?.action !== "staff" || step.verdict.code !== null) continue;
    const removed = decision.remove ?? [];
    const added = decision.add ?? [];
    team = team.filter((id) => !removed.includes(id));
    for (const id of added) if (!team.includes(id)) team.push(id);
    changes.push({ index: step.index, added, removed, team: [...team], reason: decision.reason ?? "" });
  }
  return changes;
}

/** The teams that did work in accepted delegations, first use first (for "save as template"). */
export function teamsThatWorked(record: OrchestrationRecord): string[] {
  const found: string[] = [];
  for (const step of record.steps) {
    if (!DELEGATING.has(step.decision?.action ?? "") || step.verdict.code !== null) continue;
    for (const item of assignmentsOf(step.decision)) if (item.member && !found.includes(item.member)) found.push(item.member);
  }
  return found;
}

const OUTCOME_TONE: Record<OrchestrationOutcomeStatus, Tone> = {
  succeeded: "success",
  waiting: "running",
  failed: "danger",
  rejected: "danger",
  expired: "warning",
  cancelled: "idle",
};

function OutcomeBadge({ outcome }: { outcome: OrchestrationOutcome }) {
  const { t } = useTranslation();
  return (
    <Badge tone={OUTCOME_TONE[outcome.status] ?? "idle"}>
      <span data-testid="orchestration-outcome" data-status={outcome.status}>
        {t(`flow.orchestrator.run.outcome.${outcome.status}`)}
      </span>
    </Badge>
  );
}

/** A team's run, kept current while it has not ended (the parent's record only knows it once it ends). */
function useTeamRun(ref: string | null, enabled: boolean) {
  return useQuery({
    queryKey: keys.run(ref ?? ""),
    queryFn: () => api.run(ref ?? ""),
    enabled: enabled && Boolean(ref),
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "running" || status === "queued" ? 2000 : status === "paused" ? 15_000 : false;
    },
  });
}

function activeTime(run: Run): string {
  if (typeof run.active_seconds === "number") return formatDuration(new Date(0).toISOString(), new Date(run.active_seconds * 1000).toISOString());
  return formatDuration(run.started_at, run.finished_at);
}

function Values({ values }: { values: Record<string, unknown> | undefined }) {
  const { t } = useTranslation();
  const entries = Object.entries(values ?? {});
  if (!entries.length) return null;
  return (
    <p className="small" data-testid="orchestration-values">
      <span className="muted">{t("flow.orchestrator.run.labelled", { label: t("flow.orchestrator.run.values") })}</span>{" "}
      {entries.map(([key, value]) => `${key} = ${typeof value === "string" ? value : JSON.stringify(value)}`).join(" · ")}
    </p>
  );
}

/** One team run: the team, its status, time and cost, the task it got, what came back, and a link to its run. */
function TeamRunRow({ entry, names, live }: { entry: TeamRun; names: Map<string, string>; live: boolean }) {
  const { t } = useTranslation();
  const child = useTeamRun(entry.ref, live).data;
  const outcome = entry.outcome;
  const name = names.get(entry.member) || child?.workflow_name || entry.member || t("orchestration.run.teamRun");
  const nested = child ? nestedRunCount(child) : 0;
  return (
    <li className="orch-team-run" data-testid="orchestration-team-run" data-ref={entry.ref ?? ""}>
      <div className="row-gap">
        <strong>{name}</strong>
        {outcome ? (
          <OutcomeBadge outcome={outcome} />
        ) : (
          <StatusBadge status={(child?.status ?? "running") as RunStatus} />
        )}
        {child ? (
          <span className="muted small" data-testid="orchestration-team-run-meta">
            {t("orchestration.run.active", { value: activeTime(child) })} · {formatCost(child.usage.estimated_cost_usd)}
          </span>
        ) : null}
        {nested ? (
          <Badge tone="idle" icon={Network}>
            <span data-testid="orchestration-nested">{t("orchestration.run.nested", { count: nested })}</span>
          </Badge>
        ) : null}
      </div>
      {entry.task ? (
        <p className="small">
          <span className="muted">{t("flow.orchestrator.run.labelled", { label: t("flow.orchestrator.run.task") })}</span> {entry.task}
        </p>
      ) : null}
      <Values values={entry.values} />
      {outcome?.status === "succeeded" && outcome.result ? <Output value={outcome.result} /> : null}
      {outcome && outcome.status !== "succeeded" && outcome.status !== "waiting" && outcome.error ? (
        <p className="small muted">{outcome.error}</p>
      ) : null}
      {entry.ref && live ? (
        <Link to={`/executions/${entry.ref}`} className="small">
          {t("flow.orchestrator.run.openTeam")} <ExternalLink size={11} aria-hidden />
        </Link>
      ) : null}
    </li>
  );
}

function TeamRuns({ entries, names, live }: { entries: TeamRun[]; names: Map<string, string>; live: boolean }) {
  if (!entries.length) return null;
  return (
    <ul className="orch-team-runs" data-testid="orchestration-assignments">
      {entries.map((entry) => (
        <TeamRunRow key={`${entry.round}-${entry.slot}-${entry.ref ?? ""}`} entry={entry} names={names} live={live} />
      ))}
    </ul>
  );
}

function stepTitle(t: ReturnType<typeof useTranslation>["t"], step: OrchestrationStep, nameOf: (id: string | undefined) => string) {
  const decision = step.decision;
  if (decision?.action === "delegate") return t("flow.orchestrator.run.delegated", { team: nameOf(decision.member) });
  if (decision?.action === "parallel") return t("flow.orchestrator.run.parallel", { count: decision.assignments?.length ?? 0 });
  if (decision?.action === "staff") return t("flow.orchestrator.run.staffed");
  if (decision?.action === "finish") return t("flow.orchestrator.run.finished");
  return t("flow.orchestrator.run.invalid");
}

function StepView({
  step,
  names,
  runs,
  live,
}: {
  step: OrchestrationStep;
  names: Map<string, string>;
  runs: TeamRun[];
  live: boolean;
}) {
  const { t } = useTranslation();
  const decision = step.decision;
  const refused = step.verdict.code !== null;
  const nameOf = (id: string | undefined) => (id ? (names.get(id) ?? id) : "?");
  return (
    <li className="orch-round stack-sm" data-testid="orchestration-step" data-action={decision?.action ?? "invalid"}>
      <div className="row-gap">
        <span className="orch-round__n">{t("orchestration.run.decisionN", { n: step.index + 1 })}</span>
        <strong>{stepTitle(t, step, nameOf)}</strong>
        {refused ? <Badge tone="warning">{t("flow.orchestrator.run.invalidNotRun")}</Badge> : null}
      </div>
      {decision?.reason ? (
        <p className="small">
          <span className="muted">{t("flow.orchestrator.run.labelled", { label: t("flow.orchestrator.run.reason") })}</span> {decision.reason}
        </p>
      ) : null}
      {decision?.action === "staff" ? (
        <p className="small" data-testid="orchestration-staff">
          {decision.add?.length ? t("flow.orchestrator.run.added", { teams: decision.add.map(nameOf).join(", ") }) : null}
          {decision.add?.length && decision.remove?.length ? " · " : null}
          {decision.remove?.length
            ? t("flow.orchestrator.run.removed", { teams: decision.remove.map(nameOf).join(", ") })
            : null}
        </p>
      ) : null}
      {refused && DELEGATING.has(decision?.action ?? "")
        ? assignmentsOf(decision).map((item, slot) => (
            <p className="small" key={slot}>
              <span className="muted">{t("flow.orchestrator.run.labelled", { label: t("flow.orchestrator.run.task") })}</span> {t("flow.orchestrator.run.labelled", { label: nameOf(item.member) })} {item.task}
            </p>
          ))
        : null}
      {!refused ? <TeamRuns entries={runs} names={names} live={live} /> : null}
      {refused ? (
        <p className="small" data-testid="orchestration-refusal">
          {problemText(t, { code: step.verdict.code, message: step.verdict.message })}
        </p>
      ) : null}
      {step.raw ? <pre className="small">{step.raw}</pre> : null}
    </li>
  );
}

/** Refused answers in a row: they started nothing, so they are folded into one entry with a way out. */
function RefusedGroup({ steps, names }: { steps: OrchestrationStep[]; names: Map<string, string> }) {
  const { t } = useTranslation();
  return (
    <li className="orch-round stack-sm" data-testid="orchestration-refused-group">
      <details>
        <summary>
          <span className="orch-round__n">
            {t("orchestration.run.decisionRange", { from: steps[0].index + 1, to: steps[steps.length - 1].index + 1 })}
          </span>{" "}
          <strong>{t("orchestration.run.refusedGroup", { count: steps.length })}</strong>
        </summary>
        <ol className="stack-sm orch-rounds">
          {steps.map((step) => (
            <StepView key={step.index} step={step} names={names} runs={[]} live={false} />
          ))}
        </ol>
      </details>
      <p className="small muted" data-testid="orchestration-refused-hint">
        {t("orchestration.run.refusedHint")} <HelpTip id="flow.orchestrator" label={t("orchestration.run.refusedHelp")} />
      </p>
    </li>
  );
}

/** The pool of the run (from its snapshot): each team, and the tags it matched when selected by capability. */
function PoolView({ node, names }: { node: WorkflowNode; names: Map<string, string> }) {
  const { t } = useTranslation();
  const members = node.orchestrator?.members ?? [];
  if (!members.length) return null;
  return (
    <div className="stack-sm">
      <span className="nd-field-label">{t("orchestration.run.pool", { count: members.length })}</span>
      <ul className="small" data-testid="orchestration-pool">
        {members.map((member) => (
          <li key={member.workflow_id}>
            {names.get(member.workflow_id) ?? member.workflow_id}
            {member.version ? <span className="muted"> · v{member.version}</span> : null}
            {member.matched?.length ? (
              <span className="muted"> · {t("flow.orchestrator.run.matched", { tags: member.matched.join(", ") })}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeamTimeline({ record, names }: { record: OrchestrationRecord; names: Map<string, string> }) {
  const { t } = useTranslation();
  const changes = teamChanges(record);
  if (!changes.length) return null;
  const nameOf = (id: string) => names.get(id) ?? id;
  return (
    <div className="stack-sm" data-testid="orchestration-team">
      <span className="nd-field-label">{t("flow.orchestrator.run.teamOverTime")}</span>
      <ol className="small">
        {changes.map((change) => (
          <li key={change.index}>
            {t("flow.orchestrator.run.labelled", { label: t("flow.orchestrator.run.afterStep", { n: change.index + 1 }) })}{" "}
            {change.team.length ? change.team.map(nameOf).join(", ") : t("flow.orchestrator.run.emptyTeam")}
          </li>
        ))}
      </ol>
    </div>
  );
}

function PendingView({ record, runs, names, live }: { record: OrchestrationRecord; runs: TeamRun[]; names: Map<string, string>; live: boolean }) {
  const { t } = useTranslation();
  const pending = record.pending;
  if (!pending) return null;
  const waiting = pending.outcomes.filter((item) => item.status === "waiting");
  return (
    <Callout tone="warning">
      <div className="stack-sm" data-testid="orchestration-pending">
        <strong>
          {t("orchestration.run.decisionN", { n: pending.index + 1 })} · {t("flow.orchestrator.run.waitingTitle", { count: waiting.length })}
        </strong>
        {pending.decision.reason ? (
          <p className="small">
            <span className="muted">{t("flow.orchestrator.run.labelled", { label: t("flow.orchestrator.run.reason") })}</span> {pending.decision.reason}
          </p>
        ) : null}
        <p className="small">{t("flow.orchestrator.run.waitingText")}</p>
        <TeamRuns entries={runs.filter((entry) => entry.pending)} names={names} live={live} />
      </div>
    </Callout>
  );
}

/** A new workflow with this orchestrator and the teams that worked, pinned to the versions of the run. */
export function teamTemplate(run: Run, node: WorkflowNode, teams: string[], name: string): WorkflowIn {
  const config = node.orchestrator as OrchestratorConfig;
  const versions = new Map(config.members.map((member) => [member.workflow_id, member.version]));
  const start = run.workflow.nodes.find((item) => item.type === "start");
  const orchestrator: OrchestratorConfig = {
    ...config,
    members: teams.map((id) => ({ workflow_id: id, version: versions.get(id) ?? null })),
    select: null,
    staffing: false,
  };
  return {
    name,
    description: run.workflow.description ?? "",
    nodes: [
      { ...(start ?? { id: "start", type: "start" }), id: "start", position: { x: 0, y: 0 } } as WorkflowNode,
      { ...node, id: "lead", position: { x: 280, y: 0 }, orchestrator },
      { id: "out", type: "output", label: "", position: { x: 560, y: 0 }, output: { files: [] } } as unknown as WorkflowNode,
    ],
    edges: [
      { id: "start-lead", source: "start", target: "lead" },
      { id: "lead-out", source: "lead", target: "out" },
    ],
    budget_usd: run.workflow.budget_usd ?? null,
    limits: run.workflow.limits,
  } as unknown as WorkflowIn;
}

function SaveTemplate({ run, node, record, names }: { run: Run; node: WorkflowNode; record: OrchestrationRecord; names: Map<string, string> }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const teams = teamsThatWorked(record);
  if (!teams.length || record.pending || record.outcome === null) return null;
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const name = t("flow.orchestrator.run.templateName", { name: run.workflow_name || run.workflow.name });
      const created: Workflow = await api.createWorkflow(teamTemplate(run, node, teams, name));
      toast.success(t("flow.orchestrator.run.templateSaved", { name: created.name }));
      navigate(`/workflows/${created.id}`);
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="stack-sm" data-testid="orchestration-template">
      <p className="small muted">
        {t("flow.orchestrator.run.templateText", { teams: teams.map((id) => names.get(id) ?? id).join(", ") })}{" "}
        <HelpTip id="flow.orchestratorTemplate" label={t("flow.orchestrator.run.saveTemplate")} />
      </p>
      <div>
        <Button size="sm" icon={Save} busy={busy} onClick={() => void save()}>
          {t("flow.orchestrator.run.saveTemplate")}
        </Button>
      </div>
      {error ? (
        <Callout tone="danger">
          <ErrorText error={error} />
        </Callout>
      ) : null}
    </div>
  );
}


/** The limits used against the allowed ones, the team runs by how they ended, and the cost. */
function Overview({ node, record, state, runs, names }: { node: WorkflowNode; record: OrchestrationRecord; state: NodeRun; runs: TeamRun[]; names: Map<string, string> }) {
  const { t } = useTranslation();
  const config = node.orchestrator as OrchestratorConfig | undefined;
  if (!config) return null;
  const use = limitUse(config, record);
  const decisionCost = state.decision_usage?.estimated_cost_usd;
  const totalCost = state.usage?.estimated_cost_usd;
  const cost = (value: number | null | undefined) =>
    value === null || value === undefined ? t("flow.orchestrator.run.costUnknown") : formatCost(value);
  const limits = [
    use.maxParallel > 1 ? t("flow.orchestrator.run.parallelLimit", { max: use.maxParallel }) : null,
    config.staffing ? t("flow.orchestrator.run.teamLimit", { max: config.max_team ?? 5 }) : null,
    use.maxPerMember !== null
      ? t("orchestration.run.perTeam", {
          max: use.maxPerMember,
          count: use.busiest?.count ?? 0,
          team: use.busiest ? (names.get(use.busiest.member) ?? use.busiest.member) : "–",
        })
      : null,
  ].filter(Boolean);
  const counts = teamRunCounts(runs);
  return (
    <div className="stats stats--inline" data-testid="orchestration-limits">
      <Stat
        label={t("orchestration.run.decisions")}
        tip="flow.orchestratorLimits"
        value={t("orchestration.run.usedOf", { used: use.decisions, max: use.maxDecisions })}
        hint={limits.length ? limits.join(" · ") : undefined}
      />
      <Stat
        label={t("orchestration.run.teamRuns")}
        value={<span data-testid="orchestration-team-run-count">{runs.length}</span>}
        hint={
          counts.length
            ? counts.map(([key, count]) => t("orchestration.run.stateCount", { state: t(STATE_KEY[key]), count })).join(" · ")
            : t("orchestration.run.noTeamRuns")
        }
      />
      <Stat
        label={t("orchestration.run.cost")}
        value={cost(totalCost)}
        hint={t("flow.orchestrator.run.costDecisions", { cost: cost(decisionCost) })}
      />
    </div>
  );
}

export function OrchestrationView({ node, state, run }: { node: WorkflowNode; state: NodeRun; run?: Run }) {
  const { t } = useTranslation();
  const workflows = useWorkflows();
  const modelLabel = useModelName();
  const record = state.orchestration;
  if (!record) return null;
  const names = new Map((workflows.data ?? []).map((item) => [item.id, item.name]));
  // Imported traces keep only the parent run: their team runs cannot be opened.
  const live = !run?.imported_at;
  const runs = teamRunsOf(record, state.child_run_ids ?? []);
  const byRound = (index: number) => runs.filter((entry) => entry.round === index && !entry.pending);
  const current = runs.filter((entry) => entry.round === record.steps.length && !entry.pending && !entry.outcome);
  const model = node.orchestrator?.model;
  return (
    <div className="stack-sm orchestration" data-testid="orchestration">
      <span className="nd-field-label">
        {t("flow.orchestrator.run.who", { name: node.label || t("editor.nodes.orchestrator"), model: model ? modelLabel(model) : "–" })}
      </span>
      <Overview node={node} record={record} state={state} runs={runs} names={names} />
      {record.outcome === "stopped" && record.stop_code ? (
        <Callout tone="warning">
          <span data-testid="orchestration-stopped">
            {t("orchestration.run.stopped", { reason: problemText(t, { code: record.stop_code, message: "" }) })}
          </span>
        </Callout>
      ) : null}
      <PendingView record={record} runs={runs} names={names} live={live} />
      <PoolView node={node} names={names} />
      <TeamTimeline record={record} names={names} />
      <span className="nd-field-label">
        {t("orchestration.run.rounds")} <HelpTip id="flow.orchestrator" label={t("orchestration.run.rounds")} />
      </span>
      <ol className="stack-sm orch-rounds" data-testid="orchestration-rounds">
        {roundsOf(record.steps).map((round) =>
          round.kind === "step" ? (
            <StepView key={round.step.index} step={round.step} names={names} runs={accepted(round.step) ? byRound(round.step.index) : []} live={live} />
          ) : (
            <RefusedGroup key={round.steps[0].index} steps={round.steps} names={names} />
          ),
        )}
        {current.length ? (
          <li className="orch-round stack-sm" data-testid="orchestration-current">
            <div className="row-gap">
              <span className="orch-round__n">{t("orchestration.run.decisionN", { n: record.steps.length + 1 })}</span>
              <strong>{t("orchestration.run.current", { count: current.length })}</strong>
            </div>
            <TeamRuns entries={current} names={names} live={live} />
          </li>
        ) : null}
      </ol>
      {run ? <SaveTemplate run={run} node={node} record={record} names={names} /> : null}
    </div>
  );
}
