// The help registry of the studio, in the interface language, for the shared help components of @nodestro/ui-core:
// - the platform's help (@nodestro/ui-help): a short explanation per family of API error codes, shown next to an
//   error message (ProblemText);
// - the studio's own help (lib/help.ts, texts help.<id> and titles helpTitles.<id> in the language files): the help
//   buttons (HelpTip) next to labels, settings and values all over the studio, and the settings search, which reads
//   a setting's help by the data-help id of its button (pages/settingsSearchIndex.ts).
// All of it is found by the offline help search of the documentation overview. Each entry links to the section of
// the built-in documentation that covers it; unit tests check that every reference exists.

import { HelpProvider, type HelpEntry, type HelpRegistry, type Translate, UiTextProvider } from "@nodestro/ui-core";
import { platformHelp } from "@nodestro/ui-help";
import type { TFunction } from "i18next";
import { type ReactNode, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { HELP_IDS, docPath, helpEntry } from "./help";

/** Help entry id of @nodestro/ui-help -> "<chapter>#<section>" of the built-in documentation. */
export const PLATFORM_HELP_DOCS: Record<string, string> = {
  "help.access": "einstellungen#server",
  "help.approvals": "verzweigungen#freigaben-seite",
  "help.budget": "workflows#budget",
  "help.models": "einstellungen#anbieter",
  "help.localModels": "einstellungen#lokale-modelle",
  "help.agents": "agenten#grundlagen",
  "help.tools": "tools#fehler",
  "help.libraries": "python-bibliotheken#probleme",
  "help.connections": "verbindungen#einrichten",
  "help.files": "datei-eingaben#ueberblick",
  "help.workflows": "workflows#pruefung",
  "help.runs": "ausfuehrungen#fehler",
  "help.publishing": "api-und-export#fehler",
  "help.backup": "einstellungen#backup",
  "help.requests": "faq#haeufige-fehler",
};

const HREFS = Object.fromEntries(Object.entries(PLATFORM_HELP_DOCS).map(([id, doc]) => [id, docPath(doc)]));

/** The studio's own entries of the shared help (texts in the language files), with their documentation sections. */
export const STUDIO_HELP_DOCS: Record<string, string> = {
  "studio.exchange": "verbindungen#austausch",
};

/**
 * Error code families of the API that the shared help package does not map (yet), onto the studio's entries or the
 * platform's. With HELP_ERRORS of @nodestro/ui-help they explain every code of the API's error catalog
 * (apiErrorCodes.json; checked in helpCoverage.test.ts).
 */
export const STUDIO_HELP_ERRORS: Record<string, string> = {
  "exchange.*": "studio.exchange",
  "axentra.*": "help.connections",
  "connect.*": "help.workflows",
  "validate.*": "help.workflows",
  "data.*": "help.backup",
  // Workflows as tools of an agent (N-20, off by default): refused or stopped workflow tools.
  "workflow_tool.*": "help.workflows",
  // The data-only extension store (admin page next to the approvals): refused uploads, removed packages.
  "extension_store.*": "help.approvals",
};

/** The help registry of the studio in one language: the shared help plus the studio's entries and error families. */
export function studioHelp(t: TFunction, language: string): Required<HelpRegistry> {
  const help = platformHelp(language, { hrefs: HREFS });
  const own: Record<string, HelpEntry> = {};
  for (const id of HELP_IDS) {
    const { text, doc } = helpEntry(t, id);
    own[id] = { title: t(`helpTitles.${id}`), summary: text, ...(doc ? { href: docPath(doc) } : {}) };
  }
  Object.assign(own, {
    "studio.exchange": {
      title: t("exchange.help.title"),
      summary: t("exchange.help.summary"),
      href: docPath(STUDIO_HELP_DOCS["studio.exchange"]),
      keywords: "exchange import export nodestro-mcp nodestro-connection nodestro-collection nodestro-workflow",
    },
  });
  return { entries: { ...help.entries, ...own }, errors: { ...help.errors, ...STUDIO_HELP_ERRORS } };
}

/**
 * Package text -> the studio's key, everywhere in the app: the shared components keep the studio's wording where it
 * had its own (the second step of a two-step delete button says "Really delete?", as before).
 */
export const STUDIO_UI_TEXTS: Readonly<Record<string, string>> = {
  "core.confirm.delete": "common.confirmDelete",
};

/** Provides the platform help (and the texts of the shared components) in the interface language. */
export function PlatformHelp({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const help = useMemo(() => studioHelp(t, i18n.language), [t, i18n.language]);
  // "Learn more" stays in the app: the documentation is a page of the studio, not a new page load.
  const open = useCallback((_id: string, entry: HelpEntry) => {
    if (entry.href) navigate(entry.href);
  }, [navigate]);
  const translate = useCallback<Translate>(
    (key, values) => (key in STUDIO_UI_TEXTS ? t(STUDIO_UI_TEXTS[key], values) : undefined),
    [t],
  );
  return (
    <UiTextProvider locale={i18n.language} translate={translate}>
      <HelpProvider entries={help.entries} errors={help.errors} onOpen={open}>
        {children}
      </HelpProvider>
    </UiTextProvider>
  );
}
