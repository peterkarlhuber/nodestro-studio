// The web sources of a run (NAL-A2, runtime source ledger): every search hit and every page its web tools saw, by
// id (S1, S2 ...), so cited sources (`source: ledger` result fields) can be looked up. The list is the shared
// SourceList of @nodestro/ui-ai (ST-068): titles come from web pages and are shown as plain text, and a link opens
// only an http(s) address, in a new tab without a referrer.

import { SourceList } from "@nodestro/ui-ai";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Run, SourceEntry } from "../api/types";
import { Badge } from "../components/ui";
import { formatDate, formatTime } from "../lib/format";

/** The address to open (after redirects when the page was read), or null when it is not an http(s) address. */
export function sourceHref(source: SourceEntry): string | null {
  for (const candidate of [source.final_url, source.url]) {
    if (!candidate) continue;
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.href;
    } catch {
      // not an address
    }
  }
  return null;
}

/** The sources of a run, or of anything that lists them the same way (an answer of a conversation). */
export function WebSources({ run }: { run: Pick<Run, "sources"> }) {
  const { t } = useTranslation();
  const sources = run.sources ?? [];
  return (
    <SourceList
      className="panel stack web-sources"
      data-testid="web-sources"
      level={2}
      hideEmpty
      title={
        <>
          <Globe size={14} aria-hidden /> {t("runs.webSources.title")}
        </>
      }
      hint={t("runs.webSources.hint")}
      itemProps={(item) => ({ "data-testid": `web-source-${item.id}` }) as React.LiHTMLAttributes<HTMLLIElement>}
      sources={sources.map((source) => ({
        id: source.id,
        title: source.title.trim() || source.url || source.id,
        // The address that opens: after redirects when the page was read.
        url: sourceHref(source) ?? (source.final_url || source.url),
        meta: (
          <time dateTime={source.retrieved_at} title={formatDate(source.retrieved_at)}>
            {formatTime(source.retrieved_at)}
          </time>
        ),
        badge: (
          <Badge tone={source.origin === "fetched" ? "success" : "idle"}>
            {t(source.origin === "fetched" ? "runs.webSources.fetched" : "runs.webSources.search")}
          </Badge>
        ),
      }))}
    />
  );
}
