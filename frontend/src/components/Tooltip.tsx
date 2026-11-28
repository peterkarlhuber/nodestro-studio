// Tooltips of controls: one short explanation at a button, badge or value, optionally with a link into the
// documentation. The help buttons next to labels are the shared HelpTip of @nodestro/ui-core (with the studio's help
// registry, lib/platformHelp.tsx); this file has no help button of its own any more (eslint.config.js forbids one).
//
// - Hover (mouse) shows a tooltip after a short delay, keyboard focus at once; leaving or Escape hides it. Showing
//   cancels a pending timer, so a close queued by an earlier leave never hides a tooltip focus just opened.
// - Only one tooltip is open at a time.
// - Placement: the bubble is rendered into the nearest open <dialog> of its anchor (else <body>), and shown in the
//   browser's top layer with the Popover API where available. A modal <dialog> (showModal) lives in the top layer
//   itself, so a bubble portaled into <body> would be painted beneath it whatever its z-index; inside the dialog it
//   also stays outside the dialog's inert backdrop. The top layer escapes every `overflow` and `transform` of its
//   ancestors. Without the Popover API (old browsers, jsdom) it is a fixed element with a high z-index.
// - It is kept inside the window: flipped below the anchor when there is no room above, shifted sideways at the
//   edges, and scrolls itself when it is taller than the window (high zoom, large text).
// - Escape closes the tooltip and still does what it does without one (a tooltip names a control, often the one a
//   dialog focuses first: one Escape closes the tooltip and the dialog).

import {
  type FocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { docPath } from "../lib/help";

const OPEN_DELAY = 350;
const CLOSE_DELAY = 140;
const GAP = 8;
const MARGIN = 8;

let closeActive: (() => void) | null = null;

function focusVisible(element: HTMLElement): boolean {
  try {
    return element.matches(":focus-visible");
  } catch {
    return true;
  }
}

interface TipState {
  anchor: HTMLElement | null;
}

/** The behaviour of all tooltips: timers, a single open tooltip, Escape, outside clicks. */
function useTip() {
  const [state, setState] = useState<TipState>({ anchor: null });
  const timer = useRef<number | undefined>(undefined);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const id = useId();

  const clear = () => window.clearTimeout(timer.current);
  const close = useCallback(() => {
    window.clearTimeout(timer.current);
    setState({ anchor: null });
  }, []);
  const show = useCallback(
    (anchor: HTMLElement) => {
      // A close still pending from an earlier pointer leave or blur must not hide what is shown now (e.g. the mouse
      // left the icon and Tab reached it within CLOSE_DELAY).
      window.clearTimeout(timer.current);
      if (closeActive && closeActive !== close) closeActive();
      closeActive = close;
      setState({ anchor });
    },
    [close],
  );
  const later = (action: () => void, delay: number) => {
    clear();
    timer.current = window.setTimeout(action, delay);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!state.anchor) {
      if (closeActive === close) closeActive = null;
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onPointer = (event: globalThis.PointerEvent) => {
      const target = event.target as Node;
      if (!state.anchor?.contains(target) && !bubbleRef.current?.contains(target)) close();
    };
    const onScroll = (event: Event) => {
      if (!bubbleRef.current?.contains(event.target as Node)) close();
    };
    window.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [state.anchor, close]);

  const hoverProps = {
    onPointerEnter: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === "touch") return;
      const anchor = event.currentTarget;
      if (state.anchor === anchor) clear();
      else later(() => show(anchor), OPEN_DELAY);
    },
    onPointerLeave: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === "touch") return;
      later(close, CLOSE_DELAY);
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      if (focusVisible(event.currentTarget)) show(event.currentTarget);
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      if (bubbleRef.current?.contains(event.relatedTarget as Node)) return;
      later(close, CLOSE_DELAY);
    },
  };
  const bubbleProps = {
    onPointerEnter: clear,
    onPointerLeave: () => later(close, CLOSE_DELAY),
    onBlur: (event: FocusEvent<HTMLElement>) => {
      const to = event.relatedTarget as Node | null;
      if (bubbleRef.current?.contains(to) || state.anchor?.contains(to)) return;
      later(close, CLOSE_DELAY);
    },
  };
  return { id, state, show, close, hoverProps, bubbleProps, bubbleRef };
}

/** Where a bubble is rendered: the anchor's open dialog (a modal dialog makes everything else inert), else <body>. */
export function tipHost(anchor: HTMLElement): HTMLElement {
  return anchor.closest<HTMLElement>("dialog[open]") ?? document.body;
}

