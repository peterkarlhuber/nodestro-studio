// How the interface shows costs and prices (PRICING-1). Orkexa calculates every cost and the backend sums
// them; these helpers only decide how a known, partial or unknown amount reads. An unknown cost is never
// shown as 0, and a partial sum is shown as a lower bound ("at least …").

import type { TFunction } from "i18next";

import type { ModelInfo, Usage, UsageBucket } from "../api/types";
import { formatCost, formatPrice } from "./format";
import type { Tone } from "./format";

export type CostState = "known" | "partial" | "unknown" | "none";

/** The cost state of a usage bucket; buckets from an older backend have no state and count as known. */
export function bucketState(bucket: UsageBucket): CostState {
  if (bucket.cost_state) return bucket.cost_state;
  if (!bucket.requests) return "none";
  if (!bucket.unpriced) return "known";
  return bucket.unpriced >= bucket.requests ? "unknown" : "partial";
}

/** The cost of a bucket as text: the amount, "at least" the amount, or "–". */
export function bucketCost(t: TFunction, bucket: UsageBucket): string {
  const amount = bucket.known_cost_usd ?? bucket.estimated_cost_usd;
  switch (bucketState(bucket)) {
    case "unknown":
      return formatCost(null);
    case "partial":
      return t("usage.cost.atLeast", { value: formatCost(amount) });
    default:
      return formatCost(amount);
  }
}

/** The cost of one operation: complete, at least the known part, or unknown ("–"). */
export function usageCost(t: TFunction, usage: Usage): string {
  if (usage.estimated_cost_usd !== null) return formatCost(usage.estimated_cost_usd);
  if (usage.cost_complete === false && usage.known_cost_usd)
    return t("usage.cost.atLeast", { value: formatCost(usage.known_cost_usd) });
  return formatCost(null);
}

export const PRICE_STATUS_TONE: Record<string, Tone> = {
  current: "success",
  custom: "running",
  stale: "warning",
  pending_review: "warning",
  unknown: "danger",
};

export const STALENESS_TONE: Record<string, Tone> = { ok: "success", warning: "warning", critical: "danger" };

/** The hint of a model in a picker: its prices per million tokens and whether they are reliable. */
export function modelPriceHint(t: TFunction, model: ModelInfo): string {
  if (model.input_usd_per_mtok === null || model.output_usd_per_mtok === null || model.price_status === "unknown")
    return t("models.priceUnknown");
  const prices = t("models.pricePerMTok", {
    input: formatPrice(model.input_usd_per_mtok),
    output: formatPrice(model.output_usd_per_mtok),
  });
  const status = model.price_status;
  if (status === "stale" || status === "custom" || status === "pending_review")
    return `${prices} · ${t(`models.priceStatus.${status}`)}`;
  return prices;
}
