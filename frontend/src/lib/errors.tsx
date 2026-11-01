// Messages from the backend in the interface language, with the technical original on demand.
//
// The backend sends a code with parameters (e.g. "trace.not_json") and the technical text in
// English. The sentence comes from errors.<code> in the language files; an unknown code gets a
// generic sentence for its area. The original text stays available under "Technical details".
// Runs stored before codes existed carry German texts only; they are recognised here, so old
// runs read in the current language too.

import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Link, useInRouterContext } from "react-router-dom";

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
    if (key === "provider" && !value) {
      // A provider error without a name: the sentence speaks of the provider in general.
      result[key] = t("errors.run.someProvider");
      continue;
    }
    if (key === "reason" && typeof value === "string" && /^provider\.[a-z_]+$/.test(value)) {
      // Pre-checks of Amazon Bedrock name the provider problem behind them ("check.bedrock_settings_invalid").
      result[key] = problemText(t, { code: value, params: { ...params, reason: undefined } });
      continue;
    }
    if (key === "permission" && typeof value === "string" && value) {
      // Permissions come as ids ("edit"); the sentence names them (AD-04).
      result[key] = t(`admin.permissions.${value}`, { defaultValue: value });
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

/** The code and parameters of a coded message, also for stored messages without a code. */
function resolved(item: Coded): { code: string | null; params: Record<string, unknown> } {
  let code = item.code ?? null;
  let params = item.params ?? {};
  if (!code && item.message) {
    const legacy = legacyCode(item.message);
    if (legacy) ({ code, params } = legacy);
  }
  return refineProblem(code, params, item.message ?? "");
}

/**
 * Provider failures the runtime sorts itself (AD-01): the key (``run.provider_auth``), no answer
 * (``run.provider_unreachable``), too many requests (``run.provider_rate_limited``) and no capacity
 * (``run.provider_overloaded``), with ``params.provider`` and, when the provider answered, ``params.status``.
 */
export const PROVIDER_FAILURES = new Set([
  "run.provider_auth",
  "run.provider_auth_aws",
  "run.provider_unreachable",
  "run.provider_rate_limited",
  "run.provider_overloaded",
]);

/**
 * A more specific reading of a few agent failures, from facts the runtime already reports: the HTTP status of a
 * provider error and the stop reason in the technical text of an incomplete response. The codes it returns
 * (``run.api_error_*``, ``run.agent.ContextWindowExceeded``) exist only in the interface, for their own sentence
 * and advice; nothing is guessed beyond what the run recorded. Runs since the runtime sorts provider failures
 * itself carry ``run.provider_*`` and are taken as they are; ``run.api_error`` then only means "anything else",
 * and the reading of its status stays for that and for older runs.
 */
export function refineProblem(
  code: string | null,
  params: Record<string, unknown>,
  message: string,
): { code: string | null; params: Record<string, unknown> } {
  // The sentences name the provider; without one they speak of the provider in general.
  // Amazon Bedrock has no API key: a refused sign-in is about AWS credentials and IAM permissions.
  if (code === "run.provider_auth" && params.provider === "bedrock") return { code: "run.provider_auth_aws", params };
  // An export signs in with the target machine's AWS credentials: no key variable to set.
  if (code === "export.provider" && params.provider === "bedrock") return { code: "export.provider_aws", params };
  // Its "not set up" means no region or sign-in method, not a missing base URL.
  if (code === "provider.not_configured" && params.provider === "bedrock") return { code: "provider.bedrock_not_configured", params };
  if (code && PROVIDER_FAILURES.has(code)) return { code, params: { ...params, provider: params.provider ?? "" } };
  if (code === "run.api_error") {
    params = { ...params, provider: params.provider ?? "" };
    // The technical text names the library's error class; the status is the provider's HTTP answer (empty when
    // there was none). Either clearly tells the cause; otherwise the general sentence stays, without a status.
    const status = Number(params.status);
    const empty = params.status === "" || params.status === null || params.status === undefined;
    if (/\bAuthenticationError\b/.test(message) || status === 401 || status === 403) return { code: "run.api_error_auth", params };
    if (/\bRateLimitError\b/.test(message) || status === 429) return { code: "run.api_error_rate_limit", params };
    if (/\bProviderServerError\b/.test(message) || status >= 500) return { code: "run.api_error_server", params };
    if (/\bProviderConnectionError\b/.test(message) || (empty && !/\bInvalidRequestError\b/.test(message)))
      return { code: "run.api_error_connection", params };
    return { code: empty ? "run.api_error_invalid" : "run.api_error_status", params };
  }
  if (code === "run.agent.IncompleteResponseError") {
    const stop = /stop_reason='([^']*)'/.exec(message)?.[1] ?? "";
    const limit = /max_tokens=(\d+)/.exec(message)?.[1];
    if (stop.includes("context")) return { code: "run.agent.ContextWindowExceeded", params };
    if (limit) return { code, params: { ...params, max_tokens: Number(limit).toLocaleString(i18n.language) } };
    return { code: "run.agent.OutputLimitReached", params };
  }
  return { code, params };
}

