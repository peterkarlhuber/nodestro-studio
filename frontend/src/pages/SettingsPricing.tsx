// Settings → Model prices (PRICING-1): the state of the price list, the sync, the price mode, every price with
// its status and source, individual prices, reviews of large changes, the change history and the comparison with
// the providers' bills. Orkexa calculates every cost; this page only shows and edits the price catalog.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Coins, History, Pencil, Plus, Receipt, RefreshCw, Trash2, Undo2, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { keys } from "../api/hooks";
import {
  type BillingProvider,
  type OverrideIn,
  type PriceChange,
  type PriceEntry,
  type PricingOverview,
  type ReconciliationReport,
  type ReconciliationRequest,
  REGIONAL_PRICE_PROVIDERS,
  parseRegions,
  pricingApi,
  pricingKeys,
  rateValue,
  useBillingKeys,
  usePriceReviews,
  usePrices,
  usePricingHistory,
  usePricingStatus,
} from "../api/pricing";
import { AWS_REGION_PATTERN, type Settings } from "../api/types";
import { toast } from "../components/toast";
import {
  Badge,
  Button,
  Callout,
  ConfirmIconButton,
  Field,
  HelpTip,
  IconButton,
  Modal,
  Section,
  Segmented,
  Select,
  Spinner,
  TextInput,
} from "../components/ui";
import { ErrorText } from "../lib/errors";
import { formatCost, formatDate, formatNumber, formatPrice } from "../lib/format";
import { PRICE_STATUS_TONE, STALENESS_TONE } from "../lib/pricing";

const BILLING_PROVIDERS: BillingProvider[] = ["openai", "anthropic"];
const QUALITIES = ["contract", "verified", "estimated", "unverified"] as const;
const RATE_FIELDS = [
  "input_usd_per_mtok",
  "output_usd_per_mtok",
  "cache_read_usd_per_mtok",
  "cache_write_5m_usd_per_mtok",
  "cache_write_1h_usd_per_mtok",
] as const;
type RateField = (typeof RATE_FIELDS)[number];

/** Prices shown before "show all": a catalog synced from LiteLLM has a few hundred. */
const PAGE = 25;

const rate = (value: string | null | undefined) => formatPrice(rateValue(value));

function useInvalidatePricing() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: pricingKeys.all });
    // The model list carries the effective prices, and the usage page their state.
    void queryClient.invalidateQueries({ queryKey: keys.meta });
  };
}

/** One change of a price list: "Input $3 → $3.60 (+20 %)". */
function ChangeText({ change }: { change: PriceChange }) {
  const { t } = useTranslation();
  const field = change.field ? t(`pricing.fields.${change.field}`, { defaultValue: change.field }) : "";
  if (change.kind === "added") return <span>{t("pricing.change.added")}</span>;
  if (change.kind === "removed") return <span>{t("pricing.change.removed")}</span>;
  const ratio = change.ratio !== null && change.ratio !== undefined ? Number(change.ratio) : null;
  return (
    <span className={change.needs_review ? "pricing__change--review" : undefined}>
      {field}: {rate(change.old)} → {rate(change.new)}
      {ratio !== null && Number.isFinite(ratio) ? ` (${ratio >= 0 ? "+" : ""}${formatNumber(ratio * 100, { maximumFractionDigits: 1 })} %)` : null}
    </span>
  );
}

