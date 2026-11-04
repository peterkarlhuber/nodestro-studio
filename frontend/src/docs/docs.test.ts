import { describe, expect, it, vi } from "vitest";

import { LANGUAGES, type Language } from "../i18n";
import { HELP_DOCS } from "../lib/help";
import { bundles } from "../test/locales";
import { CHAPTER_IDS, type DocChapter, type Sources, docExists, loadChapters, loadSources } from "./index";
import { parseChapter, plainText, splitWidgets } from "./parse";
import { fold, plain, searchDocs } from "./search";

const SOURCES = Object.fromEntries(await Promise.all(LANGUAGES.map(async (language) => [language, await loadSources(language)]))) as Record<
  Language,
  Sources
>;
const LOADED = Object.fromEntries(await Promise.all(LANGUAGES.map(async (language) => [language, await loadChapters(language)]))) as Record<
  Language,
  DocChapter[]
>;
const chaptersFor = (language: Language) => LOADED[language];
const CHAPTERS = chaptersFor("de");

describe("documentation content", () => {
  it("has titled chapters with unique section ids", () => {
    expect(CHAPTERS.length).toBeGreaterThanOrEqual(10);
    for (const chapter of CHAPTERS) {
      expect(chapter.title, chapter.id).not.toBe("");
      expect(chapter.intro, chapter.id).not.toBe("");
      expect(chapter.sections.length, chapter.id).toBeGreaterThan(0);
      const ids = chapter.sections.map((section) => section.id);
      expect(new Set(ids).size, chapter.id).toBe(ids.length);
      for (const section of chapter.sections) expect(section.body, `${chapter.id}#${section.id}`).not.toBe("");
    }
  });

  it("links only to sections that exist", async () => {
    const links = CHAPTERS.flatMap((chapter) =>
      chapter.sections.flatMap((section) => [...section.body.matchAll(/\]\(\/docs\/([^)]+)\)/g)].map((match) => match[1])),
    );
    expect(links.length).toBeGreaterThan(10);
    for (const link of links) expect(await docExists(link), link).toBe(true);
  });

  it("backs every tooltip link with a documentation section", async () => {
    for (const [id, doc] of Object.entries(HELP_DOCS)) if (doc) expect(await docExists(doc), `${id} → ${doc}`).toBe(true);
    expect(await docExists("workflows#no-such-section")).toBe(false);
  });

  it("covers every area of the application", () => {
    const ids = CHAPTERS.map((chapter) => chapter.id);
    for (const area of ["workflows", "agenten", "tools", "wissen", "memory", "ausfuehrungen", "nutzung", "einstellungen"])
      expect(ids).toContain(area);
  });
});

