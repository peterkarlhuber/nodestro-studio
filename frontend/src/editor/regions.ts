/**
 * F6 / Shift+F6 move the focus between the editor's regions (title bar, building blocks, canvas, properties,
 * run overview), the way desktop applications and browsers do (WAI-ARIA APG, "landmark regions"). A region that
 * is not shown is skipped. The region itself takes the focus, so a screen reader names it; Tab then goes inside.
 */
export const REGION_ATTRIBUTE = "data-editor-region";

function regions(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(`[${REGION_ATTRIBUTE}]`)].filter(
    (element) => element.getClientRects().length > 0 && !element.closest("[inert], [hidden]"),
  );
}

/** The region after (or before) the one holding the focus; the first (or last) one when none does. */
export function nextRegion(root: ParentNode, active: Element | null, backwards: boolean): HTMLElement | undefined {
  const list = regions(root);
  if (!list.length) return undefined;
  const index = list.findIndex((region) => region === active || region.contains(active));
  if (index < 0) return backwards ? list[list.length - 1] : list[0];
  return list[(index + (backwards ? list.length - 1 : 1)) % list.length];
}

export function onRegionKey(event: KeyboardEvent, root: ParentNode | null): void {
  if (event.key !== "F6" || event.altKey || event.ctrlKey || event.metaKey || !root) return;
  // Inside a dialog F6 is not ours: the dialog keeps the focus.
  if ((document.activeElement as HTMLElement | null)?.closest("[role=dialog]")) return;
  const target = nextRegion(root, document.activeElement, event.shiftKey);
  if (!target) return;
  event.preventDefault();
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus();
}
