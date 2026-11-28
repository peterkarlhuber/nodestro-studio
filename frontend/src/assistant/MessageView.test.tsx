// The assistant's chat messages are the shared ChatMessage of @nodestro/ui-ai (ST-068 step 4), in the studio's look:
// a person's message as a bubble without an author line, an answer next to its avatar, busy while it is written, with
// the assistant's own step line instead of the package's "Writing…".

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import type { ChatMessage } from "../api/types";
import { PlatformHelp } from "../lib/platformHelp";
import { MessageView } from "./MessageView";

afterEach(cleanup);

function message(extra: Partial<ChatMessage>): ChatMessage {
  return {
    id: "msg_1",
    conversation_id: "chat_1",
    seq: 2,
    role: "assistant",
    content: "",
    status: "complete",
    error: null,
    context: [],
    files: [],
    sources: [],
    handovers: [],
    steps: [],
    usage: null,
    estimated: false,
    model: null,
    language: "de",
    reply_to: "msg_0",
    attempts: 1,
    created_at: "2026-10-28T10:00:00Z",
    finished_at: null,
    ...extra,
  } as ChatMessage;
}

function show(value: ChatMessage) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <PlatformHelp>
          <MessageView message={value} conversationId="chat_1" canRetry={false} onRetry={() => undefined} />
        </PlatformHelp>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("assistant messages", () => {
  it("show a person's message as a bubble, without an author line", () => {
    show(message({ role: "user", content: "Hallo" }));
    const item = screen.getByTestId("chat-user");
    expect(item).toHaveClass("ui-chat-message", "ui-chat-message--user", "chat-message--user");
    expect(item.tagName).toBe("ARTICLE");
    expect(item.querySelector("header")).toBeNull();
    expect(within(item).getByText("Hallo")).toHaveClass("chat-bubble");
  });

  it("show an answer next to its avatar, busy while it is written, with the assistant's step line", () => {
    show(message({ status: "streaming", content: "Ich", steps: [{ kind: "generate", detail: "" }] as ChatMessage["steps"] }));
    const item = screen.getByTestId("chat-assistant");
    expect(item).toHaveClass("ui-chat-message", "ui-chat-message--assistant", "ui-chat-message--avatar");
    expect(item).toHaveAttribute("aria-busy", "true");
    expect(item).toHaveAttribute("data-status", "streaming");
    expect(item.querySelector(".ui-chat-message__avatar")).toHaveAttribute("aria-hidden", "true");
    expect(within(item).getByTestId("assistant-status")).toBeInTheDocument();
    expect(within(item).queryByText("Schreibt …")).toBeNull();
    expect(within(item).queryByText(/Writing/)).toBeNull();
  });
});
