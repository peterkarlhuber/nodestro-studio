import { CheckCircle2, Copy, Keyboard, PanelRightClose, PanelRightOpen, Trash2 } from "lucide-react";
import { type Ref, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import {
  MAX_CAPABILITIES,
  MAX_DURATION_LIMIT_S,
  MAX_PARALLEL_LIMIT,
  MAX_STEPS_LIMIT,
  type WorkflowCheck,
} from "../api/types";
import { Button, Chip, DocLink, Field, HelpTip, IconButton, TextArea, TextInput } from "../components/ui";
import { removeWithUndo } from "./actions";
import { WorkflowDependencies } from "../python/DependencyPanel";
import { AgentInspector } from "./AgentInspector";
import { CheckList, findings } from "./CheckList";
import { ConnectionInspector } from "./ConnectionInspector";
import { addCapabilities } from "../lib/capabilities";
import { useEditorLayout } from "./layout";
import { OrchestratorInspector } from "./OrchestratorInspector";
import { ApprovalInspector, ConditionInspector, FormEditor, OutputContractEditor, OutputFilesEditor, SubworkflowInspector } from "./FlowInspectors";
import { useEditor } from "./store";

export function Inspector({ check, panelRef }: { check: WorkflowCheck | undefined; panelRef?: Ref<HTMLElement> }) {
  const { t } = useTranslation();
  const selectedId = useEditor((s) => s.selectedId);
  const several = useEditor((s) => s.selectedIds.length > 1);
  const node = useEditor((s) => s.nodes.find((item) => item.id === s.selectedId));
  // Collapsing only hides the panel: the selection stays, and opening it again shows the same node.
  const open = useEditorLayout((state) => state.open.inspector);
  const { setOpen } = useEditorLayout.getState();
  const selected = selectedId && node ? node : null;
  const edgeId = useEditor((s) => (s.selectedEdgeId && s.edges.some((edge) => edge.id === s.selectedEdgeId) ? s.selectedEdgeId : null));

  let label = t("editor.inspector.workflow");
  let content = <WorkflowInspector check={check} />;
  if (several) {
    label = t("editor.inspector.selection");
    content = <SelectionInspector />;
  } else if (!selected && edgeId) {
    label = t("editor.inspector.connection");
    content = <ConnectionInspector key={edgeId} edgeId={edgeId} />;
  } else if (selected?.type === "agent" && selected.agent) {
    label = t("editor.inspector.agent");
    content = <AgentInspector key={selected.id} node={selected} />;
  } else if (selected) {
    label = t("editor.inspector.node");
    content =
      selected.type === "condition" && selected.condition ? (
        <ConditionInspector key={selected.id} node={selected} />
      ) : selected.type === "approval" && selected.approval ? (
        <ApprovalInspector key={selected.id} node={selected} />
      ) : selected.type === "subworkflow" && selected.subworkflow ? (
        <SubworkflowInspector key={selected.id} node={selected} />
      ) : selected.type === "orchestrator" && selected.orchestrator ? (
        <OrchestratorInspector key={selected.id} node={selected} check={check} />
      ) : (
        <TerminalInspector key={selected.id} nodeId={selected.id} />
      );
  }

  return (
    <aside
      ref={panelRef}
      id="editor-inspector"
      className={`inspector ${open ? "" : "inspector--collapsed"}`}
      aria-label={label}
      data-testid="inspector"
    >
      <div className="panel-head inspector__panel-head">
        <IconButton
          icon={open ? PanelRightClose : PanelRightOpen}
          label={open ? t("editor.panels.hideInspector") : t("editor.panels.showInspector")}
          className="inspector__toggle"
          aria-expanded={open}
          aria-controls="editor-inspector"
          onClick={() => setOpen("inspector", !open)}
        />
        {open ? <span className="panel-head__title">{t("editor.panels.inspector")}</span> : null}
      </div>
      {open ? (
        <div className="inspector__body">
          {selected && !several ? <NodeFindings check={check} nodeId={selected.id} /> : null}
          {content}
        </div>
      ) : (
        // The collapsed rail still names what is selected and opens the panel on click.
        <button type="button" className="inspector__rail" onClick={() => setOpen("inspector", true)} tabIndex={-1} aria-hidden>
          <span>{selected ? t("editor.panels.railSelection", { name: selected.label || label }) : t("editor.panels.inspector")}</span>
        </button>
      )}
    </aside>
  );
}

const KEYS = { kbd: <kbd /> };

/** The check's errors and warnings about the selected node, above its settings (also workflow-level ones). */
function NodeFindings({ check, nodeId }: { check: WorkflowCheck | undefined; nodeId: string }) {
  const { t } = useTranslation();
  const count = findings(check).filter((finding) => finding.level !== "info" && finding.nodeId === nodeId).length;
  if (!check || !count) return null;
  return (
    <section className="check-panel check-panel--node" aria-label={t("editor.inspector.nodeProblems")} data-testid="node-findings">
      <CheckList check={check} levels={["error", "warning"]} nodeId={nodeId} />
    </section>
  );
}

/** Several nodes are selected: what can be done with all of them at once. */
function SelectionInspector() {
  const { t } = useTranslation();
  const ids = useEditor((s) => s.selectedIds);
  const names = useEditor((s) => s.nodes.filter((node) => s.selectedIds.includes(node.id)).map((node) => node.label));
  const { duplicateNodes, select } = useEditor.getState();
  return (
    <div className="inspector__content" data-testid="selection-inspector">
      <h2 className="inspector__heading">{t("editor.inspector.selectedCount", { count: ids.length })}</h2>
      <p className="muted small">{names.filter(Boolean).join(", ")}</p>
      <div className="row-gap">
        <Button icon={Copy} onClick={() => duplicateNodes(ids)}>
          {t("editor.inspector.duplicateAll")}
        </Button>
        <Button icon={Trash2} variant="danger" onClick={() => removeWithUndo(ids)}>
          {t("editor.inspector.deleteAll", { count: ids.length })}
        </Button>
        <Button variant="ghost" onClick={() => select(null)}>
          {t("editor.inspector.clearSelection")}
        </Button>
      </div>
      <p className="field__hint">{t("editor.inspector.selectionHint")}</p>
    </div>
  );
}

function TerminalInspector({ nodeId }: { nodeId: string }) {
  const { t } = useTranslation();
  const node = useEditor((s) => s.nodes.find((item) => item.id === nodeId))!;
  const { updateNode } = useEditor.getState();
  const isStart = node.type === "start";
  const title = isStart ? t("editor.nodes.start") : t("editor.nodes.output");
  return (
    <div className="inspector__content">
      <div className="row-between">
        <div>
          <h2 className="inspector__heading">
            {title} <HelpTip id={isStart ? "workflow.startNode" : "workflow.outputNode"} label={title} />
          </h2>
          <p className="muted small">{isStart ? t("editor.inspector.startText") : t("editor.inspector.outputText")}</p>
        </div>
        <IconButton icon={Trash2} label={t("editor.inspector.deleteNode")} onClick={() => removeWithUndo([node.id])} />
      </div>
      <Field label={t("editor.inspector.label")}>
        <TextInput value={node.label} onChange={(e) => updateNode(node.id, { label: e.target.value }, { record: false })} />
      </Field>
      {isStart ? (
        <Field label={t("editor.inspector.defaultInput")} hint={t("editor.inspector.defaultInputHint")} tip="workflow.defaultInput">
          <TextArea
            rows={6}
            value={node.start?.default_input ?? ""}
            onChange={(e) =>
              updateNode(
                node.id,
                { start: { file_ids: [], ...node.start, default_input: e.target.value } },
                { record: false },
              )
            }
          />
        </Field>
      ) : null}
      {isStart ? (
        <FormEditor node={node} />
      ) : (
        <>
          <OutputContractEditor node={node} />
          <OutputFilesEditor node={node} />
        </>
      )}
    </div>
  );
}

function WorkflowInspector({ check }: { check: WorkflowCheck | undefined }) {
  const { t } = useTranslation();
  const name = useEditor((s) => s.name);
  const description = useEditor((s) => s.description);
  const budget = useEditor((s) => s.budget);
  const workflowId = useEditor((s) => s.workflowId);
  // Re-render when agents or their tools change, so the Python libraries stay current.
  useEditor((s) => s.nodes);
  const { setMeta, toWorkflow } = useEditor.getState();
  return (
    <div className="inspector__content">
      <h2 className="inspector__heading titlebar__title">
        {t("editor.inspector.workflowTitle")}{" "}
        <DocLink to="workflows#einstellungen" label={t("editor.inspector.workflowDocs")} />
      </h2>
      <p className="muted small">{t("editor.inspector.selectNode")}</p>
      {check ? (
        <section className="check-panel" tabIndex={-1} aria-label={t("editor.inspector.problemsLabel")}>
          <h3 className="check-panel__title">
            {t("editor.check.title")} <HelpTip id="workflow.problems" label={t("editor.inspector.problemsLabel")} />
          </h3>
          {check.ok && !check.warnings ? (
            <p className="check-panel__ok">
              <CheckCircle2 size={14} aria-hidden /> {t("editor.check.allGood")}
            </p>
          ) : (
            <>
              <p className="muted small">
                {check.ok
                  ? t("editor.check.warningsOnly", { count: check.warnings })
                  : t("editor.check.blocked", { count: check.errors })}
              </p>
              <CheckList check={check} levels={["error", "warning"]} />
            </>
          )}
          <CheckList check={check} levels={["info"]} />
        </section>
      ) : null}
      <Field label={t("common.name")}>
        <TextInput value={name} onChange={(e) => setMeta({ name: e.target.value })} />
      </Field>
      <Field label={t("common.description")}>
        <TextArea rows={3} value={description} onChange={(e) => setMeta({ description: e.target.value })} />
      </Field>
      <Field label={t("editor.inspector.budget")} hint={t("editor.inspector.budgetHint")} tip="workflow.budget">
        <TextInput
          type="number"
          min={0}
          step={0.1}
          value={budget ?? ""}
          onChange={(e) => setMeta({ budget: e.target.value === "" ? null : Number(e.target.value) })}
        />
      </Field>
      <LimitFields />
      <CapabilityField />
      {workflowId ? <WorkflowDependencies workflowId={workflowId} workflow={toWorkflow()} /> : null}
      <div className="help-box">
        <strong>
          <Keyboard size={14} aria-hidden /> {t("editor.inspector.controls")}
        </strong>
        <ul>
          <li>{t("editor.inspector.controlDrag")}</li>
          <li>{t("editor.inspector.controlConnect")}</li>
          <li>
            <Trans i18nKey="editor.inspector.controlDelete" components={KEYS} />
          </li>
          <li>
            <Trans i18nKey="editor.inspector.controlUndo" components={KEYS} />
          </li>
          <li>{t("editor.inspector.controlPanels")}</li>
        </ul>
      </div>
    </div>
  );
}


/** The workflow's execution limits: steps at the same time, active time and steps per run (empty: no limit). */
function LimitFields() {
  const { t } = useTranslation();
  const limits = useEditor((s) => s.limits);
  const { setMeta } = useEditor.getState();
  const whole = (value: string, low: number, high: number): number | null => {
    if (value === "") return null;
    const number = Math.round(Number(value));
    return Number.isFinite(number) ? Math.min(high, Math.max(low, number)) : null;
  };
  const minutes = limits.max_duration_s === null ? "" : Math.round((limits.max_duration_s / 60) * 100) / 100;
  return (
    <>
      <Field
        label={t("editor.inspector.maxParallel")}
        hint={t("editor.inspector.maxParallelHint", { max: MAX_PARALLEL_LIMIT })}
        tip="workflow.limits"
      >
        <TextInput
          type="number"
          min={1}
          max={MAX_PARALLEL_LIMIT}
          step={1}
          value={limits.max_parallel ?? ""}
          onChange={(e) => setMeta({ limits: { ...limits, max_parallel: whole(e.target.value, 1, MAX_PARALLEL_LIMIT) } })}
          data-testid="limit-parallel"
        />
      </Field>
      <Field label={t("editor.inspector.timeLimit")} hint={t("editor.inspector.timeLimitHint")} tip="workflow.limits">
        <TextInput
          type="number"
          min={0.1}
          max={MAX_DURATION_LIMIT_S / 60}
          step={1}
          value={minutes}
          onChange={(e) => {
            const value = e.target.value === "" ? null : Number(e.target.value);
            const seconds =
              value === null || !Number.isFinite(value) || value <= 0
                ? null
                : Math.min(MAX_DURATION_LIMIT_S, Math.round(value * 60));
            setMeta({ limits: { ...limits, max_duration_s: seconds } });
          }}
          data-testid="limit-duration"
        />
      </Field>
      <Field
        label={t("editor.inspector.maxSteps")}
        hint={t("editor.inspector.maxStepsHint", { max: MAX_STEPS_LIMIT })}
        tip="workflow.limits"
      >
        <TextInput
          type="number"
          min={1}
          max={MAX_STEPS_LIMIT}
          step={1}
          value={limits.max_steps ?? ""}
          onChange={(e) => setMeta({ limits: { ...limits, max_steps: whole(e.target.value, 1, MAX_STEPS_LIMIT) } })}
          data-testid="limit-steps"
        />
      </Field>
    </>
  );
}

/** What the workflow can do as a team: short tags that help to find it later (they grant nothing). */
function CapabilityField() {
  const { t } = useTranslation();
  const capabilities = useEditor((s) => s.capabilities);
  const { setMeta } = useEditor.getState();
  const [typed, setTyped] = useState("");
  const take = () => {
    if (!typed.trim()) return;
    setMeta({ capabilities: addCapabilities(capabilities, typed) });
    setTyped("");
  };
  return (
    <Field
      label={t("editor.inspector.capabilities")}
      hint={t("editor.inspector.capabilitiesHint", { max: MAX_CAPABILITIES })}
      tip="workflow.capabilities"
    >
      <div className="stack-sm">
        {capabilities.length ? (
          <div className="chip-row" data-testid="capabilities">
            {capabilities.map((tag) => (
              <Chip key={tag} onRemove={() => setMeta({ capabilities: capabilities.filter((item) => item !== tag) })}>
                {tag}
              </Chip>
            ))}
          </div>
        ) : null}
        <TextInput
          value={typed}
          placeholder={t("editor.inspector.capabilitiesPlaceholder")}
          disabled={capabilities.length >= MAX_CAPABILITIES}
          onChange={(e) => setTyped(e.target.value)}
          onBlur={take}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              take();
            }
          }}
          data-testid="capability-input"
        />
      </div>
    </Field>
  );
}
