// The editor's code (canvas, code editor) is a chunk of its own. The Workflows page asks for it once the browser is
// idle (ST-004), so opening a workflow does not wait for the download; the router uses the same import.

let loading: Promise<typeof import("./pages/EditorPage")> | null = null;

export function loadEditorModule() {
  // A failed download is forgotten, so the next attempt (the route, after a network hiccup) asks again.
  loading ??= import("./pages/EditorPage").catch((error: unknown) => {
    loading = null;
    throw error;
  });
  return loading;
}

/** Starts the download when the browser is idle; returns the cancel function for an effect. */
export function preloadEditor(): () => void {
  const start = () => {
    void loadEditorModule().catch(() => undefined);
  };
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(start, { timeout: 4000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(start, 1500);
  return () => window.clearTimeout(id);
}
