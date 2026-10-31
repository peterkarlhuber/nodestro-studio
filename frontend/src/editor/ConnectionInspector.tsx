// Inspector of a selected connection: where it leads, and the limits of a loop connection.

import { Repeat, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MAX_LOOP_ITERATIONS, type EdgeLoop } from "../api/types";
import { Button, Callout, DocLink, Field, HelpTip, IconButton, Select, TextInput } from "../components/ui";
import { toast } from "../components/toast";
import { branchLabel } from "./nodes";
import { DEFAULT_LOOP, useEditor, wouldCycle } from "./store";

/** Placeholder syntax the text shows literally (i18next would otherwise fill it in). */
const LOOP_PLACEHOLDERS = { iteration: "{{iteration}}", previous: "{{previous}}", feedback: "{{feedback}}" };

export function ConnectionInspector({ edgeId }: { edgeId: string }) {
  const { t } = useTranslation();
  const edge = useEditor((s) => s.edges.find((item) => item.id === edgeId));
  const nodes = useEditor((s) => s.nodes);
  const edges = useEditor((s) => s.edges);
  const { setEdgeLoop, removeEdges } = useEditor.getState();
  if (!edge) return null;
  const from = nodes.find((node) => node.id === edge.source);
  const to = nodes.find((node) => node.id === edge.target);
  const loop = edge.loop ?? null;
  // A normal connection may become a loop only if it leaves a branch and leads back.
  const leadsBack = wouldCycle(
    edges.filter((item) => item.id !== edge.id),
    edge.source,
    edge.target,
  );
  const update = (next: EdgeLoop | null) => {
    const problem = setEdgeLoop(edge.id, next);
    if (problem) toast.info(t(problem));
  };
  const limit = (value: string) => {
    const number = Math.round(Number(value));
    if (!Number.isFinite(number)) return;
    update({ ...(loop ?? DEFAULT_LOOP), max_iterations: Math.min(MAX_LOOP_ITERATIONS, Math.max(2, number)) });
  };

  return (
    <div className="inspector__content" data-testid="connection-inspector">
      <div className="row-between">
        <div>
          <h2 className="inspector__heading">
            {loop ? t("editor.loop.title") : t("editor.connection.title")}{" "}
            {loop ? <HelpTip id="workflow.loop" label={t("editor.loop.title")} /> : null}
          </h2>
          <p className="muted small">
            {t("editor.connection.path", { source: from?.label ?? "", target: to?.label ?? "" })}
            {from && edge.source_handle ? ` (${branchLabel(from, edge.source_handle, t)})` : ""}
          </p>
        </div>
        <IconButton icon={Trash2} label={t("editor.connection.delete")} onClick={() => removeEdges([edge.id])} />
      </div>
      {loop ? (
        <>
          <p className="muted small">{t("editor.loop.text")}</p>
          <Field label={t("editor.loop.maxIterations")} hint={t("editor.loop.maxIterationsHint", { max: MAX_LOOP_ITERATIONS })}>
            <TextInput
              type="number"
              min={2}
              max={MAX_LOOP_ITERATIONS}
              step={1}
              value={loop.max_iterations}
              onChange={(event) => limit(event.target.value)}
              data-testid="loop-max"
            />
          </Field>
          <Field label={t("editor.loop.onExhausted")}>
            <Select
              value={loop.on_exhausted}
              onChange={(value) => update({ ...loop, on_exhausted: value as EdgeLoop["on_exhausted"] })}
              options={[
                { value: "fail", label: t("editor.loop.fail") },
                { value: "continue", label: t("editor.loop.continue") },
              ]}
            />
          </Field>
          <Callout tone="info">
            {t("editor.loop.placeholders", LOOP_PLACEHOLDERS)} <DocLink to="verzweigungen#schleifen" label={t("editor.loop.docs")} />
          </Callout>
        </>
      ) : leadsBack && edge.source_handle ? (
        <Button icon={Repeat} size="sm" onClick={() => update({ ...DEFAULT_LOOP })}>
          {t("editor.loop.make")}
        </Button>
      ) : null}
    </div>
  );
}
