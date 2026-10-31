import { ArrowLeft, ArrowRight, BookMarked, Hash, Search, X } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import ReactMarkdown, { type Components } from "react-markdown";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import remarkGfm from "remark-gfm";

import { useMeta } from "../api/hooks";
import { Callout, PageHeader } from "../components/ui";
import { type DocChapter, chaptersFor } from "../docs";
import { plainText, splitWidgets } from "../docs/parse";
import { type DocHit, fold, searchDocs } from "../docs/search";
import { currentLanguage } from "../i18n";
import { modelDescription } from "../lib/catalog";
import { formatNumber, formatPrice } from "../lib/format";

const SECTION_PREFIX = "doc-";

/** Links inside the documentation: chapters open in the app, everything else in a new tab. */
const MARKDOWN: Components = {
  a: ({ href = "", children }) =>
    href.startsWith("/") ? (
      <Link to={href}>{children}</Link>
    ) : (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    ),
  table: ({ children }) => (
    <div className="docs-table">
      <table>{children}</table>
    </div>
  ),
};

function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN}>
      {text}
    </ReactMarkdown>
  );
}

/** The chapters in the interface language; re-renders when the language changes. */
function useChapters(): DocChapter[] {
  const { i18n } = useTranslation();
  return useMemo(() => chaptersFor(currentLanguage()), [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps
}

function ModelTable() {
  const { t } = useTranslation();
  const meta = useMeta();
  const models = meta.data?.models ?? [];
  if (!models.length) return <p className="muted small">{t("docs.models.loading")}</p>;
  const usd = (value: number | null) => formatPrice(value);
  return (
    <div className="docs-table">
      <table>
        <caption className="sr-only">{t("docs.models.caption")}</caption>
        <thead>
          <tr>
            <th>{t("agent.model")}</th>
            <th>{t("docs.models.use")}</th>
            <th className="num">{t("docs.models.input")}</th>
            <th className="num">{t("docs.models.output")}</th>
            <th className="num">{t("docs.models.cacheWrite")}</th>
            <th className="num">{t("docs.models.cacheRead")}</th>
          </tr>
        </thead>
        <tbody>
          {models.map((model) => (
            <tr key={model.id}>
              <td>
                <strong>{model.label}</strong>
                <div className="muted small">
                  <code>{model.id}</code>
                </div>
              </td>
              <td>{modelDescription(t, model)}</td>
              <td className="num">{usd(model.input_usd_per_mtok)}</td>
              <td className="num">{usd(model.output_usd_per_mtok)}</td>
              <td className="num">
                {usd(model.cache_write_5m_usd_per_mtok)} / {usd(model.cache_write_1h_usd_per_mtok)}
              </td>
              <td className="num">{usd(model.cache_read_usd_per_mtok)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small">{t("docs.models.note")}</p>
    </div>
  );
}

/** Keyboard shortcuts: the keys and the action come from docs.shortcuts.<id> in the language files. */
const SHORTCUTS = ["save", "undo", "redo", "duplicate", "delete", "canvas", "escape", "search", "assistant"] as const;

const KEYS = { kbd: <kbd /> };

function ShortcutTable() {
  const { t } = useTranslation();
  return (
    <div className="docs-table">
      <table>
        <thead>
          <tr>
            <th>{t("docs.shortcuts.key")}</th>
            <th>{t("docs.shortcuts.action")}</th>
          </tr>
        </thead>
        <tbody>
          {SHORTCUTS.map((id) => (
            <tr key={id}>
              <td>
                <Trans i18nKey={`docs.shortcuts.${id}.keys`} components={KEYS} />
              </td>
              <td>{t(`docs.shortcuts.${id}.action`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small">
        <Trans i18nKey="docs.shortcuts.mac" components={KEYS} />
      </p>
    </div>
  );
}

const WIDGETS: Record<string, () => ReactNode> = { models: ModelTable, shortcuts: ShortcutTable };

function SectionBody({ body }: { body: string }) {
  return (
    <div className="markdown docs-markdown">
      {splitWidgets(body).map((part, index) => {
        if (part.kind === "markdown") return <Markdown key={index} text={part.text} />;
        const Widget = WIDGETS[part.name];
        return Widget ? <Widget key={index} /> : null;
      })}
    </div>
  );
}

/** Highlights the search words in a snippet. */
function Highlight({ text, query }: { text: string; query: string }) {
  const words = fold(query).split(/\s+/).filter((word) => word.length > 1);
  const folded = fold(text);
  if (!words.length || folded.length !== text.length) return <>{text}</>;
  const marks: boolean[] = new Array(text.length).fill(false);
  for (const word of words)
    for (let at = folded.indexOf(word); at !== -1; at = folded.indexOf(word, at + word.length))
      for (let i = at; i < at + word.length; i += 1) marks[i] = true;
  const parts: ReactNode[] = [];
  let start = 0;
  for (let i = 1; i <= text.length; i += 1) {
    if (i === text.length || marks[i] !== marks[start]) {
      const piece = text.slice(start, i);
      parts.push(marks[start] ? <mark key={start}>{piece}</mark> : piece);
      start = i;
    }
  }
  return <>{parts}</>;
}

function SearchResults({ hits, query, onOpen }: { hits: DocHit[]; query: string; onOpen: () => void }) {
  const { t } = useTranslation();
  return (
    <section className="docs-results" aria-label={t("docs.search.results")} aria-live="polite">
      <h2 className="panel__title">
        {hits.length
          ? t("docs.search.hits", { count: hits.length, value: formatNumber(hits.length), query })
          : t("docs.search.noHits", { query })}
      </h2>
      {!hits.length ? <p className="muted small">{t("docs.search.tryOther")}</p> : null}
      <ol className="docs-results__list">
        {hits.map((hit) => (
          <li key={`${hit.chapter.id}-${hit.sectionId}`}>
            <Link to={`/docs/${hit.chapter.id}#${hit.sectionId}`} onClick={onOpen} className="docs-result">
              <span className="docs-result__path">{hit.chapter.title}</span>
              <strong>
                <Highlight text={hit.title} query={query} />
              </strong>
              <span className="docs-result__snippet">
                <Highlight text={hit.snippet} query={query} />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function useActiveSection(chapter: DocChapter | undefined): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    setActive(null);
    if (!chapter || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setActive(visible[0].target.id.slice(SECTION_PREFIX.length));
      },
      { rootMargin: "0px 0px -70% 0px" },
    );
    for (const section of chapter.sections) {
      const element = document.getElementById(SECTION_PREFIX + section.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [chapter]);
  return active;
}

function Overview() {
  const { t } = useTranslation();
  const chapters = useChapters();
  return (
    <>
      <Callout tone="brand">
        <Trans
          i18nKey="docs.overview.intro"
          components={{ a: <Link to="/docs/start#erste-schritte" />, strong: <strong /> }}
        />
      </Callout>
      <div className="card-grid docs-cards">
        {chapters.map((chapter) => {
          const Icon = chapter.icon;
          return (
            <Link key={chapter.id} to={`/docs/${chapter.id}`} className="card card--link docs-card">
              <div className="card__head">
                <span className="card__avatar">
                  <Icon size={16} aria-hidden />
                </span>
                <div>
                  <h3>{chapter.title}</h3>
                  <span className="muted small">{t("docs.overview.sections", { count: chapter.sections.length })}</span>
                </div>
              </div>
              <p className="card__text">{plainText(chapter.intro).split(". ")[0]}.</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function ChapterView({ chapter }: { chapter: DocChapter }) {
  const { t } = useTranslation();
  const chapters = useChapters();
  const index = chapters.findIndex((item) => item.id === chapter.id);
  const previous = chapters[index - 1];
  const next = chapters[index + 1];
  return (
    <article className="docs-article" aria-label={chapter.title}>
      <div className="docs-intro">
        <Markdown text={chapter.intro} />
      </div>
      <nav className="docs-toc" aria-label={t("docs.onThisPage")}>
        <span className="nd-field-label">{t("docs.onThisPage")}</span>
        <ol>
          {chapter.sections.map((section) => (
            <li key={section.id}>
              <Link to={`#${section.id}`}>{section.title}</Link>
            </li>
          ))}
        </ol>
      </nav>
      {chapter.sections.map((section) => (
        <section key={section.id} id={SECTION_PREFIX + section.id} className="docs-section" aria-labelledby={`${SECTION_PREFIX}${section.id}-title`}>
          <h2 id={`${SECTION_PREFIX}${section.id}-title`}>
            {section.title}
            <Link to={`#${section.id}`} className="docs-anchor" aria-label={t("docs.linkTo", { title: section.title })}>
              <Hash size={13} aria-hidden />
            </Link>
          </h2>
          <SectionBody body={section.body} />
        </section>
      ))}
      <nav className="docs-pager" aria-label={t("docs.pager")}>
        {previous ? (
          <Link to={`/docs/${previous.id}`} className="docs-pager__link">
            <ArrowLeft size={14} aria-hidden />
            <span>
              <small>{t("docs.previous")}</small>
              {previous.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/docs/${next.id}`} className="docs-pager__link docs-pager__link--next">
            <span>
              <small>{t("docs.next")}</small>
              {next.title}
            </span>
            <ArrowRight size={14} aria-hidden />
          </Link>
        ) : null}
      </nav>
    </article>
  );
}

/** The built-in user manual: chapters from src/docs/chapters, a table of contents and a search. */
export function DocsPage() {
  const { t } = useTranslation();
  const { chapter: chapterId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const chapters = useChapters();
  const chapter = useMemo(() => chapters.find((item) => item.id === chapterId), [chapters, chapterId]);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const hits = useMemo(() => searchDocs(chapters, query), [chapters, query]);
  const active = useActiveSection(chapter);
  const searching = query.trim().length > 1;

  // Scroll to "#section" whenever the chapter or the hash changes, and mark the target briefly.
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!chapter) return;
    const target = id ? document.getElementById(SECTION_PREFIX + id) : null;
    if (target) {
      target.scrollIntoView?.({ block: "start" });
      target.classList.add("docs-section--target");
      const timer = window.setTimeout(() => target.classList.remove("docs-section--target"), 1600);
      return () => window.clearTimeout(timer);
    }
    document.querySelector(".content")?.scrollTo?.({ top: 0 });
  }, [chapter, location.hash]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key === "/" && !target?.closest("input, textarea, select, [contenteditable]")) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (chapterId && !chapter) {
    return (
      <div className="page">
        <PageHeader title={t("nav.docs")} />
        <div className="page__body">
          <Callout tone="warning">
            <Trans i18nKey="docs.missingChapter" components={{ a: <Link to="/docs" /> }} />
          </Callout>
        </div>
      </div>
    );
  }

  return (
    <div className="page docs">
      <PageHeader
        title={chapter ? chapter.title : t("nav.docs")}
        crumbs={
          chapter ? (
            <>
              <Link to="/docs">{t("nav.docs")}</Link> / <span>{chapter.title}</span>
            </>
          ) : undefined
        }
        description={
          chapter
            ? undefined
            : t("docs.description")
        }
      />
      <div className="docs__layout">
        <aside className="docs-nav" aria-label={t("nav.docs")}>
          <form className="docs-search" role="search" onSubmit={(event) => event.preventDefault()}>
            <Search size={14} aria-hidden className="docs-search__icon" />
            <input
              ref={searchRef}
              type="search"
              className="nd-input"
              placeholder={t("docs.search.placeholder")}
              aria-label={t("docs.search.label")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setQuery("");
                if (event.key === "Enter" && hits[0]) {
                  navigate(`/docs/${hits[0].chapter.id}#${hits[0].sectionId}`);
                  setQuery("");
                }
              }}
            />
            {query ? (
              <button type="button" className="docs-search__clear" aria-label={t("docs.search.clear")} onClick={() => setQuery("")}>
                <X size={13} aria-hidden />
              </button>
            ) : (
              <kbd className="docs-search__key" aria-hidden>
                /
              </kbd>
            )}
          </form>
          <ol className="docs-nav__chapters">
            <li>
              <Link to="/docs" className={`docs-nav__chapter ${!chapter ? "active" : ""}`} aria-current={!chapter ? "page" : undefined}>
                <BookMarked size={14} aria-hidden /> {t("docs.overview.title")}
              </Link>
            </li>
            {chapters.map((item) => {
              const Icon = item.icon;
              const current = item.id === chapter?.id;
              return (
                <li key={item.id}>
                  <Link
                    to={`/docs/${item.id}`}
                    className={`docs-nav__chapter ${current ? "active" : ""}`}
                    aria-current={current ? "page" : undefined}
                  >
                    <Icon size={14} aria-hidden /> {item.title}
                  </Link>
                  {current ? (
                    <ol className="docs-nav__sections">
                      {item.sections.map((section) => (
                        <li key={section.id}>
                          <Link to={`#${section.id}`} className={active === section.id ? "active" : undefined}>
                            {section.title}
                          </Link>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </aside>
        <div className="docs__main">
          {searching ? (
            <SearchResults hits={hits} query={query.trim()} onOpen={() => setQuery("")} />
          ) : chapter ? (
            <ChapterView chapter={chapter} />
          ) : (
            <Overview />
          )}
        </div>
      </div>
    </div>
  );
}
