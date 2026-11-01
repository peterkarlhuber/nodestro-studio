// Where the canvas looks: a new node appears where the user can see it, and a large workflow opens readable.
//
// The canvas registers itself here (it lives inside React Flow's provider); the palette and the title actions
// sit outside it and add nodes through ``addVisibleNode``.

import type { AgentConfig, NodeType, WorkflowNode } from "../api/types";
import { type TeamPreset, useEditor } from "./store";

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point {
  width: number;
  height: number;
}

/** The size of a new node in canvas units (see .flow-node). */
export const NEW_NODE = { width: 216, height: 96 };

/** Below this zoom the node titles are too small to read; a large workflow opens at this zoom instead. */
export const READABLE_ZOOM = 0.6;

const COLUMN = 320;
const ROW = 150;

interface CanvasView {
  /** The visible part of the canvas in canvas units. */
  visible: () => Rect | null;
  /** Pans (without zooming) so that the node is in view. */
  reveal: (id: string, position: Point) => void;
}

let view: CanvasView | null = null;

export function registerCanvasView(next: CanvasView | null): void {
  view = next;
}

function overlaps(nodes: WorkflowNode[], point: Point): boolean {
  return nodes.some(
    (node) => Math.abs(node.position.x - point.x) < NEW_NODE.width && Math.abs(node.position.y - point.y) < ROW - 40,
  );
}

/**
 * The position of a new node: to the right of the one selected node, or in the middle of the visible canvas; it
 * moves down until it covers no other node. Without a canvas (tests) it goes to the right of the graph.
 */
export function placeNewNode(nodes: WorkflowNode[], selectedId: string | null, visible: Rect | null): Point {
  const anchor = selectedId ? nodes.find((node) => node.id === selectedId) : undefined;
  let point: Point;
  if (anchor) point = { x: anchor.position.x + COLUMN, y: anchor.position.y };
  else if (visible)
    point = {
      x: Math.round(visible.x + visible.width / 2 - NEW_NODE.width / 2),
      y: Math.round(visible.y + visible.height / 2 - NEW_NODE.height / 2),
    };
  else if (nodes.length) point = { x: Math.max(...nodes.map((node) => node.position.x)) + COLUMN, y: 0 };
  else point = { x: 0, y: 0 };
  for (let step = 0; step < 40 && overlaps(nodes, point); step += 1) point = { x: point.x, y: point.y + ROW };
  return point;
}

/** Whether a node at ``point`` is completely inside ``visible``. */
export function inView(point: Point, visible: Rect | null): boolean {
  if (!visible) return true;
  return (
    point.x >= visible.x &&
    point.y >= visible.y &&
    point.x + NEW_NODE.width <= visible.x + visible.width &&
    point.y + NEW_NODE.height <= visible.y + visible.height
  );
}

/**
 * The viewport a workflow opens with: the fitted view when it is readable, otherwise the readable zoom with the
 * start node (or the leftmost node) at the left edge, vertically centred, so the user pans from the beginning.
 */
export function openingViewport(
  fitted: { x: number; y: number; zoom: number },
  nodes: { type: string; position: Point; height?: number }[],
  pane: { width: number; height: number },
): { x: number; y: number; zoom: number } {
  if (fitted.zoom >= READABLE_ZOOM || !nodes.length) return fitted;
  const start =
    nodes.find((node) => node.type === "start") ??
    nodes.reduce((left, node) => (node.position.x < left.position.x ? node : left), nodes[0]);
  const zoom = READABLE_ZOOM;
  const height = start.height ?? NEW_NODE.height;
  return {
    zoom,
    x: Math.round(48 - start.position.x * zoom),
    y: Math.round(pane.height / 2 - (start.position.y + height / 2) * zoom),
  };
}

/** Adds a node where the user can see it, selects it and pans to it when needed. */
export function addVisibleNode(type: NodeType, agent?: Partial<AgentConfig>, team?: TeamPreset): WorkflowNode {
  const state = useEditor.getState();
  const visible = view?.visible() ?? null;
  const position = placeNewNode(state.nodes, state.selectedId, visible);
  const node = state.addNode(type, position, agent, team);
  if (!inView(position, visible)) view?.reveal(node.id, position);
  return node;
}
