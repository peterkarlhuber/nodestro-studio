// The Publications page's overview logic: status, search, filter and sort of the publications the API lists.
// Nothing here changes a publication; the page only reads GET /api/publication-overview.

import type { PublicationOverviewItem } from "../api/types";

/** The editor opens its "API & Export" dialog when the address carries ?api=1 (a link from the Publications page). */
export const API_DIALOG_PARAM = "api";

/** The workflow editor with its "API & Export" dialog open: the publication of that workflow is shown there. */
export function apiDialogHref(workflowId: string): string {
  return `/workflows/${encodeURIComponent(workflowId)}?${API_DIALOG_PARAM}=1`;
}

export const PUBLICATION_STATUSES = ["live", "off", "noVersion"] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

/** live: the API answers requests; off: switched off; noVersion: switched on, but no version is active. */
export function publicationStatus(item: Pick<PublicationOverviewItem, "enabled" | "active_release">): PublicationStatus {
  if (!item.enabled) return "off";
  return item.active_release === null ? "noVersion" : "live";
}

export const PUBLICATION_SORTS = ["name", "published", "exported"] as const;
export type PublicationSort = (typeof PUBLICATION_SORTS)[number];

export interface PublicationFilter {
  query: string;
  status: PublicationStatus | null;
  sort: PublicationSort;
}

/** The address keeps the filter (?q=…&status=…&sort=…), so the way back from the editor finds it again. Unknown
 *  values count as no filter. */
export function filterFromParams(params: URLSearchParams): PublicationFilter {
  const status = params.get("status");
  const sort = params.get("sort");
  return {
    query: params.get("q") ?? "",
    status: (PUBLICATION_STATUSES as readonly string[]).includes(status ?? "") ? (status as PublicationStatus) : null,
    sort: (PUBLICATION_SORTS as readonly string[]).includes(sort ?? "") ? (sort as PublicationSort) : "name",
  };
}

/** The address of a filter: only what differs from the default (name order, no search, every status). */
export function paramsFromFilter(filter: PublicationFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.query) params.set("q", filter.query);
  if (filter.status) params.set("status", filter.status);
  if (filter.sort !== "name") params.set("sort", filter.sort);
  return params;
}

const fold = (text: string) => text.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase();

/** The API's name, its address name and the workflow's name all match a search (case and accents ignored). */
export function matchesQuery(item: PublicationOverviewItem, query: string): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = fold([item.name, item.slug, `/api/published/${item.slug}`, item.workflow_name ?? ""].join(" "));
  return words.every((word) => haystack.includes(word));
}

const newest = (value: string | null | undefined) => (value ? Date.parse(value) || 0 : 0);
const lastExport = (item: PublicationOverviewItem) => newest(item.exports[0]?.created_at);

export function visiblePublications(items: PublicationOverviewItem[], filter: PublicationFilter): PublicationOverviewItem[] {
  const byName = (a: PublicationOverviewItem, b: PublicationOverviewItem) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.slug.localeCompare(b.slug);
  const compare: Record<PublicationSort, (a: PublicationOverviewItem, b: PublicationOverviewItem) => number> = {
    name: byName,
    published: (a, b) => newest(b.published_at) - newest(a.published_at) || byName(a, b),
    exported: (a, b) => lastExport(b) - lastExport(a) || byName(a, b),
  };
  return items
    .filter((item) => (!filter.status || publicationStatus(item) === filter.status) && matchesQuery(item, filter.query))
    .sort(compare[filter.sort]);
}
