// The connections of the selected node as a list, plus "Connect to…": building a workflow without dragging
// (keyboard, screen reader, touch). It uses the same store action and checks as a connection drawn on the canvas.

import { ArrowLeft, ArrowRight, Link2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { WorkflowNode } from "../api/types";
import { toast } from "../components/toast";
import { Button, Field, IconButton, Section, Select } from "../components/ui";
import { branchLabel } from "./nodes";
import { branchHandles, useEditor, wouldCycle } from "./store";

const TYPE_KEY: Record<WorkflowNode["type"], string> = {
  start: "editor.nodes.start",
  agent: "editor.nodes.agent",
  output: "editor.nodes.output",
  condition: "editor.nodes.condition",
  approval: "editor.nodes.approval",
  subworkflow: "editor.nodes.subworkflow",
  orchestrator: "editor.nodes.orchestrator",
};

/** "Writer (Agent)": the name of a node with its kind, as the canvas announces it. */
export function nodeName(node: WorkflowNode, t: (key: string) => string): string {
  const kind = t(TYPE_KEY[node.type] ?? "editor.nodes.agent");
  return node.label && node.label !== kind ? `${node.label} (${kind})` : kind;
}

export function NodeConnections({ nodeId }: { nodeId: string }) {
  const { t } = useTranslation();
  const nodes = useEditor((s) => s.nodes);
  const edges = useEditor((s) => s.edges);
  const { connect, removeEdges, selectEdge } = useEditor.getState();
  const node = nodes.find((item) => item.id === nodeId);
  const handles = node ? branchHandles(node) : null;
  const [handle, setHandle] = useState(handles?.[0] ?? "");
  const [target, setTarget] = useState("");
  const [status, setStatus] = useState("");
  if (!node) return null;

  const byId = new Map(nodes.map((item) => [item.id, item]));
  const label = (id: string) => {
    const item = byId.get(id);
    return item ? nodeName(item, t) : id;
  };
  const outgoing = edges.filter((edge) => edge.source === nodeId);
  const incoming = edges.filter((edge) => edge.target === nodeId);
  const branch = handles ? (handles.includes(handle) ? handle : handles[0]) : null;
  // Valid targets only: not itself, not the start, not twice, and no cycle unless it leaves a branch (a loop).
  const candidates =
    node.type === "output"
      ? []
      : nodes.filter(
          (item) =>
            item.id !== nodeId &&
            item.type !== "start" &&
            !outgoing.some((edge) => edge.target === item.id) &&
            (branch !== null || !wouldCycle(edges, nodeId, item.id)),
        );
  const chosen = candidates.some((item) => item.id === target) ? target : "";

  const create = () => {
    if (!chosen) return;
    const problem = connect(nodeId, chosen, branch);
    if (problem && problem !== "editor.connect.loopCreated") {
      toast.info(t(problem));
      setStatus(t(problem));
      return;
    }
    if (problem) toast.info(t(problem));
    setTarget("");
    setStatus(t("a11y.connect.created", { source: label(nodeId), target: label(chosen) }));
  };

  const row = (edgeId: string, otherId: string, direction: "in" | "out", handleId?: string | null) => {
    const other = label(otherId);
    const via = handleId ? ` · ${branchLabel(node, handleId, t)}` : "";
    const text = direction === "out" ? t("a11y.connect.to", { name: other }) : t("a11y.connect.from", { name: other });
    return (
      <li key={edgeId} className="node-connections__item">
        {direction === "out" ? <ArrowRight size={13} aria-hidden /> : <ArrowLeft size={13} aria-hidden />}
        <span className="node-connections__name">
          {text}
          {via}
        </span>
        <Button size="sm" variant="ghost" onClick={() => selectEdge(edgeId)} aria-label={t("a11y.connect.showLabel", { name: text })}>
          {t("a11y.connect.show")}
        </Button>
        <IconButton icon={Trash2} label={t("a11y.connect.removeLabel", { name: text })} onClick={() => removeEdges([edgeId])} />
      </li>
    );
  };

  return (
    <div className="inspector__content inspector__content--follow" data-testid="node-connections">
      <Section
        id="node-connections"
        icon={Link2}
        title={t("a11y.connect.title")}
        summary={t("a11y.connect.summary", { incoming: incoming.length, outgoing: outgoing.length })}
        defaultOpen
      >
        <div className="stack-sm">
          {incoming.length || outgoing.length ? (
            <ul className="node-connections" aria-label={t("a11y.connect.listLabel")}>
              {incoming.map((edge) => row(edge.id, edge.source, "in"))}
              {outgoing.map((edge) => row(edge.id, edge.target, "out", edge.source_handle))}
            </ul>
          ) : (
            <p className="muted small">{t("a11y.connect.none")}</p>
          )}
          {node.type === "output" ? (
            <p className="muted small">{t("editor.connect.fromOutput")}</p>
          ) : (
            <>
              {handles ? (
                <Field label={t("a11y.connect.branch")}>
                  <Select
                    value={branch ?? ""}
                    onChange={setHandle}
                    options={handles.map((id) => ({ value: id, label: branchLabel(node, id, t) }))}
                    data-testid="connect-branch"
                  />
                </Field>
              ) : null}
              <Field label={t("a11y.connect.target")} hint={candidates.length ? undefined : t("a11y.connect.noTargets")}>
                <Select
                  value={chosen}
                  onChange={setTarget}
                  placeholder={t("a11y.connect.pick")}
                  options={candidates.map((item) => ({ value: item.id, label: nodeName(item, t) }))}
                  disabled={!candidates.length}
                  data-testid="connect-target"
                />
              </Field>
              <div>
                <Button icon={Link2} onClick={create} disabled={!chosen} data-testid="connect-create">
                  {t("a11y.connect.create")}
                </Button>
              </div>
            </>
          )}
          <p className="sr-only" role="status" aria-live="polite">
            {status}
          </p>
        </div>
      </Section>
    </div>
  );
}
