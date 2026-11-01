// The chapters of the built-in documentation, in reading order, in every interface language.
//
// Each language has the same chapter files under chapters/<language>/ with the same section ids
// ("## Title {#id}"), so links, tooltips and bookmarks work in every language. The ids are the
// original German slugs and are never translated.
//
// Only the language that is shown is downloaded (sources/docs-<language>.ts, one chunk each); the
// Nodestro Assistant reads the same Markdown files on the server, independent of this bundle.

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

/** Chapter id → Markdown source of one language. */
export type Sources = Record<string, string>;

// One chunk per language (about 340 kB of Markdown each): only the language that is shown is loaded.
const LOADERS: Record<Language, () => Promise<{ default: Record<string, string> }>> = {
  de: () => import("./sources/docs-de"),
  en: () => import("./sources/docs-en"),
  es: () => import("./sources/docs-es"),
  fr: () => import("./sources/docs-fr"),
  it: () => import("./sources/docs-it"),
  "pt-BR": () => import("./sources/docs-pt-BR"),
};

const sources = new Map<Language, Promise<Sources>>();

/** The Markdown sources of one language, loaded once. */
export function loadSources(language: Language): Promise<Sources> {
  let pending = sources.get(language);
  if (!pending) {
    pending = LOADERS[language]().then(({ default: files }) =>
      Object.fromEntries(Object.entries(files).map(([path, text]) => [path.replace(/^.*\//, "").replace(/\.md$/, ""), text])),
    );
    // A failed download (offline, new deployment) may be tried again.
    pending.catch(() => sources.delete(language));
    sources.set(language, pending);
  }
  return pending;
}

const cache = new Map<Language, DocChapter[]>();

/** The chapters of one language if they are loaded already (no request), else undefined. */
export function cachedChapters(language: Language): DocChapter[] | undefined {
  return cache.get(language);
}

/** The chapters in one language; a chapter missing there falls back to English. */
export async function loadChapters(language: Language): Promise<DocChapter[]> {
  const cached = cache.get(language);
  if (cached) return cached;
  const own = await loadSources(language);
  const complete = CHAPTER_IDS.every(([id]) => own[id] !== undefined);
  const fallback = complete || language === FALLBACK_LANGUAGE ? {} : await loadSources(FALLBACK_LANGUAGE);
  const chapters = CHAPTER_IDS.map(([id, icon]) => ({ id, icon, ...parseChapter(own[id] ?? fallback[id] ?? "") }));
  cache.set(language, chapters);
  return chapters;
}

/** Whether "chapter" or "chapter#section" points at existing documentation in every language. */
export async function docExists(ref: string): Promise<boolean> {
  const [chapterId, sectionId] = ref.split("#");
  const all = await Promise.all(LANGUAGES.map((language) => loadChapters(language)));
  return all.every((chapters) => {
    const chapter = chapters.find((item) => item.id === chapterId);
    return Boolean(chapter && (!sectionId || chapter.sections.some((section) => section.id === sectionId)));
  });
}
