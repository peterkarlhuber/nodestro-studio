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

export const resources: Resource = Object.fromEntries(
  Object.entries(bundles).map(([language, areas]) => [language, { translation: areas as ResourceLanguage }]),
);