function StatusSummary({ status }: { status: PricingOverview }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="pricing__status" data-testid="pricing-status">
        <Badge tone={STALENESS_TONE[status.staleness] ?? "idle"}>{t(`pricing.staleness.${status.staleness}`)}</Badge>
        {Object.entries(status.counts)
          .filter(([, count]) => count > 0)
          .map(([name, count]) => (
            <Badge key={name} tone={PRICE_STATUS_TONE[name] ?? "idle"}>
              {t(`pricing.status.${name}`, { defaultValue: name })}: {formatNumber(count)}
            </Badge>
          ))}
        <span className="muted small">
          {t("pricing.lastChecked", { date: status.last_success_at ? formatDate(status.last_success_at) : "–" })} ·{" "}
          {t("pricing.version", { version: status.active_version })}
        </span>
      </div>
      {status.staleness === "warning" ? (
        <Callout tone="warning">{t("pricing.staleWarning", { hours: status.warn_after_hours })}</Callout>
      ) : null}
      {status.staleness === "critical" ? (
        <Callout tone="danger">{t("pricing.staleCritical", { days: status.critical_after_days })}</Callout>
      ) : null}
      {status.last_error ? (
        <Callout tone="warning">
          {t("pricing.lastError")} <code>{status.last_error}</code>
        </Callout>
      ) : null}
      {status.reference_read_only ? <Callout tone="info">{t("pricing.readOnly")}</Callout> : null}
    </>
  );
}

function SyncButton({ status }: { status: PricingOverview }) {
  const { t } = useTranslation();
  const invalidate = useInvalidatePricing();
  const sync = useMutation({
    mutationFn: pricingApi.sync,
    onSuccess: (report) => {
      invalidate();
      if (!report.ran) return toast.success(t("pricing.sync.skipped"));
      const failed = report.sources.filter((source) => !source.ok);
      const held = report.sources.reduce((sum, source) => sum + source.held_for_review, 0);
      const changes = report.sources.reduce((sum, source) => sum + source.changes, 0);
      if (failed.length) toast.error(new Error(t("pricing.sync.failed", { sources: failed.map((item) => item.source).join(", ") })));
      else if (held) toast.success(t("pricing.sync.review", { count: held }));
      else toast.success(t("pricing.sync.done", { count: changes }));
    },
    onError: toast.error,
  });
  if (status.reference_read_only) return null;
  return (
    <Button icon={RefreshCw} busy={sync.isPending} onClick={() => sync.mutate()}>
      {t("pricing.sync.run")}
    </Button>
  );
}

