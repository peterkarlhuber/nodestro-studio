// Branch helpers of decision and approval nodes, free of the canvas library, so run views can use them
// without loading @xyflow/react.

import type { NodeRun, WorkflowNode } from "../api/types";

/** Whether a run went along this branch of a decision or approval node. */
export function isBranchTaken(state: NodeRun | undefined, handle: string): boolean {
  if (!state) return false;
  if (state.decision) return state.decision.branches.includes(handle);
  if (state.approval) return state.approval.decision === handle;
  return false;
}

/** The label of a branch of a decision or approval node, as shown on the node and on its connections. */
export function branchLabel(
  node: WorkflowNode,
  handle: string | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (!handle) return "";
  if (node.type === "approval") return handle === "rejected" ? t("editor.approval.rejected") : t("editor.approval.approved");
  if (node.type !== "condition") return "";
  if (handle === "default") return node.condition?.default_label || t("editor.condition.otherwise");
  const index = node.condition?.rules.findIndex((rule) => rule.id === handle) ?? -1;
  if (index < 0) return handle;
  return node.condition?.rules[index].label || t("editor.condition.branchN", { n: index + 1 });
}
