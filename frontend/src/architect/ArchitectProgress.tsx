import {
  AlertTriangle,
  Boxes,
  Cable,
  Check,
  CircleCheck,
  CircleDot,
  Eye,
  Loader2,
  type LucideIcon,
  Network,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Wand2,
  Wrench,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import type { ArchitectEvent, ArchitectJob, ArchitectPhase } from "../api/types";
import { HelpTip } from "../components/Tooltip";
import { formatCost, formatTime } from "../lib/format";
import { ArchitectGraph, MarkLegend } from "./ArchitectGraph";
import { latestGraph, logEntries, stepStates } from "./progress";

export const PHASE_ICONS: Record<ArchitectPhase, LucideIcon> = {
  analyze: Search,
  plan: Network,
  resources: Boxes,
  configure: SlidersHorizontal,
  tools: Wrench,
  connect: Cable,
  validate: ShieldCheck,
  present: Eye,
};

const LEVEL_ICONS: Record<ArchitectEvent["level"], LucideIcon> = {
  info: CircleDot,
  success: CircleCheck,
  warning: AlertTriangle,
  fix: Wand2,
};

/** A log message in the interface language; the English original if the code is unknown. */
export function useLogText() {
  const { t, i18n } = useTranslation();
  return (event: ArchitectEvent) => {
    const key = `architect.log.${event.code ?? ""}`;
    return event.code && i18n.exists(key, event.params) ? t(key, event.params) : event.message;
  };
}

function Steps({ job }: { job: ArchitectJob }) {
  const { t } = useTranslation();
  return (
    <ol className="architect-steps" aria-label={t("architect.progress.steps")}>
      {stepStates(job).map(({ phase, state }) => {
        const Icon = state === "done" ? Check : state === "active" ? Loader2 : PHASE_ICONS[phase];
        return (
          <li key={phase} className={`architect-step architect-step--${state}`} aria-current={state === "active" ? "step" : undefined}>
            <span className="architect-step__icon">
              <Icon size={14} className={state === "active" ? "spin" : undefined} aria-hidden />
            </span>
            <span className="architect-step__label">{t(`architect.phase.${phase}`)}</span>
            <span className="sr-only">{t(`architect.stepState.${state}`)}</span>
          </li>
        );
      })}
    </ol>
  );
}

function ActivityLog({ job }: { job: ArchitectJob }) {
  const { t } = useTranslation();
  const text = useLogText();
  const entries = logEntries(job);
  const end = useRef<HTMLLIElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: "nearest" });
  }, [entries.length]);
  return (
    <section className="architect-log" aria-label={t("architect.progress.log")}>
      <h3 className="architect-panel__title">
        {t("architect.progress.log")} <HelpTip id="architect.log" label={t("architect.progress.log")} />
      </h3>
      <ol className="architect-log__list" aria-live="polite">
        {entries.map((event) => {
          const Icon = LEVEL_ICONS[event.level];
          return (
            <li key={event.seq} className={`architect-log__item architect-log__item--${event.level}`} ref={event === entries.at(-1) ? end : undefined}>
              <Icon size={13} aria-hidden className="architect-log__icon" />
              <span className="architect-log__text">{text(event)}</span>
              <time className="architect-log__time">{formatTime(event.at)}</time>
            </li>
          );
        })}
        {!entries.length ? <li className="muted small">{t("architect.progress.starting")}</li> : null}
      </ol>
    </section>
  );
}

/** Cost so far and the limit of this job. */
export function CostMeter({ job }: { job: ArchitectJob }) {
  const { t } = useTranslation();
  return (
    <span className="architect-cost" data-testid="architect-cost">
      {t("architect.progress.cost", { cost: formatCost(job.usage.estimated_cost_usd) })}
      {job.budget_usd !== null ? ` · ${t("architect.progress.limit", { limit: formatCost(job.budget_usd) })}` : null}
      <HelpTip id="architect.cost" label={t("architect.progress.costLabel")} />
    </span>
  );
}

/** What the architect is doing right now: step, activity log and the workflow as it grows. */
export function ArchitectProgress({ job }: { job: ArchitectJob }) {
  const { t } = useTranslation();
  const graph = latestGraph(job);
  return (
    <div className="architect-progress" data-testid="architect-progress">
      <div className="architect-progress__head">
        <div>
          <span className="architect-progress__eyebrow">{t(job.mode === "create" ? "architect.mode.create" : "architect.mode.revise")}</span>
          <h3 className="architect-progress__title">{job.phase ? t(`architect.phaseRunning.${job.phase}`) : t("architect.progress.starting")}</h3>
        </div>
        <CostMeter job={job} />
      </div>
      <Steps job={job} />
      <div className="architect-progress__body">
        <section className="architect-progress__graph">
          <h3 className="architect-panel__title">{t("architect.progress.graph")}</h3>
          <ArchitectGraph graph={graph} base={job.mode === "revise" ? job.base : null} />
          <MarkLegend marks={graph?.marks ?? {}} />
        </section>
        <ActivityLog job={job} />
      </div>
    </div>
  );
}
