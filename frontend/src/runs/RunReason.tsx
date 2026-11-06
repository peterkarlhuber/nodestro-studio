// The reason of a run in one line, for lists (Runs, comparison): "<step>: <reason>" when a step failed the run and
// the run carries its cause (runtime RT-012), else the run's own problem ("Failed: <steps>" for older runs).

import { useTranslation } from "react-i18next";

import type { RunCause } from "../api/types";
import { ProblemText, problemText, runProblem } from "../lib/errors";

interface ReasonTarget {
  status: string;
  error: string | null;
  error_code?: string | null;
  error_params?: Record<string, unknown>;
  cause?: RunCause | null;
}

/** The cause of a run that failed because of a step, when the run carries one. */
export function stepCause(run: ReasonTarget): RunCause | null {
  return run.status === "failed" && run.error_code === "run.nodes_failed" && run.cause ? run.cause : null;
}

/** The step's name a cause shows. */
export function causeStep(cause: RunCause): string {
  return cause.label || cause.node_id;
}

export function RunReason({ run }: { run: ReasonTarget }) {
  const { t } = useTranslation();
  const cause = stepCause(run);
  if (!cause) return <ProblemText item={runProblem(run)} compact />;
  const reason = problemText(t, { code: cause.code, params: cause.params, message: null });
  return <span data-testid="run-cause">{t("runs.failure.cause", { step: causeStep(cause), reason })}</span>;
}
