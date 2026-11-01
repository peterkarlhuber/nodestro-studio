import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { CodeEditor } from "./CodeEditor";
import { MarkdownText, Output } from "./Markdown";

// CodeMirror and the Markdown parser load on first use; until then the text is already on screen.
describe("lazily loaded views", () => {
  beforeAll(() => {
    // jsdom has no layout; CodeMirror measures text ranges.
    Range.prototype.getClientRects ??= () => [] as unknown as DOMRectList;
    Range.prototype.getBoundingClientRect ??= () => new DOMRect();
  });
  afterEach(cleanup);

  it("shows the code at once and then the CodeMirror editor", async () => {
    const { container } = render(<CodeEditor value={"def run(text):\n    return text"} ariaLabel="Code" />);
    const placeholder = container.querySelector(".code-editor-placeholder");
    expect(placeholder).toHaveTextContent("def run(text): return text");
    expect(placeholder).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByRole("textbox", { name: "Code" })).toHaveClass("cm-content");
    expect(container.querySelector(".code-editor-placeholder")).toBeNull();
  });

  it("shows Markdown as plain text at once and then formatted", async () => {
    const { container } = render(<MarkdownText text={"## Result\n\n**done**"} />);
    expect(container.querySelector(".markdown-pending")).toHaveTextContent("## Result **done**");
    expect(await screen.findByRole("heading", { name: "Result" })).toBeInTheDocument();
    expect(container.querySelector("strong")).toHaveTextContent("done");
    expect(container.querySelector(".markdown-pending")).toBeNull();
  });

  it("formats structured output without the Markdown parser", () => {
    const { container } = render(<Output value={{ answer: 42 }} />);
    expect(container.querySelector("pre.code-block")).toHaveTextContent('"answer": 42');
  });
});