/** The code a coded message is read with (also for stored messages without a code, and refined ones). */
export function problemCode(item: Coded): string | null {
  return resolved(item).code;
}

/** What the person can do about a coded problem (errors.hints.<code>), or null when there is no advice. */
export function problemHint(t: TFunction, item: Coded): string | null {
  const { code, params } = resolved(item);
  if (!code) return null;
  const values = interpolationParams(t, params);
  const key = `errors.hints.${textKey(code)}`;
  return i18n.exists(key, values) ? t(key, values) : null;
}

/** The sentence for a coded message in the current language. */
export function problemText(t: TFunction, item: Coded): string {
  const { code, params } = resolved(item);
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
  const hint = compact ? null : problemHint(t, item);
  return (
    <>
      <span>{text}</span>
      {hint ? (
        <span className="problem-hint" data-testid="problem-hint">
          {hint}
        </span>
      ) : null}
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

/**
 * AWS sign-in problems of Amazon Bedrock (no key involved): missing or refused credentials, a profile that does not
 * exist, missing permissions, a residency the settings forbid. Solved under Settings → AI providers.
 */
export const AWS_PROVIDER_PROBLEMS = new Set([
  "provider.aws_credentials_missing",
  "provider.aws_credentials_invalid",
  "provider.aws_access_denied",
  "provider.aws_profile_not_found",
  "provider.aws_region_invalid",
  "provider.aws_model_not_found",
  "provider.aws_unreachable",
  "provider.aws_rate_limited",
  "provider.aws_verification_failed",
  "provider.data_residency_violation",
  "provider.data_residency_region",
]);

/** A refused API key or AWS sign-in, from the runtime's own code or read from an older run's provider error. */
export function isProviderAuth(code: string | null | undefined): boolean {
  return (
    code === "run.provider_auth" ||
    code === "run.provider_auth_aws" ||
    code === "run.api_error_auth" ||
    code === "provider.aws_credentials_missing" ||
    code === "provider.aws_credentials_invalid" ||
    code === "provider.aws_access_denied" ||
    code === "provider.aws_profile_not_found"
  );
}

/** Problems a person solves in Settings → AI providers (a missing key or endpoint), with or without an area prefix. */
export function needsProviderSetup(item: Coded | null | undefined): boolean {
  const code = item?.code ?? "";
  return (
    /(^|\.)(api_key_missing|provider_not_configured|bedrock_not_configured|bedrock_settings_invalid)$/.test(code) ||
    /(^|\.)provider\.(not_configured|region_missing|region_invalid|region_not_allowed|aws_credentials_missing|aws_profile_not_found)$/.test(code)
  );
}

/** "Set up AI provider" after such a problem; nothing for other problems. */
export function ProviderSetupLink({ item }: { item: Coded | null | undefined }) {
  const { t } = useTranslation();
  const routed = useInRouterContext();
  if (!needsProviderSetup(item)) return null;
  const label = t("errors.setupProvider");
  return (
    <>
      {" "}
      {routed ? (
        <Link to="/settings" data-testid="provider-setup-link">
          {label}
        </Link>
      ) : (
        <a href="/settings">{label}</a>
      )}
    </>
  );
}
