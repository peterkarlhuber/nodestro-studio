// Global search (Ctrl/Cmd+K): workflows, agents in workflows, agent templates, examples, tools and
// knowledge from the server, plus pages and settings sections, the latest runs (filtered here, OB-09) and
// the documentation in the current language. Without a query it offers the recent runs and workflows.
// Results are grouped by kind; Enter or a click opens the hit where it lives.

import { useQuery } from "@tanstack/react-query";
import {
  BookMarked,
  BookOpen,
  Bot,
  Command,
  CornerDownRight,
  Diamond,
  History,
  LayoutTemplate,
  type LucideIcon,
  Play,
  Search,
  Star,
} from "lucide-react";
import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { RunSummary, SearchResult, WorkflowSummary } from "../api/types";
import { Modal, Spinner } from "../components/ui";
import { currentLanguage } from "../i18n";
import { relativeTime } from "../lib/format";

type Kind = "recent" | "page" | SearchResult["kind"] | "run" | "docs";
type Translate = (key: string, options?: Record<string, unknown>) => string;

interface Hit {
  key: string;
  kind: Kind;
  title: string;
  subtitle: string;
  snippet: string;
  to: string;
  favorite: boolean;
}

const KINDS: Kind[] = ["recent", "page", "workflow", "run", "agent", "template", "example", "tool", "knowledge", "docs"];
const ICONS: Record<Kind, LucideIcon> = {
  recent: History,
  page: CornerDownRight,
  workflow: Diamond,
  run: Play,
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

/** Pages and settings sections to jump to: the label keys of the navigation and of the settings headings. */
const PAGES: { to: string; label: string; within?: string }[] = [
  { to: "/", label: "nav.workflows" },
  { to: "/workflows/examples", label: "library.title" },
  { to: "/agents", label: "nav.agents" },
  { to: "/tools", label: "nav.tools" },
  { to: "/knowledge", label: "nav.knowledge" },
  { to: "/memory", label: "nav.memory" },
  { to: "/executions", label: "nav.executions" },
  { to: "/approvals", label: "nav.approvals" },
  { to: "/usage", label: "nav.usage" },
  { to: "/tests", label: "nav.tests" },
  { to: "/batches", label: "nav.batches" },
  { to: "/schedules", label: "nav.schedules" },
  { to: "/docs", label: "nav.docs" },
  { to: "/welcome", label: "nav.welcome" },
  { to: "/settings", label: "nav.settings" },
  { to: "/settings#settings-local-models", label: "localModels.title", within: "nav.settings" },
  { to: "/settings#settings-providers", label: "settings.providers.title", within: "nav.settings" },
  { to: "/settings#settings-language", label: "settings.language.title", within: "nav.settings" },
  { to: "/settings#settings-models", label: "settings.models.title", within: "nav.settings" },
  { to: "/settings#settings-prices", label: "pricing.title", within: "nav.settings" },
  { to: "/settings#settings-reconciliation", label: "pricing.reconciliation.title", within: "nav.settings" },
  { to: "/settings#settings-sandbox", label: "settings.sandbox.title", within: "nav.settings" },
  { to: "/settings#settings-knowledge-search", label: "localModels.search.title", within: "nav.settings" },
  { to: "/settings#settings-ocr", label: "settings.ocr.title", within: "nav.settings" },
  { to: "/settings#settings-inputs", label: "inputs.storage.title", within: "nav.settings" },
  { to: "/settings#settings-python", label: "python.maintenance.title", within: "nav.settings" },
  { to: "/settings#settings-backup", label: "backup.title", within: "nav.settings" },
  { to: "/settings#settings-diagnostics", label: "diagnostics.title", within: "nav.settings" },
  { to: "/settings#settings-about", label: "settings.about.title", within: "nav.settings" },
];

/** Runs shown at most in the "Runs" group, and recent runs and workflows for an empty query. */
const RUN_HITS = 6;
const RECENT_RUNS = 3;
const RECENT_WORKFLOWS = 3;

/** Lower case without accents and with plain apostrophes, so "regles" finds "Réglages" and "l'outil" "l’outil". */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .toLowerCase();
}

