// The web sources of a run (NAL-A2, runtime source ledger): every search hit and every page its web tools saw, by
// id (S1, S2 ...), so cited sources (`source: ledger` result fields) can be looked up. Titles come from web pages:
// they are shown as plain text, and a link opens only an http(s) address, in a new tab without a referrer.

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

function domainOf(source: SourceEntry): string {
  try {
    return new URL(source.final_url || source.url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function WebSources({ run }: { run: Run }) {
  const { t } = useTranslation();
  const sources = run.sources ?? [];
  if (!sources.length) return null;
  return (
    <section className="panel stack" aria-label={t("runs.webSources.title")} data-testid="web-sources">
      <h2 className="panel__title">
        <Globe size={14} aria-hidden /> {t("runs.webSources.title")}
      </h2>
      <p className="muted small">{t("runs.webSources.hint")}</p>
      <ul className="web-sources">
        {sources.map((source) => {
          const href = sourceHref(source);
          const title = source.title.trim() || source.url || source.id;
          return (
            <li key={source.id} className="web-sources__item" data-testid={`web-source-${source.id}`}>
              <code>{source.id}</code>
              <span className="web-sources__text">
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {title}
                  </a>
                ) : (
                  <span>{title}</span>
                )}
                <span className="muted small">
                  {domainOf(source)}
                  {domainOf(source) ? " · " : ""}
                  <time dateTime={source.retrieved_at} title={formatDate(source.retrieved_at)}>
                    {formatTime(source.retrieved_at)}
                  </time>
                </span>
              </span>
              <Badge tone={source.origin === "fetched" ? "success" : "idle"}>
                {t(source.origin === "fetched" ? "runs.webSources.fetched" : "runs.webSources.search")}
              </Badge>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
