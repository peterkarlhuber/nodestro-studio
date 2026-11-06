import { ArrowLeft } from "lucide-react";
import { type RefObject, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { safeReturnPath } from "../lib/settingsLink";
import { prefersReducedMotion } from "../lib/motion";

/** The groups of the page, in the order of the page; a section the map does not know goes to "more". */
export const SETTINGS_GROUPS: Record<string, "setup" | "costs" | "running" | "maintenance"> = {
  "settings-local-models": "setup",
  "settings-providers": "setup",
  "settings-language": "setup",
  "settings-models": "setup",
  "settings-reasoning": "setup",
  "settings-output-limits": "setup",
  "settings-prices": "costs",
  "settings-reconciliation": "costs",
  "settings-sandbox": "running",
  "settings-knowledge-search": "running",
  "settings-ocr": "running",
  "settings-inputs": "running",
  "settings-python": "running",
  "settings-backup": "maintenance",
  "settings-diagnostics": "maintenance",
  "settings-about": "maintenance",
};

interface Anchor {
  id: string;
  title: string;
  group: string;
}

/** A heading's own words, without the labels of its help button. */
function headingText(heading: HTMLElement): string {
  const copy = heading.cloneNode(true) as HTMLElement;
  copy.querySelectorAll("button, [aria-hidden=true], .visually-hidden, .sr-only").forEach((element) => element.remove());
  return (copy.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** The sections on the page right now: which ones exist depends on the person's rights and the installation. */
function useAnchors(container: RefObject<HTMLElement | null>): Anchor[] {
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  useEffect(() => {
    const root = container.current;
    if (!root) return;
    const scan = () => {
      const found = [...root.querySelectorAll<HTMLElement>(":scope > section > h2.panel__title[id]")].map((heading) => ({
        id: heading.id,
        title: headingText(heading),
        group: SETTINGS_GROUPS[heading.id] ?? "more",
      }));
      setAnchors((previous) =>
        previous.length === found.length && previous.every((item, index) => item.id === found[index].id && item.title === found[index].title)
          ? previous
          : found,
      );
    };
    scan();
    const observer = new MutationObserver(scan);
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [container]);
  return anchors;
}

/** The section that is being read: the last heading above the upper third of the window. */
function useActive(anchors: Anchor[]): string | undefined {
  const [active, setActive] = useState<string>();
  useEffect(() => {
    if (!anchors.length || typeof IntersectionObserver === "undefined") return;
    const visible = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting);
        const first = anchors.find((anchor) => visible.get(anchor.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "0px 0px -65% 0px" },
    );
    for (const anchor of anchors) {
      const element = document.getElementById(anchor.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [anchors]);
  return active;
}

/** Brings a section (or a provider's part of it) into view and puts the focus there, for keyboard and screen readers. */
export function revealSettingsSection(hash: string): boolean {
  const name = decodeURIComponent(hash.replace(/^#/, ""));
  if (!name) return false;
  const provider = document.querySelector<HTMLDetailsElement>(`details[data-section="${CSS.escape(name)}"]`);
  const target = provider ?? document.getElementById(name);
  if (!target) return false;
  if (provider) provider.open = true;
  target.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  const focusable = provider?.querySelector<HTMLElement>("summary") ?? target;
  if (!provider && !target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  focusable.focus({ preventScroll: true });
  return true;
}

/** Follows #section in the address once the section is on the page (panels appear when their data arrives). */
export function useSettingsHash(ready: boolean): void {
  const { hash } = useLocation();
  useEffect(() => {
    if (!ready || !hash) return;
    if (revealSettingsSection(hash)) return;
    // Some panels load their own data first: try again when the page changes, for a few seconds at most.
    const observer = new MutationObserver(() => {
      if (revealSettingsSection(hash)) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const stop = window.setTimeout(() => observer.disconnect(), 5000);
    return () => {
      observer.disconnect();
      window.clearTimeout(stop);
    };
  }, [hash, ready]);
}

/** "Back to the workflow": shown when another page sent the person here to set something up. */
export function SettingsReturn() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const back = safeReturnPath(params.get("from"));
  if (!back) return null;
  const label = back.startsWith("/workflows/") && back !== "/workflows/examples"
    ? t("settings.nav.backToWorkflow")
    : back.startsWith("/executions/")
      ? t("settings.nav.backToRun")
      : t("settings.nav.back");
  return (
    <Link to={back} className="settings-return" data-testid="settings-return">
      <ArrowLeft size={14} aria-hidden /> {label}
    </Link>
  );
}

/** The page's table of contents: grouped, follows the reading position, and keeps #section in the address. */
export function SettingsNav({ container }: { container: RefObject<HTMLElement | null> }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const anchors = useAnchors(container);
  const active = useActive(anchors);
  if (anchors.length < 2) return null;
  const groups: [string, Anchor[]][] = [];
  for (const anchor of anchors) {
    const last = groups[groups.length - 1];
    if (last && last[0] === anchor.group) last[1].push(anchor);
    else groups.push([anchor.group, [anchor]]);
  }
  return (
    <nav className="settings-nav" aria-label={t("settings.nav.title")} data-testid="settings-nav">
      <SettingsReturn />
      <div className="settings-nav__title">{t("settings.nav.title")}</div>
      {groups.map(([group, items], index) => (
        <div key={`${group}-${index}`} className="settings-nav__group">
          <div className="settings-nav__group-title">{t(`settings.nav.groups.${group}`)}</div>
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={active === item.id ? "location" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate({ search: location.search, hash: item.id }, { replace: true });
                    revealSettingsSection(item.id);
                  }}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
