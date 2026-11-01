/** Whether the user asked the system for less motion (false where matchMedia is unavailable, e.g. in tests). */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** The duration of a script animation in ms: none when the user prefers reduced motion. */
export function motionDuration(ms: number): number {
  return prefersReducedMotion() ? 0 : ms;
}
