// The layout of the workflow editor: which of its three panels (building blocks on the left, the
// inspector on the right, the execution overview at the bottom) are open, and how large they are.
//
// This is a preference of the browser, not part of the workflow: it is kept in localStorage, never
// marks a workflow as changed and never enters the undo history. The same layout applies to every
// workflow. Stored values are checked on load, so an old or edited entry falls back to the defaults.

import { create } from "zustand";

export type EditorPanel = "palette" | "inspector" | "runPanel";

export interface PanelBounds {
  min: number;
  max: number;
  default: number;
}

/** Sizes in CSS pixels: the width of the side panels and the height of the execution overview. */
export const PANEL_BOUNDS: Record<EditorPanel, PanelBounds> = {
  palette: { min: 180, max: 420, default: 232 },
  inspector: { min: 260, max: 680, default: 320 },
  runPanel: { min: 140, max: 900, default: 260 },
};

/**
 * The largest share of its container a panel may take (palette: the row beside the canvas, inspector:
 * the editor, execution overview: the column above it). styles/app.css applies the same limits with
 * min(), so a stored size larger than the window allows is shown smaller without being changed.
 */
export const PANEL_SHARE: Record<EditorPanel, number> = { palette: 0.35, inspector: 0.45, runPanel: 0.65 };

/** The canvas keeps at least this much room next to and above the panels. */
export const CANVAS_MIN = { width: 280, height: 180 };

const STORAGE = "nodestro-editor-layout";

interface Persisted {
  open: Record<EditorPanel, boolean>;
  size: Record<EditorPanel, number>;
}

export interface EditorLayoutState extends Persisted {
  setOpen: (panel: EditorPanel, open: boolean) => void;
  toggle: (panel: EditorPanel) => void;
  /** Sets a size; it is kept within the panel's bounds. */
  setSize: (panel: EditorPanel, size: number) => void;
  /** Back to the default size (double-click on a divider). */
  resetSize: (panel: EditorPanel) => void;
}

const PANELS: EditorPanel[] = ["palette", "inspector", "runPanel"];

export function clampSize(panel: EditorPanel, size: number): number {
  const { min, max } = PANEL_BOUNDS[panel];
  return Math.round(Math.min(max, Math.max(min, size)));
}

export function defaultLayout(): Persisted {
  // Narrow windows start with the building blocks collapsed so the canvas keeps its room.
  const narrow = typeof window !== "undefined" && window.innerWidth < 1100;
  return {
    open: { palette: !narrow, inspector: true, runPanel: true },
    size: { palette: PANEL_BOUNDS.palette.default, inspector: PANEL_BOUNDS.inspector.default, runPanel: PANEL_BOUNDS.runPanel.default },
  };
}

/** Reads a stored layout; anything missing, of the wrong type or out of bounds takes the default. */
export function parseLayout(raw: string | null): Persisted {
  const layout = defaultLayout();
  if (!raw) return layout;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return layout;
  }
  if (!value || typeof value !== "object") return layout;
  const { open, size } = value as { open?: Record<string, unknown>; size?: Record<string, unknown> };
  for (const panel of PANELS) {
    if (open && typeof open[panel] === "boolean") layout.open[panel] = open[panel] as boolean;
    const stored = size?.[panel];
    if (typeof stored === "number" && Number.isFinite(stored)) layout.size[panel] = clampSize(panel, stored);
  }
  return layout;
}

function load(): Persisted {
  try {
    return parseLayout(localStorage.getItem(STORAGE));
  } catch {
    return defaultLayout();
  }
}

function save(state: Persisted): void {
  try {
    localStorage.setItem(STORAGE, JSON.stringify({ open: state.open, size: state.size }));
  } catch {
    // storage may be unavailable (private mode); the layout then lasts until the next reload
  }
}

export const useEditorLayout = create<EditorLayoutState>((set, get) => {
  const update = (patch: Partial<Persisted>) => {
    set(patch);
    save(get());
  };
  return {
    ...load(),
    setOpen: (panel, open) => update({ open: { ...get().open, [panel]: open } }),
    toggle: (panel) => update({ open: { ...get().open, [panel]: !get().open[panel] } }),
    setSize: (panel, size) => update({ size: { ...get().size, [panel]: clampSize(panel, size) } }),
    resetSize: (panel) => update({ size: { ...get().size, [panel]: PANEL_BOUNDS[panel].default } }),
  };
});