/** Whether the browser has the Popover API (jsdom and older browsers do not: their bubble stays a fixed element). */
const POPOVER = typeof HTMLElement !== "undefined" && typeof HTMLElement.prototype.showPopover === "function";

/** Puts the bubble into the top layer (above modal dialogs); false where the browser has no Popover API. */
function raise(bubble: HTMLElement): boolean {
  if (!POPOVER || !bubble.hasAttribute("popover")) return false;
  try {
    if (!bubble.matches(":popover-open")) bubble.showPopover();
    return true;
  } catch {
    return false;
  }
}

/** The bubble's place: above the anchor, else below; always inside the window (pure, for the unit tests). */
export function placeTip(
  rect: { top: number; bottom: number; left: number; width: number },
  size: { width: number; height: number },
  view: { width: number; height: number },
): { top: number; left: number; below: boolean } {
  const room = { above: rect.top - GAP - MARGIN, below: view.height - rect.bottom - GAP - MARGIN };
  const below = size.height > room.above && room.below >= room.above;
  const wanted = below ? rect.bottom + GAP : rect.top - size.height - GAP;
  const top = Math.max(MARGIN, Math.min(wanted, view.height - size.height - MARGIN));
  const centre = rect.left + rect.width / 2 - size.width / 2;
  const left = Math.max(MARGIN, Math.min(centre, view.width - size.width - MARGIN));
  return { top, left, below };
}

function TipBubble({
  id,
  anchor,
  content,
  doc,
  onClose,
  bubbleRef,
  ...events
}: {
  id: string;
  anchor: HTMLElement;
  content: ReactNode;
  doc?: string;
  onClose: () => void;
  bubbleRef: RefObject<HTMLDivElement | null>;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
}) {
  const { t } = useTranslation();
  const [position, setPosition] = useState<{ top: number; left: number; below: boolean } | null>(null);
  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble) return;
    raise(bubble);
    const view = { width: document.documentElement.clientWidth || window.innerWidth, height: window.innerHeight };
    setPosition(placeTip(anchor.getBoundingClientRect(), { width: bubble.offsetWidth, height: bubble.offsetHeight }, view));
  }, [anchor, bubbleRef, content]);
  return createPortal(
    <div
      ref={bubbleRef}
      id={id}
      role="tooltip"
      popover={POPOVER ? "manual" : undefined}
      className={`tooltip ${position?.below ? "tooltip--below" : ""}`}
      style={position ? { top: position.top, left: position.left } : { top: -9999, left: -9999 }}
      {...events}
    >
      <div className="tooltip__text">{content}</div>
      {doc ? (
        <Link className="tooltip__link" to={docPath(doc)} onClick={onClose}>
          {t("common.moreInDocs")}
        </Link>
      ) : null}
    </div>,
    tipHost(anchor),
  );
}

type TriggerProps = {
  "aria-describedby"?: string;
  onPointerEnter?: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave?: (event: PointerEvent<HTMLElement>) => void;
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLElement>) => void;
};

/**
 * Wraps one element (a button, a badge, a value) and explains it on hover and keyboard focus.
 * Clicking the element hides the tooltip, so it never stands in the way of the action.
 */
export function Tooltip({
  content,
  doc,
  children,
}: {
  content: ReactNode;
  doc?: string;
  children: ReactElement<TriggerProps>;
}) {
  const tip = useTip();
  if (!content) return children;
  const own = children.props;
  const trigger = cloneElement(children, {
    "aria-describedby": tip.state.anchor ? tip.id : own["aria-describedby"],
    onPointerEnter: (event) => {
      own.onPointerEnter?.(event);
      tip.hoverProps.onPointerEnter(event);
    },
    onPointerLeave: (event) => {
      own.onPointerLeave?.(event);
      tip.hoverProps.onPointerLeave(event);
    },
    onPointerDown: (event) => {
      own.onPointerDown?.(event);
      tip.close();
    },
    onFocus: (event) => {
      own.onFocus?.(event);
      tip.hoverProps.onFocus(event);
    },
    onBlur: (event) => {
      own.onBlur?.(event);
      tip.hoverProps.onBlur(event);
    },
  });
  return (
    <>
      {trigger}
      {tip.state.anchor ? (
        <TipBubble
          id={tip.id}
          anchor={tip.state.anchor}
          content={content}
          doc={doc}
          onClose={tip.close}
          bubbleRef={tip.bubbleRef}
          {...tip.bubbleProps}
        />
      ) : null}
    </>
  );
}
