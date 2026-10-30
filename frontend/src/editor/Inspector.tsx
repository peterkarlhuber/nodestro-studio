import { CheckCircle2, Keyboard, PanelRightClose, PanelRightOpen, Trash2 } from "lucide-react";
import type { Ref } from "react";
import { Trans, useTranslation } from "react-i18next";

import type { WorkflowCheck } from "../api/types";
import { DocLink, Field, HelpTip, IconButton, TextArea, TextInput } from "../components/ui";
import { WorkflowDependencies } from "../python/DependencyPanel";
import { AgentInspector } from "./AgentInspector";
import { CheckList } from "./CheckList";
import { useEditorLayout } from "./layout";
import { ApprovalInspector, ConditionInspector, FormEditor, OutputFilesEditor, SubworkflowInspector } from "./FlowInspectors";
import { useEditor } from "./store";

export function Inspector({ check, panelRef }: { check: WorkflowCheck | undefined; panelRef?: Ref<HTMLElement> }) {
  const { t } = useTranslation();
  const selectedId = useEditor((s) => s.selectedId);
  const node = useEditor((s) => s.nodes.find((item) => item.id === s.selectedId));
  // Collapsing only hides the panel: the selection stays, and opening it again shows the same node.
  const open = useEditorLayout((state) => state.open.inspector);
  const { setOpen } = useEditorLayout.getState();
  const selected = selectedId && node ? node : null;

  let label = t("editor.inspector.workflow");
  let content = <WorkflowInspector check={check} />;
  if (selected?.type === "agent" && selected.agent) {
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
        <div className="inspector__body">{content}</div>
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

function TerminalInspector({ nodeId }: { nodeId: string }) {
  const { t } = useTranslation();
  const node = useEditor((s) => s.nodes.find((item) => item.id === nodeId))!;
  const { updateNode, removeNodes } = useEditor.getState();
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
        <IconButton icon={Trash2} label={t("editor.inspector.deleteNode")} onClick={() => removeNodes([node.id])} />
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
      {isStart ? <FormEditor node={node} /> : <OutputFilesEditor node={node} />}
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
      {workflowId ? <WorkflowDependencies workflowId={workflowId} workflow={toWorkflow()} /> : null}
      {check ? (
        <section className="check-panel" aria-label={t("editor.inspector.problemsLabel")}>
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
