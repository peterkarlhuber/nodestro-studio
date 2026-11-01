import { useEffect, useState } from "react";

/** A media query as live React state (false where matchMedia is unavailable, e.g. in tests). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.(query).matches);
  useEffect(() => {
    const list = window.matchMedia?.(query);
    if (!list) return;
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);
  return matches;
}

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");

/** Whether an element is (at least ``threshold``) on screen; true where IntersectionObserver is missing. */
export function useInView<T extends Element>(element: T | null, threshold = 0): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, threshold]);
  return inView;
}

/**
 * Pointer parallax without React re-renders: writes --px/--py (-1…1) on ``element`` once per
 * animation frame while the pointer moves over it, and eases back to 0 when it leaves.
 */
export function usePointerParallax(element: HTMLElement | null, enabled: boolean): void {
  useEffect(() => {
    if (!element || !enabled) return;
    if (!window.matchMedia?.("(pointer: fine)").matches) return;
    let frame = 0;
    let x = 0;
    let y = 0;
    const write = () => {
      frame = 0;
      element.style.setProperty("--px", x.toFixed(3));
      element.style.setProperty("--py", y.toFixed(3));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(write);
    };
    const move = (event: PointerEvent) => {
      const box = element.getBoundingClientRect();
      x = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1));
      y = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height) * 2 - 1));
      schedule();
    };
    const leave = () => {
      x = 0;
      y = 0;
      schedule();
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerleave", leave);
    return () => {
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", leave);
      if (frame) cancelAnimationFrame(frame);
      element.style.removeProperty("--px");
      element.style.removeProperty("--py");
    };
  }, [element, enabled]);
}
