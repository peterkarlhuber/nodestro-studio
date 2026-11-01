import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/** Markdown with GitHub extensions; load it through ``MarkdownText`` so the parser stays out of the main bundle. */
export default function MarkdownRenderer({ text, components }: { text: string; components?: Components }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {text}
    </ReactMarkdown>
  );
}