/** Pages whose name (or, for settings sections, the section's name) contains every word of the query. */
export function pageHits(query: string, translate: (key: string) => string): Hit[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return PAGES.filter((page) => {
    const text = fold(`${translate(page.label)} ${page.within ? translate(page.within) : ""}`);
    // An empty query offers the pages themselves, not every settings section.
    return words.length ? words.every((word) => text.includes(word)) : !page.within;
  }).map((page) => ({
    key: `page:${page.to}`,
    kind: "page",
    title: translate(page.label),
    subtitle: page.within ? translate(page.within) : "",
    snippet: "",
    to: page.to,
    favorite: false,
  }));
}

function runHit(run: RunSummary, t: Translate, kind: Kind = "run"): Hit {
  const input = run.input.replace(/\s+/g, " ").trim();
  return {
    key: `${kind}:run:${run.id}`,
    kind,
    title: run.workflow_name || run.workflow_id,
    subtitle: `${t(`status.${run.status}.label`)} · ${relativeTime(run.created_at)}`,
    snippet: input.length > 120 ? `${input.slice(0, 119)}…` : input,
    to: `/executions/${encodeURIComponent(run.id)}`,
    favorite: false,
  };
}

/**
 * Runs whose workflow name, input, status or id contains every word of the query: a filter of the newest runs the
 * list answers (``GET /runs``, up to 100), since the server search has no runs. Newest first.
 */
export function runHits(query: string, runs: RunSummary[] | undefined, t: Translate, limit = RUN_HITS): Hit[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return [...(runs ?? [])]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .filter((run) => {
      const text = fold(`${run.workflow_name} ${run.input.slice(0, 2000)} ${t(`status.${run.status}.label`)} ${run.id}`);
      return words.every((word) => text.includes(word));
    })
    .slice(0, limit)
    .map((run) => runHit(run, t));
}

/** For an empty query: the latest runs a person started and the most recently changed workflows. */
export function recentHits(runs: RunSummary[] | undefined, workflows: WorkflowSummary[] | undefined, t: Translate): Hit[] {
  const latestRuns = [...(runs ?? [])]
    .filter((run) => !run.imported_at)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, RECENT_RUNS)
    .map((run) => ({ ...runHit(run, t, "recent"), subtitle: `${t("search.recentRun")} · ${runHit(run, t).subtitle}` }));
  const latestWorkflows = [...(workflows ?? [])]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, RECENT_WORKFLOWS)
    .map((workflow) => ({
      key: `recent:workflow:${workflow.id}`,
      kind: "recent" as const,
      title: workflow.name,
      subtitle: `${t("search.recentWorkflow")} · ${t("common.changed", { time: relativeTime(workflow.updated_at) })}`,
      snippet: "",
      to: `/workflows/${encodeURIComponent(workflow.id)}`,
      favorite: false,
    }));
  return [...latestRuns, ...latestWorkflows];
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
  // The run list and the workflows as the other pages load them (same cache); only while the search is open.
  const runs = useQuery({ queryKey: keys.runs(undefined), queryFn: () => api.runs(), enabled: open, staleTime: 10_000 });
  const workflows = useQuery({ queryKey: keys.workflows, queryFn: api.workflows, enabled: open, staleTime: 10_000 });

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
    const typed = open ? query.trim() : "";
    const all = [
      ...(open && !typed ? recentHits(runs.data, workflows.data, t) : []),
      ...pageHits(typed, t),
      ...fromServer,
      ...runHits(typed, runs.data, t),
      ...(docs.data ?? []),
    ];
    // Grouped in a fixed order, so the keyboard order matches what is shown.
    return KINDS.flatMap((kind) => all.filter((hit) => hit.kind === kind));
  }, [server.data, docs.data, runs.data, workflows.data, open, query, t]);

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
      {/* The visible label is hidden at phone width, so the button carries its name itself (F4). */}
      <button
        type="button"
        className="search-trigger"
        onClick={() => setOpen(true)}
        aria-keyshortcuts="Control+K Meta+K"
        data-testid="search-open"
      >
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
              data-autofocus
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
                // A listbox holds options or groups of options (ARIA APG, grouped listbox): each kind is a group
                // named by its heading, which itself is presentational (F5).
                <div
                  key={kind}
                  role="group"
                  aria-labelledby={`search-group-${kind}`}
                  className="global-search__group"
                  data-testid={`search-group-${kind}`}
                >
                  <div role="presentation" id={`search-group-${kind}`} className="global-search__heading">
                    <Icon size={13} aria-hidden /> {t(`search.kind.${kind}`)}
                  </div>
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
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </>
  );
}
