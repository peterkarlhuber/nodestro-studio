// The search of the settings page finds single settings, not only sections. Like the section navigation
// (SettingsNav) it reads the page itself, so every section that follows the page's convention is found without a
// list to maintain, in the interface language of the moment:
//
//   <div class="settings">                                   the content column
//     <section> <h2 class="panel__title" id="settings-…">     a section (also what the navigation lists)
//       .field     label (.field__label label), hint (.field__hint), help (.help-tip[data-help])   ← Field
//       .toggle    label (.toggle__label > span), description (small), help                     ← Toggle
//       details > summary                                     a collapsible part (Section, SettingsAdvanced)
//       h3                                                    a group heading (SettingsGroup)
//       [data-setting="Label"] (+ data-setting-text)          anything else that should be found
//
// Help texts are only rendered when a tooltip opens; the help button names its text with data-help, and the
// caller passes a function that returns the text for an id. Parts marked [data-settings-search="skip"] (and
// tooltips) are left out. Content of a closed <details> is found and opened when the hit is shown; content that
// is not rendered at all (conditional React state) cannot be found, which is why the convention uses <details>.

export interface SettingEntry {
  /** Position in the page, stable while the page does not change. */
  key: string;
  kind: "section" | "group" | "setting";
  label: string;
  /** Section (and group) the setting belongs to, for the result list. */
  context: string;
  /** Hint, description and help text: searched, and shown as a snippet. */
  text: string;
  element: HTMLElement;
}

export interface SettingHit extends SettingEntry {
  score: number;
}

/** Lower case without accents, so "regles" finds "règles" and "Ubersetzung" finds "Übersetzung". */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** An element's own words, without its help button, icons and visually hidden parts. */
export function ownText(element: Element | null | undefined): string {
  if (!element) return "";
  const copy = element.cloneNode(true) as HTMLElement;
  copy.querySelectorAll("button.help-tip, [aria-hidden=true], svg, .visually-hidden, .sr-only, [role=tooltip]").forEach((node) => node.remove());
  return (copy.textContent ?? "").replace(/\s+/g, " ").trim();
}

const SETTING_SELECTOR = ".field, .toggle, details > summary, h3, [data-setting]";

function helpOf(element: Element | null, help: (id: string) => string | undefined): string {
  const id = element?.getAttribute("data-help");
  return id ? (help(id) ?? "") : "";
}

/** The explanation without repeated sentences (a help text may say what the hint next to it says). */
function distinct(text: string): string {
  const seen = new Set<string>();
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => part && !seen.has(normalize(part)) && seen.add(normalize(part)))
    .join(" ");
}

/** The title of the group or collapsible part a setting sits in (inside its section), if any. */
function partOf(element: HTMLElement, section: HTMLElement): string {
  const part = (element.matches("details > summary") ? element.parentElement : element)?.parentElement?.closest(".settings-group, details");
  if (!part || !section.contains(part)) return "";
  if (part.matches("details")) {
    const summary = part.querySelector(":scope > summary");
    return ownText(summary?.querySelector(".section__title, .settings-advanced__title") ?? summary);
  }
  return ownText(part.querySelector(":scope > h3"));
}

