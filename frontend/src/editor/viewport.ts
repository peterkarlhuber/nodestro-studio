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

/**
 * The smallest zoom a workflow opens with. Down to it the whole graph is shown (the overview matters more on
 * opening than reading every title); a larger graph opens at this zoom from its start, with a cue.
 */
export const READABLE_ZOOM = 0.4;

/** A small workflow is never blown up beyond this zoom when it opens. */
export const OPENING_MAX_ZOOM = 1;

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

/** The parts of the canvas pane that floating controls cover, in screen pixels from each edge. */
export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Something that covers a corner of the pane (the minimap): either nodes stay below it or to its left. */
export interface Corner {
  width: number;
  height: number;
}

/** Room kept between the graph and the edge of the free area, in screen pixels. */
const OPENING_MARGIN = 16;

export interface OpeningView {
  x: number;
  y: number;
  zoom: number;
  /** Whether the whole graph is in view; otherwise it opens at the readable zoom from its start. */
  fits: boolean;
}

interface Placed {
  type: string;
  position: Point;
  width?: number;
  height?: number;
}

function fitInto(bounds: Rect, area: Rect): { x: number; y: number; zoom: number } {
  const zoom = Math.min(
    OPENING_MAX_ZOOM,
    (area.width - 2 * OPENING_MARGIN) / Math.max(bounds.width, 1),
    (area.height - 2 * OPENING_MARGIN) / Math.max(bounds.height, 1),
  );
  return {
    zoom,
    x: Math.round(area.x + area.width / 2 - (bounds.x + bounds.width / 2) * zoom),
    y: Math.round(area.y + area.height / 2 - (bounds.y + bounds.height / 2) * zoom),
  };
}

/**
 * The viewport a workflow opens with (ED-09, F2): the whole graph fitted into the part of the pane that no
 * floating control covers (status line, zoom controls, minimap), when that stays readable; otherwise the readable
 * zoom with the start node (or the leftmost node) at the left edge, so the user pans from the beginning.
 */
export function openingViewport(
  nodes: Placed[],
  pane: { width: number; height: number },
  insets: Insets = { top: 0, right: 0, bottom: 0, left: 0 },
  corner: Corner | null = null,
): OpeningView {
  if (!nodes.length) return { x: 0, y: 0, zoom: 1, fits: true };
  const left = Math.min(...nodes.map((node) => node.position.x));
  const top = Math.min(...nodes.map((node) => node.position.y));
  const right = Math.max(...nodes.map((node) => node.position.x + (node.width ?? NEW_NODE.width)));
  const bottom = Math.max(...nodes.map((node) => node.position.y + (node.height ?? NEW_NODE.height)));
  const bounds = { x: left, y: top, width: right - left, height: bottom - top };
  const free: Rect = {
    x: insets.left,
    y: insets.top,
    width: Math.max(pane.width - insets.left - insets.right, 1),
    height: Math.max(pane.height - insets.top - insets.bottom, 1),
  };
  // The minimap covers the top right corner: the graph goes either below it or to its left, whichever is larger.
  const areas = corner
    ? [
        { ...free, y: Math.max(free.y, corner.height), height: free.y + free.height - Math.max(free.y, corner.height) },
        { ...free, width: Math.min(free.width, pane.width - corner.width - free.x) },
      ]
    : [free];
  const usable = areas.filter((area) => area.width > 2 * OPENING_MARGIN && area.height > 2 * OPENING_MARGIN);
  const fitted = (usable.length ? usable : [free])
    .map((area) => fitInto(bounds, area))
    .reduce((best, next) => (next.zoom > best.zoom ? next : best));
  if (fitted.zoom >= READABLE_ZOOM) return { ...fitted, fits: true };
  const start = nodes.find((node) => node.type === "start") ?? nodes.find((node) => node.position.x === left) ?? nodes[0];
  const zoom = READABLE_ZOOM;
  const height = start.height ?? NEW_NODE.height;
  const centre =
    bounds.height * zoom <= free.height - 2 * OPENING_MARGIN ? bounds.y + bounds.height / 2 : start.position.y + height / 2;
  return {
    zoom,
    x: Math.round(free.x + OPENING_MARGIN - left * zoom),
    y: Math.round(free.y + free.height / 2 - centre * zoom),
    fits: false,
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
