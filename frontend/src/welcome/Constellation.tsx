import { BookOpen, Bot, Command, Cpu, Hand, type LucideIcon, Rows3 } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { useTranslation } from "react-i18next";

import logo from "../assets/brand/nodestro-logo-512.webp";
import { useMediaQuery, usePointerParallax } from "./motion";

// The hero diagram: what Nodestro connects (models, knowledge, tools) flows into the logo, and
// what comes out of it (agents, approvals, runs) flows on. It mirrors the logo itself: two
// nodes joining into a third. Geometry lives in a fixed coordinate space per layout; the SVG
// lines and the HTML chips share it, so they always meet exactly at any width.

type NodeId = "models" | "knowledge" | "tools" | "agents" | "approvals" | "runs";

interface Point {
  x: number;
  y: number;
}

interface Layout {
  width: number;
  height: number;
  hub: Point & { size: number };
  nodes: Record<NodeId, Point>;
  /** Curve from a node to the hub (inbound) or from the hub to a node (outbound). */
  path: (from: Point, to: Point) => string;
}

const INPUTS: NodeId[] = ["models", "knowledge", "tools"];
const OUTPUTS: NodeId[] = ["agents", "approvals", "runs"];

const ICONS: Record<NodeId, LucideIcon> = {
  models: Cpu,
  knowledge: BookOpen,
  tools: Command,
  agents: Bot,
  approvals: Hand,
  runs: Rows3,
};

const horizontal = (from: Point, to: Point) => {
  const bend = (to.x - from.x) * 0.55;
  return `M${from.x} ${from.y} C${from.x + bend} ${from.y} ${to.x - bend} ${to.y} ${to.x} ${to.y}`;
};

const vertical = (from: Point, to: Point) => {
  const bend = (to.y - from.y) * 0.55;
  return `M${from.x} ${from.y} C${from.x} ${from.y + bend} ${to.x} ${to.y - bend} ${to.x} ${to.y}`;
};

const WIDE: Layout = {
  width: 1200,
  height: 400,
  hub: { x: 600, y: 200, size: 196 },
  nodes: {
    models: { x: 330, y: 70 },
    knowledge: { x: 300, y: 200 },
    tools: { x: 330, y: 330 },
    agents: { x: 870, y: 70 },
    approvals: { x: 900, y: 200 },
    runs: { x: 870, y: 330 },
  },
  path: horizontal,
};

const NARROW: Layout = {
  width: 360,
  height: 400,
  hub: { x: 180, y: 200, size: 112 },
  nodes: {
    models: { x: 60, y: 86 },
    knowledge: { x: 180, y: 76 },
    tools: { x: 300, y: 86 },
    agents: { x: 60, y: 314 },
    approvals: { x: 180, y: 324 },
    runs: { x: 300, y: 314 },
  },
  path: vertical,
};

const percent = (value: number, total: number) => `${(value / total) * 100}%`;

export function Constellation({ animate }: { animate: boolean }) {
  const { t } = useTranslation();
  const narrow = useMediaQuery("(max-width: 760px)");
  const layout = narrow ? NARROW : WIDE;
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  usePointerParallax(stage, animate);
  const { hub } = layout;
  const routes = [
    ...INPUTS.map((id, index) => ({ id, index, inbound: true, d: layout.path(layout.nodes[id], hub) })),
    ...OUTPUTS.map((id, index) => ({ id, index, inbound: false, d: layout.path(hub, layout.nodes[id]) })),
  ];
  return (
    <div
      ref={setStage}
      className={`wl-stage ${narrow ? "wl-stage--narrow" : "wl-stage--wide"}`}
      style={{ aspectRatio: `${layout.width} / ${layout.height}` } as CSSProperties}
      role="img"
      aria-label={t("welcome.hero.diagram")}
      data-testid="welcome-diagram"
    >
      <svg className="wl-stage__lines" viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden focusable="false">
        {routes.map(({ id, index, inbound, d }) => (
          <g key={id} style={{ "--i": index } as CSSProperties} className={inbound ? "wl-route wl-route--in" : "wl-route wl-route--out"}>
            <path className="wl-route__line" d={d} pathLength={100} />
            <path className="wl-route__pulse wl-loop" d={d} pathLength={100} />
          </g>
        ))}
        {/* Ports where a route meets its chip, as on the Studio's node cards. */}
        {[...INPUTS, ...OUTPUTS].map((id) => (
          <circle key={id} className="wl-port" cx={layout.nodes[id].x} cy={layout.nodes[id].y} r={narrow ? 3.5 : 4} />
        ))}
      </svg>
      <div
        className="wl-hub"
        style={{
          left: percent(hub.x, layout.width),
          top: percent(hub.y, layout.height),
          width: percent(hub.size, layout.width),
        }}
        aria-hidden
      >
        <span className="wl-hub__halo wl-loop" />
        <span className="wl-hub__floor" />
        <span className="wl-hub__body">
          <img src={logo} alt="" width={512} height={512} decoding="async" fetchPriority="high" draggable={false} />
          <span className="wl-hub__sheen wl-loop" style={{ maskImage: `url(${logo})`, WebkitMaskImage: `url(${logo})` }} />
        </span>
      </div>
      {[...INPUTS, ...OUTPUTS].map((id) => {
        const Icon = ICONS[id];
        const inbound = INPUTS.includes(id);
        const point = layout.nodes[id];
        return (
          <div
            key={id}
            className={`wl-chip ${inbound ? "wl-chip--in" : "wl-chip--out"} wl-loop`}
            style={
              {
                left: percent(point.x, layout.width),
                top: percent(point.y, layout.height),
                "--i": (inbound ? INPUTS : OUTPUTS).indexOf(id),
              } as CSSProperties
            }
            aria-hidden
          >
            <span className="wl-chip__icon">
              <Icon size={16} aria-hidden />
            </span>
            <span className="wl-chip__text">
              <span className="wl-chip__title">{t(`welcome.nodes.${id}.title`)}</span>
              <span className="wl-chip__detail">{t(`welcome.nodes.${id}.detail`)}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
