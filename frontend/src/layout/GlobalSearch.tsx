// Global search (Ctrl/Cmd+K): workflows, agents in workflows, agent templates, examples, tools and
// knowledge from the server, plus the documentation in the current language. Results are
// grouped by kind; Enter or a click opens the hit where it lives.

import { useQuery } from "@tanstack/react-query";
import { BookMarked, BookOpen, Bot, Command, Diamond, LayoutTemplate, type LucideIcon, Search, Star } from "lucide-react";
import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import type { SearchResult } from "../api/types";
import { Modal, Spinner } from "../components/ui";
import { currentLanguage } from "../i18n";

type Kind = SearchResult["kind"] | "docs";

interface Hit {
  key: string;
  kind: Kind;
  title: string;
  subtitle: string;
  snippet: string;
  to: string;
  favorite: boolean;
}

const KINDS: Kind[] = ["workflow", "agent", "template", "example", "tool", "knowledge", "docs"];
const ICONS: Record<Kind, LucideIcon> = {
  workflow: Diamond,
  agent: Bot,
  template: Bot,
  example: LayoutTemplate,
  tool: Command,
  knowledge: BookOpen,
  docs: BookMarked,
};

/** Where a search result opens. */
export function targetOf(result: SearchResult): string {
  switch (result.kind) {
    case "workflow":
      return `/workflows/${result.id}`;
    case "agent":
      return `/workflows/${result.workflow_id}?node=${encodeURIComponent(result.node_id ?? "")}`;
    case "template":
      return `/agents?template=${encodeURIComponent(result.id)}`;
    case "example":
      return `/workflows/examples?template=${encodeURIComponent(result.id)}`;
    case "tool":
      return `/tools?tool=${encodeURIComponent(result.id)}`;
    case "knowledge":
      return `/knowledge?file=${encodeURIComponent(result.id)}`;
  }
}

function useDebounced(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function useDocHits(query: string) {
  return useQuery({
    queryKey: ["doc-search", currentLanguage(), query],
    queryFn: async (): Promise<Hit[]> => {
      // The documentation is large, so it is only loaded when someone searches (current language only).
      const [{ loadChapters }, { searchDocs }] = await Promise.all([import("../docs/index"), import("../docs/search")]);
      return searchDocs(await loadChapters(currentLanguage()), query, 6).map((hit) => ({
        key: `docs:${hit.chapter.id}#${hit.sectionId}`,
        kind: "docs",
        title: hit.title,
        subtitle: hit.chapter.title,
        snippet: hit.snippet,
        to: `/docs/${hit.chapter.id}#${hit.sectionId}`,
        favorite: false,
      }));
    },
    enabled: query.trim().length > 1,
    staleTime: 60_000,
  });
}

export function GlobalSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const debounced = useDebounced(query.trim(), 180);
  const server = useQuery({
    queryKey: ["search", currentLanguage(), debounced],
    queryFn: () => api.search(debounced),
    enabled: open && debounced.length > 0,
    staleTime: 5_000,
  });
  const docs = useDocHits(open ? debounced : "");

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hits = useMemo<Hit[]>(() => {
    const fromServer: Hit[] = (server.data ?? []).map((result) => ({
      key: `${result.kind}:${result.workflow_id ?? ""}:${result.id}`,
      kind: result.kind,
      title: result.title,
      subtitle: result.subtitle,
      snippet: result.snippet,
      to: targetOf(result),
      favorite: result.favorite,
    }));
    const all = [...fromServer, ...(docs.data ?? [])];
    // Grouped in a fixed order, so the keyboard order matches what is shown.
    return KINDS.flatMap((kind) => all.filter((hit) => hit.kind === kind));
  }, [server.data, docs.data]);

  useEffect(() => setActive(0), [hits]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };
  const go = (hit: Hit) => {
    close();
    navigate(hit.to);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, hits.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && hits[active]) {
      event.preventDefault();
      go(hits[active]);
    }
  };

  const shortcut = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl+K";
  const loading = server.isFetching || docs.isFetching;
  let index = -1;
  return (
    <>
      <button type="button" className="search-trigger" onClick={() => setOpen(true)} aria-keyshortcuts="Control+K Meta+K" data-testid="search-open">
        <Search size={14} aria-hidden />
        <span className="search-trigger__label">{t("search.open")}</span>
        <kbd>{shortcut}</kbd>
      </button>
      <Modal title={t("search.title")} open={open} onClose={close} wide>
        <div className="global-search">
          <div className="global-search__field">
            <Search size={16} aria-hidden />
            <input
              autoFocus
              type="search"
              value={query}
              role="combobox"
              aria-expanded={hits.length > 0}
              aria-controls="global-search-results"
              aria-activedescendant={hits[active] ? `search-hit-${active}` : undefined}
              aria-label={t("search.label")}
              placeholder={t("search.placeholder")}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
            />
            {loading ? <Spinner /> : null}
          </div>
          {!debounced ? <p className="muted small">{t("search.hint")}</p> : null}
          {debounced && !loading && !hits.length ? <p className="muted">{t("search.empty", { query: debounced })}</p> : null}
          <div id="global-search-results" role="listbox" aria-label={t("search.results")}>
            {KINDS.filter((kind) => hits.some((hit) => hit.kind === kind)).map((kind) => {
              const Icon = ICONS[kind];
              return (
                <section key={kind} className="global-search__group">
                  <h3 className="global-search__heading">
                    <Icon size={13} aria-hidden /> {t(`search.kind.${kind}`)}
                  </h3>
                  {hits
                    .filter((hit) => hit.kind === kind)
                    .map((hit) => {
                      index += 1;
                      const position = index;
                      return (
                        <div
                          key={hit.key}
                          id={`search-hit-${position}`}
                          role="option"
                          aria-selected={position === active}
                          className={`global-search__hit ${position === active ? "active" : ""}`}
                          data-testid="search-hit"
                          onMouseEnter={() => setActive(position)}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => go(hit)}
                        >
                          <span className="global-search__title">
                            {hit.favorite ? <Star size={12} aria-label={t("organize.favorite")} className="favorite-star" /> : null}
                            {hit.title}
                            {hit.subtitle ? <span className="muted small"> · {hit.subtitle}</span> : null}
                          </span>
                          {hit.snippet ? <span className="global-search__snippet small muted">{hit.snippet}</span> : null}
                        </div>
                      );
                    })}
                </section>
              );
            })}
          </div>
        </div>
      </Modal>
    </>
  );
}
