import { act, render, screen } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { afterEach, describe, expect, it, vi } from "vitest";

import { problemText, legacyCode } from "../lib/errors";
import { HELP_IDS } from "../lib/help";
import i18n, {
  FALLBACK_LANGUAGE,
  LANGUAGES,
  STORAGE_KEY,
  type Language,
  currentLanguage,
  detectLanguage,
  formatLocale,
  initialLanguage,
  isLanguageLoaded,
  loadLanguage,
  matchLanguage,
  setLanguage,
  storedLanguage,
} from "./index";
import { bundles } from "../test/locales";
import { type Messages, resources } from "./resources";

/** Every key of a bundle as "area.path.to.key", with plural suffixes folded ("count_one" → "count"). */
function flatten(messages: Messages, prefix = ""): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") for (const [inner, text] of flatten(value as Messages, path)) result.set(inner, text);
    else result.set(path, String(value));
  }
  return result;
}

const PLURAL = /_(zero|one|two|few|many|other)$/;
const keysOf = (language: string) => flatten(bundles[language] as Messages);
const reference = keysOf(FALLBACK_LANGUAGE);
const baseKeys = (keys: Iterable<string>) => new Set([...keys].map((key) => key.replace(PLURAL, "")));
const variables = (text: string) => [...text.matchAll(/\{\{\s*([\w.]+)[^}]*\}\}/g)].map((match) => match[1]).sort();
const tags = (text: string) => [...text.matchAll(/<\/?([a-zA-Z0-9]+)\s*\/?>/g)].map((match) => match[0]).sort();

describe("language files", () => {
  it("exist for every language with the same areas", () => {
    expect(Object.keys(bundles).sort()).toEqual([...LANGUAGES].sort());
    for (const language of LANGUAGES) expect(Object.keys(bundles[language]).sort(), language).toEqual(Object.keys(bundles.en).sort());
  });

  it.each(LANGUAGES)("%s has every key of the reference and no extra ones", (language) => {
    const keys = baseKeys(keysOf(language).keys());
    const expected = baseKeys(reference.keys());
    expect([...expected].filter((key) => !keys.has(key)), `missing in ${language}`).toEqual([]);
    expect([...keys].filter((key) => !expected.has(key)), `unknown in ${language}`).toEqual([]);
  });

  it.each(LANGUAGES)("%s has the plural forms its grammar needs", (language) => {
    const rules = new Intl.PluralRules(language);
    const needed = new Set(rules.resolvedOptions().pluralCategories);
    const keys = keysOf(language);
    for (const key of reference.keys()) {
      if (!PLURAL.test(key)) continue;
      const base = key.replace(PLURAL, "");
      for (const category of needed) {
        // French, Spanish, Italian and Portuguese use "many" for round millions. i18next does not fall back from
        // "_many" to the same language's "_other" but to English, so "_many" must exist (resources.ts derives it).
        expect(keys.has(`${base}_${category}`), `${language}: ${base}_${category}`).toBe(true);
      }
    }
  });

  it.each(LANGUAGES)("%s has no empty texts and keeps placeholders and markup", (language) => {
    const keys = keysOf(language);
    for (const [key, text] of keys) {
      expect(text.trim(), `${language}: ${key}`).not.toBe("");
      const base = key.replace(PLURAL, "");
      const english = reference.get(key) ?? reference.get(`${base}_other`) ?? reference.get(base);
      expect(english, `${language}: ${key} has no English counterpart`).toBeDefined();
      const allowed = new Set([...variables(english!), "count"]);
      for (const name of variables(text)) expect(allowed.has(name), `${language}: ${key} uses {{${name}}}`).toBe(true);
      expect(tags(text), `${language}: ${key} markup`).toEqual(tags(english!));
    }
  });

  it.each(LANGUAGES)("%s names no void HTML element as markup", (language) => {
    // <Trans> treats these as empty elements: <link>Knowledge</link> renders an empty link and the word next to it.
    const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
    for (const [key, text] of keysOf(language)) {
      for (const tag of tags(text)) {
        const name = tag.replace(/[</>\s]/g, "");
        expect(VOID.has(name), `${language}: ${key} uses <${name}>`).toBe(false);
      }
    }
  });

  it("has a help text for every tooltip", () => {
    for (const id of HELP_IDS) expect(reference.has(`help.${id}`), id).toBe(true);
  });
});

