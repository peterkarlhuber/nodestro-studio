// The decisions of an orchestrator in a run: which team got which task, why, and what came back.

import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useWorkflows } from "../api/hooks";
import type { NodeRun, OrchestrationRecord, OrchestrationStep, WorkflowNode } from "../api/types";
import { Output } from "../components/Markdown";
import { Badge } from "../components/ui";
import { problemText } from "../lib/errors";

/** The child run of every accepted delegation, in order (the runtime starts one per accepted delegation). */
export function childRuns(record: OrchestrationRecord, childRunIds: string[]): Map<number, string> {
  const result = new Map<number, string>();
  let next = 0;
  for (const step of record.steps) {
    if (step.decision?.action === "delegate" && step.verdict.code === null && next < childRunIds.length) {
      result.set(step.index, childRunIds[next]);
      next += 1;
    }
  }
  return result;
}

function StepView({ step, team, child }: { step: OrchestrationStep; team: string | null; child: string | undefined }) {
  const { t } = useTranslation();
  const decision = step.decision;
  const refused = step.verdict.code !== null;
  const title =
    decision?.action === "delegate"
      ? t("flow.orchestrator.run.delegated", { team: team ?? decision.member ?? "?" })
      : decision?.action === "finish"
        ? t("flow.orchestrator.run.finished")
        : t("flow.orchestrator.run.invalid");
  return (
    <li className="stack-sm" data-testid="orchestration-step">
      <div>
        <strong>
          {step.index + 1}. {title}
        </strong>{" "}
        {refused ? (
          <Badge tone="warning">{t("flow.orchestrator.run.refused")}</Badge>
        ) : step.error ? (
          <Badge tone="danger">{t("flow.orchestrator.run.teamFailed")}</Badge>
        ) : null}
      </div>
      {decision?.reason ? (
        <p className="small">
          <span className="muted">{t("flow.orchestrator.run.reason")}:</span> {decision.reason}
        </p>
      ) : null}
      {decision?.task ? (
        <p className="small">
          <span className="muted">{t("flow.orchestrator.run.task")}:</span> {decision.task}
        </p>
      ) : null}
      {refused ? (
        <p className="small" data-testid="orchestration-refusal">
          {problemText(t, { code: step.verdict.code, message: step.verdict.message })}
        </p>
      ) : null}
      {step.raw ? <pre className="small">{step.raw}</pre> : null}
      {step.error ? <p className="small muted">{step.error}</p> : null}
      {step.result ? <Output value={step.result} /> : null}
      {child ? (
        <Link to={`/executions/${child}`} className="small">
          {t("flow.orchestrator.run.openTeam")} <ExternalLink size={11} aria-hidden />
        </Link>
      ) : null}
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
          {member.matched?.length ? (
            <span className="muted"> · {t("flow.orchestrator.run.matched", { tags: member.matched.join(", ") })}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function OrchestrationView({ node, state }: { node: WorkflowNode; state: NodeRun }) {
  const { t } = useTranslation();
  const workflows = useWorkflows();
  const record = state.orchestration;
  if (!record) return null;
  const names = new Map((workflows.data ?? []).map((item) => [item.id, item.name]));
  const children = childRuns(record, state.child_run_ids ?? []);
  const delegations = record.steps.filter((step) => step.decision?.action === "delegate" && step.verdict.code === null);
  return (
    <div className="stack-sm" data-testid="orchestration">
      <span className="nd-field-label">
        {t("flow.orchestrator.run.summary", { decisions: record.steps.length, delegations: delegations.length })}
      </span>
      <PoolView node={node} names={names} />
      <ol className="stack-sm">
        {record.steps.map((step) => (
          <StepView
            key={step.index}
            step={step}
            team={step.decision?.member ? (names.get(step.decision.member) ?? null) : null}
            child={children.get(step.index)}
          />
        ))}
      </ol>
    </div>
  );
}
