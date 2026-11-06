// Progress of long operations: a bar that shows a percentage only when the work reports measurable progress (and is
// indeterminate otherwise), the steps of a multi-step operation, a polite live region that announces a new step, and
// optional technical details. Shared by every long operation (local model setup and downloads first).

import { CheckCircle2, Circle, CircleSlash, Loader2, XCircle } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatLargeBytes, formatNumber } from "../lib/format";

export type StepState = "pending" | "running" | "done" | "skipped" | "failed";

/** One row of a step list; `label` and `note` are already translated. */
export interface ProgressStep {
  id: string;
  label: string;
  state: StepState;
  /** A short outcome or reason, e.g. why a step was skipped. */
  note?: string | null;
  /** The bar of the running step (only that one has one). */
  children?: ReactNode;
}

/** The share 0…1 of a measurable step, or null when it is not measurable (no total, or nothing counted for it). */
export function shareOf(completed: number, total: number | null | undefined): number | null {
  if (!total || total <= 0 || !Number.isFinite(completed)) return null;
  return Math.min(1, Math.max(0, completed / total));
}

/** "45 %" in the interface language (whole percent; "<1 %" for a start). */
export function formatPercent(share: number): string {
  if (share > 0 && share < 0.01) return `<${formatNumber(0.01, { style: "percent" })}`;
  return formatNumber(Math.floor(share * 100) / 100, { style: "percent" });
}

/** A transfer rate, e.g. "12.5 MB/s". */
export function formatRate(bytesPerSecond: number): string {
  return `${formatLargeBytes(Math.round(bytesPerSecond))}/s`;
}

/** A duration in seconds as the interface language says it ("45 seconds", "3 minutes", "1 hour 5 minutes"). */
export function formatSeconds(seconds: number): string {
  const unit = (value: number, name: string) => formatNumber(value, { style: "unit", unit: name, unitDisplay: "long", maximumFractionDigits: 0 });
  if (seconds < 60) return unit(Math.max(1, Math.round(seconds)), "second");
  if (seconds < 3600) return unit(Math.round(seconds / 60), "minute");
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return minutes ? `${unit(hours, "hour")} ${unit(minutes, "minute")}` : unit(hours, "hour");
}

/**
 * A progress bar. `share` (0…1) makes it determinate, with `aria-valuenow`; null makes it indeterminate (an animated
 * stripe, no value), for work whose progress cannot be measured. `valueText` is what a screen reader says.
 */
export function ProgressBar({
  share,
  label,
  valueText,
  tone = "brand",
  testId,
}: {
  share: number | null;
  label: string;
  valueText?: string;
  tone?: "brand" | "danger" | "idle";
  testId?: string;
}) {
  const { t } = useTranslation();
  const determinate = share !== null;
  const percent = determinate ? Math.floor(share * 100) : undefined;
  return (
    <div
      className={`nd-progress nd-progress--${tone}${determinate ? "" : " nd-progress--indeterminate"}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={determinate ? 0 : undefined}
      aria-valuemax={determinate ? 100 : undefined}
      aria-valuenow={percent}
      aria-valuetext={valueText ?? (determinate ? formatPercent(share) : t("progress.indeterminate"))}
      data-testid={testId}
    >
      <div className="nd-progress__bar" style={determinate ? { width: `${share * 100}%` } : undefined} />
    </div>
  );
}

const STEP_ICON = { pending: Circle, running: Loader2, done: CheckCircle2, skipped: CircleSlash, failed: XCircle } as const;

/** The steps of an operation in order, the running one marked as the current step. */
export function StepList({ steps, label, testId }: { steps: ProgressStep[]; label: string; testId?: string }) {
  const { t } = useTranslation();
  return (
    <ol className="nd-steps" aria-label={label} data-testid={testId}>
      {steps.map((step) => {
        const Icon = STEP_ICON[step.state];
        return (
          <li
            key={step.id}
            className={`nd-steps__item nd-steps__item--${step.state}`}
            aria-current={step.state === "running" ? "step" : undefined}
            data-step={step.id}
            data-state={step.state}
          >
            <Icon size={14} aria-hidden className={step.state === "running" ? "spin" : undefined} />
            <div className="nd-steps__body">
              <span className="nd-steps__label">
                {step.label}
                <span className="sr-only">: {t(`progress.state.${step.state}`)}</span>
              </span>
              {step.note ? <span className="nd-steps__note">{step.note}</span> : null}
              {step.children}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Announces `message` to screen readers when it changes (a new step, the end), politely and once. Percentages are not
 * announced: they change every second and would drown everything else.
 */
export function LiveAnnouncer({ message }: { message: string }) {
  const [said, setSaid] = useState("");
  const last = useRef("");
  useEffect(() => {
    if (message && message !== last.current) {
      last.current = message;
      setSaid(message);
    }
  }, [message]);
  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {said}
    </div>
  );
}

/** Technical details, closed until asked for. */
export function TechnicalDetails({ children, testId }: { children: ReactNode; testId?: string }) {
  const { t } = useTranslation();
  return (
    <details className="nd-tech" data-testid={testId}>
      <summary>{t("progress.details")}</summary>
      <div className="nd-tech__body">{children}</div>
    </details>
  );
}
