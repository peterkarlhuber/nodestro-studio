// US-dollar amounts as decimal strings (BUDGET-1): the API sends and receives money as text ("2.50") so nothing is
// rounded on the way. Comparisons and differences are exact (scaled integers); only the display goes through
// formatCost in the interface language.

import { formatCost } from "./format";

/** Decimal places kept exactly; more than any price or limit uses. */
const SCALE = 12;
const FACTOR = 10n ** BigInt(SCALE);

/** A plain decimal with a dot: "2", "2.5", "0.000123". */
const DECIMAL = /^\d+(\.\d+)?$/;

/** The scaled integer of a decimal string, or null when it is not one. */
export function parseMoney(value: string | null | undefined): bigint | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!DECIMAL.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  // Digits beyond the scale are cut (the API never sends that many).
  const digits = (fraction + "0".repeat(SCALE)).slice(0, SCALE);
  return BigInt(whole) * FACTOR + BigInt(digits);
}

/** A scaled integer as a decimal string without trailing zeros beyond the cents ("2.50", "0.000123"). */
export function moneyText(value: bigint): string {
  const negative = value < 0n;
  const size = negative ? -value : value;
  const whole = size / FACTOR;
  let fraction = (size % FACTOR).toString().padStart(SCALE, "0").replace(/0+$/, "");
  if (fraction.length < 2) fraction = fraction.padEnd(2, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

/**
 * What a person typed as an amount, normalized to the API's form ("2,50" and "2.50" both give "2.50"), or null
 * when it is not a plain positive decimal. A thousands separator is not accepted: "1,000.50" is ambiguous.
 */
export function normalizeMoneyInput(input: string): string | null {
  let text = input.trim().replace(/^\$\s*|\s*(USD|\$)$/gi, "");
  if (/^\d+,\d+$/.test(text)) text = text.replace(",", ".");
  if (!DECIMAL.test(text)) return null;
  const value = parseMoney(text);
  return value === null ? null : moneyText(value);
}

/** a - b, or null when either is unknown. */
export function moneyDifference(a: string | null | undefined, b: string | null | undefined): string | null {
  const first = parseMoney(a);
  const second = parseMoney(b);
  return first === null || second === null ? null : moneyText(first - second);
}

/** -1, 0 or 1; null when either is not a decimal. */
export function compareMoney(a: string | null | undefined, b: string | null | undefined): number | null {
  const first = parseMoney(a);
  const second = parseMoney(b);
  if (first === null || second === null) return null;
  return first === second ? 0 : first < second ? -1 : 1;
}

/** A decimal-string amount in the interface language ("$2.50", "2,50 $"); "–" when unknown. */
export function formatMoney(value: string | null | undefined): string {
  if (value === null || value === undefined || parseMoney(value) === null) return "–";
  return formatCost(Number(value));
}
