// A short, deterministic account of what happened in a run (UX-6b): which branches the decisions took, how the
// approvals were decided, which tools were called and where the run failed. Built only from the stored run; nothing
// is asked of a model, and what the run did not record is reported as missing, never guessed.

import type { Run, WorkflowNode } from "../api/types";

export interface DecisionStep {
  nodeId: string;
  label: string;
  /** The branches taken; null when the decision ran but its outcome was not recorded. */
  branches: string[] | null;
}

export interface ApprovalStep {
  nodeId: string;
  label: string;
  /** null while it waits; "unknown" when it finished without a recorded decision. */
  decision: "approved" | "rejected" | "unknown" | null;
}

export interface ToolUse {
  name: string;
  calls: number;
  errors: number;
}

export interface RunSummary {
  /** Steps that succeeded, of all steps between start and result (agents, decisions, approvals, sub-workflows). */
  done: number;
  /** Steps on a branch that was not taken. */
  skipped: number;
  total: number;
  decisions: DecisionStep[];
  approvals: ApprovalStep[];
  tools: ToolUse[];
  /** The first step that failed, in the order the steps started. */
  failed: { nodeId: string; label: string } | null;
}

function label(node: WorkflowNode): string {
  return node.label || node.agent?.name || node.id;
}

/** The steps of the run in the order they started; steps that never started come last, in workflow order. */
export function stepsInOrder(run: Run): WorkflowNode[] {
  const steps = run.workflow.nodes.filter((node) => node.type !== "start" && node.type !== "output");
  // Compared as times, never as text: a locale-aware text comparison sorts punctuation before digits.
  const started = (node: WorkflowNode) => {
    const at = run.nodes[node.id]?.started_at;
    const time = at ? Date.parse(at) : Number.NaN;
    return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
  };
  // Array.prototype.sort is stable, so steps that started together and those that never started keep workflow order.
  return [...steps].sort((a, b) => {
    const first = started(a);
    const second = started(b);
    return first === second ? 0 : first < second ? -1 : 1;
  });
}

/**
 * The step a run's details open with: the one that failed, else the one that waits for a person, else the one
 * that runs, else the first that started.
 */
export function initialStep(run: Run): WorkflowNode | undefined {
  const steps = stepsInOrder(run);
  const withStatus = (...statuses: string[]) => steps.find((node) => statuses.includes(run.nodes[node.id]?.status ?? ""));
  return withStatus("failed") ?? withStatus("awaiting_approval") ?? withStatus("running") ?? steps[0];
}

/** The steps that failed, in the order they started. */
export function failedSteps(run: Run): WorkflowNode[] {
  return stepsInOrder(run).filter((node) => run.nodes[node.id]?.status === "failed");
}

export function summarizeRun(run: Run): RunSummary {
  const steps = stepsInOrder(run);
  const decisions: DecisionStep[] = [];
  const approvals: ApprovalStep[] = [];
  const tools = new Map<string, ToolUse>();
  let failed: RunSummary["failed"] = null;
  let done = 0;
  let skipped = 0;
  for (const node of steps) {
    const state = run.nodes[node.id];
    if (!state) continue;
    if (state.status === "succeeded") done += 1;
    if (state.status === "skipped") skipped += 1;
    if (state.status === "failed" && !failed) failed = { nodeId: node.id, label: label(node) };
    if (node.type === "condition" && state.status === "succeeded") {
      const labels = state.decision?.labels ?? [];
      decisions.push({ nodeId: node.id, label: label(node), branches: state.decision && labels.length ? labels : null });
    }
    if (node.type === "approval" && state.status !== "skipped" && state.status !== "blocked" && state.status !== "idle") {
      const decision =
        state.approval?.decision ?? (state.status === "awaiting_approval" || state.status === "waiting" ? null : "unknown");
      approvals.push({ nodeId: node.id, label: label(node), decision });
    }
    for (const call of state.tool_calls ?? []) {
      const entry = tools.get(call.name) ?? { name: call.name, calls: 0, errors: 0 };
      entry.calls += 1;
      if (call.is_error) entry.errors += 1;
      tools.set(call.name, entry);
    }
  }
  return {
    done,
    skipped,
    total: steps.length,
    decisions,
    approvals,
    tools: [...tools.values()].sort((a, b) => b.calls - a.calls || a.name.localeCompare(b.name)),
    failed,
  };
}
