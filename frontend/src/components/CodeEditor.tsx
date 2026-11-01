import { Suspense, lazy } from "react";

import i18n from "../i18n";

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: "python" | "json" | "text";
  minHeight?: string;
  readOnly?: boolean;
  ariaLabel?: string;
}

// CodeMirror (about 470 kB) loads with the first editor shown, not with every page.
const CodeMirrorEditor = lazy(() => import("./CodeMirrorEditor"));

/**
 * Stands in while CodeMirror loads: the same frame and the same text, so nothing jumps or blinks
 * (no spinner). It is read-only for that moment.
 */
function CodeEditorPlaceholder({ value, minHeight = "160px", ariaLabel }: CodeEditorProps) {
  return (
    <pre className="code-editor-placeholder" style={{ minHeight }} aria-label={ariaLabel ?? i18n.t("common.code")} aria-busy="true">
      {value}
    </pre>
  );
}

/** A code editor for Python or JSON (CodeMirror), themed with the design tokens. */
export function CodeEditor(props: CodeEditorProps) {
  return (
    <Suspense fallback={<CodeEditorPlaceholder {...props} />}>
      <CodeMirrorEditor {...props} />
    </Suspense>
  );
}
