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

/** Formatters by locale and options: creating an Intl.NumberFormat costs far more than using one (ST-004). */
const NUMBER_FORMATS = new Map<string, Intl.NumberFormat>();

function numberFormat(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const tag = locale();
  const key = `${tag}|${JSON.stringify(options)}`;
  let found = NUMBER_FORMATS.get(key);
  if (!found) {
    found = new Intl.NumberFormat(tag, options);
    // Option sets are few (a handful per function); the bound only guards against an unexpected variety.
    if (NUMBER_FORMATS.size > 200) NUMBER_FORMATS.clear();
    NUMBER_FORMATS.set(key, found);
  }
  return found;
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

/** Midnight UTC exactly: a value that carries a day, not a moment (the built-in price list is checked by day). */
const DAY_ONLY = /^\d{4}-\d{2}-\d{2}(T00:00(:00(\.0+)?)?(Z|[+-]00:?00)?)?$/;

/**
 * A moment, or just its day when the value has no time of day (NSL-15: a price checked "on Oct 31" read
 * "Oct 31, 2026, 12:00 AM" in English, a time nobody checked anything at).
 */
export function formatDateOrDay(value: string | null | undefined): string {
  if (!value) return "–";
  if (!DAY_ONLY.test(value)) return formatDate(value);
  const day = value.slice(0, 10);
  return new Date(`${day}T00:00:00Z`).toLocaleDateString(locale(), { dateStyle: "medium", timeZone: "UTC" });
}

/** A short day ("27.10.", "10/27", "27 oct") for a YYYY-MM-DD bucket of the usage report. */
export function formatDay(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toLocaleDateString(locale(), { day: "numeric", month: "numeric", timeZone: "UTC" });
}

/**
 * A time of day with seconds, in the same style as the time in formatDate (NSL-15: "2-digit" hours gave
 * "08:04:02 AM" in English next to "8:04 AM"; German keeps "08:04:02").
 */
export function formatTime(value: string | null | undefined): string {
  if (!value) return "–";
  return new Date(value).toLocaleTimeString(locale(), { timeStyle: "medium" });
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
  // One unit system everywhere (ST-056): decimal kB, MB and GB, the units the names stand for and the ones model
  // catalogs and download pages use, so "999.9 MB" is followed by "1.0 GB" and never by a jump.
  const unit = (value: number, name: string, digits: number, display: "short" | "long" = "short") =>
    formatNumber(value, { style: "unit", unit: name, unitDisplay: display, maximumFractionDigits: digits, minimumFractionDigits: digits });
  // Bytes spelled out: the short form has no plural in English ("0 byte", AD-17).
  if (size < 1000) return unit(size, "byte", 0, "long");
  if (size < 1_000_000) return unit(size / 1000, "kilobyte", 1);
  return unit(size / 1_000_000, "megabyte", 1);
}

/**
 * Model, download and package sizes: GB from 1 GB on, so "3.3 GB" instead of "3,300.0 MB"; smaller values as
 * formatBytes.
 */
export function formatLargeBytes(size: number): string {
  if (size < 1_000_000_000) return formatBytes(size);
  return formatNumber(size / 1_000_000_000, { style: "unit", unit: "gigabyte", maximumFractionDigits: 1, minimumFractionDigits: 1 });
}

/** Sizes compared in one sentence ("about 900 MB, more than 2.1 GB"), all in the unit of the largest one. */
export function formatComparedBytes(sizes: number[]): string[] {
  const largest = Math.max(...sizes);
  if (largest < 1_000_000_000) return sizes.map(formatBytes);
  return sizes.map((size) =>
    formatNumber(size / 1_000_000_000, { style: "unit", unit: "gigabyte", maximumFractionDigits: 1, minimumFractionDigits: 1 }),
  );
}

export function relativeTime(value: string): string {
  const seconds = (Date.now() - new Date(value).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: "auto" });
  if (seconds < 60) return rtf.format(0, "second");
  if (seconds < 3600) return rtf.format(-Math.round(seconds / 60), "minute");
  if (seconds < 86400) return rtf.format(-Math.round(seconds / 3600), "hour");
  return rtf.format(-Math.round(seconds / 86400), "day");
}

/**
 * "changed …" for a card: "changed just now" under a minute (TX-14; the relative format alone reads "changed now",
 * de "geändert jetzt"), otherwise "changed 5 minutes ago".
 */
export function changedText(t: (key: string, options?: Record<string, unknown>) => string, value: string): string {
  const seconds = (Date.now() - new Date(value).getTime()) / 1000;
  return seconds < 60 ? t("workflows.changedJustNow") : t("common.changed", { time: relativeTime(value) });
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
  awaiting_budget: "warning",
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
