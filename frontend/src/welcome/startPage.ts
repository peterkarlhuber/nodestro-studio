// The welcome page is the entry point of every app start.
//
// An "app start" is a fresh page load of the bare start page ("/"): the Studio opened in a new browser
// tab or window, the start link printed by `nodestro serve`, or the desktop app's window. It is told apart
// from everything else without any stored state:
//
// - Only the first navigation of a page load can be a start. Every later navigation inside the running
//   Studio (the sidebar's Workflows link, the welcome page's Open Studio button, Back and Forward between
//   Studio pages) is client side and never redirected, so there is no loop.
// - Reloading the page, or coming Back/Forward to it from another site, returns to where the person was
//   (Navigation Timing type "reload" / "back_forward"); only a new navigation ("navigate") is a start.
// - Only "/" with no query and no hash is ever redirected. Deep links (/workflows/…, /executions/…,
//   any query string or hash) always open exactly what they name.
// - Automated browsers (navigator.webdriver: tests, screenshot tools) go straight to the page they asked for.
//
// The redirect is the router's initial-load redirect, which replaces the history entry, so Back from the
// welcome page does not bounce back to it. The welcome page itself is always reachable at /welcome.

import { redirect } from "react-router-dom";

export const WELCOME_PATH = "/welcome";

let pageLoaded = false;

/** Whether this document was loaded by a new navigation (not a reload, not Back/Forward). */
function freshNavigation(): boolean {
  try {
    const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    const type: string | undefined = entry?.type;
    return type === undefined || type === "navigate" || type === "prerender";
  } catch {
    return true;
  }
}

function automated(): boolean {
  return typeof navigator !== "undefined" && navigator.webdriver === true;
}

/** The fragment of the address bar: the router leaves it out of the loader's request. */
function addressHash(url: URL): string {
  return typeof window !== "undefined" && window.location.hash ? window.location.hash : url.hash;
}

/** Whether a navigation to ``url`` is an app start that should show the welcome page instead. */
export function shouldWelcome(url: URL): boolean {
  const initial = !pageLoaded;
  pageLoaded = true;
  const bare = url.pathname === "/" && url.search === "" && addressHash(url) === "";
  return initial && bare && freshNavigation() && !automated();
}

/** Loader of the Studio frame: sends an app start on the bare start page to the welcome page. */
export function studioLoader({ request }: { request: Request }) {
  return shouldWelcome(new URL(request.url)) ? redirect(WELCOME_PATH) : null;
}

/** Tests only: forget that the page has loaded, as if the document were opened again. */
export function resetPageLoad(): void {
  pageLoaded = false;
}
