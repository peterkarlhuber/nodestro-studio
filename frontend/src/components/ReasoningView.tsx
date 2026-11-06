// What a model transmitted of its reasoning, shown the same way everywhere (assistant, run chat, workflow runs,
// architect, agent test). Five states, always set apart from the answer:
//
// - thinking: a phase is open and no text has arrived (or the text is not shown) — a status only;
// - thinking text: the model's reasoning as generated (open-weight models);
// - reasoning summary: a summary the provider writes of reasoning it does not expose (OpenAI, Gemini, Claude 4+);
// - not transmitted: the model reasoned, the provider sent no text (redacted, omitted, or not asked for);
// - not exposed: the model does not reason, or its provider never sends reasoning.
//
// The text is only ever what the provider sent. Nothing here writes, completes or paraphrases reasoning.

import { Brain, ChevronRight, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ReasoningStreamInfo, ReasoningTrace } from "../api/types";
import { THINKING_DISPLAYS, type ThinkingDisplay, type ThinkingDisplayChoice, useThinkingDisplay } from "../lib/thinkingDisplay";

export type ReasoningState = "thinking" | "text" | "summary" | "notTransmitted" | "notExposed" | "none";

/** The state a trace (and, without one, the model's declaration) is in. */
export function reasoningState(trace: ReasoningTrace | null | undefined, info?: ReasoningStreamInfo | null): ReasoningState {
  if (trace && trace.text) return trace.kind === "thinking" ? "text" : "summary";
  if (trace?.active) return "thinking";
  if (trace && (trace.phases > 0 || trace.redacted)) return "notTransmitted";
  if (info?.text === "none") return "notExposed";
  return "none";
}

/** Why there is no text, in the interface language (the server's ``reason`` is English and only a fallback). */
function whyNoText(
  t: (key: string) => string,
  trace: ReasoningTrace | null | undefined,
  info: ReasoningStreamInfo | null | undefined,
): string {
  if (trace?.redacted) return t("reasoning.why.redacted");
  if (info?.request_option === "thinking_display") return t("reasoning.why.thinkingDisplay");
  if (info?.request_option && info.requested === false) return t("reasoning.why.notRequested");
  if (info?.text === "none") return t("reasoning.why.notExposed");
  return t("reasoning.why.noText");
}

export function ReasoningView({
  trace,
  display,
  info,
  showNotExposed = false,
  testId = "reasoning",
}: {
  trace: ReasoningTrace | null | undefined;
  display: ThinkingDisplay;
  /** The model's declaration, to explain an empty stream. */
  info?: ReasoningStreamInfo | null;
  /** Say so when the model does not expose reasoning at all (otherwise nothing is shown). */
  showNotExposed?: boolean;
  testId?: string;
}) {
  const { t } = useTranslation();
  const state = reasoningState(trace, info);
  const [open, setOpen] = useState<boolean | null>(null);
  const body = useRef<HTMLDivElement>(null);
  const active = Boolean(trace?.active);
  const text = trace?.text ?? "";
  const isOpen = open ?? display === "live";

  // While the text arrives and is open, the newest line stays in view (unless the reader scrolled up).
  useEffect(() => {
    const element = body.current;
    if (!element || !active || !isOpen) return;
    const nearEnd = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
    if (nearEnd || element.scrollTop === 0) element.scrollTop = element.scrollHeight;
  }, [text, active, isOpen]);

  if (state === "none" || (state === "notExposed" && !showNotExposed)) return null;

  const statusLabel = active ? t("reasoning.status.active") : t("reasoning.status.done");

  if (state === "thinking" || ((state === "text" || state === "summary") && display === "status")) {
    return (
      <div className="reasoning reasoning--status" data-testid={testId} data-state={active ? "thinking" : state}>
        <span className={`reasoning__icon${active ? " reasoning__icon--active" : ""}`} aria-hidden>
          <Brain size={13} />
        </span>
        <span role="status" aria-live="polite">
          {statusLabel}
        </span>
        {state !== "thinking" ? <span className="reasoning__note">{t("reasoning.hiddenByPreference")}</span> : null}
      </div>
    );
  }

  if (state === "notTransmitted" || state === "notExposed") {
    return (
      <div className="reasoning reasoning--empty" data-testid={testId} data-state={state}>
        <span className="reasoning__icon" aria-hidden>
          <EyeOff size={13} />
        </span>
        <span>
          <span role="status" aria-live="polite">
            {state === "notExposed" ? t("reasoning.state.notExposed") : t("reasoning.state.notTransmitted")}
          </span>
          <span className="reasoning__note">{whyNoText(t, trace, info)}</span>
        </span>
      </div>
    );
  }

  const label = state === "text" ? t("reasoning.state.text") : t("reasoning.state.summary");
  return (
    <details
      className={`reasoning reasoning--${state}`}
      data-testid={testId}
      data-state={state}
      open={isOpen}
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
    >
      <summary>
        <ChevronRight size={13} className="reasoning__chevron" aria-hidden />
        <span className={`reasoning__icon${active ? " reasoning__icon--active" : ""}`} aria-hidden>
          <Brain size={13} />
        </span>
        <span className="reasoning__label">{label}</span>
        <span className="reasoning__note" role="status" aria-live="polite">
          {statusLabel}
        </span>
      </summary>
      <div className="reasoning__body" ref={body} tabIndex={0} aria-label={label}>
        {text}
      </div>
      <p className="reasoning__source">
        {state === "text" ? t("reasoning.source.text") : t("reasoning.source.summary")}
      </p>
    </details>
  );
}

/** The choice for one conversation (or the global one, without "default"). */
export function ThinkingDisplayPicker({
  value,
  onChange,
  global,
  withDefault = true,
  label,
  testId = "thinking-display",
}: {
  value: ThinkingDisplayChoice;
  onChange: (value: ThinkingDisplayChoice) => void;
  /** The global choice, named in the "default" option. */
  global?: ThinkingDisplay;
  withDefault?: boolean;
  /** The field's name (default: "Reasoning"). */
  label?: string;
  testId?: string;
}) {
  const { t } = useTranslation();
  const choices: ThinkingDisplayChoice[] = withDefault ? ["default", ...THINKING_DISPLAYS] : [...THINKING_DISPLAYS];
  return (
    <label className="reasoning-picker">
      <span>{label ?? t("reasoning.display.label")}</span>
      <select
        className="nd-input nd-select"
        value={value}
        data-testid={testId}
        onChange={(event) => onChange(event.target.value as ThinkingDisplayChoice)}
      >
        {choices.map((choice) => (
          <option key={choice} value={choice}>
            {choice === "default"
              ? t("reasoning.display.default", { value: t(`reasoning.display.${global ?? "collapsed"}`) })
              : t(`reasoning.display.${choice}`)}
          </option>
        ))}
      </select>
    </label>
  );
}

/** The display picker of one conversation (``scope``, e.g. "conversation:<id>"); it follows the global one by default. */
export function ScopedThinkingDisplay({ scope, testId }: { scope: string; testId?: string }) {
  const { choice, global, setChoice } = useThinkingDisplay(scope);
  return <ThinkingDisplayPicker value={choice} global={global} onChange={setChoice} testId={testId} />;
}
