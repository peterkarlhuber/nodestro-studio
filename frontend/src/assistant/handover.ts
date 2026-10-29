// Handovers: the assistant proposes, the user opens an existing function with the proposal and
// decides there (Workflow Architect, Agent Architect, tool generation). Nothing starts by itself:
// the target only fills in its form.

import { useEffect } from "react";

import type { Handover } from "../api/types";
import { useAssistant } from "./store";

/** Where a handover is opened. */
export function handoverPath(handover: Handover): string {
  if (handover.target === "tool_builder") return "/tools?tab=generate";
  if (handover.target === "workflow_architect" && handover.mode === "create") return "/";
  if (handover.workflow_id) return `/workflows/${handover.workflow_id}`;
  return "/";
}

/** A view takes a handover meant for it, once it is ready (``accept`` decides). */
export function useTakeHandover(accept: (handover: Handover) => boolean, take: (handover: Handover) => void): void {
  const handover = useAssistant((state) => state.handover);
  useEffect(() => {
    if (!handover) return;
    const taken = useAssistant.getState().takeHandover(accept);
    if (taken) take(taken);
  });
}