function Reviews({ readOnly }: { readOnly: boolean }) {
  const { t } = useTranslation();
  const reviews = usePriceReviews();
  const invalidate = useInvalidatePricing();
  const decide = useMutation({
    mutationFn: ({ version, decision }: { version: string; decision: "approve" | "reject" }) => pricingApi.decide(version, decision),
    onSuccess: (_, { decision }) => {
      invalidate();
      toast.success(t(decision === "approve" ? "pricing.reviews.approved" : "pricing.reviews.rejected"));
    },
    onError: toast.error,
  });
  const items = reviews.data ?? [];
  if (!items.length) return null;
  return (
    <div className="stack" data-testid="pricing-reviews">
      <Callout tone="warning">{t("pricing.reviews.intro", { count: items.length })}</Callout>
      {items.map((review) => {
        const changes = review.changes.filter((change) => change.needs_review);
        return (
          <section key={review.version} className="panel stack" aria-label={t("pricing.reviews.title", { version: review.version })}>
            <h3 className="panel__title">
              {t("pricing.reviews.title", { version: review.version })}{" "}
              <span className="muted small">
                {review.source} · {formatDate(review.created_at)}
              </span>
            </h3>
            <ul className="small">
              {(changes.length ? changes : review.changes).map((change, index) => (
                <li key={`${change.provider}:${change.model}:${change.field ?? ""}:${index}`}>
                  <code>
                    {change.provider}:{change.model}
                  </code>{" "}
                  <ChangeText change={change} />
                </li>
              ))}
            </ul>
            {readOnly ? null : (
              <div className="row-gap">
                <Button
                  variant="primary"
                  icon={CheckCircle2}
                  busy={decide.isPending}
                  onClick={() => decide.mutate({ version: review.version, decision: "approve" })}
                >
                  {t("pricing.reviews.approve")}
                </Button>
                <Button icon={XCircle} busy={decide.isPending} onClick={() => decide.mutate({ version: review.version, decision: "reject" })}>
                  {t("pricing.reviews.reject")}
                </Button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

type RateForm = Record<RateField, string> & { quality: OverrideIn["quality"]; source: string; source_url: string; note: string };

function initialForm(entry: PriceEntry | null): RateForm {
  return {
    input_usd_per_mtok: entry?.input_usd_per_mtok ?? "",
    output_usd_per_mtok: entry?.output_usd_per_mtok ?? "",
    cache_read_usd_per_mtok: entry?.cache_read_usd_per_mtok ?? "",
    cache_write_5m_usd_per_mtok: entry?.cache_write_5m_usd_per_mtok ?? "",
    cache_write_1h_usd_per_mtok: entry?.cache_write_1h_usd_per_mtok ?? "",
    quality: "contract",
    source: entry?.overridden ? entry.source : "custom",
    source_url: entry?.overridden ? (entry.source_url ?? "") : "",
    note: "",
  };
}

const isRate = (value: string) => /^\d+(\.\d+)?$/.test(value.trim());

/** An individual price for one model: a contract price or a correction; it wins over the reference price. */
function OverrideDialog({ entry, onClose }: { entry: PriceEntry | "new"; onClose: () => void }) {
  const { t } = useTranslation();
  const invalidate = useInvalidatePricing();
  const existing = entry === "new" ? null : entry;
  const [provider, setProvider] = useState(existing?.provider ?? "openai");
  const [model, setModel] = useState(existing?.model ?? "");
  const [form, setForm] = useState<RateForm>(() => initialForm(existing));
  // Amazon Bedrock is priced per AWS region: an override names the regions its rates apply to.
  const [regionsText, setRegionsText] = useState(() => (existing?.regions ?? []).join(", "));
  const regional = REGIONAL_PRICE_PROVIDERS.has(provider);
  const regions = parseRegions(regionsText);
  const regionsValid = !regional || (regions.length > 0 && regions.every((item) => AWS_REGION_PATTERN.test(item)));
  const save = useMutation({
    mutationFn: () => {
      const body: OverrideIn = {
        input_usd_per_mtok: form.input_usd_per_mtok.trim(),
        output_usd_per_mtok: form.output_usd_per_mtok.trim(),
        quality: form.quality,
        source: form.source.trim() || "custom",
        source_url: form.source_url.trim() || null,
        note: form.note.trim() || null,
        ...(regional ? { aws_regions: regions } : {}),
      };
      for (const field of ["cache_read_usd_per_mtok", "cache_write_5m_usd_per_mtok", "cache_write_1h_usd_per_mtok"] as const)
        body[field] = form[field].trim() || null;
      return pricingApi.setOverride(provider, model.trim(), body);
    },
    onSuccess: () => {
      invalidate();
      toast.success(t("pricing.override.saved"));
      onClose();
    },
    onError: toast.error,
  });
  const valid =
    model.trim() !== "" &&
    regionsValid &&
    isRate(form.input_usd_per_mtok) &&
    isRate(form.output_usd_per_mtok) &&
    (["cache_read_usd_per_mtok", "cache_write_5m_usd_per_mtok", "cache_write_1h_usd_per_mtok"] as const).every(
      (field) => form[field].trim() === "" || isRate(form[field]),
    );
  return (
    <Modal
      open
      wide
      title={existing ? t("pricing.override.editTitle", { model: `${existing.provider}:${existing.model}` }) : t("pricing.override.newTitle")}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button variant="primary" busy={save.isPending} disabled={!valid} onClick={() => save.mutate()}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="stack">
        <p className="muted small">{t("pricing.override.intro")}</p>
        {existing ? null : (
          <div className="pricing__rates">
            <Field label={t("providers.provider")} htmlFor="pricing-provider">
              <TextInput id="pricing-provider" value={provider} onChange={(event) => setProvider(event.target.value.trim())} />
            </Field>
            <Field label={t("providers.model")} htmlFor="pricing-model">
              <TextInput id="pricing-model" value={model} spellCheck={false} onChange={(event) => setModel(event.target.value)} />
            </Field>
          </div>
        )}
        {regional ? (
          <Field
            label={t("bedrock.pricing.regions")}
            htmlFor="pricing-regions"
            hint={regionsText.trim() && !regionsValid ? t("bedrock.pricing.regionsInvalid") : t("bedrock.pricing.regionsHint")}
          >
            <TextInput
              id="pricing-regions"
              value={regionsText}
              spellCheck={false}
              placeholder="eu-central-1, eu-west-1"
              aria-invalid={regionsText.trim() !== "" && !regionsValid}
              onChange={(event) => setRegionsText(event.target.value)}
            />
          </Field>
        ) : null}
        <div className="pricing__rates">
          {RATE_FIELDS.map((field) => (
            <Field key={field} label={t(`pricing.fields.${field}`)} htmlFor={`pricing-${field}`}>
              <TextInput
                id={`pricing-${field}`}
                inputMode="decimal"
                value={form[field]}
                aria-invalid={form[field].trim() !== "" && !isRate(form[field])}
                placeholder={field.startsWith("cache") ? t("pricing.override.optional") : undefined}
                onChange={(event) => setForm({ ...form, [field]: event.target.value.replace(",", ".") })}
              />
            </Field>
          ))}
        </div>
        <p className="muted small">{t("pricing.override.unit")}</p>
        <div className="pricing__rates">
          <Field label={t("pricing.columns.quality")} htmlFor="pricing-quality">
            <Select
              id="pricing-quality"
              value={form.quality ?? "contract"}
              onChange={(quality) => setForm({ ...form, quality: quality as RateForm["quality"] })}
              options={QUALITIES.map((value) => ({ value, label: t(`pricing.quality.${value}`) }))}
            />
          </Field>
          <Field label={t("pricing.columns.source")} htmlFor="pricing-source">
            <TextInput id="pricing-source" value={form.source} maxLength={80} onChange={(event) => setForm({ ...form, source: event.target.value })} />
          </Field>
          <Field label={t("pricing.override.sourceUrl")} htmlFor="pricing-source-url">
            <TextInput
              id="pricing-source-url"
              type="url"
              value={form.source_url}
              maxLength={500}
              onChange={(event) => setForm({ ...form, source_url: event.target.value })}
            />
          </Field>
        </div>
        <Field label={t("pricing.override.note")} htmlFor="pricing-note">
          <TextInput id="pricing-note" value={form.note} maxLength={500} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}

function PriceTable({ entries }: { entries: PriceEntry[] }) {
  const { t } = useTranslation();
  const invalidate = useInvalidatePricing();
  const [filter, setFilter] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [editing, setEditing] = useState<PriceEntry | "new" | null>(null);
  const remove = useMutation({
    mutationFn: (entry: PriceEntry) => pricingApi.removeOverride(entry.provider, entry.model),
    onSuccess: () => {
      invalidate();
      toast.success(t("pricing.override.removed"));
    },
    onError: toast.error,
  });
  const shown = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return needle ? entries.filter((entry) => `${entry.provider}:${entry.model}`.toLowerCase().includes(needle)) : entries;
  }, [entries, filter]);
  return (
    <div className="stack">
      <div className="row-gap">
        <TextInput
          type="search"
          value={filter}
          aria-label={t("pricing.filter")}
          placeholder={t("pricing.filter")}
          onChange={(event) => {
            setFilter(event.target.value);
            setLimit(PAGE);
          }}
        />
        <Button icon={Plus} onClick={() => setEditing("new")}>
          {t("pricing.override.add")}
        </Button>
      </div>
      <div className="table-wrap">
        <table className="table table--compact pricing__table" data-testid="pricing-table">
          <thead>
            <tr>
              <th>{t("agent.model")}</th>
              <th className="num">{t("pricing.fields.input_usd_per_mtok")}</th>
              <th className="num">{t("pricing.fields.output_usd_per_mtok")}</th>
              <th className="num">{t("pricing.fields.cache_read_usd_per_mtok")}</th>
              <th className="num">{t("pricing.columns.cacheWrite")}</th>
              <th>{t("pricing.columns.status")}</th>
              <th>{t("pricing.columns.quality")}</th>
              <th>{t("pricing.columns.source")}</th>
              <th>{t("pricing.columns.checked")}</th>
              <th>
                <span className="sr-only">{t("pricing.columns.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.slice(0, limit).map((entry) => (
              <tr key={`${entry.provider}:${entry.model}`} data-status={entry.status}>
                <td className="pricing__model">
                  <code>
                    {entry.provider}:{entry.model}
                  </code>
                  {REGIONAL_PRICE_PROVIDERS.has(entry.provider) ? (
                    <div className="muted small" data-testid="price-regions">
                      {entry.regions?.length
                        ? t("bedrock.pricing.regionsList", { regions: entry.regions.join(", ") })
                        : t("bedrock.pricing.noRegions")}
                    </div>
                  ) : null}
                  {entry.overridden && entry.reference ? (
                    <div className="muted small">
                      {t("pricing.referencePrice", { input: rate(entry.reference.input_usd_per_mtok), output: rate(entry.reference.output_usd_per_mtok) })}
                    </div>
                  ) : null}
                </td>
                <td className="num">{rate(entry.input_usd_per_mtok)}</td>
                <td className="num">{rate(entry.output_usd_per_mtok)}</td>
                <td className="num">{rate(entry.cache_read_usd_per_mtok)}</td>
                <td className="num">
                  {rate(entry.cache_write_5m_usd_per_mtok)} / {rate(entry.cache_write_1h_usd_per_mtok)}
                </td>
                <td>
                  <Badge tone={PRICE_STATUS_TONE[entry.status] ?? "idle"}>{t(`pricing.status.${entry.status}`)}</Badge>
                </td>
                <td>{t(`pricing.quality.${entry.quality}`, { defaultValue: entry.quality })}</td>
                <td>
                  {entry.source_url ? (
                    <a href={entry.source_url} target="_blank" rel="noreferrer noopener">
                      {entry.source}
                    </a>
                  ) : (
                    entry.source
                  )}
                </td>
                <td>{entry.checked_at ? formatDate(entry.checked_at) : "–"}</td>
                <td className="row-gap">
                  <IconButton
                    icon={Pencil}
                    label={t("pricing.override.edit", { model: `${entry.provider}:${entry.model}` })}
                    onClick={() => setEditing(entry)}
                  />
                  {entry.overridden ? (
                    <ConfirmIconButton
                      icon={Undo2}
                      label={t("pricing.override.remove", { model: `${entry.provider}:${entry.model}` })}
                      confirmLabel={t("pricing.override.removeConfirm")}
                      busy={remove.isPending}
                      onConfirm={() => remove.mutate(entry)}
                    />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shown.length > limit ? (
        <div>
          <Button size="sm" onClick={() => setLimit(shown.length)}>
            {t("pricing.showAll", { count: shown.length })}
          </Button>
        </div>
      ) : null}
      <p className="muted small">{t("pricing.unit")}</p>
      {editing ? <OverrideDialog entry={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

function HistoryList() {
  const { t } = useTranslation();
  const history = usePricingHistory();
  if (history.isLoading) return <Spinner />;
  if (history.error) return <ErrorText error={history.error} />;
  const events = history.data ?? [];
  if (!events.length) return <p className="muted small">{t("pricing.history.empty")}</p>;
  return (
    <ul className="pricing__history small" data-testid="pricing-history">
      {events.map((event) => (
        <li key={event.id}>
          <span className="muted">{formatDate(event.at)}</span>
          <strong>{t(`pricing.history.kinds.${event.kind}`, { defaultValue: event.kind })}</strong>
          {event.scope === "reference" ? <Badge>{t("pricing.history.reference")}</Badge> : null}
          {event.provider ? (
            <code>
              {event.provider}:{event.model}
            </code>
          ) : null}
          {event.version ? <span className="muted">{event.version}</span> : null}
          {event.changes.length ? <span>{t("pricing.history.changes", { count: event.changes.length })}</span> : null}
          {event.detail ? <span className="muted">{event.detail}</span> : null}
        </li>
      ))}
    </ul>
  );
}

/** Settings → Model prices. ``onMode`` saves the price mode with the other settings. */
export function PricingPanel({ settings, onMode }: { settings: Settings; onMode: (mode: "standard" | "strict") => void }) {
  const { t } = useTranslation();
  const status = usePricingStatus();
  const prices = usePrices();
  const mode = settings.price_mode ?? status.data?.price_mode ?? "standard";
  return (
    <section className="panel stack" aria-labelledby="settings-prices" data-testid="pricing-panel">
      <h2 className="panel__title" id="settings-prices">
        <Coins size={15} aria-hidden /> {t("pricing.title")} <HelpTip id="settings.prices" label={t("pricing.title")} />
      </h2>
      <p className="muted small">{t("pricing.intro")}</p>
      {status.error ? (
        <Callout tone="danger">
          <ErrorText error={status.error} />
        </Callout>
      ) : null}
      {status.data ? (
        <>
          <StatusSummary status={status.data} />
          <div className="row-gap">
            <SyncButton status={status.data} />
            <span className="muted small">
              {status.data.sync_enabled
                ? t("pricing.sync.automatic", { hours: status.data.refresh_interval_hours })
                : t("pricing.sync.manual")}
            </span>
          </div>
        </>
      ) : status.isLoading ? (
        <Spinner />
      ) : null}
      <Field label={t("pricing.mode.label")} tip="settings.priceMode" hint={t(`pricing.mode.${mode}Hint`)}>
        <Segmented
          label={t("pricing.mode.label")}
          value={mode}
          onChange={onMode}
          options={[
            { value: "standard", label: t("pricing.mode.standard") },
            { value: "strict", label: t("pricing.mode.strict") },
          ]}
        />
      </Field>
      <Reviews readOnly={status.data?.reference_read_only ?? false} />
      <Section
        title={t("pricing.tableTitle", { count: prices.data?.length ?? 0 })}
        id="pricing-table"
        icon={Coins}
        summary={status.data?.overrides ? t("pricing.overrides", { count: status.data.overrides }) : undefined}
      >
        {prices.error ? <ErrorText error={prices.error} /> : null}
        {prices.data ? <PriceTable entries={prices.data} /> : <Spinner />}
      </Section>
      <Section title={t("pricing.history.title")} id="pricing-history" icon={History}>
        <HistoryList />
      </Section>
    </section>
  );
}

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

function ReconciliationResult({ report }: { report: ReconciliationReport }) {
  const { t } = useTranslation();
  const [all, setAll] = useState(false);
  const rows = all ? report.rows : report.rows.filter((row) => row.model === null || row.status !== "ok");
  const amount = (value: string | null) => (value === null ? "–" : formatCost(Number(value)));
  return (
    <div className="stack" data-testid="reconciliation-result">
      {report.providers.map((provider) =>
        provider.ok ? null : (
          <Callout key={provider.provider} tone="danger">
            {t("pricing.reconciliation.providerFailed", { provider: t(`providers.names.${provider.provider}`, { defaultValue: provider.provider }) })}{" "}
            <code>{provider.error}</code>
          </Callout>
        ),
      )}
      <Callout tone={report.warnings ? "warning" : "info"}>
        {report.warnings ? t("pricing.reconciliation.warnings", { count: report.warnings }) : t("pricing.reconciliation.noWarnings")}{" "}
        {t("pricing.reconciliation.thresholds", {
          percent: formatNumber(Number(report.relative_threshold) * 100),
          amount: formatCost(Number(report.absolute_threshold_usd)),
        })}
      </Callout>
      <Segmented
        label={t("pricing.reconciliation.show")}
        value={all ? "all" : "days"}
        onChange={(value) => setAll(value === "all")}
        options={[
          { value: "days", label: t("pricing.reconciliation.showDays") },
          { value: "all", label: t("pricing.reconciliation.showAll") },
        ]}
      />
      <div className="table-wrap">
        <table className="table table--compact pricing__table">
          <thead>
            <tr>
              <th>{t("pricing.reconciliation.day")}</th>
              <th>{t("providers.provider")}</th>
              <th>{t("agent.model")}</th>
              <th className="num">{t("pricing.reconciliation.estimated")}</th>
              <th className="num">{t("pricing.reconciliation.billed")}</th>
              <th className="num">{t("pricing.reconciliation.difference")}</th>
              <th>{t("pricing.columns.status")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.day}:${row.provider}:${row.model ?? ""}:${index}`} data-status={row.status}>
                <td>{row.day}</td>
                <td>{t(`providers.names.${row.provider}`, { defaultValue: row.provider })}</td>
                <td>{row.model ?? t("pricing.reconciliation.dayTotal")}</td>
                <td className="num">{amount(row.estimated_usd)}</td>
                <td className="num">{amount(row.billed_usd)}</td>
                <td className="num">
                  {amount(row.difference_usd)}
                  {row.relative_difference !== null
                    ? ` (${formatNumber(Number(row.relative_difference) * 100, { maximumFractionDigits: 1 })} %)`
                    : null}
                </td>
                <td>
                  <Badge tone={row.status === "ok" ? "success" : row.status === "warning" ? "danger" : "idle"}>
                    {t(`pricing.reconciliation.status.${row.status}`)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The comparison of Nodestro's estimates with what OpenAI and Anthropic billed (optional; needs admin keys). */
export function ReconciliationPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const billing = useBillingKeys();
  const [start, setStart] = useState(() => isoDay(new Date(Date.now() - 30 * 86_400_000)));
  const [end, setEnd] = useState(() => isoDay(new Date()));
  const [percent, setPercent] = useState("5");
  const [amount, setAmount] = useState("1");
  const [keysGiven, setKeysGiven] = useState<Record<BillingProvider, string>>({ openai: "", anthropic: "" });
  const [stored, setStored] = useState<Record<BillingProvider, string>>({ openai: "", anthropic: "" });
  const reconcile = useMutation({
    mutationFn: () => {
      const body: ReconciliationRequest = {
        start,
        end,
        relative_threshold_percent: Number(percent) || 5,
        absolute_threshold_usd: Number(amount) >= 0 ? Number(amount) : 1,
      };
      const given = BILLING_PROVIDERS.filter((provider) => keysGiven[provider].trim());
      if (given.length) body.keys = Object.fromEntries(given.map((provider) => [provider, { admin_key: keysGiven[provider].trim() }]));
      return pricingApi.reconcile(body);
    },
    // The one-off keys are never kept, not even in the form.
    onSettled: () => setKeysGiven({ openai: "", anthropic: "" }),
  });
  const refreshKeys = () => void queryClient.invalidateQueries({ queryKey: pricingKeys.billingKeys });
  const storeKey = useMutation({
    mutationFn: (provider: BillingProvider) => pricingApi.setBillingKey(provider, { admin_key: stored[provider].trim() }),
    onSuccess: (_, provider) => {
      setStored({ ...stored, [provider]: "" });
      refreshKeys();
      toast.success(t("pricing.billing.saved"));
    },
    onError: toast.error,
  });
  const removeKey = useMutation({
    mutationFn: (provider: BillingProvider) => pricingApi.removeBillingKey(provider),
    onSuccess: refreshKeys,
    onError: toast.error,
  });
  const statuses = billing.data ?? [];
  const storable = statuses.some((item) => item.storable);
  return (
    <section className="panel stack" aria-labelledby="settings-reconciliation" data-testid="reconciliation-panel">
      <h2 className="panel__title" id="settings-reconciliation">
        <Receipt size={15} aria-hidden /> {t("pricing.reconciliation.title")}{" "}
        <HelpTip id="settings.reconciliation" label={t("pricing.reconciliation.title")} />
      </h2>
      <p className="muted small">{t("pricing.reconciliation.intro")}</p>
      {billing.error ? <ErrorText error={billing.error} /> : null}
      <ul className="pricing__history small">
        {statuses.map((item) => (
          <li key={item.provider}>
            <strong>{t(`providers.names.${item.provider}`, { defaultValue: item.provider })}</strong>
            <Badge tone={item.configured ? "success" : "idle"}>{t(`pricing.billing.origin.${item.origin}`)}</Badge>
            {item.storable ? (
              <>
                <TextInput
                  type="password"
                  autoComplete="off"
                  value={stored[item.provider]}
                  aria-label={t("pricing.billing.storeLabel", { provider: t(`providers.names.${item.provider}`) })}
                  placeholder={t("pricing.billing.placeholder")}
                  onChange={(event) => setStored({ ...stored, [item.provider]: event.target.value })}
                />
                <Button
                  size="sm"
                  busy={storeKey.isPending}
                  disabled={stored[item.provider].trim().length < 8}
                  onClick={() => storeKey.mutate(item.provider)}
                >
                  {t("pricing.billing.store")}
                </Button>
                {item.origin === "stored" ? (
                  <ConfirmIconButton
                    icon={Trash2}
                    label={t("pricing.billing.remove", { provider: t(`providers.names.${item.provider}`) })}
                    onConfirm={() => removeKey.mutate(item.provider)}
                  />
                ) : null}
              </>
            ) : null}
          </li>
        ))}
      </ul>
      {statuses.length && !storable ? <p className="muted small">{t("pricing.billing.desktop")}</p> : null}
      <div className="pricing__rates">
        <Field label={t("pricing.reconciliation.start")} htmlFor="reconcile-start">
          <TextInput id="reconcile-start" type="date" value={start} max={end} onChange={(event) => setStart(event.target.value)} />
        </Field>
        <Field label={t("pricing.reconciliation.end")} htmlFor="reconcile-end">
          <TextInput id="reconcile-end" type="date" value={end} min={start} onChange={(event) => setEnd(event.target.value)} />
        </Field>
        <Field label={t("pricing.reconciliation.percent")} htmlFor="reconcile-percent">
          <TextInput id="reconcile-percent" type="number" min={0.1} max={100} step={0.5} value={percent} onChange={(event) => setPercent(event.target.value)} />
        </Field>
        <Field label={t("pricing.reconciliation.amount")} htmlFor="reconcile-amount">
          <TextInput id="reconcile-amount" type="number" min={0} step={0.5} value={amount} onChange={(event) => setAmount(event.target.value)} />
        </Field>
      </div>
      <details className="small">
        <summary>{t("pricing.reconciliation.onceKeys")}</summary>
        <div className="pricing__rates">
          {BILLING_PROVIDERS.map((provider) => (
            <Field key={provider} label={t(`providers.names.${provider}`)} htmlFor={`reconcile-key-${provider}`}>
              <TextInput
                id={`reconcile-key-${provider}`}
                type="password"
                autoComplete="off"
                value={keysGiven[provider]}
                placeholder={t("pricing.billing.placeholder")}
                onChange={(event) => setKeysGiven({ ...keysGiven, [provider]: event.target.value })}
              />
            </Field>
          ))}
        </div>
        <p className="muted">{t("pricing.reconciliation.onceKeysHint")}</p>
      </details>
      <div>
        <Button variant="primary" icon={Receipt} busy={reconcile.isPending} disabled={!start || !end} onClick={() => reconcile.mutate()}>
          {t("pricing.reconciliation.run")}
        </Button>
      </div>
      {reconcile.error ? (
        <Callout tone="danger">
          <ErrorText error={reconcile.error} />
        </Callout>
      ) : null}
      {reconcile.data ? <ReconciliationResult report={reconcile.data} /> : null}
    </section>
  );
}
