// The width of the settings page's content column: a preference of this browser, like the editor's panel sizes
// (editor/layout.ts). The person drags the column's right edge (SettingsResizer) or uses the arrow keys on it;
// the section navigation moves with the edge. The value is kept in localStorage and checked on load, so an old
// or edited entry falls back to the default. CSS shows min(stored width, room in the window): a stored width
// larger than a smaller window (or a higher zoom) allows is shown smaller without being changed.

import { useCallback, useState } from "react";

/** CSS pixels. The default is clearly wider than the old fixed 760 px; the maximum suits 2560 px screens. */
export const SETTINGS_WIDTH = { min: 560, max: 1800, default: 1120 } as const;

/** Arrow keys move the edge by STEP, with Shift by LARGE_STEP. */
export const STEP = 16;
export const LARGE_STEP = 80;

export const SETTINGS_WIDTH_KEY = "nodestro-settings-width";

/** The CSS variable on .settings-layout that holds the width. */
export const SETTINGS_WIDTH_VARIABLE = "--settings-width";

export function clampWidth(value: number): number {
  return Math.round(Math.min(SETTINGS_WIDTH.max, Math.max(SETTINGS_WIDTH.min, value)));
}

/** A stored value: a number within the bounds, else the default. */
export function parseWidth(raw: string | null): number {
  if (raw === null || raw.trim() === "") return SETTINGS_WIDTH.default;
  const value = Number(raw);
  return Number.isFinite(value) ? clampWidth(value) : SETTINGS_WIDTH.default;
}

export function loadWidth(): number {
  try {
    return parseWidth(localStorage.getItem(SETTINGS_WIDTH_KEY));
  } catch {
    return SETTINGS_WIDTH.default; // storage may be unavailable (private mode)
  }
}

export function saveWidth(value: number): void {
  try {
    if (value === SETTINGS_WIDTH.default) localStorage.removeItem(SETTINGS_WIDTH_KEY);
    else localStorage.setItem(SETTINGS_WIDTH_KEY, String(value));
  } catch {
    // storage may be unavailable (private mode): the width then lasts until the next reload
  }
}

export function useSettingsWidth(): { width: number; setWidth: (value: number) => void; reset: () => void } {
  const [width, setState] = useState(loadWidth);
  const setWidth = useCallback((value: number) => {
    const next = clampWidth(value);
    saveWidth(next);
    setState(next);
  }, []);
  const reset = useCallback(() => setWidth(SETTINGS_WIDTH.default), [setWidth]);
  return { width, setWidth, reset };
}
