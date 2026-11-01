// Messages from the backend in the interface language, with the technical original on demand.
//
// The backend sends a code with parameters (e.g. "trace.not_json") and the technical text in
// English. The sentence comes from errors.<code> in the language files; an unknown code gets a
// generic sentence for its area. The original text stays available under "Technical details".
// Runs stored before codes existed carry German texts only; they are recognised here, so old
// runs read in the current language too.

import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { ApiError } from "../api/client";
import i18n from "../i18n";

export interface Coded {
  code?: string | null;
  params?: Record<string, unknown> | null;
  message?: string | null;
}

/** Library error classes the run view explains in its own words (run.agent.<Class>). */
const LEGACY: [RegExp, string, (match: RegExpExecArray) => Record<string, unknown>][] = [
  [/^Der Lauf wurde abgebrochen$/, "run.cancelled", () => ({})],
  [/^Abgebrochen$/, "run.node_cancelled", () => ({})],
  [/^Übersprungen, weil ein vorheriger Knoten nicht erfolgreich war$/, "run.skipped", () => ({})],
  [/^Fehlgeschlagen: (.+)$/s, "run.nodes_failed", (match) => ({ nodes: match[1] })],
  [/^Nicht alle Knoten liefen$/, "run.incomplete", () => ({})],
  [/^Unvollständiger Trace/, "trace.unfinished", () => ({})],
  [/^BudgetExceededError\b/, "run.budget_exceeded", () => ({})],
  [/^(\w+Error)\b/, "run.agent.$1", (match) => ({ type: match[1] })],
];

/** The code of a stored message that has none (runs saved before codes existed). */
export function legacyCode(text: string): { code: string; params: Record<string, unknown> } | null {
  for (const [pattern, code, params] of LEGACY) {
    const match = pattern.exec(text);
    if (match) return { code: code.replace("$1", match[1] ?? ""), params: params(match) };
  }
  return null;
}

/** Generic sentences for codes the interface does not know (yet), by area. */
const FALLBACKS: [string, string][] = [
  ["run.agent.", "errors.run.agentFailed"],
  ["agent.", "errors.agentFailed"],
  ["run.", "errors.run.failed"],
  ["config.", "errors.config.library"],
  ["tool.", "errors.tool.failed"],
  ["trace.", "errors.trace.invalid"],
  ["deps.", "errors.deps.failed"],
  ["http.", "errors.http"],
];

/**
 * Codes whose texts live under another key: errors.library is the agent library's own sentence, so the example
 * library's codes ("library.integration_unavailable") are kept under errors.examples.
 */
const ALIASES: [string, string][] = [["library.", "examples."]];

function textKey(code: string): string {
  const alias = ALIASES.find(([prefix]) => code.startsWith(prefix));
  return alias ? alias[1] + code.slice(alias[0].length) : code;
}

function interpolationParams(t: TFunction, params: Record<string, unknown> | null | undefined): Record<string, unknown> {
  // Values are shown as they are; nested problems (e.g. why a workflow cannot start) in the current language too.
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (key === "provider" && typeof value === "string" && value) {
      // Providers come as ids ("openai"); the sentence names them.
      result[key] = t(`providers.names.${value}`, { defaultValue: value });
      continue;
    }
    result[key] = Array.isArray(value)
      ? value.map((item) => (item && typeof item === "object" ? nestedText(t, item as Coded & { field?: string }) : String(item))).join("; ")
      : value;
  }
  return result;
}

/** A nested problem; a form field's problem names its field. */
function nestedText(t: TFunction, item: Coded & { field?: string }): string {
  const text = problemText(t, item);
  return item.field ? `${item.field}: ${text}` : text;
}

/** The sentence for a coded message in the current language. */
export function problemText(t: TFunction, item: Coded): string {
  let code = item.code ?? null;
  let params = item.params ?? {};
  if (!code && item.message) {
    const legacy = legacyCode(item.message);
    if (legacy) ({ code, params } = legacy);
  }
  if (code) {
    const values = interpolationParams(t, params);
    // With the values, a plural key ("…_one", "…_other") counts as existing too.
    const key = `errors.${textKey(code)}`;
    if (i18n.exists(key, values)) return t(key, values);
    const fallback = FALLBACKS.find(([prefix]) => code!.startsWith(prefix));
    if (fallback) return t(fallback[1], values);
  }
  return t("errors.unknown");
}

/** The coded parts of a thrown error (an ApiError, an Error, or anything else). */
export function codedError(error: unknown): Coded {
  if (error instanceof ApiError) return { code: error.code, params: error.params, message: error.message };
  if (error instanceof LocalError) return { code: error.code, params: error.params, message: error.message };
  if (error instanceof Error) return { code: null, message: error.message };
  return { code: null, message: String(error) };
}

/** An error raised in the browser with a code from the language files (errors.<code>). */
export class LocalError extends Error {
  constructor(
    readonly code: string,
    readonly params: Record<string, unknown> = {},
  ) {
    super(code);
  }
}

export function errorText(t: TFunction, error: unknown): string {
  return problemText(t, codedError(error));
}

/** The technical text worth showing next to the sentence (never the same words twice). */
export function technicalText(t: TFunction, item: Coded): string | null {
  if (!item.message || item.message === item.code) return null;
  return item.message === problemText(t, item) ? null : item.message;
}

/** A localized message, with the technical original folded away below it. */
export function ProblemText({ item, compact = false }: { item: Coded; compact?: boolean }) {
  const { t } = useTranslation();
  const text = problemText(t, item);
  const technical = compact ? null : technicalText(t, item);
  return (
    <>
      <span>{text}</span>
      {technical ? (
        <details className="technical">
          <summary>{t("common.technicalDetails")}</summary>
          <code>{technical}</code>
        </details>
      ) : null}
    </>
  );
}

/** The same for a thrown error, e.g. a failed query or mutation. */
export function ErrorText({ error, compact }: { error: unknown; compact?: boolean }) {
  return <ProblemText item={codedError(error)} compact={compact} />;
}

/** Coded message of a run or node: its error with code, or the legacy text. */
export function runProblem(target: { error: string | null; error_code?: string | null; error_params?: Record<string, unknown> }): Coded {
  return { code: target.error_code ?? null, params: target.error_params ?? {}, message: target.error };
}
