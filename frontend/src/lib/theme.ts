import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/** The colours the app is drawn in. */
export type Theme = "dark" | "light";
/** What the person chose: a fixed theme, or "system" to follow the operating system's setting. */
export type ThemeChoice = Theme | "system";

export const THEME_STORAGE_KEY = "nodestro-theme";
const LIGHT_QUERY = "(prefers-color-scheme: light)";

function current(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** The operating system's preference; dark when the browser cannot tell (Nodestro's own default). */
export function systemTheme(): Theme {
  return typeof window !== "undefined" && window.matchMedia?.(LIGHT_QUERY).matches ? "light" : "dark";
}

/** The stored choice. Nothing stored (a first visit, or "system" chosen) means: follow the system. */
export function storedThemeChoice(): ThemeChoice {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // storage may be unavailable (private mode)
  }
  return "system";
}

export function resolveTheme(choice: ThemeChoice): Theme {
  return choice === "system" ? systemTheme() : choice;
}

/**
 * The theme switch: the choice is remembered in this browser ("system" is remembered as no choice), and the app
 * follows a change of the system setting while "system" is chosen. index.html applies the same rule before the
 * first paint, so the page never flashes in the other theme.
 */
export function useTheme(): [ThemeChoice, (choice: ThemeChoice) => void, Theme] {
  const [choice, setChoiceState] = useState<ThemeChoice>(storedThemeChoice);
  const [system, setSystem] = useState<Theme>(systemTheme);
  useEffect(() => {
    const list = window.matchMedia?.(LIGHT_QUERY);
    if (!list) return;
    const onChange = () => setSystem(list.matches ? "light" : "dark");
    list.addEventListener?.("change", onChange);
    return () => list.removeEventListener?.("change", onChange);
  }, []);
  const applied = choice === "system" ? system : choice;
  useEffect(() => {
    document.documentElement.dataset.theme = applied;
  }, [applied]);
  const setChoice = useCallback((value: ThemeChoice) => {
    try {
      if (value === "system") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch {
      // storage may be unavailable (private mode)
    }
    setChoiceState(value);
  }, []);
  return [choice, setChoice, applied];
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/** The theme the app is drawn in right now (after resolving "system"), e.g. for the canvas colour mode. */
export function useAppTheme(): Theme {
  return useSyncExternalStore(subscribe, current, () => "dark");
}
