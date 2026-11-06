// Why a run did not succeed, in the words of the step that failed: its own problem, what to do about it, and the
// technical text one click away. A run that failed because of a step only says "Failed: <step>"; the step knows why
// (and the run's cause, RT-012, when the step's data is not at hand).

import { Settings, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import type { Run } from "../api/types";
import { Callout } from "../components/ui";
import { AWS_PROVIDER_PROBLEMS, PROVIDER_FAILURES, ProblemText, isProviderAuth, needsSandboxSetup, problemCode, runProblem } from "../lib/errors";
import { failedSteps } from "./runSummary";
import { causeStep, stepCause } from "./RunReason";
import { settingsHref } from "../lib/settingsLink";
import { providerOf } from "../lib/providers";

/** Codes of a failed agent whose fix is a setting under "Advanced" of that agent. */
const ADVANCED_FIX = new Set([
  "run.agent.IncompleteResponseError",
  "run.agent.OutputLimitReached",
  "run.agent.MaxToolRoundsError",
  // Orkexa ORK-029: one answer asked for more tool calls than max_tool_calls_per_round (64 by default).
  "run.agent.MaxToolCallsError",
]);

/**
 * Provider failures, which name the model the step asked: the runtime's own codes first, then the readings of
 * older runs' ``run.api_error`` (see refineProblem).
 */
const PROVIDER = new Set([
  ...PROVIDER_FAILURES,
  "run.api_error_auth",
  "run.api_error_rate_limit",
  "run.api_error_server",
  "run.api_error_connection",
  "run.api_error_invalid",
  "run.api_error_status",
  // Amazon Bedrock: the full model id (inference profile, ARN) tells which AWS resource was asked.
  ...AWS_PROVIDER_PROBLEMS,
]);

/** The run-level codes that only point at the steps that failed. */
const POINTS_AT_STEPS = new Set(["run.nodes_failed"]);

/**
 * The reason of a run that did not succeed. ``children`` are further notes of the same run shown under it (room
 * for e.g. a "finished with problems" indicator of other parts of the interface).
 */
export function RunProblem({ run, children }: { run: Run; children?: ReactNode }) {
  const { t } = useTranslation();
  if (!run.error) return null;
  const failed = failedSteps(run).filter((node) => run.nodes[node.id]?.error);
  const first = failed[0];
  const state = first ? run.nodes[first.id] : undefined;
  if (run.status === "failed" && first && state && POINTS_AT_STEPS.has(problemCode(runProblem(run)) ?? "")) {
    const code = problemCode(runProblem(state));
    const editable = !run.imported_at && first.type === "agent" && ADVANCED_FIX.has(code ?? "");
    return (
      <Callout tone="danger">
        <div className="run-problem" data-testid="run-failure">
          <strong>{t("runs.failure.atStep", { name: first.label || first.agent?.name || first.id })}</strong>
          <ProblemText item={runProblem(state)} />
          {failed.length > 1 ? <span className="muted small">{t("runs.failure.more", { count: failed.length - 1 })}</span> : null}
          {PROVIDER.has(code ?? "") && first.agent?.model ? (
            <span className="muted small" data-testid="run-failure-model">
              {t("runs.failure.model", { model: first.agent.model })}
            </span>
          ) : null}
          {isProviderAuth(code) ? (
            <Link
              className="small run-problem__fix"
              to={settingsHref(first.agent?.model ? `provider-${providerOf(first.agent.model)}` : "settings-providers", `/executions/${run.id}`)}
            >
              <Settings size={12} aria-hidden /> {t("runs.failure.openSettings")}
            </Link>
          ) : null}
          {needsSandboxSetup(runProblem(state)) ? <SandboxFix runId={run.id} /> : null}
          {editable ? (
            <Link className="small run-problem__fix" to={`/workflows/${run.workflow_id}?node=${encodeURIComponent(first.id)}&section=advanced`}>
              <SlidersHorizontal size={12} aria-hidden /> {t("runs.failure.openAdvanced", { name: first.label || first.agent?.name || first.id })}
            </Link>
          ) : null}
          {children}
        </div>
      </Callout>
    );
  }
  // The step's data is not at hand (e.g. a run whose steps were cleaned up): the run's own cause names step and reason.
  const cause = stepCause(run);
  if (cause) {
    return (
      <Callout tone="danger">
        <div className="run-problem" data-testid="run-failure">
          <strong>{t("runs.failure.atStep", { name: causeStep(cause) })}</strong>
          <ProblemText item={{ code: cause.code, params: cause.params, message: null }} />
          {children}
        </div>
      </Callout>
    );
  }
  return (
    <Callout tone={run.status === "failed" ? "danger" : "warning"}>
      <div className="run-problem" data-testid="run-failure">
        <ProblemText item={runProblem(run)} />
        {needsSandboxSetup(runProblem(run)) ? <SandboxFix runId={run.id} /> : null}
        {children}
      </div>
    </Callout>
  );
}

/** AI-created code found no sandbox: the way to Settings → Sandbox, and back to this run. */
function SandboxFix({ runId }: { runId: string }) {
  const { t } = useTranslation();
  return (
    <Link className="small run-problem__fix" to={settingsHref("settings-sandbox", `/executions/${runId}`)} data-testid="run-failure-sandbox">
      <Settings size={12} aria-hidden /> {t("errors.openSandbox")}
    </Link>
  );
}
