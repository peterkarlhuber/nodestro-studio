import { useLocation } from "react-router-dom";

/** Sections of the settings page that other pages link to (the ids of their headings). */
export type SettingsSection =
  | "settings-local-models"
  | "settings-providers"
  | "settings-models"
  | "settings-prices"
  | "settings-sandbox"
  | "settings-python"
  | "settings-ocr"
  | `provider-${string}`;

/** Only paths inside the Studio count as a way back (never another site). */
export function safeReturnPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/settings")) return null;
  return value;
}

/** A link to the settings page, to one of its sections, and back to where the person came from. */
export function settingsHref(section?: SettingsSection, from?: string): string {
  const back = safeReturnPath(from);
  return `/settings${back ? `?from=${encodeURIComponent(back)}` : ""}${section ? `#${section}` : ""}`;
}

/** The same link, coming from the current page (the settings page then offers the way back). */
export function useSettingsHref(section?: SettingsSection): string {
  const location = useLocation();
  return settingsHref(section, `${location.pathname}${location.search}`);
}
