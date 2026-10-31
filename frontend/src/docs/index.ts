// The chapters of the built-in documentation, in reading order, in every interface language.
//
// Each language has the same chapter files under chapters/<language>/ with the same section ids
// ("## Title {#id}"), so links, tooltips and bookmarks work in every language. The ids are the
// original German slugs and are never translated.

import {
  Activity,
  BookOpen,
  Bot,
  Brain,
  Command,
  Compass,
  Diamond,
  FileText,
  FileUp,
  GitBranch,
  LayoutTemplate,
  Library,
  LifeBuoy,
  type LucideIcon,
  MessageSquare,
  Package,
  Plug,
  Repeat,
  Rows3,
  Settings,
  Sparkles,
} from "lucide-react";

import { FALLBACK_LANGUAGE, LANGUAGES, type Language } from "../i18n";
import { type ParsedChapter, parseChapter } from "./parse";

export interface DocChapter extends ParsedChapter {
  id: string;
  icon: LucideIcon;
}

export const CHAPTER_IDS: [string, LucideIcon][] = [
  ["start", Compass],
  ["begriffe", Library],
  ["workflows", Diamond],
  ["verzweigungen", GitBranch],
  ["ki-architekt", Sparkles],
  ["assistent", MessageSquare],
  ["beispiele", LayoutTemplate],
  ["agenten", Bot],
  ["tools", Command],
  ["python-bibliotheken", Package],
  ["datei-eingaben", FileUp],
  ["wissen", BookOpen],
  ["dateien", FileText],
  ["memory", Brain],
  ["ausfuehrungen", Rows3],
  ["automatisierung", Repeat],
  ["api-und-export", Plug],
  ["nutzung", Activity],
  ["einstellungen", Settings],
  ["faq", LifeBuoy],
];

/** The Markdown sources by "<language>/<chapter>". */
export const SOURCES: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob<string>("./chapters/*/*.md", { eager: true, query: "?raw", import: "default" })).map(
    ([path, text]) => [path.replace(/^\.\/chapters\//, "").replace(/\.md$/, ""), text],
  ),
);

const cache = new Map<Language, DocChapter[]>();

/** The chapters in one language; a chapter missing there falls back to English. */
export function chaptersFor(language: Language): DocChapter[] {
  let chapters = cache.get(language);
  if (!chapters) {
    chapters = CHAPTER_IDS.map(([id, icon]) => ({
      id,
      icon,
      ...parseChapter(SOURCES[`${language}/${id}`] ?? SOURCES[`${FALLBACK_LANGUAGE}/${id}`] ?? ""),
    }));
    cache.set(language, chapters);
  }
  return chapters;
}

export function findChapter(id: string | undefined, language: Language): DocChapter | undefined {
  return chaptersFor(language).find((chapter) => chapter.id === id);
}

/** Whether "chapter" or "chapter#section" points at existing documentation in every language. */
export function docExists(ref: string): boolean {
  const [chapterId, sectionId] = ref.split("#");
  return LANGUAGES.every((language) => {
    const chapter = findChapter(chapterId, language);
    return Boolean(chapter && (!sectionId || chapter.sections.some((section) => section.id === sectionId)));
  });
}
