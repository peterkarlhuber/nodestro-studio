// The shared help of the platform (@nodestro/ui-help): a short explanation per family of API error codes, in the
// interface language, shown next to an error message (ProblemText) and found by the offline help search of the
// documentation overview. Each entry links to the chapter of the built-in documentation that covers it; a unit test
// checks that every reference exists.

import { HelpProvider, type HelpEntry, UiTextProvider } from "@nodestro/ui-core";
import { platformHelp } from "@nodestro/ui-help";
import { type ReactNode, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { docPath } from "./help";

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

/** Provides the platform help (and the texts of the shared components) in the interface language. */
export function PlatformHelp({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const help = useMemo(() => platformHelp(i18n.language, { hrefs: HREFS }), [i18n.language]);
  // "Learn more" stays in the app: the documentation is a page of the studio, not a new page load.
  const open = useCallback((_id: string, entry: HelpEntry) => {
    if (entry.href) navigate(entry.href);
  }, [navigate]);
  return (
    <UiTextProvider locale={i18n.language}>
      <HelpProvider entries={help.entries} errors={help.errors} onOpen={open}>
        {children}
      </HelpProvider>
    </UiTextProvider>
  );
}
