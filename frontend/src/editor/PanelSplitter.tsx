// The divider between an editor panel and the canvas: drag it, or focus it and use the arrow keys,
// to change the panel's size; a double-click restores the default (WAI-ARIA "window splitter").
//
// While dragging, only a CSS variable on the editor changes, so neither the canvas nor the panels
// re-render on every pixel; the final size goes to the layout store when the pointer is released.

import { type KeyboardEvent, type PointerEvent, type RefObject, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Tooltip } from "../components/Tooltip";
import { CANVAS_MIN, type EditorPanel, PANEL_BOUNDS, PANEL_SHARE, clampSize, useEditorLayout } from "./layout";

/** The CSS variable on the editor that holds each panel's size. */
export const PANEL_VARIABLE: Record<EditorPanel, string> = {
  palette: "--editor-palette-width",
  inspector: "--editor-inspector-width",
  runPanel: "--editor-run-height",
};

const STEP = 16;
const LARGE_STEP = 64;

interface Props {
  panel: EditorPanel;
  /** The panel's id, for aria-controls. */
  controls: string;
  label: string;
  /** The element that carries the size variables (the editor). */
  host: RefObject<HTMLElement | null>;
  /** The resized panel and the canvas, measured when a resize starts. */
  target: RefObject<HTMLElement | null>;
  canvas: RefObject<HTMLElement | null>;
}

export function PanelSplitter({ panel, controls, label, host, target, canvas }: Props) {
  const { t } = useTranslation();
  const size = useEditorLayout((state) => state.size[panel]);
  const { setSize, resetSize } = useEditorLayout.getState();
  const vertical = panel !== "runPanel";
  const drag = useRef<{ start: number; size: number; max: number; current: number } | null>(null);
  const self = useRef<HTMLDivElement | null>(null);

  /** The panel's size on screen and the largest size that still leaves the canvas its room. */
  const measure = () => {
    const panelBox = target.current?.getBoundingClientRect();
    const canvasBox = canvas.current?.getBoundingClientRect();
    const shown = panelBox ? Math.round(vertical ? panelBox.width : panelBox.height) : size;
    const room = canvasBox ? (vertical ? canvasBox.width - CANVAS_MIN.width : canvasBox.height - CANVAS_MIN.height) : Infinity;
    // The container whose share limits the panel (the same limits as in the CSS).
    const container = panel === "inspector" ? host.current : target.current?.parentElement;
    const containerBox = container?.getBoundingClientRect();
    const share = containerBox ? (vertical ? containerBox.width : containerBox.height) * PANEL_SHARE[panel] : Infinity;
    const max = Math.max(PANEL_BOUNDS[panel].min, Math.floor(Math.min(PANEL_BOUNDS[panel].max, share, shown + Math.max(0, room))));
    return { shown, max };
  };

  const show = (value: number) => {
    host.current?.style.setProperty(PANEL_VARIABLE[panel], `${value}px`);
    self.current?.setAttribute("aria-valuenow", String(value));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const { shown, max } = measure();
    drag.current = { start: vertical ? event.clientX : event.clientY, size: shown, max, current: shown };
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.classList.add("is-resizing", vertical ? "is-resizing--x" : "is-resizing--y");
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state) return;
    const position = vertical ? event.clientX : event.clientY;
    // Dragging away from the panel makes it larger: right for the palette, left for the inspector, up for the overview.
    const delta = panel === "palette" ? position - state.start : state.start - position;
    const next = Math.round(Math.min(state.max, Math.max(PANEL_BOUNDS[panel].min, state.size + delta)));
    if (next === state.current) return;
    state.current = next;
    show(next);
  };

  const finish = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    document.body.classList.remove("is-resizing", "is-resizing--x", "is-resizing--y");
    if (state.current !== state.size) setSize(panel, state.current);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const grow = { palette: "ArrowRight", inspector: "ArrowLeft", runPanel: "ArrowUp" }[panel];
    const shrink = { palette: "ArrowLeft", inspector: "ArrowRight", runPanel: "ArrowDown" }[panel];
    const step = event.shiftKey ? LARGE_STEP : STEP;
    const { shown, max } = measure();
    let next: number | null = null;
    if (event.key === grow) next = shown + step;
    else if (event.key === shrink) next = shown - step;
    else if (event.key === "Home") next = PANEL_BOUNDS[panel].min;
    else if (event.key === "End") next = max;
    if (next === null) return;
    event.preventDefault();
    setSize(panel, Math.min(max, clampSize(panel, next)));
  };

  return (
    <Tooltip content={t("editor.panels.resizeHint")}>
      <div
        ref={self}
        className={`splitter splitter--${vertical ? "vertical" : "horizontal"} splitter--${panel}`}
        role="separator"
        tabIndex={0}
        aria-label={label}
        aria-controls={controls}
        aria-orientation={vertical ? "vertical" : "horizontal"}
        aria-valuemin={PANEL_BOUNDS[panel].min}
        aria-valuemax={PANEL_BOUNDS[panel].max}
        aria-valuenow={size}
        data-testid={`splitter-${panel}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
        onDoubleClick={() => resetSize(panel)}
        onKeyDown={onKeyDown}
      />
    </Tooltip>
  );
}
