import { describe, expect, it } from "vitest";

import { compareMoney, formatMoney, moneyDifference, moneyText, normalizeMoneyInput, parseMoney } from "./money";

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

  it("formats in the interface language and shows unknown as a dash, never as 0", () => {
    expect(formatMoney("2.5")).toMatch(/2,50/);
    expect(formatMoney(null)).toBe("–");
    expect(formatMoney("n/a")).toBe("–");
  });
});
