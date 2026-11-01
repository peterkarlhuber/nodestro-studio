// The live run chat of a run (LRC-1): the view from the API, kept current by its event stream, and sending.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { ChatMessageIn, ChatTarget, RunChatTargets, RunChatView, RunMessage } from "../api/types";
import { endedWithoutAccess } from "../editor/useRunStream";
import { hasPendingQuestion, withMessage, withTargets } from "./runChatModel";

/** How often the view is read again without an event stream (EventSource missing), while something can change. */
export const RUN_CHAT_POLL_MS = 2000;

const parse = <T,>(event: Event): T | null => {
  try {
    return JSON.parse((event as MessageEvent).data as string) as T;
  } catch {
    return null;
  }
};

/** Whether the view can still change: the run is active or a question waits for its answer. */
export function chatIsLive(view: RunChatView | null | undefined): boolean {
  return Boolean(view && (view.active || hasPendingQuestion(view)));
}

/** The chat view of a run, without following it (enough to know whether the run has team leaders). */
export function useRunChatView(runId: string, enabled = true) {
  return useQuery({
    queryKey: keys.runChat(runId),
    queryFn: () => api.runChat(runId),
    enabled: Boolean(runId) && enabled,
    retry: false,
    // Without an event stream the view is polled while it can change; otherwise the stream keeps it current.
    refetchInterval: (query) => (typeof EventSource === "undefined" && chatIsLive(query.state.data) ? RUN_CHAT_POLL_MS : false),
  });
}

/**
 * Follow the conversation: ``snapshot`` replaces the view (on every connect, so a reconnect reads it again),
 * ``message`` adds or updates one message, ``targets`` replaces the team leaders, ``end`` closes the stream.
 * The stream is opened only while the view can still change.
 */
export function useRunChatStream(runId: string, live: boolean) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!runId || !live || typeof EventSource === "undefined") return;
    const key = keys.runChat(runId);
    const update = (change: (view: RunChatView) => RunChatView) =>
      queryClient.setQueryData<RunChatView>(key, (view) => (view ? change(view) : view));
    const source = new EventSource(api.runChatEventsUrl(runId));
    source.addEventListener("snapshot", (event) => {
      const view = parse<RunChatView>(event);
      if (view) queryClient.setQueryData(key, view);
    });
    source.addEventListener("message", (event) => {
      const message = parse<RunMessage>(event);
      if (!message) return;
      update((view) => withMessage(view, message));
      // An answer used chat budget and a question: the remaining budget and questions are read again.
      if (message.kind === "answer") void queryClient.invalidateQueries({ queryKey: key });
    });
    source.addEventListener("targets", (event) => {
      // {targets, run_status, active}; a bare list is taken as well.
      const data = parse<RunChatTargets | ChatTarget[]>(event);
      if (Array.isArray(data)) update((view) => withTargets(view, data));
      else if (data && Array.isArray(data.targets)) update((view) => withTargets(view, data.targets, data));
    });
    source.addEventListener("end", (event) => {
      source.close();
      // {status} when the run ended; {reason: "access_ended"} when the session is gone: the sign-in is checked again.
      if (endedWithoutAccess((event as MessageEvent).data)) void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      void queryClient.invalidateQueries({ queryKey: key });
    });
    source.onerror = () => {
      // The browser reconnects by itself and gets a new snapshot; a stream it gave up is replaced by a fresh read.
      if (source.readyState === EventSource.CLOSED) void queryClient.invalidateQueries({ queryKey: key });
    };
    return () => source.close();
  }, [runId, live, queryClient]);
}

/** The chat view, followed live, and a mutation that sends a message (idempotent through ``client_id``). */
export function useRunChat(runId: string) {
  const queryClient = useQueryClient();
  const view = useRunChatView(runId);
  useRunChatStream(runId, chatIsLive(view.data));
  const send = useMutation({
    mutationFn: (body: ChatMessageIn) => api.sendRunChatMessage(runId, body),
    onSuccess: (message) => {
      queryClient.setQueryData<RunChatView>(keys.runChat(runId), (current) => (current ? withMessage(current, message) : current));
      // What is left (questions, messages) changed; the events carry only messages.
      void queryClient.invalidateQueries({ queryKey: keys.runChat(runId) });
    },
  });
  return { view, send };
}
