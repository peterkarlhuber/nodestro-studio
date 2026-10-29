// Contextual tooltips: one short explanation at the control, optionally with a link into the documentation.
//
// - Hover (mouse) or keyboard focus shows a tooltip after a short delay; leaving or Escape hides it.
// - The help icon (<HelpTip>) also opens on click and tap, so it works on touch devices.
// - Only one tooltip is open at a time; it is rendered into <body> so panels never clip it.

import { CircleHelp } from "lucide-react";
import {
  type FocusEvent,
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

import { type HelpId, docPath, helpEntry } from "../lib/help";

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
  pinned: boolean;
}

/** The shared behaviour of all tooltips: timers, a single open tooltip, Escape, outside clicks. */
function useTip() {
  const [state, setState] = useState<TipState>({ anchor: null, pinned: false });
  const timer = useRef<number | undefined>(undefined);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const id = useId();

  const clear = () => window.clearTimeout(timer.current);
  const close = useCallback(() => {
    window.clearTimeout(timer.current);
    setState({ anchor: null, pinned: false });
  }, []);
  const show = useCallback(
    (anchor: HTMLElement, pinned = false) => {
      if (closeActive && closeActive !== close) closeActive();
      closeActive = close;
      setState({ anchor, pinned });
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
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", onKey);
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
      if (event.pointerType === "touch" || state.pinned) return;
      later(close, CLOSE_DELAY);
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      if (focusVisible(event.currentTarget)) show(event.currentTarget, state.pinned);
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      if (bubbleRef.current?.contains(event.relatedTarget as Node)) return;
      if (!state.pinned) later(close, CLOSE_DELAY);
    },
  };
  const bubbleProps = {
    onPointerEnter: clear,
    onPointerLeave: () => {
      if (!state.pinned) later(close, CLOSE_DELAY);
    },
  };
  return { id, state, show, close, clear, hoverProps, bubbleProps, bubbleRef };
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
}) {
  const { t } = useTranslation();
  const [position, setPosition] = useState<{ top: number; left: number; below: boolean } | null>(null);
  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble) return;
    const rect = anchor.getBoundingClientRect();
    const width = bubble.offsetWidth;
    const height = bubble.offsetHeight;
    const below = rect.top - height - GAP < MARGIN;
    const top = below ? rect.bottom + GAP : rect.top - height - GAP;
    const centre = rect.left + rect.width / 2 - width / 2;
    const left = Math.min(Math.max(centre, MARGIN), window.innerWidth - width - MARGIN);
    setPosition({ top, left, below });
  }, [anchor, bubbleRef, content]);
  return createPortal(
    <div
      ref={bubbleRef}
      id={id}
      role="tooltip"
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
    document.body,
  );
}

type TriggerProps = {
  "aria-describedby"?: string;
  onPointerEnter?: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave?: (event: PointerEvent<HTMLElement>) => void;
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
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

/**
 * A small help icon next to a label. Hover or focus shows the explanation; click or tap pins it open,
 * which makes it usable on touch screens. Texts live in the language files (help.<id>); lib/help.ts
 * keeps their documentation links.
 */
export function HelpTip({ id, label }: { id: HelpId; label?: string }) {
  const { t } = useTranslation();
  const tip = useTip();
  const help = helpEntry(t, id);
  const open = tip.state.anchor !== null;
  return (
    <>
      <button
        type="button"
        className={`help-tip ${open ? "help-tip--open" : ""}`}
        aria-label={label ? t("common.helpFor", { label }) : t("common.help")}
        aria-expanded={open}
        aria-describedby={open ? tip.id : undefined}
        {...tip.hoverProps}
        onClick={(event) => {
          // Inside a <summary> the click would also open or close the section.
          event.preventDefault();
          event.stopPropagation();
          if (tip.state.pinned) tip.close();
          else {
            tip.clear();
            tip.show(event.currentTarget, true);
          }
        }}
      >
        <CircleHelp size={13} aria-hidden />
      </button>
      {tip.state.anchor ? (
        <TipBubble
          id={tip.id}
          anchor={tip.state.anchor}
          content={help.text}
          doc={help.doc}
          onClose={tip.close}
          bubbleRef={tip.bubbleRef}
          {...tip.bubbleProps}
        />
      ) : null}
    </>
  );
}
