import { afterEach, describe, expect, it } from "vitest";

import { type Language, setLanguage } from "../i18n";
import {
  formatBytes,
  formatCost,
  formatDate,
  formatDay,
  formatDuration,
  formatNumber,
  formatPrice,
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

  it("formats sizes and durations", async () => {
    await inLanguage("en");
    expect(formatBytes(2048)).toBe("2.0 kB");
    expect(formatDuration("2026-01-01T00:00:00Z", "2026-01-01T00:00:02.500Z")).toBe("2.5 s");
    expect(formatDuration("2026-01-01T00:00:00Z", "2026-01-01T00:01:05Z")).toBe("1 min 5 s");
    await inLanguage("de");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1,5 MB");
    expect(formatDuration("2026-01-01T00:00:00Z", "2026-01-01T00:00:02.500Z")).toBe("2,5 s");
    await inLanguage("fr");
    expect(normalize(formatBytes(2048))).toBe("2,0 ko");
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
