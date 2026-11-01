// The decisions of an orchestrator in a run: who works, why, what came back, how the team changed,
// who is waiting for an approval, and what it cost. Only the structured record is shown (no model reasoning).

import { ExternalLink, Save } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { useWorkflows } from "../api/hooks";
import type {
  NodeRun,
  OrchestrationDecision,
  OrchestrationOutcome,
  OrchestrationOutcomeStatus,
  OrchestrationRecord,
  OrchestrationStep,
  OrchestratorConfig,
  Run,
  Workflow,
  WorkflowIn,
  WorkflowNode,
} from "../api/types";
import { Output } from "../components/Markdown";
import { toast } from "../components/toast";
import { Badge, Button, Callout, HelpTip } from "../components/ui";
import { ErrorText, problemText } from "../lib/errors";
import { formatCost, type Tone } from "../lib/format";
import { useModelName } from "../components/ModelPicker";

const DELEGATING = new Set(["delegate", "parallel"]);

/** The teams of a decision, in order (one for ``delegate``, several for ``parallel``). */
export function assignmentsOf(decision: OrchestrationDecision | null | undefined) {
  if (!decision) return [];
  if (decision.action === "parallel") return decision.assignments ?? [];
  if (decision.action === "delegate") return [{ member: decision.member ?? "", task: decision.task ?? "", values: decision.values }];
  return [];
}

/** The team run of every accepted delegation: from the outcome (version 2), else in order (version 1 records). */
export function childRuns(record: OrchestrationRecord, childRunIds: string[]): Map<number, string> {
  const result = new Map<number, string>();
  let next = 0;
  for (const step of record.steps) {
    if (step.decision?.action !== "delegate" || step.verdict.code !== null) continue;
    const ref = step.outcomes?.[0]?.ref;
    if (ref) result.set(step.index, ref);
    else if (next < childRunIds.length) result.set(step.index, childRunIds[next]);
    next += 1;
  }
  return result;
}

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

function TeamLink({ runId }: { runId: string | null | undefined }) {
  const { t } = useTranslation();
  if (!runId) return null;
  return (
    <Link to={`/executions/${runId}`} className="small">
      {t("flow.orchestrator.run.openTeam")} <ExternalLink size={11} aria-hidden />
    </Link>
  );
}

function Values({ values }: { values: Record<string, unknown> | undefined }) {
  const { t } = useTranslation();
  const entries = Object.entries(values ?? {});
  if (!entries.length) return null;
  return (
    <p className="small" data-testid="orchestration-values">
      <span className="muted">{t("flow.orchestrator.run.values")}:</span>{" "}
      {entries.map(([key, value]) => `${key} = ${typeof value === "string" ? value : JSON.stringify(value)}`).join(" · ")}
    </p>
  );
}

function Assignments({
  decision,
  outcomes,
  names,
}: {
  decision: OrchestrationDecision;
  outcomes: OrchestrationOutcome[];
  names: Map<string, string>;
}) {
  const { t } = useTranslation();
  return (
    <ul className="stack-sm" data-testid="orchestration-assignments">
      {assignmentsOf(decision).map((item, slot) => {
        const outcome = outcomes[slot];
        return (
          <li key={`${item.member}-${slot}`} className="stack-sm">
            <div>
              <strong>{names.get(item.member) ?? item.member}</strong> {outcome ? <OutcomeBadge outcome={outcome} /> : null}
            </div>
            <p className="small">
              <span className="muted">{t("flow.orchestrator.run.task")}:</span> {item.task}
            </p>
            <Values values={item.values} />
            {outcome?.status === "succeeded" && outcome.result ? <Output value={outcome.result} /> : null}
            {outcome && outcome.status !== "succeeded" && outcome.status !== "waiting" && outcome.error ? (
              <p className="small muted">{outcome.error}</p>
            ) : null}
            <TeamLink runId={outcome?.ref} />
          </li>
        );
      })}
    </ul>
  );
}

