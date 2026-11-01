// The browser tab names the page: "Approvals · Nodestro Studio". Titles come from the page header, so they are
// in the interface language and follow a language switch.

import { useEffect } from "react";

export const APP_TITLE = "Nodestro Studio";

/** The document title for a page title; the plain app name when there is none. */
export function pageTitle(title: string | null | undefined): string {
  const text = title?.trim();
  return text ? `${text} · ${APP_TITLE}` : APP_TITLE;
}

/** Shows the page title in the browser tab while the component is mounted. */
export function useDocumentTitle(title: string | null | undefined): void {
  useEffect(() => {
    if (!title?.trim()) return;
    const previous = document.title;
    document.title = pageTitle(title);
    return () => {
      document.title = previous;
    };
  }, [title]);
}
