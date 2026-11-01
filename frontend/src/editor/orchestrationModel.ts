// The structure of an orchestrator's run (ED-26): its rounds (one decision each), the team runs every decision
// started, and the limits it used. Built only from the stored record and the run ids the API returns; nothing is
// guessed: a team run without a reference stays without a link.

import type {
  NodeRun,
  OrchestrationDecision,
  OrchestrationOutcome,
  OrchestrationOutcomeStatus,
  OrchestrationRecord,
  OrchestrationStep,
  OrchestratorConfig,
  Run,
} from "../api/types";

/** The teams of a decision, in order (one for ``delegate``, several for ``parallel``). */
export function assignmentsOf(decision: OrchestrationDecision | null | undefined) {
  if (!decision) return [];
  if (decision.action === "parallel") return decision.assignments ?? [];
  if (decision.action === "delegate") return [{ member: decision.member ?? "", task: decision.task ?? "", values: decision.values }];
  return [];
}

/** Whether the orchestrator acted on this decision (a refused or unreadable answer started nothing). */
export function accepted(step: OrchestrationStep): boolean {
  return step.decision !== null && step.verdict.code === null;
}

/** One run of a team that the orchestrator started. */
export interface TeamRun {
  /** The decision (round) that started it, from 0. */
  round: number;
  /** Its place in a parallel decision, from 0. */
  slot: number;
  member: string;
  task: string;
  values?: Record<string, unknown>;
  /** How it ended as the orchestrator recorded it; null while it still runs. */
  outcome: OrchestrationOutcome | null;
  /** The team's own run, when known. */
  ref: string | null;
  /** Part of the decision that waits until all its teams ended (e.g. for an approval). */
  pending: boolean;
}

/**
 * Every team run of the orchestrator, in the order the decisions started them: accepted delegations, the waiting
 * decision, and runs the API lists but the record does not have yet (a decision whose teams still run). Outcomes
 * carry the run (protocol version 2); records without it get the listed runs in order.
 */
export function teamRunsOf(record: OrchestrationRecord, childRunIds: string[] = []): TeamRun[] {
  const entries: TeamRun[] = [];
  const add = (round: number, decision: OrchestrationDecision, outcomes: OrchestrationOutcome[], pending: boolean) => {
    assignmentsOf(decision).forEach((item, slot) => {
      const outcome = outcomes[slot] ?? null;
      entries.push({ round, slot, member: item.member, task: item.task, values: item.values, outcome, ref: outcome?.ref ?? null, pending });
    });
  };
  for (const step of record.steps) {
    if (!accepted(step) || !step.decision) continue;
    let outcomes = step.outcomes ?? [];
    // Version 1 records keep a delegation's end on the step itself.
    if (!outcomes.length && step.decision.action === "delegate" && (step.result !== null || step.error !== null))
      outcomes = [{ member: step.decision.member ?? "", status: step.error ? "failed" : "succeeded", result: step.result, error: step.error, ref: null }];
    add(step.index, step.decision, outcomes, false);
  }
  if (record.pending) add(record.pending.index, record.pending.decision, record.pending.outcomes, true);
  // Version 1 records name no run: the listed runs belong to the delegations in order.
  const known = new Set(entries.map((entry) => entry.ref).filter(Boolean));
  const unclaimed = childRunIds.filter((id) => !known.has(id));
  for (const entry of entries) {
    if (entry.ref || !unclaimed.length) continue;
    if (entry.outcome || record.version < 2) entry.ref = unclaimed.shift() ?? null;
  }
  // Runs that the record does not know yet: the teams of the decision that runs right now.
  const round = record.steps.length;
  unclaimed.forEach((ref, slot) => entries.push({ round, slot, member: "", task: "", outcome: null, ref, pending: false }));
  return entries;
}

/** The team run of every accepted ``delegate`` decision, by round (kept for older callers and tests). */
export function childRuns(record: OrchestrationRecord, childRunIds: string[]): Map<number, string> {
  const result = new Map<number, string>();
  for (const entry of teamRunsOf({ ...record, pending: null }, childRunIds)) {
    const step = record.steps.find((item) => item.index === entry.round);
    if (step?.decision?.action === "delegate" && entry.ref) result.set(entry.round, entry.ref);
  }
  return result;
}

export type TeamRunState = OrchestrationOutcomeStatus | "running";

