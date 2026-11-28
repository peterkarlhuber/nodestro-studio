import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo } from "react";

import i18n from "../i18n";
import type { CodeEditorProps } from "./CodeEditor";

// The editor takes its colours from the shared --ui-* tokens (nodestro brand theme), so it follows the theme.
const tokens = EditorView.theme({
  "&": {
    color: "var(--ui-color-text)",
    backgroundColor: "var(--ui-color-surface)",
    fontSize: "var(--ui-text-sm)",
    border: "1px solid var(--ui-color-border)",
    borderRadius: "var(--ui-radius-sm)",
  },
  "&.cm-focused": { outline: "2px solid var(--ui-color-focus)", outlineOffset: "2px" },
  ".cm-content": { fontFamily: "var(--ui-font-mono)", caretColor: "var(--ui-color-primary)" },
  ".cm-gutters": {
    backgroundColor: "var(--ui-color-surface-raised)",
    color: "var(--ui-color-text-subtle)",
    border: "none",
    borderRight: "1px solid var(--ui-color-border)",
  },
  ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "color-mix(in srgb, var(--ui-color-primary) 7%, transparent)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "color-mix(in srgb, var(--ui-color-primary) 28%, transparent) !important",
  },
  ".cm-cursor": { borderLeftColor: "var(--ui-color-primary)" },
});

// Syntax colours from the status roles, readable in both themes.
const highlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: [tags.keyword, tags.controlKeyword, tags.moduleKeyword, tags.operatorKeyword], color: "var(--ui-color-running)" },
    { tag: [tags.function(tags.variableName), tags.function(tags.definition(tags.variableName))], color: "var(--ui-color-primary)" },
    { tag: [tags.definition(tags.variableName), tags.className], color: "var(--ui-color-primary)" },
    { tag: [tags.string, tags.special(tags.string)], color: "var(--ui-color-success)" },
    { tag: [tags.number, tags.bool, tags.null, tags.atom], color: "var(--ui-color-warning)" },
    { tag: [tags.comment, tags.docString], color: "var(--ui-color-text-subtle)", fontStyle: "italic" },
    { tag: [tags.propertyName], color: "var(--ui-color-running)" },
    { tag: [tags.invalid], color: "var(--ui-color-danger)" },
  ]),
);

/** The CodeMirror editor; load it through ``CodeEditor`` so the library stays out of the main bundle. */
export default function CodeMirrorEditor({
  value,
  onChange,
  language = "python",
  minHeight = "160px",
  readOnly,
  ariaLabel,
}: CodeEditorProps) {
  const extensions = useMemo(() => {
    const base = [tokens, highlight, EditorView.lineWrapping, EditorView.contentAttributes.of({ "aria-label": ariaLabel ?? i18n.t("common.code") })];
    if (language === "python") return [...base, python()];
    if (language === "json") return [...base, json()];
    return base;
  }, [language, ariaLabel]);
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme="none"
      readOnly={readOnly}
      editable={!readOnly}
      minHeight={minHeight}
      basicSetup={{ foldGutter: false, highlightActiveLine: !readOnly, autocompletion: false }}
    />
  );
}
