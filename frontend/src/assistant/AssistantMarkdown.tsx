import type { AnchorHTMLAttributes } from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import remarkGfm from "remark-gfm";

/** Links inside Nodestro (e.g. a documentation section) open in the app, the panel stays open. */
function ChatLink({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href?.startsWith("/") && !href.startsWith("//")) return <Link to={href}>{children}</Link>;
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" {...rest}>
      {children}
    </a>
  );
}

/** An answer of the assistant: Markdown with lists, tables and code blocks; no raw HTML. */
export function AssistantMarkdown({ text }: { text: string }) {
  return (
    <div className="markdown chat-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ChatLink }}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
