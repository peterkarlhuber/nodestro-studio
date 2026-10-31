// Comparing models in a test series (Q-2): which agents a run gave another model, in words.

import type { BenchmarkRun, Workflow, WorkflowNode } from "../api/types";

/** The agent nodes of a workflow whose model a test run can replace. */
export const agentNodes = (workflow: Workflow | undefined): WorkflowNode[] =>
  (workflow?.nodes ?? []).filter((node) => node.type === "agent" && node.agent !== null);

export const nodeName = (node: WorkflowNode | undefined, id: string) => node?.label || node?.agent?.name || id;

/** "Research: anthropic:claude-haiku-4-5, …" for a run with other models; empty for the saved version. */
export function modelChanges(run: BenchmarkRun, workflow: Workflow | undefined): string {
  const nodes = new Map((workflow?.nodes ?? []).map((node) => [node.id, node]));
  return Object.entries(run.models ?? {})
    .map(([id, model]) => `${nodeName(nodes.get(id), id)}: ${model}`)
    .join(", ");
}

/** Only the models that differ from the saved ones: the request names what changes. */
export function changedModels(chosen: Record<string, string>, nodes: WorkflowNode[]): Record<string, string> {
  const saved = new Map(nodes.map((node) => [node.id, node.agent?.model ?? ""]));
  return Object.fromEntries(Object.entries(chosen).filter(([id, model]) => saved.has(id) && model.trim() && model !== saved.get(id)));
}
