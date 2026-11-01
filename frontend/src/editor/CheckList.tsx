// The findings of the workflow check, each linked to the node or connection it concerns.

import { AlertTriangle, Info, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { CheckIssue, ConfigIssue, WorkflowCheck } from "../api/types";
import { Button } from "../components/ui";
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

const ICONS = { error: XCircle, warning: AlertTriangle, info: Info };

export function CheckList({ check, levels = ["error", "warning", "info"] }: { check: WorkflowCheck | undefined; levels?: Finding["level"][] }) {
  const { t } = useTranslation();
  const nodes = useEditor((s) => s.nodes);
  const { select, selectEdge } = useEditor.getState();
  const shown = findings(check).filter((finding) => levels.includes(finding.level));
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
        const fix = finding.nodeId && needsEffortOff(finding.item) ? finding.nodeId : null;
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
            {fix ? <EffortFix nodeId={fix} /> : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * An OpenAI-compatible endpoint (Ollama, vLLM, ...) cannot receive the effort setting: the agent library refuses
 * it with a technical message about CompatibleOptions, which no setting of Nodestro offers (AD-09). The way out the
 * studio has is the agent's own effort: back to the model default, which sends none.
 */
export function needsEffortOff(item: { code?: string | null; message?: string | null }): boolean {
  return Boolean(item.message && /send_reasoning_effort/.test(item.message));
}

function EffortFix({ nodeId }: { nodeId: string }) {
  const { t } = useTranslation();
  const effort = useEditor((s) => s.nodes.find((node) => node.id === nodeId)?.agent?.effort ?? null);
  return (
    <div className="check-list__fix small" data-testid="effort-fix">
      <span className="muted">{t("admin.compat.effortText")}</span>{" "}
      {effort !== null ? (
        <Button
          size="sm"
          onClick={() => {
            useEditor.getState().updateAgent(nodeId, { effort: null });
            useEditor.getState().select(nodeId);
          }}
        >
          {t("admin.compat.effortOff")}
        </Button>
      ) : null}
    </div>
  );
}