describe("keys used in the source", () => {
  const sources = import.meta.glob<string>(["../**/*.{ts,tsx}", "!../**/*.test.{ts,tsx}", "!../i18n/**"], {
    eager: true,
    query: "?raw",
    import: "default",
  });
  const known = baseKeys(reference.keys());
  const prefixes = new Set([...known].flatMap((key) => key.split(".").map((_, index, parts) => parts.slice(0, index + 1).join("."))));

  it("only uses keys that exist", () => {
    const missing: string[] = [];
    for (const [file, text] of Object.entries(sources)) {
      for (const match of text.matchAll(/(?:\bt|i18n\.t|i18nKey=)\(?\s*["'`]([a-zA-Z][\w.-]*)(\$\{)?/g)) {
        const [, key, dynamic] = match;
        if (!key.includes(".")) continue;
        // `agent.options.${group}` and the like: the static part must be a known prefix.
        const ok = dynamic ? prefixes.has(key.replace(/\.$/, "")) : known.has(key);
        if (!ok) missing.push(`${file}: ${key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("has no German or English sentences left in components", () => {
    const suspicious: string[] = [];
    for (const [file, text] of Object.entries(sources)) {
      if (!file.endsWith(".tsx")) continue;
      for (const match of text.matchAll(/(?:label|title|placeholder|hint|description|aria-label|content)="([^"{]*[a-zA-Z]{3,} [a-zA-Z]{2,}[^"]*)"/g))
        suspicious.push(`${file}: ${match[1]}`);
    }
    expect(suspicious).toEqual([]);
  });
});

describe("language detection", () => {
  afterEach(() => vi.restoreAllMocks());

  it("matches browser languages to supported ones", () => {
    expect(matchLanguage("de-AT")).toBe("de");
    expect(matchLanguage("pt")).toBe("pt-BR");
    expect(matchLanguage("pt-PT")).toBe("pt-BR");
    expect(matchLanguage("fr_CA")).toBe("fr");
    expect(matchLanguage("nl")).toBeNull();
  });

  it("takes the first supported browser language and falls back to English", () => {
    expect(detectLanguage(["nl-NL", "it-IT", "de"])).toBe("it");
    expect(detectLanguage(["ja", "zh-CN"])).toBe("en");
    expect(detectLanguage([])).toBe("en");
  });

  it("prefers a stored manual choice over the browser", () => {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["es-ES"]);
    expect(initialLanguage()).toBe("es");
    localStorage.setItem(STORAGE_KEY, "fr");
    expect(initialLanguage()).toBe("fr");
    localStorage.setItem(STORAGE_KEY, "xx");
    expect(initialLanguage()).toBe("es");
  });

  it("uses the browser's region for numbers when it fits the language", () => {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["de-CH", "en-GB"]);
    expect(formatLocale("de")).toBe("de-CH");
    expect(formatLocale("en")).toBe("en-GB");
    expect(formatLocale("fr")).toBe("fr-FR");
    expect(formatLocale("pt-BR")).toBe("pt-BR");
  });
});

describe("switching languages", () => {
  function Label() {
    const { t } = useTranslation();
    return <span>{t("nav.settings")}</span>;
  }

  it("re-renders at once and remembers a manual choice", async () => {
    render(<Label />);
    expect(screen.getByText("Einstellungen")).toBeInTheDocument();
    await act(() => setLanguage("it"));
    expect(screen.getByText("Impostazioni")).toBeInTheDocument();
    expect(currentLanguage()).toBe("it");
    expect(storedLanguage()).toBe("it");
    expect(document.documentElement.lang).toBe("it");
  });

  it("follows the browser again when the choice is reset", async () => {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["pt-BR"]);
    await setLanguage("fr");
    await setLanguage(null);
    expect(storedLanguage()).toBeNull();
    expect(currentLanguage()).toBe("pt-BR");
    vi.restoreAllMocks();
  });

  it.each(LANGUAGES)("shows %s texts", async (language: Language) => {
    await setLanguage(language, false);
    expect(i18n.t("common.save")).toBe((bundles[language].common as Messages).save);
  });

  it("falls back to English for a key a language does not have", async () => {
    await setLanguage("de", false);
    i18n.addResource("en", "translation", "test.onlyEnglish", "Only English");
    expect(i18n.t("test.onlyEnglish")).toBe("Only English");
  });
});

describe("loading languages", () => {
  it("keeps only English in the main bundle", () => {
    expect(Object.keys(resources)).toEqual(["en"]);
    expect(isLanguageLoaded("en")).toBe(true);
  });

  it("fetches a language once and adds all of its texts", async () => {
    i18n.removeResourceBundle("it", "translation");
    expect(isLanguageLoaded("it")).toBe(false);
    const first = loadLanguage("it");
    expect(loadLanguage("it")).toBe(first); // one fetch for two callers
    await first;
    expect(isLanguageLoaded("it")).toBe(true);
    expect(i18n.t("common.save", { lng: "it" })).toBe((bundles.it.common as Messages).save);
    // the derived plural form "many" is part of the loaded texts
    expect(i18n.t("python.install.done", { lng: "it", count: 1_000_000 })).not.toBe(
      i18n.t("python.install.done", { lng: "en", count: 1_000_000 }),
    );
  });

  it("switches only once the texts are there", async () => {
    i18n.removeResourceBundle("fr", "translation");
    const seen: string[] = [];
    const onChange = () => seen.push(i18n.t("nav.settings"));
    i18n.on("languageChanged", onChange);
    await setLanguage("fr", false);
    i18n.off("languageChanged", onChange);
    expect(seen).toEqual([(bundles.fr.nav as Messages).settings]);
  });
});

describe("backend messages", () => {
  const t = i18n.t.bind(i18n);

  it("are shown in the interface language from their code", async () => {
    await setLanguage("en", false);
    expect(problemText(t, { code: "trace.too_large", params: { limit_mb: 50 }, message: "The file is too large" })).toContain("50 MB");
    await setLanguage("es", false);
    const spanish = problemText(t, { code: "workflow.no_agents", message: "The workflow has no agent yet" });
    expect(spanish).not.toBe("The workflow has no agent yet");
    expect(spanish).toBe(i18n.t("errors.workflow.no_agents"));
  });

  it("translate nested problems and fall back by area", async () => {
    await setLanguage("de", false);
    const blocked = problemText(t, {
      code: "workflow.blocked",
      params: { problems: [{ code: "workflow.no_agents", message: "The workflow has no agent yet" }] },
    });
    expect(blocked).toContain(i18n.t("errors.workflow.no_agents"));
    expect(problemText(t, { code: "run.agent.SomethingNewError", params: { type: "SomethingNewError" } })).toContain("SomethingNewError");
    expect(problemText(t, { code: "totally.unknown" })).toBe(i18n.t("errors.unknown"));
  });

  it("name the default model a designed agent cannot be judged by, in every language", async () => {
    const note = {
      code: "draft.judge_unsupported",
      params: { model: "compatible:local-llm" },
      message: "The default model compatible:local-llm cannot return the structured verdict of a quality check",
    };
    for (const language of ["de", "en", "es", "fr", "it", "pt-BR"] as const) {
      await setLanguage(language, false);
      const text = problemText(t, note);
      expect(text).toBe(i18n.t("errors.draft.judge_unsupported", { model: "compatible:local-llm" }));
      expect(text).toContain("compatible:local-llm");
      if (language !== "en") expect(text).not.toBe(note.message);
    }
  });

  it("have their own sentence for the newer API refusals, in every language", async () => {
    const refusals = [
      { code: "runs.cursor_invalid", params: { before: "yesterday" } },
      { code: "workflow.revision_invalid", params: { revision: "x" } },
      { code: "workflow.conflict", params: { name: "Rechnungen", updated_at: "2026-11-01T10:00:00Z" } },
      { code: "workflow.runs_active", params: { runs: 2 } },
      { code: "workflow.edge_dangling", params: {} },
      { code: "workflow.node_duplicate", params: { id: "a" } },
      { code: "identity.login_expired", params: {} },
      { code: "model_choice.node_unknown", params: { node: "writer" } },
      { code: "run.provider_auth", params: { provider: "anthropic", status: 401 } },
      { code: "run.provider_unreachable", params: { provider: "anthropic" } },
      { code: "run.provider_rate_limited", params: { provider: "anthropic", status: 429 } },
      { code: "run.provider_overloaded", params: { provider: "anthropic", status: 529 } },
    ];
    await setLanguage("en", false);
    const english = refusals.map((item) => problemText(t, item));
    for (const language of LANGUAGES) {
      await setLanguage(language, false);
      refusals.forEach((item, index) => {
        const text = problemText(t, item);
        expect(text, `${language} ${item.code}`).not.toBe(i18n.t("errors.unknown"));
        expect(text, `${language} ${item.code}`).not.toMatch(/\{\{/);
        if (language !== "en") expect(text, `${language} ${item.code}`).not.toBe(english[index]);
      });
    }
  });

  it("use the plural form of a counted problem", async () => {
    await setLanguage("de", false);
    expect(problemText(t, { code: "assistant.secrets_masked", params: { count: 1 } })).toBe(
      i18n.t("errors.assistant.secrets_masked_one", { count: 1 }),
    );
    expect(problemText(t, { code: "assistant.secrets_masked", params: { count: 3 } })).toContain("3 vertrauliche Werte");
  });

  it("recognise German texts of runs stored before codes existed", () => {
    expect(legacyCode("Der Lauf wurde abgebrochen")).toEqual({ code: "run.cancelled", params: {} });
    expect(legacyCode("Fehlgeschlagen: A, B")).toEqual({ code: "run.nodes_failed", params: { nodes: "A, B" } });
    expect(legacyCode("BudgetExceededError: over budget")?.code).toBe("run.budget_exceeded");
    expect(legacyCode("MaxToolRoundsError: too many")).toEqual({ code: "run.agent.MaxToolRoundsError", params: { type: "MaxToolRoundsError" } });
    expect(legacyCode("something else")).toBeNull();
  });
});
