import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo } from "react";

import i18n from "../i18n";

// The editor takes its colours from the Midnight Citron tokens, so it follows the theme.
const tokens = EditorView.theme({
  "&": {
    color: "var(--nd-text)",
    backgroundColor: "var(--nd-surface)",
    fontSize: "12.5px",
    border: "1px solid var(--nd-border)",
    borderRadius: "var(--nd-radius-sm)",
  },
  "&.cm-focused": { outline: "2px solid var(--nd-focus)", outlineOffset: "2px" },
  ".cm-content": { fontFamily: "var(--nd-mono)", caretColor: "var(--nd-brand)" },
  ".cm-gutters": {
    backgroundColor: "var(--nd-surface-raised)",
    color: "var(--nd-text-subtle)",
    border: "none",
    borderRight: "1px solid var(--nd-border)",
  },
  ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "color-mix(in srgb, var(--nd-brand) 7%, transparent)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "color-mix(in srgb, var(--nd-brand) 28%, transparent) !important",
  },
  ".cm-cursor": { borderLeftColor: "var(--nd-brand)" },
});

// Syntax colours from the status roles, readable in both themes.
const highlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: [tags.keyword, tags.controlKeyword, tags.moduleKeyword, tags.operatorKeyword], color: "var(--nd-running)" },
    { tag: [tags.function(tags.variableName), tags.function(tags.definition(tags.variableName))], color: "var(--nd-brand)" },
    { tag: [tags.definition(tags.variableName), tags.className], color: "var(--nd-brand)" },
    { tag: [tags.string, tags.special(tags.string)], color: "var(--nd-success)" },
    { tag: [tags.number, tags.bool, tags.null, tags.atom], color: "var(--nd-warning)" },
    { tag: [tags.comment, tags.docString], color: "var(--nd-text-subtle)", fontStyle: "italic" },
    { tag: [tags.propertyName], color: "var(--nd-running)" },
    { tag: [tags.invalid], color: "var(--nd-danger)" },
  ]),
);

export function CodeEditor({
  value,
  onChange,
  language = "python",
  minHeight = "160px",
  readOnly,
  ariaLabel,
}: {
  value: string;
  onChange?: (value: string) => void;
  language?: "python" | "json" | "text";
  minHeight?: string;
  readOnly?: boolean;
  ariaLabel?: string;
}) {
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
