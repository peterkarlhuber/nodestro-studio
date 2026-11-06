// The editor's code (canvas, code editor) is a chunk of its own. The Workflows page asks for it as soon as the pointer
// or the keyboard focus reaches a workflow (ST-004), so the click does not wait for the download; the router uses
// the same import. A failed download is forgotten, so the next attempt asks again.

let loading: Promise<typeof import("./pages/EditorPage")> | null = null;

export function loadEditorModule() {
  loading ??= import("./pages/EditorPage").catch((error: unknown) => {
    loading = null;
    throw error;
  });
  return loading;
}

/** Starts the download once (later calls reuse it); errors surface when the route loads. */
export function preloadEditor(): void {
  if (!loading) void loadEditorModule().catch(() => undefined);
}
