// Favorites and tags for workflows, agent templates and tools, and the filter that uses them.
// They are stored apart from the objects, so marking something never changes it.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Tag, X } from "lucide-react";
import { type KeyboardEvent, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys, useOrganize } from "../api/hooks";
import type { Organize, OrganizeKind, OrganizeState } from "../api/types";
import { toast } from "./toast";
import { Button, IconButton, Modal, Select } from "./ui";

const EMPTY: Organize = { favorite: false, tags: [] };

export function organizeOf(state: OrganizeState | undefined, kind: OrganizeKind, id: string): Organize {
  return state?.items[`${kind}:${id}`] ?? EMPTY;
}

export interface OrganizeFilterValue {
  favorites: boolean;
  tag: string;
}

export const NO_FILTER: OrganizeFilterValue = { favorites: false, tag: "" };

/** Items matching the filter, favorites first; the order is otherwise kept. */
export function applyOrganize<T>(
  items: T[],
  kind: OrganizeKind,
  idOf: (item: T) => string,
  filter: OrganizeFilterValue,
  state: OrganizeState | undefined,
): T[] {
  const lower = filter.tag.toLowerCase();
  const matching = items.filter((item) => {
    const entry = organizeOf(state, kind, idOf(item));
    if (filter.favorites && !entry.favorite) return false;
    if (lower && !entry.tags.some((tag) => tag.toLowerCase() === lower)) return false;
    return true;
  });
  const favorite = (item: T) => (organizeOf(state, kind, idOf(item)).favorite ? 0 : 1);
  return matching
    .map((item, index) => ({ item, index }))
    .sort((a, b) => favorite(a.item) - favorite(b.item) || a.index - b.index)
    .map(({ item }) => item);
}

/** Tags used by items of one kind. */
export function tagsOf(state: OrganizeState | undefined, kind: OrganizeKind): string[] {
  const tags = new Map<string, string>();
  for (const [key, entry] of Object.entries(state?.items ?? {}))
    if (key.startsWith(`${kind}:`)) for (const tag of entry.tags) if (!tags.has(tag.toLowerCase())) tags.set(tag.toLowerCase(), tag);
  return [...tags.values()].sort((a, b) => a.localeCompare(b));
}

function useSetOrganize(kind: OrganizeKind, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (value: Organize) => api.setOrganize(kind, id, value),
    onMutate: (value) => {
      // Shown at once; the server answer replaces it.
      queryClient.setQueryData<OrganizeState>(keys.organize, (state) =>
        state ? { ...state, items: { ...state.items, [`${kind}:${id}`]: value } } : state,
      );
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: keys.organize }),
    onError: toast.error,
  });
}

export function FavoriteButton({ kind, id, name }: { kind: OrganizeKind; id: string; name: string }) {
  const { t } = useTranslation();
  const state = useOrganize();
  const entry = organizeOf(state.data, kind, id);
  const set = useSetOrganize(kind, id);
  return (
    <button
      type="button"
      className={`favorite-button ${entry.favorite ? "favorite-button--on" : ""}`}
      aria-pressed={entry.favorite}
      aria-label={entry.favorite ? t("organize.unfavorite", { name }) : t("organize.makeFavorite", { name })}
      title={entry.favorite ? t("organize.unfavorite", { name }) : t("organize.makeFavorite", { name })}
      data-testid="favorite"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        set.mutate({ ...entry, favorite: !entry.favorite });
      }}
    >
      <Star size={15} aria-hidden fill={entry.favorite ? "currentColor" : "none"} />
    </button>
  );
}

export function TagChips({ kind, id }: { kind: OrganizeKind; id: string }) {
  const state = useOrganize();
  const tags = organizeOf(state.data, kind, id).tags;
  if (!tags.length) return null;
  return (
    <span className="tag-row">
      {tags.map((tag) => (
        <span key={tag} className="tag">
          {tag}
        </span>
      ))}
    </span>
  );
}

export function TagEditor({ kind, id, name }: { kind: OrganizeKind; id: string; name: string }) {
  const { t } = useTranslation();
  const state = useOrganize();
  const entry = organizeOf(state.data, kind, id);
  const set = useSetOrganize(kind, id);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const suggestions = useMemo(
    () => (state.data?.tags ?? []).filter((tag) => !entry.tags.some((own) => own.toLowerCase() === tag.toLowerCase())),
    [state.data, entry.tags],
  );
  const add = (value: string) => {
    const tag = value.trim();
    setText("");
    if (!tag || entry.tags.some((own) => own.toLowerCase() === tag.toLowerCase())) return;
    set.mutate({ ...entry, tags: [...entry.tags, tag] });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(text);
    }
  };
  const listId = `tag-suggestions-${kind}-${id}`;
  return (
    <>
      <IconButton
        icon={Tag}
        label={t("organize.editTags", { name })}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
      />
      <Modal title={t("organize.tagsTitle", { name })} open={open} onClose={() => setOpen(false)}>
        <p className="muted small">{t("organize.tagsText")}</p>
        <div className="tag-row">
          {entry.tags.length ? (
            entry.tags.map((tag) => (
              <span key={tag} className="tag tag--removable">
                {tag}
                <button
                  type="button"
                  aria-label={t("organize.removeTag", { tag })}
                  onClick={() => set.mutate({ ...entry, tags: entry.tags.filter((own) => own !== tag) })}
                >
                  <X size={11} aria-hidden />
                </button>
              </span>
            ))
          ) : (
            <span className="muted small">{t("organize.noTags")}</span>
          )}
        </div>
        <div className="row-gap">
          <input
            className="nd-input"
            list={listId}
            value={text}
            maxLength={32}
            autoFocus
            data-autofocus
            aria-label={t("organize.newTag")}
            placeholder={t("organize.newTagPlaceholder")}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={onKeyDown}
          />
          <datalist id={listId}>
            {suggestions.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
          <Button onClick={() => add(text)} disabled={!text.trim()}>
            {t("organize.addTag")}
          </Button>
        </div>
      </Modal>
    </>
  );
}

export function OrganizeFilter({
  kind,
  value,
  onChange,
}: {
  kind: OrganizeKind;
  value: OrganizeFilterValue;
  onChange: (value: OrganizeFilterValue) => void;
}) {
  const { t } = useTranslation();
  const state = useOrganize();
  const tags = tagsOf(state.data, kind);
  return (
    <div className="organize-filter row-gap">
      <button
        type="button"
        className={`nd-button nd-button--ghost nd-button--md ${value.favorites ? "nd-button--active" : ""}`}
        aria-pressed={value.favorites}
        onClick={() => onChange({ ...value, favorites: !value.favorites })}
        data-testid="favorites-filter"
      >
        <Star size={14} aria-hidden fill={value.favorites ? "currentColor" : "none"} /> {t("organize.onlyFavorites")}
      </button>
      {tags.length ? (
        <Select
          aria-label={t("organize.filterTag")}
          value={value.tag}
          placeholder={t("organize.allTags")}
          options={tags.map((tag) => ({ value: tag, label: tag }))}
          onChange={(tag) => onChange({ ...value, tag })}
        />
      ) : null}
    </div>
  );
}
