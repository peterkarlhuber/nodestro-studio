import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { Run, RunEvent } from "../api/types";
import { useEditor } from "./store";

/** Events after which the open tool approvals change: the list (and its card) is read again at once. */
const TOOL_APPROVAL_EVENTS = new Set(["tool_approval_requested", "tool_approval_decided"]);

/** How often a paused run is read again, and how often right after someone decided one of its approvals. */
export const PAUSED_POLL_MS = 3000;
export const NUDGED_POLL_MS = 500;
/** How long the quick reading lasts after a decision. */
export const NUDGE_WINDOW_MS = 10_000;

/**
 * Whether a stream's ``end`` event says that access ended (``{"reason": "access_ended"}``: the session or the
 * membership is gone) rather than that the run stopped. A normal end carries a status or nothing at all.
 */
export function endedWithoutAccess(data: unknown): boolean {
  if (typeof data !== "string" || !data) return false;
  try {
    const parsed = JSON.parse(data) as { reason?: unknown; status?: unknown };
    return Boolean(parsed && typeof parsed === "object" && parsed.reason && !parsed.status);
  } catch {
    return false;
  }
}

/** Follow a run's Server-Sent Events and keep the editor's run state current. */
export function useRunStream(runId: string | null) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!runId || typeof EventSource === "undefined") return;
    const { setRun, applyEvent } = useEditor.getState();
    const source = new EventSource(`/api/runs/${runId}/events`);
    source.addEventListener("snapshot", (message) => setRun(JSON.parse((message as MessageEvent).data) as Run));
    source.addEventListener("event", (message) => {
      const event = JSON.parse((message as MessageEvent).data) as RunEvent;
      applyEvent(event);
      if (TOOL_APPROVAL_EVENTS.has(event.type)) void queryClient.invalidateQueries({ queryKey: keys.toolApprovals });
    });
    source.addEventListener("end", (message) => {
      source.close();
      if (endedWithoutAccess((message as MessageEvent).data)) {
        // The session or membership is gone, not the run: keep what is shown, read nothing as final, and let the
        // sign-in state be checked again.
        void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        return;
      }
      api
        .run(runId)
        .then((run) => {
          if (useEditor.getState().run?.id === run.id) setRun(run);
        })
        .catch(() => undefined);
      void queryClient.invalidateQueries({ queryKey: ["runs"] });
      void queryClient.invalidateQueries({ queryKey: ["workflows"] });
    });
    source.onerror = () => {
      // The browser reconnects by itself; a finished run sends "end" and closes.
    };
    return () => source.close();
  }, [runId, queryClient]);
}

/**
 * Keep the editor's run current in every state: the event stream while it runs, and while it is paused a fresh
 * copy from the server, at once when it pauses (the events do not carry everything, e.g. the usage of teams) and
 * then regularly, quickly right after a decision. An approval decided anywhere (here, on the approvals page, in
 * another tab or over the API) therefore shows here, and once the run continues the stream takes over again.
 * Only what the server reports is shown; nothing is assumed about progress.
 */
export function useFollowRun(run: Pick<Run, "id" | "status"> | null) {
  const queryClient = useQueryClient();
  const id = run?.id ?? null;
  const status = run?.status ?? null;
  const live = status === "running" || status === "queued";
  useRunStream(live ? id : null);
  const nudge = useEditor((state) => state.runNudge);
  useEffect(() => {
    if (!id || status !== "paused") return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const nudgedAt = nudge ? Date.now() : 0;
    let last = "";
    const read = async () => {
      try {
        const fresh = await api.run(id);
        if (stopped) return;
        // An unchanged copy is not set again, so the canvas does not render for nothing.
        const text = JSON.stringify(fresh);
        if (text !== last && useEditor.getState().run?.id === fresh.id) useEditor.getState().setRun(fresh);
        last = text;
        if (fresh.status !== "paused") {
          // It goes on (the stream follows) or it ended (its run lists change).
          void queryClient.invalidateQueries({ queryKey: ["runs"] });
          void queryClient.invalidateQueries({ queryKey: keys.approvals });
          return;
        }
      } catch {
        // A failed read is tried again with the next one.
      }
      if (stopped) return;
      const quick = nudgedAt && Date.now() - nudgedAt < NUDGE_WINDOW_MS;
      timer = setTimeout(() => void read(), quick ? NUDGED_POLL_MS : PAUSED_POLL_MS);
    };
    void read();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [id, status, nudge, queryClient]);
}
