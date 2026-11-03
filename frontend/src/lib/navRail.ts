import { useCallback, useState } from "react";
import { matchPath, useLocation } from "react-router-dom";

/**
 * The main navigation as a full list or as an icon rail. "auto" (nothing stored) shows the rail in the workflow
 * editor, where the canvas needs the room, and the full list elsewhere; the person's own choice applies everywhere.
 * Narrow windows always show the rail (CSS), phones a menu.
 */
export type NavChoice = "auto" | "expanded" | "collapsed";

export const NAV_STORAGE_KEY = "nodestro-nav";

function stored(): NavChoice {
  try {
    const value = localStorage.getItem(NAV_STORAGE_KEY);
    if (value === "expanded" || value === "collapsed") return value;
  } catch {
    // storage may be unavailable (private mode)
  }
  return "auto";
}

export function railFor(choice: NavChoice, pathname: string): boolean {
  if (choice !== "auto") return choice === "collapsed";
  return matchPath("/workflows/:id", pathname) !== null && !matchPath("/workflows/examples", pathname);
}

export function useNavRail(): { rail: boolean; toggle: () => void } {
  const { pathname } = useLocation();
  const [choice, setChoice] = useState<NavChoice>(stored);
  const rail = railFor(choice, pathname);
  const toggle = useCallback(() => {
    const next: NavChoice = rail ? "expanded" : "collapsed";
    try {
      localStorage.setItem(NAV_STORAGE_KEY, next);
    } catch {
      // storage may be unavailable (private mode)
    }
    setChoice(next);
  }, [rail]);
  return { rail, toggle };
}
