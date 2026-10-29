import { Bot, ChevronDown, Flag, GitBranch, Hand, Play, Sparkles, Workflow } from "lucide-react";
import { type DragEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { useTemplates } from "../api/hooks";
import type { AgentConfig, NodeType } from "../api/types";
import { agentIcon } from "../components/icons";
import { HelpTip, Tooltip } from "../components/Tooltip";
import { helpEntry } from "../lib/help";
import { DRAG_TYPE, type DragPayload } from "./Canvas";
import { useEditor } from "./store";

function place(): { x: number; y: number } {
  const nodes = useEditor.getState().nodes;
  if (!nodes.length) return { x: 0, y: 0 };
  const right = Math.max(...nodes.map((node) => node.position.x));
  const lowest = nodes.filter((node) => node.position.x === right).map((node) => node.position.y);
  return { x: right + 320, y: Math.min(...lowest) };
}

function Item({
  icon: Icon,
  label,
  hint,
  payload,
}: {
  icon: typeof Bot;
  label: string;
  hint: string;
  payload: DragPayload;
}) {
  const { t } = useTranslation();
  const onDragStart = (event: DragEvent) => {
    event.dataTransfer.setData(DRAG_TYPE, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "move";
  };
  return (
    <Tooltip content={t("editor.palette.itemTip", { hint })}>
    <button
      type="button"
      className="palette__item"
      draggable
      onDragStart={onDragStart}
      onClick={() => useEditor.getState().addNode(payload.type, place(), payload.agent)}
    >
      <span className="palette__icon">
        <Icon size={14} aria-hidden />
      </span>
      <span>
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
    </button>
    </Tooltip>
  );
}

export function Palette({ onDesign }: { onDesign: () => void }) {
  const { t } = useTranslation();
  // Collapsed whenever the editor opens; the choice holds while editing and is not stored.
  const [open, setOpen] = useState(false);
  const design = helpEntry(t, "workflow.paletteDesign");
  const templates = useTemplates();
  const add = (type: NodeType, agent?: Partial<AgentConfig>) => ({ type, agent });
  return (
    <div className={`palette ${open ? "" : "palette--closed"}`}>
      <div className="palette__head">
        <button type="button" className="palette__toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
          {t("editor.palette.title")} <ChevronDown size={14} aria-hidden />
        </button>
        <HelpTip id="workflow.palette" label={t("editor.palette.title")} />
      </div>
      {open ? (
        <div className="palette__items">
          <Item icon={Bot} label={t("editor.nodes.agent")} hint={t("editor.palette.emptyAgent")} payload={add("agent")} />
          <Tooltip content={design.text} doc={design.doc}>
          <button type="button" className="palette__item" onClick={onDesign}>
            <span className="palette__icon palette__icon--brand">
              <Sparkles size={14} aria-hidden />
            </span>
            <span>
              <strong>{t("editor.palette.describe")}</strong>
              <small>{t("editor.palette.describeHint")}</small>
            </span>
          </button>
          </Tooltip>
          <Item icon={Play} label={t("editor.nodes.start")} hint={t("editor.palette.startHint")} payload={add("start")} />
          <Item icon={Flag} label={t("editor.nodes.output")} hint={t("editor.palette.outputHint")} payload={add("output")} />
          <div className="palette__label">{t("editor.palette.flow")}</div>
          <Item icon={GitBranch} label={t("editor.nodes.condition")} hint={t("editor.palette.conditionHint")} payload={add("condition")} />
          <Item icon={Hand} label={t("editor.nodes.approval")} hint={t("editor.palette.approvalHint")} payload={add("approval")} />
          <Item
            icon={Workflow}
            label={t("editor.nodes.subworkflow")}
            hint={t("editor.palette.subworkflowHint")}
            payload={add("subworkflow")}
          />
          {templates.data?.length ? <div className="palette__label">{t("editor.palette.library")}</div> : null}
          {templates.data?.slice(0, 8).map((template) => (
            <Item
              key={template.id}
              icon={agentIcon(template.agent.icon)}
              label={template.agent.name}
              hint={template.agent.description || template.agent.model}
              payload={add("agent", template.agent)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
