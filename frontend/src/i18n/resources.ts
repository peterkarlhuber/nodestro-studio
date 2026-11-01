// Collects src/i18n/locales/<language>/<area>.json into one i18next bundle per language.
// Every area file becomes a top-level key: locales/de/agent.json → t("agent.…").

import type { Resource, ResourceLanguage } from "i18next";

const files = import.meta.glob<Record<string, unknown>>("./locales/*/*.json", { eager: true, import: "default" });

export type Messages = Record<string, unknown>;

/** language → area → messages, e.g. bundles.de.common.save */
export const bundles: Record<string, Record<string, Messages>> = {};

for (const [path, messages] of Object.entries(files)) {
  const match = /\.\/locales\/([^/]+)\/([^/]+)\.json$/.exec(path);
  if (!match) continue;
  const [, language, area] = match;
  (bundles[language] ??= {})[area] = messages;
}

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

for (const [language, areas] of Object.entries(bundles)) {
  if (!new Intl.PluralRules(language).resolvedOptions().pluralCategories.includes("many")) continue;
  for (const messages of Object.values(areas)) addManyForms(messages);
}

export const resources: Resource = Object.fromEntries(
  Object.entries(bundles).map(([language, areas]) => [language, { translation: areas as ResourceLanguage }]),
);
