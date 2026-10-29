// Two stored runs side by side: totals, the final result and every agent, with what differs.

import type { NodeRun, Run, RunStatus, Usage, WorkflowNode } from "../api/types";
import { asText } from "./diff";

export interface RunTotals {
  status: RunStatus;
  durationMs: number | null;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number | null;
  toolCalls: number;
  failedAgents: number;
  error: Run["error"];
}

export interface AgentSide {
  node: WorkflowNode;
  state: NodeRun | undefined;
  model: string;
  durationMs: number | null;
  tools: string[];
  output: string;
}

export interface AgentPair {
  key: string;
  label: string;
  a: AgentSide | null;
  b: AgentSide | null;
  /** Which aspects differ (model, status, output, tools, tokens, cost, error, evaluation). */
  differs: Set<string>;
}

export interface RunComparison {
  a: RunTotals;
  b: RunTotals;
  sameWorkflow: boolean;
  /** The workflow configuration (agents, prompts, connections) changed between the runs. */
  configChanged: boolean;
  outputA: string;
  outputB: string;
  agents: AgentPair[];
}

export function duration(from: string | null | undefined, to: string | null | undefined): number | null {
  if (!from || !to) return null;
  return Math.max(new Date(to).getTime() - new Date(from).getTime(), 0);
}

function sumUsage(usages: Usage[]): number | null {
  let total = 0;
  for (const usage of usages) {
    if (usage.estimated_cost_usd === null) return null;
    total += usage.estimated_cost_usd;
  }
  return total;
}

export function totals(run: Run): RunTotals {
  const states = Object.values(run.nodes);
  return {
    status: run.status,
    durationMs: duration(run.started_at ?? run.created_at, run.finished_at),
    requests: run.usage.requests,
    inputTokens: run.usage.input_tokens,
    outputTokens: run.usage.output_tokens,
    totalTokens: run.usage.total_tokens,
    cost: run.usage.requests ? run.usage.estimated_cost_usd : sumUsage(states.map((state) => state.usage)),
    toolCalls: states.reduce((sum, state) => sum + state.tool_calls.length, 0),
    failedAgents: run.workflow.nodes.filter((node) => node.type === "agent" && run.nodes[node.id]?.status === "failed").length,
    error: run.error,
  };
}

function side(run: Run, node: WorkflowNode): AgentSide {
  const state = run.nodes[node.id];
  return {
    node,
    state,
    model: node.agent?.model ?? "",
    durationMs: duration(state?.started_at, state?.finished_at),
    tools: (state?.tool_calls ?? []).map((call) => call.name),
    output: asText(state?.output),
  };
}

function configOf(run: Run): string {
  const { nodes, edges } = run.workflow;
  return JSON.stringify({ nodes: nodes.map(({ position: _position, ...rest }) => rest), edges });
}

function differences(a: AgentSide | null, b: AgentSide | null): Set<string> {
  const result = new Set<string>();
  if (!a || !b) return new Set(["presence"]);
  if (a.model !== b.model) result.add("model");
  if (a.state?.status !== b.state?.status) result.add("status");
  if (a.output !== b.output) result.add("output");
  if (a.tools.join() !== b.tools.join()) result.add("tools");
  if ((a.state?.usage.total_tokens ?? 0) !== (b.state?.usage.total_tokens ?? 0)) result.add("tokens");
  if ((a.state?.usage.estimated_cost_usd ?? 0) !== (b.state?.usage.estimated_cost_usd ?? 0)) result.add("cost");
  if ((a.state?.error ?? null) !== (b.state?.error ?? null)) result.add("error");
  const evaluation = (state: NodeRun | undefined) =>
    state?.evaluation ? `${state.evaluation.passed}:${state.evaluation.attempts}` : "";
  if (evaluation(a.state) !== evaluation(b.state)) result.add("evaluation");
  return result;
}

export function compareRuns(a: Run, b: Run): RunComparison {
  const agentsA = a.workflow.nodes.filter((node) => node.type === "agent");
  const agentsB = b.workflow.nodes.filter((node) => node.type === "agent");
  const sameWorkflow = a.workflow_id === b.workflow_id;
  // Agents are matched by node id within one workflow, otherwise by name.
  const keyOf = (node: WorkflowNode) => (sameWorkflow ? node.id : (node.label || node.agent?.name || node.id).toLowerCase());
  const pairs = new Map<string, AgentPair>();
  for (const node of agentsA)
    pairs.set(keyOf(node), { key: keyOf(node), label: node.label, a: side(a, node), b: null, differs: new Set() });
  for (const node of agentsB) {
    const key = keyOf(node);
    const pair = pairs.get(key);
    if (pair) pair.b = side(b, node);
    else pairs.set(key, { key, label: node.label, a: null, b: side(b, node), differs: new Set() });
  }
  for (const pair of pairs.values()) pair.differs = differences(pair.a, pair.b);
  return {
    a: totals(a),
    b: totals(b),
    sameWorkflow,
    configChanged: configOf(a) !== configOf(b),
    outputA: asText(a.output),
    outputB: asText(b.output),
    agents: [...pairs.values()],
  };
}
