import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import type { Components } from "react-markdown";

import { outputText } from "../lib/format";

// The Markdown parser (about 165 kB) loads with the first formatted text shown, not with every page.
const MarkdownRenderer = lazy(() => import("./MarkdownRenderer"));

/**
 * Markdown text. Until the parser has loaded, the text is shown as it is (line breaks kept), so the
 * content is there at once and no spinner blinks.
 */
export function MarkdownText({ text, components }: { text: string; components?: Components }) {
  return (
    <Suspense fallback={<p className="markdown-pending">{text}</p>}>
      <MarkdownRenderer text={text} components={components} />
    </Suspense>
  );
}

/** Agent output: Markdown for text, formatted JSON for structured results. */
export function Output({ value }: { value: unknown }) {
  const { t } = useTranslation();
  if (value === null || value === undefined || value === "") return <p className="muted">{t("runs.noOutputYet")}</p>;
  if (typeof value !== "string") return <pre className="code-block">{outputText(value)}</pre>;
  return (
    <div className="markdown">
      <MarkdownText text={value} />
    </div>
  );
}