function StepView({
  step,
  names,
  child,
}: {
  step: OrchestrationStep;
  names: Map<string, string>;
  child: string | undefined;
}) {
  const { t } = useTranslation();
  const decision = step.decision;
  const refused = step.verdict.code !== null;
  const outcomes = step.outcomes ?? [];
  const nameOf = (id: string | undefined) => (id ? (names.get(id) ?? id) : "?");
  const title =
    decision?.action === "delegate"
      ? t("flow.orchestrator.run.delegated", { team: nameOf(decision.member) })
      : decision?.action === "parallel"
        ? t("flow.orchestrator.run.parallel", { count: decision.assignments?.length ?? 0 })
        : decision?.action === "staff"
          ? t("flow.orchestrator.run.staffed")
          : decision?.action === "finish"
            ? t("flow.orchestrator.run.finished")
            : t("flow.orchestrator.run.invalid");
  const v1Failed = !outcomes.length && step.error;
  return (
    <li className="stack-sm" data-testid="orchestration-step">
      <div>
        <strong>
          {step.index + 1}. {title}
        </strong>{" "}
        {refused ? (
          <Badge tone="warning">{t("flow.orchestrator.run.invalidNotRun")}</Badge>
        ) : v1Failed ? (
          <Badge tone="danger">{t("flow.orchestrator.run.teamFailed")}</Badge>
        ) : decision?.action === "delegate" && outcomes[0] ? (
          <OutcomeBadge outcome={outcomes[0]} />
        ) : null}
      </div>
      {decision?.reason ? (
        <p className="small">
          <span className="muted">{t("flow.orchestrator.run.reason")}:</span> {decision.reason}
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
      {decision?.action === "delegate" && decision.task ? (
        <p className="small">
          <span className="muted">{t("flow.orchestrator.run.task")}:</span> {decision.task}
        </p>
      ) : null}
      {decision?.action === "delegate" ? <Values values={decision.values} /> : null}
      {decision?.action === "parallel" && !refused ? (
        <Assignments decision={decision} outcomes={outcomes} names={names} />
      ) : null}
      {refused ? (
        <p className="small" data-testid="orchestration-refusal">
          {problemText(t, { code: step.verdict.code, message: step.verdict.message })}
        </p>
      ) : null}
      {step.raw ? <pre className="small">{step.raw}</pre> : null}
      {decision?.action === "delegate" && step.error ? <p className="small muted">{step.error}</p> : null}
      {decision?.action === "delegate" && step.result ? <Output value={step.result} /> : null}
      {decision?.action === "delegate" ? <TeamLink runId={child} /> : null}
    </li>
  );
}

/** The pool of the run (from its snapshot): each team, and the tags it matched when selected by capability. */
function PoolView({ node, names }: { node: WorkflowNode; names: Map<string, string> }) {
  const { t } = useTranslation();
  const members = node.orchestrator?.members ?? [];
  if (!members.length) return null;
  return (
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
            {t("flow.orchestrator.run.afterStep", { n: change.index + 1 })}:{" "}
            {change.team.length ? change.team.map(nameOf).join(", ") : t("flow.orchestrator.run.emptyTeam")}
          </li>
        ))}
      </ol>
    </div>
  );
}

function PendingView({ record, names }: { record: OrchestrationRecord; names: Map<string, string> }) {
  const { t } = useTranslation();
  const pending = record.pending;
  if (!pending) return null;
  const waiting = pending.outcomes.filter((item) => item.status === "waiting");
  return (
    <Callout tone="warning">
      <div className="stack-sm" data-testid="orchestration-pending">
        <strong>{t("flow.orchestrator.run.waitingTitle", { count: waiting.length })}</strong>
        <p className="small">{t("flow.orchestrator.run.waitingText")}</p>
        <Assignments decision={pending.decision} outcomes={pending.outcomes} names={names} />
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

function Limits({ node, record, state }: { node: WorkflowNode; record: OrchestrationRecord; state: NodeRun }) {
  const { t } = useTranslation();
  const config = node.orchestrator as OrchestratorConfig | undefined;
  if (!config) return null;
  const decisionCost = state.decision_usage?.estimated_cost_usd;
  const totalCost = state.usage?.estimated_cost_usd;
  const parts = [
    t("flow.orchestrator.run.decisionsUsed", { used: record.steps.length, max: config.max_decisions }),
    (config.max_parallel ?? 1) > 1 ? t("flow.orchestrator.run.parallelLimit", { max: config.max_parallel }) : null,
    config.staffing ? t("flow.orchestrator.run.teamLimit", { max: config.max_team ?? 5 }) : null,
    t("flow.orchestrator.run.costDecisions", { cost: decisionCost === null || decisionCost === undefined ? t("flow.orchestrator.run.costUnknown") : formatCost(decisionCost) }),
    t("flow.orchestrator.run.costTotal", { cost: totalCost === null || totalCost === undefined ? t("flow.orchestrator.run.costUnknown") : formatCost(totalCost) }),
  ].filter(Boolean);
  return (
    <p className="small muted" data-testid="orchestration-limits">
      {parts.join(" · ")}
    </p>
  );
}

export function OrchestrationView({ node, state, run }: { node: WorkflowNode; state: NodeRun; run?: Run }) {
  const { t } = useTranslation();
  const workflows = useWorkflows();
  const modelLabel = useModelName();
  const record = state.orchestration;
  if (!record) return null;
  const names = new Map((workflows.data ?? []).map((item) => [item.id, item.name]));
  const children = childRuns(record, state.child_run_ids ?? []);
  const delegations = record.steps.filter((step) => DELEGATING.has(step.decision?.action ?? "") && step.verdict.code === null);
  const model = node.orchestrator?.model;
  return (
    <div className="stack-sm" data-testid="orchestration">
      <span className="nd-field-label">
        {t("flow.orchestrator.run.who", { name: node.label || t("editor.nodes.orchestrator"), model: model ? modelLabel(model) : "–" })}
      </span>
      <span className="small">
        {t("flow.orchestrator.run.summary", { decisions: record.steps.length, delegations: delegations.length })}
      </span>
      <Limits node={node} record={record} state={state} />
      <PoolView node={node} names={names} />
      <TeamTimeline record={record} names={names} />
      <PendingView record={record} names={names} />
      <ol className="stack-sm">
        {record.steps.map((step) => (
          <StepView key={step.index} step={step} names={names} child={children.get(step.index)} />
        ))}
      </ol>
      {run ? <SaveTemplate run={run} node={node} record={record} names={names} /> : null}
    </div>
  );
}
