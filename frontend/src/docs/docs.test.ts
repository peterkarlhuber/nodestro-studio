import { describe, expect, it } from "vitest";

import { LANGUAGES } from "../i18n";
import { HELP_DOCS } from "../lib/help";
import { CHAPTER_IDS, SOURCES, chaptersFor, docExists } from "./index";
import { parseChapter, plainText, splitWidgets } from "./parse";
import { fold, searchDocs } from "./search";

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

  it("links only to sections that exist", () => {
    const links = CHAPTERS.flatMap((chapter) =>
      chapter.sections.flatMap((section) => [...section.body.matchAll(/\]\(\/docs\/([^)]+)\)/g)].map((match) => match[1])),
    );
    expect(links.length).toBeGreaterThan(10);
    for (const link of links) expect(docExists(link), link).toBe(true);
  });

  it("backs every tooltip link with a documentation section", () => {
    for (const [id, doc] of Object.entries(HELP_DOCS)) if (doc) expect(docExists(doc), `${id} → ${doc}`).toBe(true);
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
    for (const [id] of CHAPTER_IDS) expect(SOURCES[`${language}/${id}`], `${language}/${id}`).toBeTruthy();
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

  it("is not just a copy of the German text", () => {
    for (const language of LANGUAGES.filter((item) => item !== "de"))
      for (const [id] of CHAPTER_IDS) expect(SOURCES[`${language}/${id}`], `${language}/${id}`).not.toBe(SOURCES[`de/${id}`]);
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
