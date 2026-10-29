import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { ChatMessage, Conversation, DocSource, Handover, ReplyEvent, Usage } from "../api/types";

/** Apply one live event of an answer to the message. */
export function applyReplyEvent(message: ChatMessage, event: ReplyEvent): ChatMessage {
  switch (event.type) {
    case "delta":
      return { ...message, content: message.content + event.text };
    case "step":
      return {
        ...message,
        steps: [...message.steps, { kind: event.data.kind as ChatMessage["steps"][number]["kind"], detail: String(event.data.detail ?? ""), at: new Date().toISOString() }],
      };
    case "source":
      return { ...message, sources: [...message.sources, event.data as unknown as DocSource] };
    case "handover":
      return { ...message, handovers: [...message.handovers, event.data as unknown as Handover] };
    case "usage":
      return { ...message, usage: event.data.usage as Usage, estimated: Boolean(event.data.estimated) };
    case "finished":
      return (event.data.message as ChatMessage | undefined) ?? message;
    default:
      return message;
  }
}

/** Follow an answer while it is written (Server-Sent Events); null when nothing streams. */
function useReplyStream(conversationId: string | null, messageId: string | null): ChatMessage | null {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<ChatMessage | null>(null);
  useEffect(() => {
    setMessage(null);
    if (!conversationId || !messageId) return;
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: keys.conversation(conversationId) });
      void queryClient.invalidateQueries({ queryKey: keys.conversations });
    };
    if (typeof EventSource === "undefined") {
      const timer = window.setInterval(refresh, 700);
      return () => window.clearInterval(timer);
    }
    const source = new EventSource(api.messageEventsUrl(conversationId, messageId));
    source.addEventListener("snapshot", (event) => setMessage(JSON.parse((event as MessageEvent).data) as ChatMessage));
    source.addEventListener("event", (event) => {
      const reply = JSON.parse((event as MessageEvent).data) as ReplyEvent;
      setMessage((current) => (current ? applyReplyEvent(current, reply) : current));
    });
    source.addEventListener("end", () => {
      source.close();
      refresh();
    });
    return () => source.close();
  }, [conversationId, messageId, queryClient]);
  return message;
}

/** A conversation with its live answer merged in. */
export function useConversation(conversationId: string | null) {
  const query = useQuery({
    queryKey: keys.conversation(conversationId ?? ""),
    queryFn: () => api.conversation(conversationId ?? ""),
    enabled: Boolean(conversationId),
    // The states of attached objects (changed, deleted) are checked again from time to time.
    refetchInterval: (state) => (state.state.data?.streaming ? false : 10_000),
    retry: false,
  });
  const live = useReplyStream(conversationId, query.data?.streaming ?? null);
  const conversation = useMemo<Conversation | undefined>(() => {
    if (!query.data || !live) return query.data;
    return { ...query.data, history: query.data.history.map((message) => (message.id === live.id ? live : message)) };
  }, [query.data, live]);
  return { ...query, data: conversation };
}
