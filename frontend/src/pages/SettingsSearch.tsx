// The search box of the settings page: finds single settings by their name, explanation and help text, in the
// interface language, and jumps to one (opening the parts around it, focusing its control, highlighting it).
// A combobox with a list of hits (WAI-ARIA combobox pattern): arrow keys choose, Enter jumps, Escape clears.
// The index is read from the page (pages/settingsSearch.ts), so new sections are found without a list here.

import { Search, X } from "lucide-react";
import { type KeyboardEvent, type RefObject, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { prefersReducedMotion } from "../lib/motion";
import { type SettingHit, indexSettings, revealSetting, searchSettings, snippet } from "./settingsSearch";

export function SettingsSearch({ container }: { container: RefObject<HTMLElement | null> }) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const id = useId();
  const listId = `${id}-list`;

  const hits = useMemo<SettingHit[]>(() => {
    const root = container.current;
    if (!root || !query.trim()) return [];
    const help = (key: string) => {
      const text = t(`help.${key}`, { defaultValue: "" });
      return typeof text === "string" ? text : "";
    };
    return searchSettings(indexSettings(root, help), query);
    // The language is part of the key: the page's texts change with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container, query, i18n.language, open]);

  const choose = (hit: SettingHit | undefined) => {
    if (!hit || !hit.element.isConnected) return;
    setOpen(false);
    revealSetting(hit.element, prefersReducedMotion());
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!hits.length) return;
      event.preventDefault();
      setOpen(true);
      setActive((current) => (current + (event.key === "ArrowDown" ? 1 : hits.length - 1)) % hits.length);
    } else if (event.key === "Enter") {
      if (!hits.length) return;
      event.preventDefault();
      choose(hits[Math.min(active, hits.length - 1)]);
    } else if (event.key === "Escape") {
      if (!query && !open) return;
      event.preventDefault();
      event.stopPropagation();
      if (open && hits.length) setOpen(false);
      else setQuery("");
    }
  };

  const showList = open && hits.length > 0;
  const current = showList ? hits[Math.min(active, hits.length - 1)] : undefined;
  return (
    <div className="settings-search" role="search" data-testid="settings-search">
      <div className="settings-search__box">
        <Search size={14} aria-hidden className="settings-search__icon" />
        <input
          id={`${id}-input`}
          className="nd-input settings-search__input"
          type="search"
          role="combobox"
          aria-label={t("settingsUi.search.label")}
          autoComplete="off"
          spellCheck={false}
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={current ? `${id}-hit-${current.key}` : undefined}
          aria-describedby={`${id}-status`}
          placeholder={t("settingsUi.search.placeholder")}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={(event) => {
            if (!event.currentTarget.parentElement?.parentElement?.contains(event.relatedTarget as Node)) setOpen(false);
          }}
          onKeyDown={onKeyDown}
          data-testid="settings-search-input"
        />
        {query ? (
          <button
            type="button"
            className="settings-search__clear"
            aria-label={t("settingsUi.search.clear")}
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
          >
            <X size={13} aria-hidden />
          </button>
        ) : null}
      </div>
      <ul id={listId} role="listbox" className="settings-search__list" hidden={!showList} aria-label={t("settingsUi.search.results")}>
        {hits.map((hit, index) => (
          <li
            key={hit.key}
            id={`${id}-hit-${hit.key}`}
            role="option"
            aria-selected={current?.key === hit.key}
            className="settings-search__hit"
            data-testid="settings-search-hit"
            // Keeps the focus in the input, so the list stays open until the hit is chosen.
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => setActive(index)}
            onClick={() => choose(hit)}
          >
            <span className="settings-search__label">{hit.label}</span>
            {hit.context ? <span className="settings-search__context">{hit.context}</span> : null}
            {hit.text ? <span className="settings-search__snippet">{snippet(hit.text, query)}</span> : null}
          </li>
        ))}
      </ul>
      <p id={`${id}-status`} className="settings-search__status" aria-live="polite">
        {query.trim()
          ? hits.length
            ? open
              ? t("settingsUi.search.found", { count: hits.length })
              : ""
            : t("settingsUi.search.none", { query: query.trim() })
          : ""}
      </p>
    </div>
  );
}
