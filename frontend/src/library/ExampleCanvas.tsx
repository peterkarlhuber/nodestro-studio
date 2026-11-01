import { type Edge, type Node, ReactFlow } from "@xyflow/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { ExampleDetail } from "../api/types";
import { type FlowNodeData, nodeTypes } from "../editor/nodes";

/** The workflow of an example as a small read-only canvas; loaded lazily by ``ExamplePreview``. */
export default function ExampleCanvas({ example }: { example: ExampleDetail }) {
  const { t } = useTranslation();
  const nodes: Node[] = useMemo(
    () =>
      example.workflow.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: { node, issues: 0, preview: true } satisfies FlowNodeData,
      })),
    [example],
  );
  const edges: Edge[] = useMemo(
    () => example.workflow.edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target })),
    [example],
  );
  return (
    <div className="example-graph nd-workflow-canvas" aria-label={t("library.preview.graph")} role="img">
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
        fitViewOptions={{ padding: 0.08, maxZoom: 0.9 }}
        minZoom={0.2}
        proOptions={{ hideAttribution: true }}
      />
    </div>
  );
}
