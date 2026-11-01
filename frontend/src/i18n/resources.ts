// Collects src/i18n/locales/<language>/<area>.json into one i18next bundle per language.
// Every area file becomes a top-level key: locales/de/agent.json → t("agent.…").
//
// Only English (the fallback) is part of the main chunk. Every other language is a chunk of its own
// (src/i18n/bundles/<language>.ts) that loadLanguage() in ./index.ts fetches before it is shown.

import type { Resource, ResourceLanguage } from "i18next";

export type Messages = Record<string, unknown>;

/** area → messages, e.g. areas.common.save */
export type Areas = Record<string, Messages>;

/**
 * French, Spanish, Italian and Portuguese have a plural category "many" (1,000,000, 2,000,000 …). i18next looks
 * for "…_many" and, when it is missing, falls back to the English text instead of the same language's "…_other".
 * The language files keep only "_one"/"_other"; "_many" is derived here from "_other" unless a file names it.
 */
export function addManyForms(messages: Messages): Messages {
  for (const [key, value] of Object.entries(messages)) {
    if (value && typeof value === "object") addManyForms(value as Messages);
    else if (key.endsWith("_other")) {
      const many = `${key.slice(0, -"_other".length)}_many`;
      if (!(many in messages)) messages[many] = value;
    }
  }
  return messages;
}

/** language → area → messages from the result of an eager import.meta.glob of locales/<language>/<area>.json. */
export function collectBundles(files: Record<string, Messages>): Record<string, Areas> {
  const bundles: Record<string, Areas> = {};
  for (const [path, messages] of Object.entries(files)) {
    const match = /locales\/([^/]+)\/([^/]+)\.json$/.exec(path);
    if (!match) continue;
    const [, language, area] = match;
    (bundles[language] ??= {})[area] = messages;
  }
  for (const [language, areas] of Object.entries(bundles)) {
    if (!new Intl.PluralRules(language).resolvedOptions().pluralCategories.includes("many")) continue;
    for (const messages of Object.values(areas)) addManyForms(messages);
  }
  return bundles;
}

/** The areas of one language from such a glob result (an empty object when the glob found nothing). */
export function collectLanguage(language: string, files: Record<string, Messages>): Areas {
  return collectBundles(files)[language] ?? {};
}

const english = collectLanguage("en", import.meta.glob<Messages>("./locales/en/*.json", { eager: true, import: "default" }));

/** The bundles in the main chunk: English only. */
export const resources: Resource = { en: { translation: english as ResourceLanguage } };