describe("documentation in every language", () => {
  const widgets = (text: string) => [...text.matchAll(/<!--\s*widget:\s*([a-z-]+)\s*-->/g)].map((match) => match[1]);
  const links = (text: string) => [...text.matchAll(/\]\((\/[^)\s]*)\)/g)].map((match) => match[1]).sort();

  it.each(LANGUAGES)("has every chapter in %s", (language) => {
    for (const [id] of CHAPTER_IDS) expect(SOURCES[language][id], `${language}/${id}`).toBeTruthy();
  });

  it.each(LANGUAGES)("%s has the same sections, widgets and links as German", (language) => {
    const german = chaptersFor("de");
    const chapters = chaptersFor(language);
    chapters.forEach((chapter, index) => {
      const reference = german[index];
      expect(chapter.title, `${language}/${chapter.id}`).not.toBe("");
      expect(chapter.intro, `${language}/${chapter.id}`).not.toBe("");
      expect(chapter.sections.map((section) => section.id), `${language}/${chapter.id}`).toEqual(
        reference.sections.map((section) => section.id),
      );
      chapter.sections.forEach((section, at) => {
        const where = `${language}/${chapter.id}#${section.id}`;
        expect(section.body, where).not.toBe("");
        expect(widgets(section.body), where).toEqual(widgets(reference.sections[at].body));
        expect(links(section.body), where).toEqual(links(reference.sections[at].body));
      });
    });
  });

  // "*Settings → Model prices*": a path through the interface starts with the page's navigation label and names
  // existing interface texts after it. The chapter "beispiele" is generated from nodestro-examples.
  const PATH = /(?<![*\w])\*\[?([^*\n]{2,120}?→[^*\n]*?)\]?(?:\([^)]*\))?\*(?![*\w])/g;
  const PRODUCTS = new Set(["Amazon Bedrock"]);
  const interfaceTexts = (language: Language) => {
    const values = new Set<string>();
    const visit = (messages: unknown) => {
      for (const value of Object.values(messages as Record<string, unknown>))
        if (value && typeof value === "object") visit(value);
        else values.add(String(value).trim());
    };
    visit(bundles[language]);
    return values;
  };
  const navigationPaths = (language: Language, id: string) => {
    const labels = new Set(Object.values(bundles[language].nav as Record<string, unknown>).map(String));
    return [...SOURCES[language][id].matchAll(PATH)]
      .map((match) => match[1].split("→").map((part) => part.trim().replace(/^\[|\]$/g, "")))
      .filter((parts) => labels.has(parts[0]));
  };

  it.each(LANGUAGES)("%s names interface paths with the navigation labels", (language) => {
    const values = interfaceTexts(language);
    for (const [id] of CHAPTER_IDS.filter(([chapter]) => chapter !== "beispiele")) {
      const paths = navigationPaths(language, id);
      // As many paths as in English: a path whose first step is not the navigation label is not counted.
      expect(paths.length, `${language}/${id}`).toBe(navigationPaths("en", id).length);
      for (const parts of paths)
        for (const part of parts.slice(1))
          expect(values.has(part) || PRODUCTS.has(part), `${language}/${id}: “${parts.join(" → ")}”`).toBe(true);
    }
  });

  // The words docs/i18n/terminology.md lists under "Avoid", and the address form; code, links and anchors aside.
  const AVOID: Partial<Record<Language, RegExp>> = {
    en: /(?<!\p{L})(colours?|recognis\w*|analys(e|ed|ing)|labell(ed|ing)|judgement|catalogue|fulfil|cancell(ed|ing)|organis\w*|summaris\w*|prioritis\w*|behaviour\w*|grey)(?!\p{L})/iu,
    de: /Unter-Workflow/,
    es: /(?<!\p{L})(sub-?)?workflows?(?!\p{L})|(?<!\p{L})(usted|ustedes|consulte|introduzca|seleccione|pulse|asegúrese)(?!\p{L})/iu,
    it: /(?<!\p{L})sub-?workflows?(?!\p{L})/iu,
    "pt-BR": /(?<!\p{L})(sub-?)?workflows?(?!\p{L})|(?<!\p{L})(tu|teu|tua|teus|tuas)(?!\p{L})/iu,
  };

  it.each(Object.keys(AVOID) as Language[])("%s uses the terminology and the informal address", (language) => {
    const wrong: string[] = [];
    for (const [id] of CHAPTER_IDS.filter(([chapter]) => chapter !== "beispiele"))
      SOURCES[language][id].split("\n").forEach((line, index) => {
        const prose = line.replace(/`[^`]*`|\]\([^)]*\)|\{#[^}]*\}|<!--.*?-->|https?:\/\/\S+/g, "");
        if (AVOID[language]!.test(prose)) wrong.push(`${id}:${index + 1}: ${line.slice(0, 120)}`);
      });
    expect(wrong).toEqual([]);
  });

  it("is not just a copy of the German text", () => {
    for (const language of LANGUAGES.filter((item) => item !== "de"))
      for (const [id] of CHAPTER_IDS) expect(SOURCES[language][id], `${language}/${id}`).not.toBe(SOURCES.de[id]);
  });
});

describe("loading per language", () => {
  it("loads only the language that is asked for, once", async () => {
    vi.resetModules();
    const docs = await import("./index");
    expect(docs.cachedChapters("fr")).toBeUndefined();
    const french = await docs.loadChapters("fr");
    expect(french.map((chapter) => chapter.id)).toEqual(CHAPTER_IDS.map(([id]) => id));
    expect(docs.cachedChapters("fr")).toBe(french);
    expect(await docs.loadChapters("fr")).toBe(french);
    for (const language of LANGUAGES.filter((item) => item !== "fr")) expect(docs.cachedChapters(language), language).toBeUndefined();
  });
});

describe("parseChapter", () => {
  it("reads title, intro, sections, keywords and widgets", () => {
    const chapter = parseChapter(
      [
        "# Titel",
        "",
        "Einleitung.",
        "",
        "## Erster Abschnitt {#eins}",
        "<!-- keywords: a, b -->",
        "",
        "Text mit `code`.",
        "",
        "```",
        "## Kein Abschnitt {#nein}",
        "```",
        "",
        "## Zweiter {#zwei}",
        "<!-- widget: models -->",
        "Danach.",
      ].join("\n"),
    );
    expect(chapter.title).toBe("Titel");
    expect(chapter.intro).toBe("Einleitung.");
    expect(chapter.sections.map((section) => section.id)).toEqual(["eins", "zwei"]);
    expect(chapter.sections[0].keywords).toEqual(["a", "b"]);
    expect(chapter.sections[0].body).toContain("## Kein Abschnitt");
    expect(splitWidgets(chapter.sections[1].body)).toEqual([
      { kind: "widget", name: "models" },
      { kind: "markdown", text: "Danach." },
    ]);
  });
});

