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
import { dockerReasonKey, isDockerReason } from "../api/types";
import i18n from "../i18n";
import { formatLargeBytes } from "./format";
import { useSettingsHref } from "./settingsLink";

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
  ["local.", "errors.local.failed"],
  ["knowledge.", "errors.knowledge.failed"],
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

function interpolationParams(t: TFunction, params: Record<string, unknown> | null | undefined, code?: string | null): Record<string, unknown> {
  // Values are shown as they are; nested problems (e.g. why a workflow cannot start) in the current language too.
  const result: Record<string, unknown> = {};
  const special = codeParams(t, code ?? null, params ?? {});
  if (special) return special;
  for (const [key, value] of Object.entries(params ?? {})) {
    if ((key === "tokens" || key === "recommended" || key === "max_tokens") && typeof value === "number") {
      // Token counts of the local context checks: 32768 reads as "32,768".
      result[key] = value.toLocaleString(i18n.language);
      continue;
    }
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
    if (key === "reason" && typeof value === "string" && isDockerReason(value)) {
      // A sandbox refusal in automatic or Docker mode names Docker's reason (DS-3); the sentence reads it.
      result[key] = t(dockerReasonKey(value)!);
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

/** Parameters of a few codes that need more than the per-key reading below (or null for all other codes). */
function codeParams(t: TFunction, code: string | null, params: Record<string, unknown>): Record<string, unknown> | null {
  if (code === "export.download_needed" || code === "export.downloads") return { ...params, items: downloadList(t, downloadCodes(params)) };
  if (code === "export.server_too_large")
    return { ...params, size: formatLargeBytes(Number(params.size)), limit: formatLargeBytes(Number(params.limit)) };
  if (code === "local.invalid_package_reason") return { ...params, reason: t(`errors.local.${String(params.reason)}`, { defaultValue: String(params.reason) }) };
  return null;
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
  // BUDGET-1: a budget decision nobody made in time is stored as "budget used up" with ``expired``.
  if (code === "run.budget_exceeded" && params.expired === true) return { code: "run.budget_request_expired", params };
  // A refused budget decision of someone who may run but did not start the run (and is no administrator).
  if (code === "access.forbidden" && params.reason === "budget.not_starter") return { code: "budget.not_starter", params };
  // Validation answers name their fields either as ``fields`` (text) or as ``errors`` (one item per field); the
  // sentence lists the field names, or speaks of the input in general when there are none.
  if (code === "request.invalid" && !params.fields) {
    const names = Array.isArray(params.errors)
      ? [...new Set(params.errors.map((item) => (item && typeof item === "object" ? (item as { field?: unknown }).field : null)))]
          .filter((name): name is string => typeof name === "string" && name !== "")
      : [];
    return names.length ? { code, params: { ...params, errors: undefined, fields: names.join(", ") } } : { code: "request.invalid_plain", params };
  }
  // A size limit, when the server names it.
  if (code === "request.too_large" && params.limit_mb != null) return { code: "request.too_large_limit", params };
  // The downloads a portable build needs: codes (python, libraries, ollama) named in words. Older APIs send them only
  // joined in ``items`` and a failed build job names one in ``what``; without any of them the sentence stays general.
  if ((code === "export.download_needed" || code === "export.downloads") && !downloadCodes(params).length)
    return { code: `${code}_plain`, params };
  // A server's size limit for portable packages: the refused estimate names both sizes, a failed build job neither.
  if (code === "export.server_too_large" && !(Number(params.size) > 0 && Number(params.limit) > 0))
    return { code: "export.server_too_large_plain", params };
  // An offline model package refused before its import started: the folder, and what is wrong with it when the
  // agent library's reason has a sentence of its own (a damaged manifest, an invalid model name).
  if (code === "local.invalid_package" && typeof params.path === "string" && params.path)
    return { code: PACKAGE_REASONS.has(params.reason as string) ? "local.invalid_package_reason" : "local.invalid_package_path", params };
  if (code && PROVIDER_FAILURES.has(code)) return { code, params: { ...params, provider: params.provider ?? "" } };
  // A source-only package a person accepted to build: its build script runs only in a container. The runtime names
  // why that container could not run (no Docker, or no pinned resolver image); never on this computer.
  if (code === "deps.build_required" && params.reason === "sandbox.unavailable") return { code: "deps.build_required_no_docker", params };
  if (code === "deps.build_required" && params.reason === "deps.build_unavailable") return { code: "deps.build_required_not_set_up", params };
  // Docker-first (DS-3): why AI-created code was refused. The subprocess mode is for trusted use only; automatic and
  // Docker mode name Docker's reason; the built-in Linux sandbox gives AI-created tools no third-party libraries.
  if (code === "sandbox.isolation_required" && params.reason === "subprocess-mode")
    return { code: "sandbox.isolation_required_subprocess", params };
  if (code === "sandbox.isolation_required" && isDockerReason(params.reason as string))
    return { code: "sandbox.isolation_required_docker", params };
  if (code === "sandbox.libraries_need_isolation" && params.mode === "linux")
    return { code: "sandbox.libraries_need_isolation_linux", params };
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

/** Reasons of a refused offline package whose own sentence (errors.local.<reason>) says what is wrong. */
const PACKAGE_REASONS = new Set(["checksum_mismatch", "invalid_name"]);

/** The download codes of a portable export problem: ``downloads`` (since API PR #87), else ``items`` or ``what``. */
export function downloadCodes(params: Record<string, unknown>): string[] {
  if (Array.isArray(params.downloads)) return params.downloads.filter((item): item is string => typeof item === "string" && item !== "");
  if (typeof params.items === "string" && params.items.trim()) return params.items.split(",").map((item) => item.trim()).filter(Boolean);
  if (typeof params.what === "string" && params.what) return [params.what];
  return [];
}

/** Download codes in words ("Python and the libraries"); an unknown code stays as it came. */
export function downloadList(t: TFunction, codes: string[]): string {
  const names = codes.map((item) => t(`publish.export.portable.download.${item}`, { defaultValue: item }));
  try {
    // The language of ``t`` (a fixed one in tests and previews), else the interface's.
    const language = (t as unknown as { lng?: string }).lng || i18n.language;
    return new Intl.ListFormat(language, { style: "long", type: "conjunction" }).format(names);
  } catch {
    return names.join(", ");
  }
}

/** The code a coded message is read with (also for stored messages without a code, and refined ones). */
export function problemCode(item: Coded): string | null {
  return resolved(item).code;
}

/** What the person can do about a coded problem (errors.hints.<code>), or null when there is no advice. */
export function problemHint(t: TFunction, item: Coded): string | null {
  const { code, params } = resolved(item);
  if (!code) return null;
  const values = interpolationParams(t, params, code);
  const key = `errors.hints.${textKey(code)}`;
  return i18n.exists(key, values) ? t(key, values) : null;
}

/**
 * A sandbox refusal names the refused tool (NJR-08), so with several tools on one agent it is clear which one is
 * blocked; sentences that already contain the name stay as they are.
 */
function namedTool(t: TFunction, code: string, params: Record<string, unknown>, text: string): string {
  const name = params.name;
  if (!code.startsWith("sandbox.") || typeof name !== "string" || !name.trim() || text.includes(name)) return text;
  return t("errors.namedTool", { name, text });
}

/** The sentence for a coded message in the current language. */
export function problemText(t: TFunction, item: Coded): string {
  const { code, params } = resolved(item);
  if (code) {
    const values = interpolationParams(t, params, code);
    // With the values, a plural key ("…_one", "…_other") counts as existing too.
    const key = `errors.${textKey(code)}`;
    if (i18n.exists(key, values)) return namedTool(t, code, params, t(key, values));
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

/**
 * A backend's own text (in English, whatever the interface language) folded away under "Technical details", so it
 * never reads as an untranslated sentence (NSL-11). The text is shown as it came; it is never translated.
 */
export function TechnicalDetails({ text, testId }: { text: string; testId?: string }) {
  const { t } = useTranslation();
  return (
    <details className="technical" data-testid={testId}>
      <summary>{t("common.technicalDetails")}</summary>
      <code lang="en">{text}</code>
    </details>
  );
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
      {technical ? <TechnicalDetails text={technical} /> : null}
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
        <RoutedSetupLink label={label} provider={typeof item?.params?.provider === "string" ? item.params.provider : undefined} />
      ) : (
        <a href="/settings">{label}</a>
      )}
    </>
  );
}

/** Problems a person solves in Settings → Sandbox: AI-created code that needs isolation no sandbox here offers. */
export function needsSandboxSetup(item: Coded | null | undefined): boolean {
  return /^sandbox\.isolation_required/.test(item?.code ?? "");
}

/** "Open Settings → Sandbox" after such a problem (the path the sentence names, as a link); nothing otherwise. */
export function SandboxSetupLink({ item, always = false }: { item?: Coded | null; always?: boolean }) {
  const { t } = useTranslation();
  const routed = useInRouterContext();
  if (!always && !needsSandboxSetup(item)) return null;
  const label = t("errors.openSandbox");
  return routed ? <RoutedSandboxLink label={label} /> : <a href="/settings#settings-sandbox">{label}</a>;
}

function RoutedSandboxLink({ label }: { label: string }) {
  return (
    <Link to={useSettingsHref("settings-sandbox")} data-testid="sandbox-setup-link">
      {label}
    </Link>
  );
}

/** Inside the app: to the AI providers in the settings, with the way back to this page. */
function RoutedSetupLink({ label, provider }: { label: string; provider?: string }) {
  return (
    <Link to={useSettingsHref(provider ? `provider-${provider}` : "settings-providers")} data-testid="provider-setup-link">
      {label}
    </Link>
  );
}