/** One entry per setting of the page, in the page's order. */
export function indexSettings(root: HTMLElement, help: (id: string) => string | undefined = () => undefined): SettingEntry[] {
  const entries: SettingEntry[] = [];
  const sections = root.querySelectorAll<HTMLElement>(":scope > section");
  sections.forEach((section, sectionIndex) => {
    const heading = section.querySelector<HTMLElement>(":scope > h2.panel__title[id]");
    if (!heading || section.closest("[data-settings-search=skip]")) return;
    const sectionTitle = ownText(heading);
    entries.push({
      key: `${sectionIndex}`,
      kind: "section",
      label: sectionTitle,
      context: "",
      text: [ownText(section.querySelector(":scope > p")), helpOf(heading.querySelector(".help-tip"), help)].filter(Boolean).join(" "),
      element: section,
    });
    section.querySelectorAll<HTMLElement>(SETTING_SELECTOR).forEach((element, index) => {
      if (element.closest("[data-settings-search=skip], [role=tooltip], [hidden]")) return;
      // A field inside a toggle or a marked part belongs to that one entry.
      const owner = element.parentElement?.closest(".field, .toggle, [data-setting]");
      if (owner && section.contains(owner) && !element.matches("details > summary, h3")) return;
      let label = "";
      let text = "";
      let kind: SettingEntry["kind"] = "setting";
      if (element.matches("[data-setting]")) {
        label = element.getAttribute("data-setting") ?? "";
        text = [element.getAttribute("data-setting-text") ?? "", helpOf(element.querySelector(".help-tip"), help)].join(" ");
      } else if (element.matches(".field")) {
        label = ownText(element.querySelector(".field__label label") ?? element.querySelector(".field__label"));
        text = [ownText(element.querySelector(":scope > .field__hint")), helpOf(element.querySelector(".field__label .help-tip"), help)].join(" ");
      } else if (element.matches(".toggle")) {
        label = ownText(element.querySelector(".toggle__label > span"));
        text = [ownText(element.querySelector(".toggle__label > small")), helpOf(element.querySelector(":scope > .help-tip"), help)].join(" ");
      } else if (element.matches("details > summary")) {
        label = ownText(element.querySelector(".section__title, .settings-advanced__title") ?? element);
        const frame = element.parentElement?.parentElement;
        text = helpOf(frame?.querySelector(":scope > .section__tip .help-tip") ?? element.querySelector(".help-tip"), help);
        kind = "group";
      } else {
        label = ownText(element);
        text = helpOf(element.querySelector(".help-tip"), help);
        kind = "group";
      }
      if (!label) return;
      entries.push({
        key: `${sectionIndex}.${index}`,
        kind,
        label,
        context: [sectionTitle, partOf(element, section)].filter(Boolean).join(" › "),
        text: distinct(text),
        element: element.matches("details > summary") ? (element.parentElement as HTMLElement) : element,
      });
    });
  });
  return entries;
}

/**
 * The entries that contain every word of the query (in the label, the section or the explanation), best first:
 * words in the label count most, then the section's name, then the explanation; a label that starts with the
 * query comes first.
 */
export function searchSettings(entries: SettingEntry[], query: string, limit = 12): SettingHit[] {
  const words = normalize(query).split(" ").filter(Boolean);
  if (!words.length) return [];
  const hits: SettingHit[] = [];
  entries.forEach((entry, position) => {
    const label = normalize(entry.label);
    const context = normalize(entry.context);
    const text = normalize(entry.text);
    let score = 0;
    for (const word of words) {
      if (label.includes(word)) score += label.startsWith(word) || label.includes(` ${word}`) ? 6 : 4;
      else if (context.includes(word)) score += 2;
      else if (text.includes(word)) score += 1;
      else return;
    }
    if (label.startsWith(normalize(query))) score += 4;
    if (entry.kind === "setting") score += 0.5;
    hits.push({ ...entry, score: score - position / 10000 });
  });
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** The words around the first match in a text, for the result list. */
export function snippet(text: string, query: string, size = 110): string {
  if (text.length <= size) return text;
  const words = normalize(query).split(" ").filter(Boolean);
  const plain = normalize(text);
  const at = Math.max(0, ...words.map((word) => plain.indexOf(word)).filter((index) => index >= 0).slice(0, 1));
  const start = Math.max(0, at - 30);
  const part = text.slice(start, start + size).trim();
  return `${start > 0 ? "… " : ""}${part}${start + size < text.length ? " …" : ""}`;
}

const HIT_CLASS = "settings-hit";

/** Opens the parts around a hit, scrolls it into view, focuses its control and highlights it for a moment. */
export function revealSetting(element: HTMLElement, reducedMotion = false): void {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (parent instanceof HTMLDetailsElement && !parent.open) parent.open = true;
  }
  if (element instanceof HTMLDetailsElement) element.open = true;
  element.scrollIntoView?.({ block: "center", behavior: reducedMotion ? "auto" : "smooth" });
  const control =
    element.matches("details") ? element.querySelector<HTMLElement>(":scope > summary")
    : element.matches("section") ? element.querySelector<HTMLElement>(":scope > h2")
    : element.querySelector<HTMLElement>("input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [role=switch]:not([disabled]), button:not(.help-tip):not([disabled])");
  const target = control ?? element;
  if (!target.matches("a[href], button, input, select, textarea, summary, [tabindex]")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  document.querySelectorAll(`.${HIT_CLASS}`).forEach((node) => node.classList.remove(HIT_CLASS));
  element.classList.add(HIT_CLASS);
  window.setTimeout(() => element.classList.remove(HIT_CLASS), 2600);
}
