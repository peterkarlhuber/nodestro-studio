import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { outputText } from "../lib/format";

/** Agent output: Markdown for text, formatted JSON for structured results. */
export function Output({ value }: { value: unknown }) {
  const { t } = useTranslation();
  if (value === null || value === undefined || value === "") return <p className="muted">{t("runs.noOutputYet")}</p>;
  if (typeof value !== "string") return (
      // Focusable, so keyboard users can scroll long data (WCAG 2.1.1).
      <pre className="code-block" tabIndex={0}>
        {outputText(value)}
      </pre>
    );
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
    </div>
  );
}
