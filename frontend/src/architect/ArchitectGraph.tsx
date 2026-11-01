import { type Edge, type Node, ReactFlow, ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { ArchitectMark, WorkflowIn } from "../api/types";
import { useFlowAriaLabels } from "../editor/flowA11y";
import { type FlowNodeData, nodeTypes } from "../editor/nodes";
import { motionDuration } from "../lib/motion";
import { useAppTheme } from "../lib/theme";
import type { ArchitectGraph as Graph } from "./progress";

function GraphInner({ graph, base, label }: { graph: Graph; base: WorkflowIn | null; label: string }) {
  const flow = useReactFlow();
  const theme = useAppTheme();
  const ariaLabelConfig = useFlowAriaLabels();
  const { workflow, marks, removed } = graph;
  const nodes: Node[] = useMemo(
    () => [
      ...workflow.nodes.map((node) => {
        const mark: ArchitectMark | undefined = marks[node.id];
        return {
          id: node.id,
          type: node.type,
          position: node.position,
          className: mark ? `arch-node arch-node--${mark}` : "arch-node",
          data: { node, issues: 0 } satisfies FlowNodeData,
        };
      }),
      ...removed.map((node) => ({
        id: `removed:${node.id}`,
        type: node.type,
        position: node.position,
        className: "arch-node arch-node--removed",
        data: { node, issues: 0 } satisfies FlowNodeData,
      })),
    ],
    [workflow, marks, removed],
  );
  const edges: Edge[] = useMemo(() => {
    const key = (edge: { source: string; target: string }) => `${edge.source}>${edge.target}`;
    const before = new Set((base?.edges ?? []).map(key));
    const after = new Set(workflow.edges.map(key));
    const present = new Set(workflow.nodes.map((node) => node.id));
    const removedIds = new Set(removed.map((node) => node.id));
    const id = (nodeId: string) => (removedIds.has(nodeId) ? `removed:${nodeId}` : nodeId);
    return [
      ...workflow.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        className: base && !before.has(key(edge)) ? "edge--added" : undefined,
        animated: Boolean(base && !before.has(key(edge))),
      })),
      ...(base?.edges ?? [])
        .filter((edge) => !after.has(key(edge)))
        .filter((edge) => (present.has(edge.source) || removedIds.has(edge.source)) && (present.has(edge.target) || removedIds.has(edge.target)))
        .map((edge) => ({ id: `removed:${edge.id}`, source: id(edge.source), target: id(edge.target), className: "edge--removed" })),
    ];
  }, [workflow, base, removed]);

  // The view follows the graph as it grows.
  const count = nodes.length;
  useEffect(() => {
    const timer = window.setTimeout(() => void flow.fitView({ padding: 0.12, maxZoom: 0.95, duration: motionDuration(250) }), 60);
    return () => window.clearTimeout(timer);
  }, [count, flow]);

  return (
    <div className="architect-graph nd-workflow-canvas" aria-label={label} role="img">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnScroll={false}
        preventScrolling={false}
        fitView
        fitViewOptions={{ padding: 0.12, maxZoom: 0.95 }}
        minZoom={0.15}
        proOptions={{ hideAttribution: true }}
        colorMode={theme}
        ariaLabelConfig={ariaLabelConfig}
      />
    </div>
  );
}

/** The workflow a job is drafting, read-only: new, changed, removed and pending agents are marked. */
export function ArchitectGraph({ graph, base }: { graph: Graph | null; base: WorkflowIn | null }) {
  const { t } = useTranslation();
  if (!graph)
    return (
      <div className="architect-graph architect-graph--empty nd-workflow-canvas">
        <p className="muted small">{t("architect.progress.graphEmpty")}</p>
      </div>
    );
  return (
    <ReactFlowProvider>
      <GraphInner graph={graph} base={base} label={t("architect.progress.graph")} />
    </ReactFlowProvider>
  );
}

/** The legend of the marks, as text and symbol (never colour alone). */
export function MarkLegend({ marks }: { marks: Record<string, ArchitectMark> }) {
  const { t } = useTranslation();
  const present = new Set(Object.values(marks));
  const order: ArchitectMark[] = ["pending", "configured", "added", "changed", "removed"];
  const shown = order.filter((mark) => present.has(mark));
  if (!shown.length) return null;
  return (
    <ul className="mark-legend" aria-label={t("architect.marks.legend")}>
      {shown.map((mark) => (
        <li key={mark} className={`mark-legend__item mark-legend__item--${mark}`}>
          <span className="mark-legend__swatch" aria-hidden />
          {t(`architect.marks.${mark}`)}
        </li>
      ))}
    </ul>
  );
}
