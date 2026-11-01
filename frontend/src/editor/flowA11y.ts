// Translated screen-reader texts of React Flow (its defaults are English only).

import type { AriaLabelConfig } from "@xyflow/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function useFlowAriaLabels(): Partial<AriaLabelConfig> {
  const { t, i18n } = useTranslation();
  return useMemo(
    () => ({
      "node.a11yDescription.default": t("a11y.flow.node"),
      "node.a11yDescription.keyboardDisabled": t("a11y.flow.node"),
      "node.a11yDescription.ariaLiveMessage": ({ direction, x, y }: { direction: string; x: number; y: number }) =>
        t("a11y.flow.moved", {
          direction: t(`a11y.flow.direction.${direction}`, { defaultValue: direction }),
          x: Math.round(x),
          y: Math.round(y),
        }),
      "edge.a11yDescription.default": t("a11y.flow.edge"),
      "controls.ariaLabel": t("a11y.flow.controls"),
      "controls.zoomIn.ariaLabel": t("editor.canvas.zoomIn"),
      "controls.zoomOut.ariaLabel": t("editor.canvas.zoomOut"),
      "controls.fitView.ariaLabel": t("editor.canvas.fitView"),
      "controls.interactive.ariaLabel": t("a11y.flow.interactive"),
      "minimap.ariaLabel": t("editor.canvas.minimap"),
      "handle.ariaLabel": t("a11y.flow.handle"),
    }),
    // The texts change with the language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language],
  );
}
