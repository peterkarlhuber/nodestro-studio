// Interface languages: i18next with one resource bundle per language (src/i18n/locales/<lang>/*.json).
//
// - On the first start the browser language decides; unsupported languages fall back to English.
// - A language the user picks in the settings always wins. It is kept in localStorage (read
//   before the first render) and in the backend settings (so another browser gets it too).
// - Switching only re-renders the interface: no workflow runs, no AI request, stored content
//   (agents, prompts, results) is never touched.
// - English is the technical fallback for any missing key.

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { resources } from "./resources";

export const LANGUAGES = ["de", "en", "es", "fr", "pt-BR", "it"] as const;
export type Language = (typeof LANGUAGES)[number];
export const FALLBACK_LANGUAGE: Language = "en";

/** Each language in its own name, for the language picker. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  de: "Deutsch",
  en: "English",
  es: "Español",
  fr: "Français",
  "pt-BR": "Português (Brasil)",
  it: "Italiano",
};

/** The region used for numbers and dates when the browser does not name one for the language. */
const DEFAULT_REGION: Record<Language, string> = {
  de: "de-DE",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  "pt-BR": "pt-BR",
  it: "it-IT",
};

export const STORAGE_KEY = "nodestro-language";

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}

/** The supported language for a BCP 47 tag ("de-AT" → "de", "pt" → "pt-BR"), or null. */
export function matchLanguage(tag: string | null | undefined): Language | null {
  if (!tag) return null;
  const lower = tag.trim().toLowerCase().replace("_", "-");
  const base = lower.split("-")[0];
  if (base === "pt") return "pt-BR";
  return isLanguage(base) ? base : null;
}

/** The first supported browser language; English when none is supported. */
export function detectLanguage(preferred: readonly string[] | undefined): Language {
  for (const tag of preferred ?? []) {
    const language = matchLanguage(tag);
    if (language) return language;
  }
  return FALLBACK_LANGUAGE;
}

function browserLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return [];
  return navigator.languages?.length ? navigator.languages : [navigator.language];
}

/** The language the user picked in the settings, if any. */
export function storedLanguage(): Language | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isLanguage(value) ? value : null;
  } catch {
    return null; // storage may be unavailable (private mode)
  }
}

function store(language: Language | null): void {
  try {
    if (language) localStorage.setItem(STORAGE_KEY, language);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage may be unavailable (private mode)
  }
}

export function initialLanguage(): Language {
  return storedLanguage() ?? detectLanguage(browserLanguages());
}

export function currentLanguage(): Language {
  return isLanguage(i18n.language) ? i18n.language : FALLBACK_LANGUAGE;
}

/**
 * The locale for numbers and dates: the browser's own regional variant when it matches the
 * interface language (de-AT, en-GB, fr-CA …), otherwise the usual region of the language.
 */
export function formatLocale(language: Language = currentLanguage()): string {
  for (const tag of browserLanguages()) {
    if (matchLanguage(tag) === language && tag.includes("-")) {
      if (language === "pt-BR" && !/^pt-br$/i.test(tag)) continue;
      return tag;
    }
  }
  return DEFAULT_REGION[language];
}

/**
 * Switch the interface language right away. ``remember`` stores a manual choice;
 * ``null`` forgets it and follows the browser again.
 */
export async function setLanguage(language: Language | null, remember = true): Promise<Language> {
  const next = language ?? detectLanguage(browserLanguages());
  if (remember) store(language);
  await i18n.changeLanguage(next);
  return next;
}

function applyDocumentLanguage(language: string): void {
  if (typeof document !== "undefined") document.documentElement.lang = language;
}

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  supportedLngs: [...LANGUAGES],
  // "pt-BR" is a language of its own here, not a variant of "pt".
  nonExplicitSupportedLngs: false,
  load: "currentOnly",
  interpolation: { escapeValue: false }, // React escapes
  returnNull: false,
  initAsync: false,
});
applyDocumentLanguage(i18n.language);
i18n.on("languageChanged", applyDocumentLanguage);

export default i18n;
