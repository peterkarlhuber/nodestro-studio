// Why a run did not succeed, in the words of the step that failed: its own problem, what to do about it, and the
// technical text one click away. A run that failed because of a step only says "Failed: <step>"; the step knows why.

import { Settings, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import type { Run } from "../api/types";
import { Callout } from "../components/ui";
import { ProblemText, problemCode, runProblem } from "../lib/errors";
import { failedSteps } from "./runSummary";

/** Codes of a failed agent whose fix is a setting under "Advanced" of that agent. */
const ADVANCED_FIX = new Set(["run.agent.IncompleteResponseError", "run.agent.OutputLimitReached", "run.agent.MaxToolRoundsError"]);

/** Provider failures whose fix starts in Settings (the key) or that name the model the step asked. */
const PROVIDER = new Set([
  "run.api_error_auth",
  "run.api_error_rate_limit",
  "run.api_error_server",
  "run.api_error_connection",
  "run.api_error_invalid",
  "run.api_error_status",
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
          {code === "run.api_error_auth" ? (
            <Link className="small run-problem__fix" to="/settings">
              <Settings size={12} aria-hidden /> {t("runs.failure.openSettings")}
            </Link>
          ) : null}
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
  return (
    <Callout tone={run.status === "failed" ? "danger" : "warning"}>
      <div className="run-problem" data-testid="run-failure">
        <ProblemText item={runProblem(run)} />
        {children}
      </div>
    </Callout>
  );
}
