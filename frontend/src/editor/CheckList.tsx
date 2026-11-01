// The findings of the workflow check, each linked to the node or connection it concerns.

import { AlertTriangle, Info, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { CheckIssue, ConfigIssue, WorkflowCheck } from "../api/types";
import { ProblemText } from "../lib/errors";
import { useEditor } from "./store";

export interface Finding {
  key: string;
  level: CheckIssue["level"];
  item: CheckIssue | ConfigIssue;
  nodeId: string | null;
  edgeId: string | null;
}

/** Workflow problems and agent configuration problems in one list, errors first. */
export function findings(check: WorkflowCheck | undefined): Finding[] {
  if (!check) return [];
  const list: Finding[] = check.problems.map((item, index) => ({
    key: `p${index}`,
    level: item.level,
    item,
    nodeId: item.node_id,
    edgeId: item.edge_id,
  }));
  for (const [nodeId, issues] of Object.entries(check.agents))
    issues
      .filter((issue) => issue.level !== "info")
      .forEach((issue, index) =>
        list.push({ key: `${nodeId}:${index}`, level: issue.level, item: issue, nodeId, edgeId: null }),
      );
  const order = { error: 0, warning: 1, info: 2 };
  return list.sort((a, b) => order[a.level] - order[b.level]);
}

/** Check codes of a provider without settings: no node causes them, the fix is in Settings. */
export const PROVIDER_CODES: readonly string[] = ["check.api_key_missing", "check.provider_not_configured"];

/** What keeps a workflow from starting, for the reason next to the start button. */
export interface StartBlock {
  /** The first error (the one the reason names). */
  first: Finding;
  /** All errors. */
  count: number;
  /** A provider is missing: the fix is in Settings, and no node is ready to run. */
  provider: boolean;
}

export function startBlock(check: WorkflowCheck | undefined): StartBlock | null {
  if (!check || check.ok) return null;
  const errors = findings(check).filter((finding) => finding.level === "error");
  if (!errors.length) return null;
  const provider = errors.find((finding) => PROVIDER_CODES.includes(finding.item.code));
  return { first: provider ?? errors[0], count: errors.length, provider: Boolean(provider) };
}

/** Errors and warnings per node, for the badges on the canvas. */
export function countsByNode(check: WorkflowCheck | undefined): { errors: Record<string, number>; warnings: Record<string, number> } {
  const errors: Record<string, number> = {};
  const warnings: Record<string, number> = {};
  for (const finding of findings(check)) {
    if (!finding.nodeId || finding.edgeId) continue;
    if (finding.level === "error") errors[finding.nodeId] = (errors[finding.nodeId] ?? 0) + 1;
    else if (finding.level === "warning") warnings[finding.nodeId] = (warnings[finding.nodeId] ?? 0) + 1;
  }
  return { errors, warnings };
}

const ICONS = { error: XCircle, warning: AlertTriangle, info: Info };

export function CheckList({
  check,
  levels = ["error", "warning", "info"],
  nodeId,
}: {
  check: WorkflowCheck | undefined;
  levels?: Finding["level"][];
  /** Only the findings about this node. */
  nodeId?: string;
}) {
  const { t } = useTranslation();
  const nodes = useEditor((s) => s.nodes);
  const { select, selectEdge } = useEditor.getState();
  const shown = findings(check).filter(
    (finding) => levels.includes(finding.level) && (nodeId === undefined || finding.nodeId === nodeId),
  );
  if (!shown.length) return null;
  const label = (id: string | null) => (id ? nodes.find((node) => node.id === id)?.label || "" : "");
  return (
    <ul className="check-list">
      {shown.map((finding) => {
        const Icon = ICONS[finding.level];
        const target = finding.edgeId ? "edge" : finding.nodeId ? "node" : null;
        const name = label(finding.nodeId);
        const content = (
          <>
            <Icon size={13} aria-hidden className={`check-list__icon check-list__icon--${finding.level}`} />
            <span className="check-list__text">
              {name && target === "node" && !("node_id" in finding.item) ? <strong>{name}: </strong> : null}
              <ProblemText item={finding.item} compact />
            </span>
          </>
        );
        return (
          <li key={finding.key} data-level={finding.level}>
            {target ? (
              <button
                type="button"
                className="check-list__item"
                title={target === "edge" ? t("editor.check.showConnection") : t("editor.check.showNode", { name })}
                onClick={() => (finding.edgeId ? selectEdge(finding.edgeId) : select(finding.nodeId))}
              >
                {content}
              </button>
            ) : (
              <span className="check-list__item">{content}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
