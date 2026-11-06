import { afterEach, describe, expect, it, vi } from "vitest";

import i18n, { type Language, setLanguage } from "../i18n";
import {
  changedText,
  formatBytes,
  formatComparedBytes,
  formatCost,
  formatDate,
  formatDateOrDay,
  formatDay,
  formatDuration,
  formatLargeBytes,
  formatNumber,
  formatPrice,
  formatTime,
  outputText,
  tokenBreakdown,
} from "./format";

async function inLanguage(language: Language) {
  await setLanguage(language, false);
}

// Intl uses (narrow) no-break spaces in some languages; the tests compare with plain spaces.
const normalize = (text: string) => text.replace(/[\u00a0\u202f]/g, " ");

describe("format", () => {
  afterEach(() => inLanguage("de"));

  it("formats US dollars in the style of each language", async () => {
    const expected: Record<Language, [string, string, string]> = {
      de: ["1.234,50 $", "0,0042 $", "0,000123 $"],
      en: ["$1,234.50", "$0.0042", "$0.000123"],
      es: ["1234,50 US$", "0,0042 US$", "0,000123 US$"],
      fr: ["1 234,50 $US", "0,0042 $US", "0,000123 $US"],
      "pt-BR": ["US$ 1.234,50", "US$ 0,0042", "US$ 0,000123"],
      it: ["1234,50 USD", "0,0042 USD", "0,000123 USD"],
    };
    
    for (const [language, [large, small, tiny]] of Object.entries(expected) as [Language, string[]][]) {
      await inLanguage(language);
      expect(normalize(formatCost(1234.5)), language).toBe(large);
      expect(normalize(formatCost(0.0042)), language).toBe(small);
      expect(normalize(formatCost(0.000123456)), language).toBe(tiny);
    }
  });

  it("keeps costs in dollars with up to six decimals and never converts", async () => {
    await inLanguage("en");
    expect(formatCost(null)).toBe("–");
    expect(formatCost(0)).toBe("$0.00");
    expect(formatCost(1.234)).toBe("$1.23");
    expect(formatCost(0.0000014)).toBe("$0.000001");
    expect(formatCost(0.0000004)).toBe("< $0.000001");
    expect(formatPrice(0.3)).toBe("$0.30");
    expect(formatPrice(15)).toBe("$15.00");
  });

  it("formats numbers, dates and days per language", async () => {
    await inLanguage("en");
    expect(formatNumber(12345.5)).toBe("12,345.5");
    expect(formatDate("2026-10-27T14:05:00Z")).toBe("Oct 27, 2026, 2:05 PM");
    expect(formatDay("2026-10-27")).toBe("10/27");
    await inLanguage("de");
    expect(formatNumber(12345.5)).toBe("12.345,5");
    expect(formatDate("2026-10-27T14:05:00Z")).toBe("27.10.2026, 14:05");
    expect(formatDay("2026-10-27")).toBe("27.10.");
    await inLanguage("fr");
    expect(formatDay("2026-10-27")).toBe("27/10");
    expect(formatDay("Total")).toBe("Total");
  });

  it("reuses number formatters per language and options, and follows a language change", async () => {
    const created = vi.spyOn(Intl, "NumberFormat");
    try {
      await inLanguage("en");
      created.mockClear();
      formatNumber(1234.5);
      formatNumber(99.5);
      expect(created.mock.calls.filter(([, options]) => JSON.stringify(options) === "{}").length).toBeLessThanOrEqual(1);
      await inLanguage("de");
      expect(formatNumber(1234.5)).toBe("1.234,5");
      await inLanguage("en");
      expect(formatNumber(1234.5)).toBe("1,234.5");
    } finally {
      created.mockRestore();
    }
  });

  it("writes times like the time in a date and shows a bare day without midnight (NSL-15)", async () => {
    await inLanguage("en");
    expect(normalize(formatTime("2026-10-27T08:04:02Z"))).toBe("8:04:02 AM");
    expect(normalize(formatDate("2026-10-27T08:04:02Z"))).toBe("Oct 27, 2026, 8:04 AM");
    expect(formatDateOrDay("2026-10-31T00:00:00Z")).toBe("Oct 31, 2026");
    expect(formatDateOrDay("2026-10-31")).toBe("Oct 31, 2026");
    expect(formatDateOrDay("2026-10-31T00:00:00.000000+00:00")).toBe("Oct 31, 2026");
    expect(normalize(formatDateOrDay("2026-10-31T09:15:00Z"))).toBe("Oct 31, 2026, 9:15 AM");
    expect(formatDateOrDay(null)).toBe("–");
    await inLanguage("de");
    expect(formatTime("2026-10-27T08:04:02Z")).toBe("08:04:02");
    expect(formatDateOrDay("2026-10-31T00:00:00Z")).toBe("31.10.2026");
  });

  it("formats sizes and durations", async () => {
    await inLanguage("en");
    expect(formatBytes(2048)).toBe("2.0 kB");
    expect(formatBytes(0)).toBe("0 bytes");
    expect(formatBytes(1)).toBe("1 byte");
    // Model and package sizes: decimal GB from 1 GB, as catalogs state them, not "3,147.1 MB".
    expect(formatLargeBytes(3_300_000_000)).toBe("3.3 GB");
    expect(formatLargeBytes(610_000_000)).toBe(formatBytes(610_000_000));
    // One unit system (ST-056): decimal below 1 GB too, so there is no jump at the GB boundary.
    expect(formatBytes(999_900_000)).toBe("999.9 MB");
    expect(formatLargeBytes(1_000_000_000)).toBe("1.0 GB");
    expect(formatBytes(1_000)).toBe("1.0 kB");
    expect(formatBytes(999)).toBe("999 bytes");
    // Sizes in one sentence share the unit of the largest.
    expect(formatComparedBytes([900_000_000, 2 * 1024 ** 3])).toEqual(["0.9 GB", "2.1 GB"]);
    expect(formatComparedBytes([5_000_000, 20_000_000])).toEqual(["5.0 MB", "20.0 MB"]);
    expect(formatDuration("2026-01-01T00:00:00Z", "2026-01-01T00:00:02.500Z")).toBe("2.5 s");
    expect(formatDuration("2026-01-01T00:00:00Z", "2026-01-01T00:01:05Z")).toBe("1 min 5 s");
    await inLanguage("de");
    expect(formatBytes(1_500_000)).toBe("1,5 MB");
    expect(formatDuration("2026-01-01T00:00:00Z", "2026-01-01T00:00:02.500Z")).toBe("2,5 s");
    await inLanguage("fr");
    expect(normalize(formatBytes(2048))).toBe("2,0 ko");
  });

  it("says a card was changed just now instead of \"changed now\" (TX-14)", async () => {
    await inLanguage("de");
    const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);
    expect(changedText(t, new Date().toISOString())).toBe("gerade eben geändert");
    expect(changedText(t, new Date(Date.now() - 5 * 60_000).toISOString())).toBe("geändert vor 5 Minuten");
  });

  it("explains token totals in the interface language", async () => {
    const usage = {
      requests: 2,
      input_tokens: 1200,
      output_tokens: 300,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
      thinking_tokens: 0,
      web_search_requests: 1,
      total_tokens: 1500,
      estimated_cost_usd: 0.01,
    };
    await inLanguage("en");
    expect(tokenBreakdown(usage)).toBe("1,200 in · 300 out · 1 web search");
    await inLanguage("de");
    expect(tokenBreakdown(usage)).toBe("1.200 ein · 300 aus · 1 Websuche");
  });

  it("renders structured output as JSON", () => {
    expect(outputText({ a: 1 })).toBe('{\n  "a": 1\n}');
    expect(outputText("text")).toBe("text");
    expect(outputText(null)).toBe("");
  });
});

describe("number formats ahead of use (ST-004)", () => {
  it("creates them when the browser is idle", async () => {
    const { warmNumberFormats, whenIdle } = await import("./format");
    let task: (() => void) | null = null;
    vi.stubGlobal("requestIdleCallback", (callback: () => void) => {
      task = callback;
      return 1;
    });
    const warm = vi.fn(warmNumberFormats);
    whenIdle(warm);
    expect(warm).not.toHaveBeenCalled();
    task!();
    expect(warm).toHaveBeenCalledTimes(1);
    expect(formatNumber(0.5, { style: "percent", maximumFractionDigits: 0 })).toMatch(/50/);
    vi.unstubAllGlobals();
  });
});
