// The reasoning of an answer or a step as its live events arrive, the same way the server keeps it
// (nodestro_runtime.reasoning.ReasoningTrace). The server already sends the paragraph break between phases inside the
// text of a delta, so the text is only ever joined, never changed.

import type { ReasoningKind, ReasoningTrace } from "../api/types";

export const EMPTY_TRACE: ReasoningTrace = { text: "", kind: null, phases: 0, redacted: false, active: false };

function asKind(value: unknown): ReasoningKind {
  return value === "thinking" ? "thinking" : "summary";
}

/** A ``thinking_status`` event: ``started`` opens a phase, anything else closes it. */
export function withStatus(trace: ReasoningTrace | null | undefined, state: unknown, redacted: unknown): ReasoningTrace {
  const current = trace ?? EMPTY_TRACE;
  if (state === "started") {
    return { ...current, phases: current.phases + 1, active: true, redacted: current.redacted || Boolean(redacted) };
  }
  return { ...current, active: false };
}

/** A ``thinking`` event: text the provider sent. */
export function withDelta(trace: ReasoningTrace | null | undefined, text: string, kind: unknown): ReasoningTrace {
  const current = trace ?? EMPTY_TRACE;
  return {
    ...current,
    text: current.text + text,
    kind: asKind(kind),
    phases: Math.max(current.phases, 1),
    active: current.phases === 0 ? true : current.active,
  };
}

/** The trace with no phase open (the answer or the step has ended). */
export function settled(trace: ReasoningTrace | null | undefined): ReasoningTrace | null {
  return trace ? { ...trace, active: false } : null;
}

/** The reasoning of a run step (its ``thinking*`` fields); null when the step did not reason. */
export function nodeTrace(state: {
  status?: string;
  thinking?: string | null;
  thinking_kind?: ReasoningKind | null;
  thinking_phases?: number;
  thinking_redacted?: boolean;
  thinking_active?: boolean;
}): ReasoningTrace | null {
  const text = state.thinking ?? "";
  const phases = state.thinking_phases ?? (text ? 1 : 0);
  if (!text && !phases && !state.thinking_active) return null;
  return {
    text,
    // Runs stored before the kind was recorded held Anthropic's (summarized) thinking.
    kind: text ? (state.thinking_kind ?? "summary") : null,
    phases,
    redacted: Boolean(state.thinking_redacted),
    active: state.status === "running" && Boolean(state.thinking_active),
  };
}
