// The state of a Workflow Architect job as its events arrive: the current step, the activity
// log, the growing graph and the cost so far. Everything comes from the backend's events; the
// interface adds no progress of its own.

import type { ArchitectEvent, ArchitectJob, ArchitectMark, ArchitectPhase, ArchitectStatus, WorkflowIn, WorkflowNode } from "../api/types";

export interface ArchitectGraph {
  workflow: WorkflowIn;
  marks: Record<string, ArchitectMark>;
  /** Agents a revision removes (shown faded at their old place). */
  removed: WorkflowNode[];
}

/** One event applied to the job, without changing the original object. */
export function applyArchitectEvent(job: ArchitectJob, event: ArchitectEvent): ArchitectJob {
  if (job.id !== event.job_id || job.events.some((item) => item.seq === event.seq)) return job;
  const next: ArchitectJob = { ...job, events: [...job.events, event] };
  if (event.cost_usd !== null) next.usage = { ...next.usage, estimated_cost_usd: event.cost_usd };
  switch (event.type) {
    case "phase":
      next.phase = event.phase;
      break;
    case "graph":
      next.marks = (event.data.marks as Record<string, ArchitectMark>) ?? next.marks;
      break;
    case "usage":
      if (event.data.usage) next.usage = event.data.usage as ArchitectJob["usage"];
      break;
    case "finished":
      next.status = (event.data.status as ArchitectStatus) ?? next.status;
      break;
    default:
      break;
  }
  return next;
}

/** The latest graph the job reported, or the draft once it is ready. */
export function latestGraph(job: ArchitectJob | null): ArchitectGraph | null {
  if (!job) return null;
  for (let index = job.events.length - 1; index >= 0; index -= 1) {
    const event = job.events[index];
    if (event.type === "graph" && event.data.workflow) {
      return {
        workflow: event.data.workflow as WorkflowIn,
        marks: (event.data.marks as Record<string, ArchitectMark>) ?? {},
        removed: (event.data.removed as WorkflowNode[]) ?? [],
      };
    }
  }
  if (job.draft) return { workflow: job.draft, marks: job.marks, removed: [] };
  return null;
}

export type StepState = "done" | "active" | "todo" | "stopped";

/** Each step of the job as done, running, still to come, or where a stopped job ended. */
export function stepStates(job: ArchitectJob): { phase: ArchitectPhase; state: StepState }[] {
  const current = job.phase ? job.phases.indexOf(job.phase) : -1;
  const finished = job.status === "ready" || job.status === "accepted";
  return job.phases.map((phase, index) => {
    if (finished || index < current) return { phase, state: "done" };
    if (index === current) return { phase, state: job.status === "running" ? "active" : "stopped" };
    return { phase, state: "todo" };
  });
}

/** The log entries (messages), oldest first. */
export function logEntries(job: ArchitectJob | null): ArchitectEvent[] {
  return job ? job.events.filter((event) => event.type === "log") : [];
}

/** True while the job may still change. */
export function isRunning(job: ArchitectJob | null): boolean {
  return job?.status === "running";
}
