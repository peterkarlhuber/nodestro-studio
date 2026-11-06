// The right edge of the settings content: drag it, or focus it and use the arrow keys, to make the content wider or
// narrower; Home and End go to the smallest and the largest width that fits, a double-click (or the reset link in
// the navigation) restores the default. A WAI-ARIA "window splitter" like the editor's PanelSplitter.
//
// While dragging only the CSS variable on the layout changes (no re-render per pixel); the final width is stored
// when the pointer is released. Escape during a drag puts the edge back where it was.

import { GripVertical } from "lucide-react";
import { type KeyboardEvent, type PointerEvent, type RefObject, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Tooltip } from "../components/Tooltip";
import { LARGE_STEP, SETTINGS_WIDTH, SETTINGS_WIDTH_VARIABLE, STEP, clampWidth } from "./settingsWidth";

interface Props {
  /** The grid (.settings-layout) that carries the width variable. */
  host: RefObject<HTMLElement | null>;
  /** The content column (.settings). */
  content: RefObject<HTMLElement | null>;
  /** The section navigation right of the edge: the room after it is the room the content can still grow by. */
  nav: RefObject<HTMLElement | null>;
  width: number;
  onWidth: (value: number) => void;
  onReset: () => void;
}

/** The width the content has on screen and the largest width the window leaves it (never below the minimum). */
export function measureRoom(host: HTMLElement | null, content: HTMLElement | null, nav: HTMLElement | null, fallback: number) {
  if (!host || !content) return { shown: fallback, max: SETTINGS_WIDTH.max };
  const shown = Math.round(content.getBoundingClientRect().width);
  const hostBox = host.getBoundingClientRect();
  const padding = Number.parseFloat(getComputedStyle(host).paddingRight) || 0;
  const right = nav && nav.getClientRects().length ? nav.getBoundingClientRect().right : content.getBoundingClientRect().right;
  const free = Math.max(0, Math.floor(hostBox.right - padding - right));
  return { shown, max: Math.max(SETTINGS_WIDTH.min, Math.min(SETTINGS_WIDTH.max, shown + free)) };
}

export function SettingsResizer({ host, content, nav, width, onWidth, onReset }: Props) {
  const { t } = useTranslation();
  const self = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ start: number; size: number; max: number; current: number } | null>(null);
  const [room, setRoom] = useState<{ shown: number; max: number }>({ shown: width, max: SETTINGS_WIDTH.max });

  // The values a screen reader announces follow the window, the zoom and the assistant panel.
  useEffect(() => {
    const update = () => {
      const next = measureRoom(host.current, content.current, nav.current, width);
      setRoom((previous) => (previous.shown === next.shown && previous.max === next.max ? previous : next));
    };
    update();
    if (typeof ResizeObserver === "undefined" || !host.current) return;
    const observer = new ResizeObserver(update);
    observer.observe(host.current);
    if (content.current) observer.observe(content.current);
    return () => observer.disconnect();
  }, [host, content, nav, width]);

  const show = (value: number) => {
    host.current?.style.setProperty(SETTINGS_WIDTH_VARIABLE, `${value}px`);
    self.current?.setAttribute("aria-valuenow", String(value));
  };

  const end = (pointer: PointerEvent<HTMLDivElement>, keep: boolean) => {
    const state = drag.current;
    if (!state) return;
    drag.current = null;
    if (pointer.currentTarget.hasPointerCapture(pointer.pointerId)) pointer.currentTarget.releasePointerCapture(pointer.pointerId);
    document.body.classList.remove("is-resizing", "is-resizing--x");
    if (!keep) {
      show(width);
      return;
    }
    if (state.current !== state.size) onWidth(state.current);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const { shown, max } = measureRoom(host.current, content.current, nav.current, width);
    drag.current = { start: event.clientX, size: shown, max, current: shown };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus({ preventScroll: true });
    document.body.classList.add("is-resizing", "is-resizing--x");
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state) return;
    if (event.buttons === 0) {
      end(event, true);
      return;
    }
    const next = Math.min(state.max, clampWidth(state.size + event.clientX - state.start));
    if (next === state.current) return;
    state.current = next;
    show(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && drag.current) {
      event.preventDefault();
      drag.current = null;
      document.body.classList.remove("is-resizing", "is-resizing--x");
      show(width);
      return;
    }
    const { shown, max } = measureRoom(host.current, content.current, nav.current, width);
    const step = event.shiftKey ? LARGE_STEP : STEP;
    let next: number | null = null;
    if (event.key === "ArrowRight") next = shown + step;
    else if (event.key === "ArrowLeft") next = shown - step;
    else if (event.key === "Home") next = SETTINGS_WIDTH.min;
    else if (event.key === "End") next = max;
    if (next === null) return;
    event.preventDefault();
    onWidth(Math.min(max, clampWidth(next)));
  };

  return (
    <Tooltip content={t("settingsUi.width.hint")}>
      <div
        ref={self}
        className="settings-resizer"
        role="separator"
        tabIndex={0}
        aria-label={t("settingsUi.width.label")}
        aria-controls="settings-content"
        aria-orientation="vertical"
        aria-valuemin={SETTINGS_WIDTH.min}
        aria-valuemax={room.max}
        aria-valuenow={Math.min(room.shown, room.max)}
        aria-valuetext={t("settingsUi.width.value", { width: Math.min(room.shown, room.max) })}
        data-testid="settings-resizer"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => end(event, true)}
        onPointerCancel={(event) => end(event, false)}
        onLostPointerCapture={(event) => end(event, true)}
        onDoubleClick={onReset}
        onKeyDown={onKeyDown}
      >
        <span className="settings-resizer__grip" aria-hidden>
          <GripVertical size={14} />
        </span>
      </div>
    </Tooltip>
  );
}
