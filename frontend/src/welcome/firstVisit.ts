// The welcome page greets a browser once: the first time it opens the Studio's start page.
//
// - Only the bare start page ("/") is ever redirected. Deep links (/workflows/…, /executions/…,
//   any query string or hash) always open exactly what they name.
// - Opening any Studio page counts as "seen", so the redirect happens at most once per browser
//   and never forms a loop. The welcome page itself is always reachable at /welcome.
// - Automated browsers (navigator.webdriver: tests, screenshot tools) are not a first visit
//   by a person and go straight to the page they asked for.

import { redirect } from "react-router-dom";

export const WELCOME_PATH = "/welcome";
export const WELCOME_STORAGE_KEY = "nodestro-welcome-seen";

export function welcomeSeen(): boolean {
  try {
    return localStorage.getItem(WELCOME_STORAGE_KEY) !== null;
  } catch {
    return true; // without storage the page could never be dismissed, so do not redirect
  }
}

export function markWelcomeSeen(): void {
  try {
    localStorage.setItem(WELCOME_STORAGE_KEY, "1");
  } catch {
    // storage may be unavailable (private mode)
  }
}

function automated(): boolean {
  return typeof navigator !== "undefined" && navigator.webdriver === true;
}

/** Whether a navigation to ``url`` should show the welcome page instead (and remember the visit). */
export function shouldWelcome(url: URL): boolean {
  const first = !welcomeSeen() && !automated();
  markWelcomeSeen();
  return first && url.pathname === "/" && url.search === "" && url.hash === "";
}

/** Loader of the Studio frame: sends the very first visit of the start page to the welcome page. */
export function studioLoader({ request }: { request: Request }) {
  return shouldWelcome(new URL(request.url)) ? redirect(WELCOME_PATH) : null;
}
