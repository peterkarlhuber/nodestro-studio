/**
 * The way into nested teams: when a sub-workflow node is opened with a double-click, the editor
 * remembers the workflows above it in the `trail` search parameter (ids, outermost first).
 */

const MAX_TRAIL = 6; // deeper than the runtime's nesting limit, so the trail never cuts a real way

export function parseTrail(value: string | null, current: string): string[] {
  if (!value) return [];
  const ids = value.split(",").filter((id) => /^[A-Za-z0-9_-]+$/.test(id));
  // A loop back to the current workflow (or a repeated id) ends the trail there.
  const cut = ids.indexOf(current);
  const unique = (cut >= 0 ? ids.slice(0, cut) : ids).filter((id, index, all) => all.indexOf(id) === index);
  return unique.slice(-MAX_TRAIL);
}

/** The editor link of `target`, reached from `current` with `trail` above it. */
export function childLink(trail: string[], current: string, target: string): string {
  const next = [...trail, current].filter((id) => id !== target).slice(-MAX_TRAIL);
  return `/workflows/${target}?trail=${next.join(",")}`;
}

/** The editor link of the workflow at `index` of the trail, with the part of the trail above it. */
export function crumbLink(trail: string[], index: number): string {
  const above = trail.slice(0, index);
  return `/workflows/${trail[index]}${above.length ? `?trail=${above.join(",")}` : ""}`;
}
