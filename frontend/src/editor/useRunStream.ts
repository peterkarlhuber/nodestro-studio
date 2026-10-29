import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { api } from "../api/client";
import type { Run, RunEvent } from "../api/types";
import { useEditor } from "./store";

/** Follow a run's Server-Sent Events and keep the editor's run state current. */
export function useRunStream(runId: string | null) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!runId || typeof EventSource === "undefined") return;
    const { setRun, applyEvent } = useEditor.getState();
    const source = new EventSource(`/api/runs/${runId}/events`);
    source.addEventListener("snapshot", (message) => setRun(JSON.parse((message as MessageEvent).data) as Run));
    source.addEventListener("event", (message) => applyEvent(JSON.parse((message as MessageEvent).data) as RunEvent));
    source.addEventListener("end", () => {
      source.close();
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
