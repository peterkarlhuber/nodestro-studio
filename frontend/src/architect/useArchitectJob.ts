import { useEffect, useState } from "react";

import { api } from "../api/client";
import type { ArchitectEvent, ArchitectJob } from "../api/types";
import { applyArchitectEvent } from "./progress";

/** Follow a Workflow Architect job via its Server-Sent Events; the full job is fetched at the end. */
export function useArchitectJob(jobId: string | null, initial: ArchitectJob | null = null) {
  const [job, setJob] = useState<ArchitectJob | null>(initial);
  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }
    let closed = false;
    const refresh = () =>
      api
        .architectJob(jobId)
        .then((full) => !closed && setJob(full))
        .catch(() => undefined);
    if (typeof EventSource === "undefined") {
      // Without SSE (very old browsers) the job is polled.
      const timer = window.setInterval(() => void refresh(), 800);
      void refresh();
      return () => {
        closed = true;
        window.clearInterval(timer);
      };
    }
    const source = new EventSource(`/api/architect/jobs/${jobId}/events`);
    source.addEventListener("snapshot", (message) => setJob(JSON.parse((message as MessageEvent).data) as ArchitectJob));
    source.addEventListener("event", (message) => {
      const event = JSON.parse((message as MessageEvent).data) as ArchitectEvent;
      setJob((current) => (current ? applyArchitectEvent(current, event) : current));
    });
    source.addEventListener("end", () => {
      source.close();
      void refresh();
    });
    source.onerror = () => {
      // The browser reconnects by itself; the snapshot brings the job up to date again.
    };
    return () => {
      closed = true;
      source.close();
    };
  }, [jobId]);
  return [job, setJob] as const;
}
