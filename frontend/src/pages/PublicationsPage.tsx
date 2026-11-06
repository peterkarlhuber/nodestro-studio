// "Publications": every API published in this installation at a glance, with its workflow, status, active version,
// publication date and export history. A central overview only: publishing, versions, keys and exports stay in the
// workflow's "API & Export" dialog, which each entry opens.

import { useQuery } from "@tanstack/react-query";
import { Download, Globe, Plug } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";

import { api } from "../api/client";
import type { ExportRecord, PublicationOverviewItem } from "../api/types";
import { Badge, Button, Callout, EmptyState, PageHeader, Select, Spinner, TextInput } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { type Tone, formatBytes, formatDate } from "../lib/format";
import {
  PUBLICATION_SORTS,
  PUBLICATION_STATUSES,
  type PublicationFilter,
  type PublicationSort,
  type PublicationStatus,
  apiDialogHref,
  filterFromParams,
  paramsFromFilter,
  publicationStatus,
  visiblePublications,
} from "../publish/publicationsList";

/** In the "api" group, so the "API & Export" dialog's changes refresh this list too. */
export const publicationOverviewKey = ["api", "publication-overview"] as const;

const STATUS_TONE: Record<PublicationStatus, Tone> = { live: "success", off: "idle", noVersion: "warning" };

function ExportHistory({ records }: { records: ExportRecord[] }) {
  const { t } = useTranslation();
  if (!records.length) return <span className="muted small">{t("publications.exports.none")}</span>;
  return (
    <details className="publications__exports">
      <summary>
        {t("publications.exports.summary", { count: records.length })}
        <span className="muted small"> · {formatDate(records[0].created_at)}</span>
      </summary>
      <ul className="api-exports" data-testid="publication-exports">
        {records.map((record) => (
          <li key={record.id}>
            <a href={api.exportUrl(record.id)} download={record.file_name} aria-label={t("publications.exports.download", { file: record.file_name })}>
              <Download size={13} aria-hidden /> {record.file_name}
            </a>
            <span className="muted small">{formatDate(record.created_at)}</span>
            <Badge tone={record.options.kind === "portable" ? "success" : "idle"}>
              {record.options.kind === "portable" ? t("publish.export.kindPortable") : t("publish.export.kindStandard")}
            </Badge>
            <span className="muted small">
              {t("publications.version", { release: record.release_number })} · {formatBytes(record.size)}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function PublicationRow({ item }: { item: PublicationOverviewItem }) {
  const { t } = useTranslation();
  const status = publicationStatus(item);
  const openLabel = t("publications.open");
  return (
    <tr data-testid="publication-row" data-publication={item.id}>
      <td>
        <strong>{item.name}</strong>
        <div className="muted small">
          <code>/api/published/{item.slug}</code>
        </div>
      </td>
      <td data-label={t("publications.columns.workflow")}>
        {item.workflow_name ?? <span className="muted">{t("publications.workflowMissing")}</span>}
      </td>
      <td>
        <span className="publications__status">
          <Badge tone={STATUS_TONE[status]}>{t(`publications.status.${status}`)}</Badge>
          {item.network ? <Badge icon={Globe}>{t("publications.network")}</Badge> : null}
        </span>
      </td>
      <td data-label={t("publications.columns.version")}>
        {item.active_release !== null ? (
          <>
            {t("publications.version", { release: item.active_release })}
            {item.active_version !== null ? (
              <div className="muted small">{t("publications.workflowVersion", { version: item.active_version })}</div>
            ) : null}
          </>
        ) : (
          "–"
        )}
      </td>
      <td className="small" data-label={t("publications.columns.published")}>
        {item.published_at ? formatDate(item.published_at) : "–"}
      </td>
      <td data-label={t("publications.columns.exports")}>
        <ExportHistory records={item.exports} />
      </td>
      <td>
        <Link
          className="nd-button nd-button--default nd-button--sm publications__open"
          to={apiDialogHref(item.workflow_id)}
          aria-label={t("publications.openFor", { open: openLabel, name: item.name })}
          data-testid="publication-open-api"
        >
          <Plug size={14} aria-hidden />
          {openLabel}
        </Link>
      </td>
    </tr>
  );
}

export function PublicationsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  // The filter lives here and is mirrored into the address (replace), so quick successive changes never overwrite
  // each other and the way back from the editor finds the list as it was left.
  const [filter, setFilter] = useState<PublicationFilter>(() => filterFromParams(params));
  useEffect(() => {
    const next = paramsFromFilter(filter);
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [filter, params, setParams]);
  const overview = useQuery({ queryKey: publicationOverviewKey, queryFn: api.publicationOverview });
  const all = overview.data ?? [];
  const shown = useMemo(() => visiblePublications(overview.data ?? [], filter), [overview.data, filter]);
  const filtered = Boolean(filter.query || filter.status);
  const update = (patch: Partial<PublicationFilter>) => setFilter((current) => ({ ...current, ...patch }));

  return (
    <div className="page">
      <PageHeader title={t("nav.publications")} doc="api-und-export#veroeffentlichungen" description={t("publications.description")} />
      <div className="page__body">
        {overview.isLoading ? <Spinner /> : null}
        {overview.error ? (
          <Callout tone="danger">
            <ErrorText error={overview.error} />
          </Callout>
        ) : null}
        {all.length ? (
          <div className="page__filters publications__filters" role="search">
            <TextInput
              type="search"
              value={filter.query}
              onChange={(event) => update({ query: event.target.value })}
              placeholder={t("publications.searchPlaceholder")}
              aria-label={t("publications.searchLabel")}
              data-testid="publications-search"
            />
            <Select
              aria-label={t("publications.statusLabel")}
              value={filter.status ?? ""}
              onChange={(value) => update({ status: (value || null) as PublicationStatus | null })}
              options={[
                { value: "", label: t("publications.allStatuses") },
                ...PUBLICATION_STATUSES.map((value) => ({ value, label: t(`publications.status.${value}`) })),
              ]}
              data-testid="publications-status"
            />
            <Select
              aria-label={t("publications.sortLabel")}
              value={filter.sort}
              onChange={(value) => update({ sort: value as PublicationSort })}
              options={PUBLICATION_SORTS.map((value) => ({ value, label: t(`publications.sort.${value}`) }))}
              data-testid="publications-sort"
            />
          </div>
        ) : null}
        {overview.data && !all.length ? (
          <EmptyState icon={Plug} title={t("publications.empty")}>
            {t("publications.emptyText")}
          </EmptyState>
        ) : null}
        {all.length ? (
          <p className="muted small" aria-live="polite" data-testid="publications-count">
            {t("publications.results", { count: shown.length })}
          </p>
        ) : null}
        {all.length && !shown.length && filtered ? (
          <EmptyState
            icon={Plug}
            title={t("publications.noMatch")}
            action={
              <Button onClick={() => update({ query: "", status: null })} data-testid="publications-clear-filters">
                {t("publications.clearFilters")}
              </Button>
            }
          />
        ) : null}
        {shown.length ? (
          <div className="table-wrap">
            <table className="table publications__table" data-testid="publications-table">
              <thead>
                <tr>
                  <th>{t("publications.columns.api")}</th>
                  <th>{t("publications.columns.workflow")}</th>
                  <th>{t("publications.columns.status")}</th>
                  <th>{t("publications.columns.version")}</th>
                  <th>{t("publications.columns.published")}</th>
                  <th>{t("publications.columns.exports")}</th>
                  <th>
                    <span className="sr-only">{t("publications.columns.actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((item) => (
                  <PublicationRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
