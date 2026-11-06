// The reasoning of the Workflow Architect's current request (analysis, plan, agent revision, repair), shown live
// next to the activity log. Only what the model's provider sends; older steps stay on the job (job.reasoning).

import { useTranslation } from "react-i18next";

import type { ArchitectJob } from "../api/types";
import { ReasoningView } from "../components/ReasoningView";
import { useThinkingDisplay } from "../lib/thinkingDisplay";

export function ArchitectReasoning({ job }: { job: ArchitectJob }) {
  const { t } = useTranslation();
  const { display } = useThinkingDisplay("architect");
  const entry = job.reasoning?.at(-1);
  if (!entry) return null;
  return (
    <div className="architect-reasoning" data-testid="architect-reasoning" data-step={entry.step}>
      <span className="muted small">{t(`reasoning.steps.${entry.step}`, { defaultValue: entry.step })}</span>
      <ReasoningView trace={job.status === "running" ? entry : { ...entry, active: false }} display={display} testId="architect-reasoning-view" />
    </div>
  );
}
