// Turns the chapter Markdown files into sections that can be navigated, linked and searched.
//
// A chapter file starts with "# Title" and an introduction. Every "## Heading {#id}" starts a
// section; an optional "<!-- keywords: a, b -->" line feeds the search, and
// "<!-- widget: name -->" places a live component (e.g. the model price table) in the text.

export interface DocSection {
  id: string;
  title: string;
  body: string;
  keywords: string[];
}

export interface ParsedChapter {
  title: string;
  intro: string;
  sections: DocSection[];
}

const HEADING = /^##\s+(.+?)\s*\{#([a-z0-9-]+)\}\s*$/;
const KEYWORDS = /^<!--\s*keywords:\s*(.*?)\s*-->\s*$/;
// Other comment lines (e.g. the markers around the generated example sections) are not shown.
const COMMENT = /^<!--(?!\s*widget:).*-->\s*$/;

export function parseChapter(markdown: string): ParsedChapter {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let title = "";
  const intro: string[] = [];
  const sections: DocSection[] = [];
  let current: (DocSection & { lines: string[] }) | null = null;
  let fenced = false;
  for (const line of lines) {
    if (line.startsWith("```")) fenced = !fenced;
    const heading = fenced ? null : HEADING.exec(line);
    if (!title && !fenced && line.startsWith("# ")) {
      title = line.slice(2).trim();
    } else if (heading) {
      if (current) sections.push(finish(current));
      current = { id: heading[2], title: heading[1], body: "", keywords: [], lines: [] };
    } else if (current) {
      const keywords = fenced ? null : KEYWORDS.exec(line);
      if (keywords && !current.lines.some((item) => item.trim())) {
        current.keywords = keywords[1].split(",").map((word) => word.trim()).filter(Boolean);
      } else if (!fenced && COMMENT.test(line)) {
        continue;
      } else {
        current.lines.push(line);
      }
    } else {
      intro.push(line);
    }
  }
  if (current) sections.push(finish(current));
  return { title, intro: intro.join("\n").trim(), sections };
}

function finish(section: DocSection & { lines: string[] }): DocSection {
  const { lines, ...rest } = section;
  return { ...rest, body: lines.join("\n").trim() };
}

export type DocPart = { kind: "markdown"; text: string } | { kind: "widget"; name: string };

/** Splits a section body at widget markers, so the page can render live components in place. */
export function splitWidgets(body: string): DocPart[] {
  const parts: DocPart[] = [];
  const pattern = /^<!--\s*widget:\s*([a-z-]+)\s*-->\s*$/gm;
  let last = 0;
  for (const match of body.matchAll(pattern)) {
    const before = body.slice(last, match.index).trim();
    if (before) parts.push({ kind: "markdown", text: before });
    parts.push({ kind: "widget", name: match[1] });
    last = (match.index ?? 0) + match[0].length;
  }
  const rest = body.slice(last).trim();
  if (rest) parts.push({ kind: "markdown", text: rest });
  return parts;
}

/** The text of inline Markdown (emphasis, code, links) for short previews such as the chapter cards. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|\*|`)(\S(?:.*?\S)?)\1/g, "$2")
    .trim();
}
