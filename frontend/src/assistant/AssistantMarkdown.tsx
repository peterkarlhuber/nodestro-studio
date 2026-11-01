import type { AnchorHTMLAttributes } from "react";
import type { Components } from "react-markdown";
import { Link } from "react-router-dom";

import { MarkdownText } from "../components/Markdown";

/** Links inside Nodestro (e.g. a documentation section) open in the app, the panel stays open. */
function ChatLink({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href?.startsWith("/") && !href.startsWith("//")) return <Link to={href}>{children}</Link>;
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" {...rest}>
      {children}
    </a>
  );
}

const COMPONENTS: Components = { a: ChatLink };

/** An answer of the assistant: Markdown with lists, tables and code blocks; no raw HTML. */
export function AssistantMarkdown({ text }: { text: string }) {
  return (
    <div className="markdown chat-markdown">
      <MarkdownText text={text} components={COMPONENTS} />
    </div>
  );
}