describe("searchDocs", () => {
  it("ranks the section about a term first", () => {
    expect(searchDocs(CHAPTERS, "Budget")[0]).toMatchObject({ chapter: { id: "workflows" }, sectionId: "budget" });
    expect(searchDocs(CHAPTERS, "Trace importieren")[0]).toMatchObject({ sectionId: "trace-import" });
    expect(searchDocs(CHAPTERS, "Platzhalter")[0]).toMatchObject({ sectionId: "platzhalter" });
  });

  it("searches the chapters of the given language", () => {
    expect(searchDocs(chaptersFor("en"), "placeholders")[0]).toMatchObject({ sectionId: "platzhalter" });
    expect(searchDocs(chaptersFor("fr"), "budget")[0]).toMatchObject({ chapter: { id: "workflows" }, sectionId: "budget" });
  });

  it("ignores case and accents and needs every word", () => {
    expect(fold("Ausführung Größe")).toBe("ausfuhrung grosse");
    expect(fold("l’outil")).toBe(fold("l'outil"));
    expect(searchDocs(CHAPTERS, "AUSFUHRUNGEN").length).toBeGreaterThan(0);
    expect(searchDocs(CHAPTERS, "sandbox docker").every((hit) => hit.snippet.length > 0)).toBe(true);
    expect(searchDocs(CHAPTERS, "xylophon")).toEqual([]);
    expect(searchDocs(CHAPTERS, "a")).toEqual([]);
  });
});

describe("chapter previews", () => {
  it("show inline Markdown as plain text", () => {
    expect(plainText("A **decision** picks a path, `numpy` and [links](/docs/x) or *emphasis*.")).toBe(
      "A decision picks a path, numpy and links or emphasis.",
    );
    expect(plainText("snake_case_names stay")).toBe("snake_case_names stay");
  });
});

describe("search snippets", () => {
  it("keeps angle brackets inside text and drops quote markers", () => {
    expect(plain("> A quote\nSend `Authorization: Bearer <key>` with it.")).toBe("A quote Send Authorization: Bearer <key> with it.");
  });
});
