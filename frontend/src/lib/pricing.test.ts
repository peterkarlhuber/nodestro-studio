import { describe, expect, it } from "vitest";

import type { ModelInfo, Usage, UsageBucket } from "../api/types";
import i18n from "../i18n";

import { formatCost, formatPrice } from "./format";

import { bucketCost, bucketState, modelPriceHint, usageCost } from "./pricing";

const t = i18n.t.bind(i18n);

const bucket = (values: Partial<UsageBucket>): UsageBucket => ({
  key: "k",
  label: "k",
  runs: 1,
  operations: 0,
  unpriced: 0,
  requests: 2,
  total_tokens: 10,
  input_tokens: 5,
  output_tokens: 5,
  estimated_cost_usd: 0.5,
  ...values,
});

const usage = (values: Partial<Usage>): Usage => ({
  requests: 1,
  input_tokens: 1,
  output_tokens: 1,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
  thinking_tokens: 0,
  web_search_requests: 0,
  total_tokens: 2,
  estimated_cost_usd: 0.25,
  ...values,
});

const model = (values: Partial<ModelInfo>): ModelInfo => ({
  id: "openai:gpt-x",
  provider: "openai",
  model: "gpt-x",
  label: "GPT X",
  tier: "",
  description: "",
  input_usd_per_mtok: 2,
  output_usd_per_mtok: 8,
  cache_write_5m_usd_per_mtok: null,
  cache_write_1h_usd_per_mtok: null,
  cache_read_usd_per_mtok: null,
  recommended: true,
  ...values,
});

describe("cost display", () => {
  it("shows a known cost as an amount", () => {
    expect(bucketCost(t, bucket({ cost_state: "known", known_cost_usd: 0.5 }))).toBe(formatCost(0.5));
  });

  it("shows a partly known cost as a lower bound, never as a complete amount", () => {
    expect(bucketCost(t, bucket({ cost_state: "partial", known_cost_usd: 0.5, unpriced: 1 }))).toBe(`mindestens ${formatCost(0.5)}`);
  });

  it("never shows an unknown cost as 0", () => {
    expect(bucketCost(t, bucket({ cost_state: "unknown", known_cost_usd: 0, estimated_cost_usd: 0, unpriced: 2 }))).toBe("–");
  });

  it("derives the state from an older backend's unpriced count", () => {
    expect(bucketState(bucket({ unpriced: 0 }))).toBe("known");
    expect(bucketState(bucket({ unpriced: 1 }))).toBe("partial");
    expect(bucketState(bucket({ unpriced: 2 }))).toBe("unknown");
    expect(bucketState(bucket({ requests: 0 }))).toBe("none");
  });

  it("shows one operation's partial cost as a lower bound and an unknown one as –", () => {
    expect(usageCost(t, usage({}))).toBe(formatCost(0.25));
    expect(usageCost(t, usage({ estimated_cost_usd: null, known_cost_usd: 0.1, cost_complete: false }))).toBe(`mindestens ${formatCost(0.1)}`);
    expect(usageCost(t, usage({ estimated_cost_usd: null, known_cost_usd: 0, cost_complete: false }))).toBe("–");
  });
});

describe("model price hints", () => {
  it("names the prices and flags stale, individual and missing ones", () => {
    expect(modelPriceHint(t, model({ price_status: "current" }))).toBe(`${formatPrice(2)} / ${formatPrice(8)} pro Million Tokens (Eingabe / Ausgabe)`);
    expect(modelPriceHint(t, model({ price_status: "stale" }))).toContain("Preis länger nicht geprüft");
    expect(modelPriceHint(t, model({ price_status: "custom" }))).toContain("individueller Preis");
    expect(modelPriceHint(t, model({ input_usd_per_mtok: null, price_status: "unknown" }))).toBe(t("models.priceUnknown"));
  });
});