/** The label of each team run state (the outcome labels of the orchestrator, plus "running"). */
export const STATE_KEY: Record<TeamRunState, string> = {
  running: "orchestration.run.state.running",
  waiting: "flow.orchestrator.run.outcome.waiting",
  succeeded: "flow.orchestrator.run.outcome.succeeded",
  failed: "flow.orchestrator.run.outcome.failed",
  rejected: "flow.orchestrator.run.outcome.rejected",
  expired: "flow.orchestrator.run.outcome.expired",
  cancelled: "flow.orchestrator.run.outcome.cancelled",
};

/** How many team runs ended how ("running" for those without an outcome yet), in a fixed order. */
export function teamRunCounts(runs: TeamRun[]): [TeamRunState, number][] {
  const order: TeamRunState[] = ["running", "waiting", "succeeded", "failed", "rejected", "expired", "cancelled"];
  const counts = new Map<TeamRunState, number>();
  for (const run of runs) {
    const state: TeamRunState = run.outcome?.status ?? "running";
    counts.set(state, (counts.get(state) ?? 0) + 1);
  }
  return order.filter((state) => counts.has(state)).map((state) => [state, counts.get(state)!]);
}

/** A round of the run view: one decision, or several refused answers in a row shown as one group. */
export type Round = { kind: "step"; step: OrchestrationStep } | { kind: "refused"; steps: OrchestrationStep[] };

/** The decisions as rounds; two or more refused answers in a row become one group (they started nothing). */
export function roundsOf(steps: OrchestrationStep[]): Round[] {
  const rounds: Round[] = [];
  let group: OrchestrationStep[] = [];
  const flush = () => {
    if (group.length > 1) rounds.push({ kind: "refused", steps: group });
    else if (group.length === 1) rounds.push({ kind: "step", step: group[0] });
    group = [];
  };
  for (const step of steps) {
    if (accepted(step)) {
      flush();
      rounds.push({ kind: "step", step });
    } else group.push(step);
  }
  flush();
  return rounds;
}

export interface LimitUse {
  decisions: number;
  maxDecisions: number;
  /** The team chosen most often and how often (accepted decisions only). */
  busiest: { member: string; count: number } | null;
  maxPerMember: number | null;
  /** The most teams one decision started. */
  widest: number;
  maxParallel: number;
}

/** The orchestrator's limits and how much of each the run used. */
export function limitUse(config: OrchestratorConfig, record: OrchestrationRecord): LimitUse {
  const perMember = new Map<string, number>();
  let widest = 0;
  const decisions = [...record.steps.map((step) => (accepted(step) ? step.decision : null)), record.pending?.decision ?? null];
  for (const decision of decisions) {
    const items = assignmentsOf(decision);
    widest = Math.max(widest, items.length);
    for (const item of items) perMember.set(item.member, (perMember.get(item.member) ?? 0) + 1);
  }
  let busiest: LimitUse["busiest"] = null;
  for (const [member, count] of perMember) if (!busiest || count > busiest.count) busiest = { member, count };
  return {
    // The waiting decision already counts: the orchestrator made it.
    decisions: record.steps.length + (record.pending ? 1 : 0),
    maxDecisions: config.max_decisions,
    busiest,
    maxPerMember: config.max_per_member ?? null,
    widest,
    maxParallel: config.max_parallel ?? 1,
  };
}

/**
 * The team runs a run started further down (teams of its own orchestrators and its sub-workflows); used to show
 * that a team itself works with teams.
 */
export function nestedRunCount(run: Pick<Run, "nodes">): number {
  let count = 0;
  for (const state of Object.values(run.nodes) as NodeRun[]) {
    count += state.child_run_ids?.length ?? 0;
    if (state.child_run_id) count += 1;
  }
  return count;
}

/** The orchestrator steps of a run that have a record, for the run summary. */
export function orchestrationsOf(run: Pick<Run, "nodes" | "workflow">): { nodeId: string; label: string; record: OrchestrationRecord; runs: TeamRun[] }[] {
  return run.workflow.nodes
    .filter((node) => node.type === "orchestrator" && run.nodes[node.id]?.orchestration)
    .map((node) => {
      const state = run.nodes[node.id];
      const record = state.orchestration!;
      return { nodeId: node.id, label: node.label || node.id, record, runs: teamRunsOf(record, state.child_run_ids ?? []) };
    });
}
