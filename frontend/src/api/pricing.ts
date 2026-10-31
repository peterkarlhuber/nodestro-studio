// Model prices, their sync and reviews, overrides and the comparison with the providers' bills (PRICING-1).
// Orkexa resolves prices and calculates every cost; the interface only shows and edits the catalog
// (nodestro-api: nodestro_api/api_pricing.py, OpenAPI /api/openapi.json).

import { useQuery } from "@tanstack/react-query";

import { request } from "./client";

/** current: checked recently; stale: not checked for longer than the warning threshold; custom: an override. */
export type PriceStatus = "current" | "stale" | "unknown" | "pending_review" | "custom";
export type Staleness = "ok" | "warning" | "critical";
export type PriceQuality = "verified" | "contract" | "unverified" | "estimated";

export interface PriceEntry {
  provider: string;
  model: string;
  currency: string;
  /** Decimal strings, USD per million tokens. */
  input_usd_per_mtok: string;
  output_usd_per_mtok: string;
  cache_read_usd_per_mtok: string | null;
  cache_write_5m_usd_per_mtok: string | null;
  cache_write_1h_usd_per_mtok: string | null;
  has_long_context: boolean;
  tariffs: string[];
  status: PriceStatus;
  staleness: Staleness;
  quality: PriceQuality | string;
  source: string;
  source_url: string | null;
  checked_at: string | null;
  version: string | null;
  overridden: boolean;
  reference: PriceEntry | null;
}

export interface PricingOverview {
  active_version: string;
  activated_at: string | null;
  last_attempt_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  staleness: Staleness;
  counts: Record<string, number>;
  pending_reviews: string[];
  overrides: number;
  /** A server: reference prices are managed by its operator. */
  reference_read_only: boolean;
  sync_enabled: boolean;
  price_mode: "standard" | "strict";
  warn_after_hours: number;
  critical_after_days: number;
  review_change_percent: number;
  refresh_interval_hours: number;
}

export interface PriceChange {
  provider: string;
  model: string;
  kind: string;
  field?: string | null;
  old?: string | null;
  new?: string | null;
  ratio?: string | null;
  needs_review?: boolean;
  reason?: string | null;
}

export interface PricingEvent {
  id: string;
  at: string;
  kind: string;
  scope: "reference" | "workspace";
  version: string | null;
  provider: string | null;
  model: string | null;
  detail: string | null;
  changes: PriceChange[];
}

export interface PriceReview {
  version: string;
  source: string;
  created_at: string | null;
  changes: PriceChange[];
  issues: { severity: string; code: string; provider?: string; model?: string; message: string }[];
}

export interface SourceReport {
  source: string;
  ok: boolean;
  /** activated, unchanged, pending_review or rejected. */
  outcome: string | null;
  version: string | null;
  error: string | null;
  changes: number;
  held_for_review: number;
  invalid: number;
}

export interface SyncReport {
  started_at: string;
  finished_at: string;
  /** false when another sync was running. */
  ran: boolean;
  skipped_reason: string | null;
  sources: SourceReport[];
  active_version: string;
}

export interface OverrideIn {
  input_usd_per_mtok: string;
  output_usd_per_mtok: string;
  cache_read_usd_per_mtok?: string | null;
  cache_write_5m_usd_per_mtok?: string | null;
  cache_write_1h_usd_per_mtok?: string | null;
  quality?: "contract" | "verified" | "estimated" | "unverified";
  source?: string;
  source_url?: string | null;
  note?: string | null;
}

export type BillingProvider = "openai" | "anthropic";

export interface ReconciliationRequest {
  start: string;
  end: string;
  keys?: Partial<Record<BillingProvider, { admin_key: string; scope_ids?: string[] }>>;
  relative_threshold_percent?: number;
  absolute_threshold_usd?: number;
}

export type ReconciliationStatus = "ok" | "warning" | "incomplete" | "pending" | "not_comparable" | "unattributed";

export interface ReconciliationRow {
  day: string;
  provider: string;
  model: string | null;
  estimated_usd: string | null;
  billed_usd: string | null;
  difference_usd: string | null;
  relative_difference: string | null;
  status: ReconciliationStatus;
  note: string | null;
}

export interface ReconciliationReport {
  created_at: string;
  start: string;
  end: string;
  providers: { provider: string; ok: boolean; error: string | null; complete_until: string | null }[];
  rows: ReconciliationRow[];
  warnings: number;
  relative_threshold: string;
  absolute_threshold_usd: string;
}

export interface BillingKeyStatus {
  provider: BillingProvider;
  configured: boolean;
  origin: "stored" | "environment" | "none";
  scope_ids: string[];
  storable: boolean;
}

const path = (provider: string, model: string) =>
  `${encodeURIComponent(provider)}/${model.split("/").map(encodeURIComponent).join("/")}`;

export const pricingApi = {
  prices: () => request<PriceEntry[]>("GET", "/pricing"),
  status: () => request<PricingOverview>("GET", "/pricing/status"),
  history: (limit = 50) => request<PricingEvent[]>("GET", `/pricing/history?limit=${limit}`),
  sync: () => request<SyncReport>("POST", "/pricing/sync"),
  reviews: () => request<PriceReview[]>("GET", "/pricing/reviews"),
  decide: (version: string, decision: "approve" | "reject", note?: string) =>
    request<unknown>("POST", `/pricing/reviews/${encodeURIComponent(version)}/${decision}`, { note: note ?? null }),
  setOverride: (provider: string, model: string, body: OverrideIn) =>
    request<PriceEntry>("PUT", `/pricing/overrides/${path(provider, model)}`, body),
  removeOverride: (provider: string, model: string) =>
    request<void>("DELETE", `/pricing/overrides/${path(provider, model)}`),
  billingKeys: () => request<BillingKeyStatus[]>("GET", "/pricing/billing-keys"),
  /** Servers only: the key is stored encrypted and never shown again. */
  setBillingKey: (provider: BillingProvider, body: { admin_key: string; scope_ids?: string[] }) =>
    request<BillingKeyStatus>("PUT", `/pricing/billing-keys/${provider}`, body),
  removeBillingKey: (provider: BillingProvider) => request<void>("DELETE", `/pricing/billing-keys/${provider}`),
  reconcile: (body: ReconciliationRequest) => request<ReconciliationReport>("POST", "/pricing/reconciliation", body),
};

export const pricingKeys = {
  all: ["pricing"] as const,
  prices: ["pricing", "prices"] as const,
  status: ["pricing", "status"] as const,
  history: ["pricing", "history"] as const,
  reviews: ["pricing", "reviews"] as const,
  billingKeys: ["pricing", "billing-keys"] as const,
};

export const usePrices = () => useQuery({ queryKey: pricingKeys.prices, queryFn: pricingApi.prices });
export const usePricingStatus = () =>
  useQuery({ queryKey: pricingKeys.status, queryFn: pricingApi.status, refetchInterval: 60_000 });
export const usePricingHistory = () => useQuery({ queryKey: pricingKeys.history, queryFn: () => pricingApi.history() });
export const usePriceReviews = () => useQuery({ queryKey: pricingKeys.reviews, queryFn: pricingApi.reviews });
export const useBillingKeys = () => useQuery({ queryKey: pricingKeys.billingKeys, queryFn: pricingApi.billingKeys });

/** A decimal rate from the API as a number for formatting; null when it is not known. */
export function rateValue(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
