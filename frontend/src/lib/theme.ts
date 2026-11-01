import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

function current(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(current);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("nodestro-theme", theme);
    } catch {
      // storage may be unavailable (private mode)
    }
  }, [theme]);
  const setTheme = useCallback((value: Theme) => setThemeState(value), []);
  return [theme, setTheme];
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/** The app theme as set by the theme switch (not the OS setting), e.g. for the canvas colour mode. */
export function useAppTheme(): Theme {
  return useSyncExternalStore(subscribe, current, () => "dark");
}
