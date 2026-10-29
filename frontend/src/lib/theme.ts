import { useCallback, useEffect, useState } from "react";

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
