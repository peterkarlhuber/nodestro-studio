import { describe, expect, it } from "vitest";

import { setLanguage } from "../i18n";
import { compareMoney, formatMoney, moneyDifference, moneyInputText, moneyText, normalizeMoneyInput, parseMoney } from "./money";

describe("money as decimal strings", () => {
  it("compares and subtracts exactly", () => {
    expect(compareMoney("2.10", "2.1")).toBe(0);
    expect(compareMoney("0.30", "0.1")).toBe(1);
    expect(moneyDifference("0.3", "0.1")).toBe("0.20");
    expect(moneyDifference("2.35", "2.00")).toBe("0.35");
    expect(moneyDifference("0.000123", "0")).toBe("0.000123");
    expect(moneyDifference("1", null)).toBeNull();
    expect(moneyText(parseMoney("12.5")!)).toBe("12.50");
  });

  it("normalizes what a person typed", () => {
    expect(normalizeMoneyInput(" 2,5 ")).toBe("2.50");
    expect(normalizeMoneyInput("$3")).toBe("3.00");
    expect(normalizeMoneyInput("3 USD")).toBe("3.00");
    expect(normalizeMoneyInput("1,000.50")).toBeNull();
    expect(normalizeMoneyInput("-1")).toBeNull();
    expect(normalizeMoneyInput("abc")).toBeNull();
  });

  it("writes an amount for a text field with the language's decimal mark and reads it back (NSL-14)", async () => {
    try {
      for (const [language, expected] of [["de", "0,03"], ["fr", "0,03"], ["pt-BR", "0,03"], ["en", "0.03"]] as const) {
        await setLanguage(language, false);
        expect(moneyInputText("0.03"), language).toBe(expected);
        expect(normalizeMoneyInput(moneyInputText("2.50")), language).toBe("2.50");
      }
    } finally {
      await setLanguage("de", false);
    }
  });

  it("formats in the interface language and shows unknown as a dash, never as 0", () => {
    expect(formatMoney("2.5")).toMatch(/2,50/);
    expect(formatMoney(null)).toBe("–");
    expect(formatMoney("n/a")).toBe("–");
  });
});
