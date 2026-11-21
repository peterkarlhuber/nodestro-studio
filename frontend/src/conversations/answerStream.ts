// The live view of one answer while its run writes it: the run's events (the API forwards them unchanged) on top of
// the stored message. The stored message stays the truth; the live part only shows what arrived since it was read.

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { conversationKeys, conversationsApi, type ConversationMessage, FINAL_STATUSES } from "../api/conversations";
import { keys } from "../api/hooks";
import type { RunEvent, Usage } from "../api/types";

/** The step of an answer's run that writes it (runtime ``conversations.AGENT_NODE``). */
export const AGENT_NODE = "agent";

export interface LiveCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result: string | null;
  is_error: boolean;
  /** The call waits for a person (per-call approval). */
  waiting: boolean;
  finished: boolean;
}

export interface LiveAnswer {
  text: string;
  calls: LiveCall[];
  usage: Usage | null;
  /** The stream ended (the run stopped, paused, or the conversation is gone). */
  ended: boolean;
}

export const EMPTY_LIVE: LiveAnswer = { text: "", calls: [], usage: null, ended: false };

/** The live answer after one event of its run; events of other steps (and unknown ones) change nothing. */
export function applyAnswerEvent(live: LiveAnswer, event: Pick<RunEvent, "type" | "node_id" | "data">): LiveAnswer {
  if (event.node_id !== AGENT_NODE) return live;
  const data = event.data ?? {};
  const id = String(data.id ?? "");
  switch (event.type) {
    case "text":
      return { ...live, text: live.text + String(data.delta ?? "") };
    case "tool_started": {
      const known = live.calls.find((call) => call.id === id);
      const call: LiveCall = {
        id,
        name: String(data.name ?? known?.name ?? ""),
        arguments: (data.input as Record<string, unknown> | undefined) ?? known?.arguments ?? {},
        result: null,
        is_error: false,
        waiting: false,
        finished: false,
      };
      return { ...live, calls: known ? live.calls.map((item) => (item.id === id ? call : item)) : [...live.calls, call] };
    }
    case "tool_approval_requested": {
      const known = live.calls.find((call) => call.id === id);
      if (known) return { ...live, calls: live.calls.map((item) => (item.id === id ? { ...item, waiting: true } : item)) };
      const call: LiveCall = { id, name: String(data.name ?? ""), arguments: {}, result: null, is_error: false, waiting: true, finished: false };
      return { ...live, calls: [...live.calls, call] };
    }
    case "tool_approval_decided":
      return { ...live, calls: live.calls.map((item) => (item.id === id ? { ...item, waiting: false } : item)) };
    case "tool_finished":
      return {
        ...live,
        calls: live.calls.map((item) =>
          item.id === id ? { ...item, result: String(data.output ?? ""), is_error: Boolean(data.is_error), finished: true, waiting: false } : item,
        ),
      };
    case "usage":
      return { ...live, usage: (data.usage as Usage | undefined) ?? live.usage };
    default:
      return live;
  }
}

/** Events after which the open tool approvals change: their list is read again at once. */
const APPROVAL_EVENTS = new Set(["tool_approval_requested", "tool_approval_decided"]);

/**
 * Follow the events of an answer that is not final yet. Returns what arrived live; once the stream ends, the
 * conversation is read again (the stored message then has the whole answer).
 */
export function useAnswerStream(conversationId: string, message: ConversationMessage | null): LiveAnswer {
  const queryClient = useQueryClient();
  const [live, setLive] = useState<LiveAnswer>(EMPTY_LIVE);
  const messageId = message && message.role === "assistant" && !FINAL_STATUSES.has(message.status) && message.run_id ? message.id : null;
  useEffect(() => {
    setLive(EMPTY_LIVE);
    if (!messageId || typeof EventSource === "undefined") return;
    const source = new EventSource(conversationsApi.eventsUrl(conversationId, messageId));
    source.addEventListener("snapshot", () => setLive(EMPTY_LIVE));
    source.addEventListener("event", (raw) => {
      const event = JSON.parse((raw as MessageEvent).data as string) as RunEvent;
      setLive((current) => applyAnswerEvent(current, event));
      if (APPROVAL_EVENTS.has(event.type)) void queryClient.invalidateQueries({ queryKey: keys.toolApprovals });
    });
    source.addEventListener("end", () => {
      source.close();
      setLive((current) => ({ ...current, ended: true }));
      void queryClient.invalidateQueries({ queryKey: conversationKeys.one(conversationId) });
      void queryClient.invalidateQueries({ queryKey: conversationKeys.list });
    });
    source.onerror = () => {
      // The browser reconnects by itself; an ended answer sends "end" and closes.
    };
    return () => source.close();
  }, [conversationId, messageId, queryClient]);
  return live;
}
