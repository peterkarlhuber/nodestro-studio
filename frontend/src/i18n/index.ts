// Interface languages: i18next with one resource bundle per language (src/i18n/locales/<lang>/*.json).
//
// - On the first start the browser language decides; unsupported languages fall back to English.
// - A language the user picks in the settings always wins. It is kept in localStorage (read
//   before the first render) and in the backend settings (so another browser gets it too).
// - Switching only re-renders the interface: no workflow runs, no AI request, stored content
//   (agents, prompts, results) is never touched.
// - English is the technical fallback for any missing key.
// - Only English is part of the main chunk. Every other language is a chunk of its own that
//   loadLanguage() fetches; main.tsx renders only once the first language is there, so nobody
//   sees English texts before their own.

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { type Areas, resources } from "./resources";

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

/** The chunks of the languages besides English (see ./bundles). */
const BUNDLES: Record<Exclude<Language, "en">, () => Promise<{ default: Areas }>> = {
  de: () => import("./bundles/de"),
  es: () => import("./bundles/es"),
  fr: () => import("./bundles/fr"),
  it: () => import("./bundles/it"),
  "pt-BR": () => import("./bundles/pt-BR"),
};
const loading = new Map<Language, Promise<void>>();

/** Whether the texts of a language are there (English always is). */
export function isLanguageLoaded(language: Language): boolean {
  return language === FALLBACK_LANGUAGE || i18n.hasResourceBundle(language, "translation");
}

/**
 * Fetch the texts of a language once and add them to i18next. A failed fetch (offline, new
 * version deployed) rejects and may be tried again; English stays the fallback meanwhile.
 */
export function loadLanguage(language: Language): Promise<void> {
  if (language === "en" || isLanguageLoaded(language)) return Promise.resolve();
  const pending =
    loading.get(language) ??
    BUNDLES[language]().then(
      (module) => {
        i18n.addResourceBundle(language, "translation", module.default, true, true);
        loading.delete(language); // from now on hasResourceBundle answers
      },
      (error: unknown) => {
        loading.delete(language);
        throw error;
      },
    );
  loading.set(language, pending);
  return pending;
}

/**
 * Switch the interface language right away. ``remember`` stores a manual choice;
 * ``null`` forgets it and follows the browser again.
 */
export async function setLanguage(language: Language | null, remember = true): Promise<Language> {
  const next = language ?? detectLanguage(browserLanguages());
  // The texts first, then the switch: the interface never shows a half-loaded language.
  await loadLanguage(next);
  if (remember) store(language);
  await i18n.changeLanguage(next);
  return next;
}

function applyDocumentLanguage(language: string): void {
  if (typeof document !== "undefined") document.documentElement.lang = language;
}

/**
 * Keys the interface asked for that exist in no language, English included. A component test fails on any of
 * them (src/test/setup.ts), the browser console names each once (e2e/i18n.mjs fails on it), and the interface shows
 * readableMissingKey() instead of the raw key. Calls that pass a defaultValue are deliberate and not collected.
 */
export const missingKeys = new Set<string>();

const KEY_SHAPE = /^[a-zA-Z][\w-]*(\.[\w-]+)+$/;
/** Last parts of a key that only say which text of a thing it is: "….docx.label" reads as "docx". */
const GENERIC_PARTS = new Set(["label", "title", "text", "description", "hint", "short", "name", "open", "action"]);

/**
 * A readable stand-in for a key without a text, never the dotted key itself: "flow.files.formats.docx" → "Docx",
 * "errors.run.loop_exhausted" → "Loop exhausted", "welcome.nodes.dataRoom.title" → "Data room".
 */
export function readableMissingKey(key: string): string {
  const parts = key.split(".");
  let last = parts.pop() ?? key;
  if (GENERIC_PARTS.has(last) && parts.length > 1) last = parts.pop() ?? last;
  const words = last
    .replace(/_(zero|one|two|few|many|other)$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : key;
}

function missingKeyText(key: string, defaultValue: string | undefined): string {
  if (defaultValue !== undefined) return defaultValue; // the caller chose a fallback
  if (!KEY_SHAPE.test(key)) return key; // not a key but a text passed through t()
  if (!missingKeys.has(key)) {
    missingKeys.add(key);
    // Once per key, also in production: the browser e2e checks (e2e/i18n.mjs) fail on this message.
    if (import.meta.env.MODE !== "test") console.warn(`Missing interface text: ${key}`);
  }
  return readableMissingKey(key);
}

void i18n.use(initReactI18next).init({
  // A copy: i18next adds the loaded languages to the object it is given.
  resources: { ...resources },
  // The other languages are added by loadLanguage(); i18next must not treat English as all there is.
  partialBundledLanguages: true,
  lng: initialLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  supportedLngs: [...LANGUAGES],
  // "pt-BR" is a language of its own here, not a variant of "pt".
  nonExplicitSupportedLngs: false,
  load: "currentOnly",
  interpolation: { escapeValue: false }, // React escapes
  returnNull: false,
  // A key without a text in any language never reaches the screen as "area.some.key" (see missingKeys).
  parseMissingKeyHandler: (key: string, defaultValue?: string) => missingKeyText(key, defaultValue),
  initAsync: false,
});
applyDocumentLanguage(i18n.language);
i18n.on("languageChanged", applyDocumentLanguage);

export default i18n;
