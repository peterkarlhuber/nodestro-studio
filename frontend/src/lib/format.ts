// Numbers, dates, durations and USD amounts in the format of the interface language.
//
// Every function reads the current language when it is called, so components that re-render
// on a language change (useTranslation) show the new format at once. Values themselves never
// change: costs stay US dollars, token counts stay exact.

import type { NodeStatus, RunStatus, Usage } from "../api/types";
import i18n, { formatLocale } from "../i18n";

function locale(): string {
  return formatLocale();
}

function numberFormat(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  return new Intl.NumberFormat(locale(), options);
}

export function formatNumber(value: number, options: Intl.NumberFormatOptions = {}): string {
  return numberFormat(options).format(value);
}

export function formatTokens(value: number | null | undefined): string {
  if (!value) return formatNumber(0);
  return value < 10_000 ? formatNumber(value) : formatNumber(value, { notation: "compact", maximumFractionDigits: 1 });
}

/** The smallest non-zero amount shown exactly; anything below appears as "< $0.000001". */
export const SMALLEST_COST = 0.000001;

/**
 * A US-dollar amount in the style of the interface language ("$1,234.50", "1.234,50 $",
 * "US$ 0,0042" …). Amounts below one cent keep three significant digits, up to six decimals.
 */
export function formatCost(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "–";
  const usd = (amount: number, options: Intl.NumberFormatOptions) =>
    numberFormat({ style: "currency", currency: "USD", ...options }).format(amount);
  const size = Math.abs(value);
  if (size === 0 || size >= 0.01) return usd(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (size < SMALLEST_COST) return `< ${usd(SMALLEST_COST, { maximumFractionDigits: 6 })}`;
  return usd(value, { maximumSignificantDigits: 3, maximumFractionDigits: 6, roundingPriority: "lessPrecision" });
}

/** The sum of costs; unknown (null) as soon as one of them is unknown, never counted as 0. */
export function sumCosts(...values: (number | null | undefined)[]): number | null {
  let total = 0;
  for (const value of values) {
    if (value === null || value === undefined) return null;
    total += value;
  }
  return total;
}

/** A price such as "$5" or "$0.30" per million tokens, with as many decimals as it has; "–" when unknown. */
export function formatPrice(value: number | null): string {
  if (value === null) return "–";
  return numberFormat({ style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(
    value,
  );
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "–";
  return new Date(value).toLocaleString(locale(), { dateStyle: "medium", timeStyle: "short" });
}

/** A short day ("27.10.", "10/27", "27 oct") for a YYYY-MM-DD bucket of the usage report. */
export function formatDay(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toLocaleDateString(locale(), { day: "numeric", month: "numeric", timeZone: "UTC" });
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "–";
  return new Date(value).toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function formatDuration(start: string | null | undefined, end: string | null | undefined): string {
  if (!start) return "–";
  const ms = (end ? new Date(end).getTime() : Date.now()) - new Date(start).getTime();
  if (ms < 1000) return `${formatNumber(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${formatNumber(seconds, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`;
  return `${formatNumber(Math.floor(seconds / 60))} min ${formatNumber(Math.round(seconds % 60))} s`;
}

export function formatBytes(size: number): string {
  const unit = (value: number, name: string, digits: number) =>
    formatNumber(value, { style: "unit", unit: name, unitDisplay: "short", maximumFractionDigits: digits, minimumFractionDigits: digits });
  if (size < 1024) return unit(size, "byte", 0);
  if (size < 1024 * 1024) return unit(size / 1024, "kilobyte", 1);
  return unit(size / 1024 / 1024, "megabyte", 1);
}

export function relativeTime(value: string): string {
  const seconds = (Date.now() - new Date(value).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: "auto" });
  if (seconds < 60) return rtf.format(0, "second");
  if (seconds < 3600) return rtf.format(-Math.round(seconds / 60), "minute");
  if (seconds < 86400) return rtf.format(-Math.round(seconds / 3600), "hour");
  return rtf.format(-Math.round(seconds / 86400), "day");
}

export type Tone = "success" | "running" | "warning" | "danger" | "idle";

/** The tone of every status; label and description come from status.<status> in the language files. */
export const STATUS_TONE: Record<NodeStatus | RunStatus, Tone> = {
  idle: "idle",
  waiting: "idle",
  queued: "idle",
  running: "running",
  succeeded: "success",
  failed: "danger",
  skipped: "idle",
  blocked: "warning",
  awaiting_approval: "warning",
  paused: "warning",
  cancelled: "warning",
};

export function outputText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

/** "1,200 in · 300 out · 5,000 from cache …": the parts that make up a token total. */
export function tokenBreakdown(usage: Usage): string {
  const t = i18n.t.bind(i18n);
  const parts = [
    t("usage.breakdown.input", { value: formatTokens(usage.input_tokens) }),
    t("usage.breakdown.output", { value: formatTokens(usage.output_tokens) }),
  ];
  if (usage.cache_read_input_tokens)
    parts.push(t("usage.breakdown.cacheRead", { value: formatTokens(usage.cache_read_input_tokens) }));
  if (usage.cache_creation_input_tokens)
    parts.push(t("usage.breakdown.cacheWrite", { value: formatTokens(usage.cache_creation_input_tokens) }));
  if (usage.thinking_tokens) parts.push(t("usage.breakdown.thinking", { value: formatTokens(usage.thinking_tokens) }));
  if (usage.web_search_requests)
    parts.push(t("usage.breakdown.webSearches", { count: usage.web_search_requests, value: formatNumber(usage.web_search_requests) }));
  return parts.join(" · ");
}
