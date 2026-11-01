// Full-text search over the documentation: every word must occur; titles and keywords weigh more.

import type { DocChapter } from "./index";

export interface DocHit {
  chapter: DocChapter;
  sectionId: string;
  title: string;
  snippet: string;
  score: number;
}

/** Lower case without accents, so "Ausführung" matches "ausfuhrung" and "ausführung". */
export function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss");
}

/** Markdown reduced to readable text for snippets. */
export function plain(markdown: string): string {
  return markdown
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // ">" only marks a quote at the start of a line; inside text it stays ("Bearer <key>").
    .replace(/^[ \t]*>/gm, " ")
    .replace(/[`*_#|]/g, " ")
    .replace(/-{3,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function count(haystack: string, needle: string): number {
  let total = 0;
  for (let index = haystack.indexOf(needle); index !== -1; index = haystack.indexOf(needle, index + needle.length)) total += 1;
  return total;
}

function snippet(text: string, words: string[]): string {
  const folded = fold(text);
  const positions = words.map((word) => folded.indexOf(word)).filter((index) => index >= 0);
  const at = positions.length ? Math.min(...positions) : 0;
  const start = Math.max(0, at - 60);
  const end = Math.min(text.length, at + 160);
  return `${start > 0 ? "… " : ""}${text.slice(start, end).trim()}${end < text.length ? " …" : ""}`;
}

export function searchDocs(chapters: DocChapter[], query: string, limit = 12): DocHit[] {
  const words = fold(query).split(/\s+/).filter((word) => word.length > 1);
  if (!words.length) return [];
  const hits: DocHit[] = [];
  for (const chapter of chapters) {
    for (const section of chapter.sections) {
      const title = fold(section.title);
      const keywords = fold(section.keywords.join(" "));
      const text = plain(section.body);
      const body = fold(text);
      let score = 0;
      let all = true;
      for (const word of words) {
        const inTitle = title.includes(word);
        const inKeywords = keywords.includes(word);
        const inBody = count(body, word);
        if (!inTitle && !inKeywords && !inBody && !fold(chapter.title).includes(word)) {
          all = false;
          break;
        }
        score += (inTitle ? 10 : 0) + (inKeywords ? 5 : 0) + Math.min(inBody, 5);
      }
      if (all) hits.push({ chapter, sectionId: section.id, title: section.title, snippet: snippet(text, words), score });
    }
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
