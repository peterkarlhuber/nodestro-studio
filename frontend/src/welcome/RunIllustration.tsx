import { Bot, CheckCircle2, Circle, FileText, Loader2, type LucideIcon, PenLine, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useInView } from "./motion";

// An illustrated workflow run, drawn in the Studio's own node style. It is labelled as an
// illustration everywhere: nothing runs, no model is called, no numbers are invented.

type Status = "idle" | "running" | "done";

interface Step {
  id: "input" | "analyst" | "writer" | "output";
  icon: LucideIcon;
  tools?: ("toolKnowledge" | "toolPython")[];
}

const STEPS: Step[] = [
  { id: "input", icon: FileText },
  { id: "analyst", icon: Bot, tools: ["toolKnowledge", "toolPython"] },
  { id: "writer", icon: PenLine },
  { id: "output", icon: CheckCircle2 },
];

/** Status of each step in each phase of the illustration (phase 0 = nothing started yet). */
const PHASES: Status[][] = [
  ["idle", "idle", "idle", "idle"],
  ["done", "running", "idle", "idle"],
  ["done", "done", "running", "idle"],
  ["done", "done", "done", "done"],
];
export const LAST_PHASE = PHASES.length - 1;
const PHASE_MS = 1300;

/** Which of the three explained stages (design, run, trace) a phase belongs to. */
export function stageOf(phase: number): 0 | 1 | 2 {
  if (phase === 0) return 0;
  return phase === LAST_PHASE ? 2 : 1;
}

const STATUS_ICON: Record<Status, LucideIcon> = { idle: Circle, running: Loader2, done: CheckCircle2 };
const STATUS_TONE: Record<Status, string> = { idle: "idle", running: "running", done: "success" };

/** Plays the phases once when the illustration scrolls into view; ``replay`` starts again. */
export function useRunPhases(element: HTMLElement | null, reduced: boolean) {
  const visible = useInView(element, 0.45);
  const [phase, setPhase] = useState(reduced ? LAST_PHASE : 0);
  // 0 = not played yet; every increment plays the phases from the start.
  const [round, setRound] = useState(0);
  useEffect(() => {
    if (visible && round === 0) setRound(1);
  }, [visible, round]);
  useEffect(() => {
    if (reduced) {
      setPhase(LAST_PHASE);
      return;
    }
    if (round === 0) return;
    setPhase(0);
    const timers = Array.from({ length: LAST_PHASE }, (_, index) => window.setTimeout(() => setPhase(index + 1), (index + 1) * PHASE_MS));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [round, reduced]);
  const replay = useCallback(() => setRound((value) => value + 1), []);
  return { phase, replay, playing: round > 0 && phase < LAST_PHASE && !reduced };
}

export function RunIllustration({ phase, onReplay, busy }: { phase: number; onReplay: () => void; busy: boolean }) {
  const { t } = useTranslation();
  const statuses = PHASES[phase];
  return (
    <figure className="wl-run" aria-labelledby="wl-run-caption">
      <figcaption id="wl-run-caption" className="wl-run__caption">
        <span className="wl-run__label">{t("welcome.how.illustration")}</span>
        <button type="button" className="nd-button wl-run__replay" onClick={onReplay} disabled={busy} data-testid="welcome-replay">
          <RotateCcw size={13} aria-hidden /> {t("welcome.how.replay")}
        </button>
      </figcaption>
      <div className="wl-run__canvas" aria-hidden data-phase={phase} data-testid="welcome-run">
        {STEPS.map((step, index) => {
          const status = statuses[index];
          const StatusIcon = STATUS_ICON[status];
          const Icon = step.icon;
          const live = index > 0 && statuses[index - 1] === "done" && status !== "idle";
          return (
            <div key={step.id} className="wl-run__cell">
              {index > 0 ? <span className={`wl-run__edge ${live ? "is-live" : ""} ${status === "running" ? "is-flowing" : ""}`} /> : null}
              <div className={`wl-run__node is-${status}`} data-status={status}>
                <div className="wl-run__head">
                  <span className="wl-run__icon">
                    <Icon size={15} aria-hidden />
                  </span>
                  <span className="wl-run__name">{t(`welcome.how.demo.${step.id}`)}</span>
                </div>
                <div className="wl-run__detail">{t(`welcome.how.demo.${step.id}Detail`)}</div>
                {step.tools ? (
                  <div className="wl-run__tools">
                    {step.tools.map((tool) => (
                      <span key={tool} className="wl-run__tool">
                        {t(`welcome.how.demo.${tool}`)}
                      </span>
                    ))}
                  </div>
                ) : null}
                <span className={`nd-badge nd-badge--${STATUS_TONE[status]} wl-run__status`}>
                  <StatusIcon size={11} aria-hidden className={status === "running" ? "wl-spin" : undefined} />
                  {t(`welcome.how.demo.${status}`)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <ol className={`wl-run__history ${phase === LAST_PHASE ? "is-shown" : ""}`} aria-hidden>
        <li className="wl-run__history-title">{t("welcome.how.demo.history")}</li>
        {STEPS.map((step) => (
          <li key={step.id}>
            <CheckCircle2 size={12} aria-hidden /> {t(`welcome.how.demo.${step.id}`)}
          </li>
        ))}
      </ol>
    </figure>
  );
}
