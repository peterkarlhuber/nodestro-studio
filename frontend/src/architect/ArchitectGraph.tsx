import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";

import type { ArchitectMark, WorkflowIn } from "../api/types";
import type { ArchitectGraph as Graph } from "./progress";

const ArchitectCanvas = lazy(() => import("./ArchitectCanvas"));

/** The workflow a job is drafting, read-only: new, changed, removed and pending agents are marked. */
export function ArchitectGraph({ graph, base }: { graph: Graph | null; base: WorkflowIn | null }) {
  const { t } = useTranslation();
  if (!graph)
    return (
      <div className="architect-graph architect-graph--empty nd-workflow-canvas">
        <p className="muted small">{t("architect.progress.graphEmpty")}</p>
      </div>
    );
  const label = t("architect.progress.graph");
  return (
    // The same empty frame as the canvas while the canvas library loads (no spinner, no jump).
    <Suspense fallback={<div className="architect-graph nd-workflow-canvas" aria-label={label} role="img" aria-busy="true" />}>
      <ArchitectCanvas graph={graph} base={base} label={label} />
    </Suspense>
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
