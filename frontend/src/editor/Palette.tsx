import type { TFunction } from "i18next";
import { Bot, Flag, GitBranch, Hand, Network, PanelLeftClose, PanelLeftOpen, Play, Sparkles, Users, Workflow } from "lucide-react";
import { type DragEvent, type Ref } from "react";
import { useTranslation } from "react-i18next";

import { useTemplates, useWorkflows } from "../api/hooks";
import type { AgentConfig, NodeType } from "../api/types";
import { agentIcon } from "../components/icons";
import { HelpTip, Tooltip } from "../components/Tooltip";
import { IconButton } from "../components/ui";
import { helpEntry } from "../lib/help";
import { DRAG_TYPE, type DragPayload } from "./Canvas";
import { useEditorLayout } from "./layout";
import { useEditor } from "./store";

/** What a team can do and delivers, in one line. */
function teamHint(t: TFunction, capabilities: string[], contract: string[]): string {
  const parts = [];
  if (capabilities.length) parts.push(capabilities.join(", "));
  if (contract.length) parts.push(t("editor.palette.teamDelivers", { fields: contract.join(", ") }));
  return parts.join(" · ");
}

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
  compact,
}: {
  icon: typeof Bot;
  label: string;
  hint: string;
  payload: DragPayload;
  /** Only the icon (collapsed palette); the name moves into the tooltip and the accessible name. */
  compact: boolean;
}) {
  const { t } = useTranslation();
  const onDragStart = (event: DragEvent) => {
    event.dataTransfer.setData(DRAG_TYPE, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "move";
  };
  const tip = t("editor.palette.itemTip", { hint });
  return (
    <Tooltip content={compact ? `${label}: ${tip}` : tip}>
      <button
        type="button"
        className="palette__item"
        draggable
        aria-label={compact ? label : undefined}
        onDragStart={onDragStart}
        onClick={() => useEditor.getState().addNode(payload.type, place(), payload.agent, payload.team)}
      >
        <span className="palette__icon">
          <Icon size={14} aria-hidden />
        </span>
        {compact ? null : (
          <span>
            <strong>{label}</strong>
            <small>{hint}</small>
          </span>
        )}
      </button>
    </Tooltip>
  );
}

export function Palette({ onDesign, panelRef }: { onDesign: () => void; panelRef?: Ref<HTMLElement> }) {
  const { t } = useTranslation();
  // Open or collapsed, and the width, are a layout preference of this browser (see layout.ts).
  const open = useEditorLayout((state) => state.open.palette);
  const compact = !open;
  const design = helpEntry(t, "workflow.paletteDesign");
  const templates = useTemplates();
  const workflowId = useEditor((s) => s.workflowId);
  // Teams: other workflows that promise a result (output contract) or name their capabilities.
  const teams = (useWorkflows().data ?? []).filter(
    (item) => item.id !== workflowId && ((item.contract?.length ?? 0) > 0 || (item.capabilities?.length ?? 0) > 0),
  );
  const add = (type: NodeType, agent?: Partial<AgentConfig>) => ({ type, agent });
  return (
    <aside
      ref={panelRef}
      id="editor-palette"
      className={`palette ${open ? "" : "palette--collapsed"}`}
      aria-label={t("editor.palette.title")}
      data-testid="palette"
    >
      <div className="panel-head palette__head">
        {open ? (
          <h2 className="panel-head__title">
            {t("editor.palette.title")} <HelpTip id="workflow.palette" label={t("editor.palette.title")} />
          </h2>
        ) : null}
        <IconButton
          icon={open ? PanelLeftClose : PanelLeftOpen}
          label={open ? t("editor.panels.hidePalette") : t("editor.panels.showPalette")}
          className="palette__toggle"
          aria-expanded={open}
          aria-controls="editor-palette"
          onClick={() => useEditorLayout.getState().toggle("palette")}
        />
      </div>
      <div className="palette__items">
        <Item compact={compact} icon={Bot} label={t("editor.nodes.agent")} hint={t("editor.palette.emptyAgent")} payload={add("agent")} />
        <Tooltip content={compact ? `${t("editor.palette.describe")}: ${design.text}` : design.text} doc={design.doc}>
          <button type="button" className="palette__item" onClick={onDesign} aria-label={compact ? t("editor.palette.describe") : undefined}>
            <span className="palette__icon palette__icon--brand">
              <Sparkles size={14} aria-hidden />
            </span>
            {compact ? null : (
              <span>
                <strong>{t("editor.palette.describe")}</strong>
                <small>{t("editor.palette.describeHint")}</small>
              </span>
            )}
          </button>
        </Tooltip>
        <Item compact={compact} icon={Play} label={t("editor.nodes.start")} hint={t("editor.palette.startHint")} payload={add("start")} />
        <Item compact={compact} icon={Flag} label={t("editor.nodes.output")} hint={t("editor.palette.outputHint")} payload={add("output")} />
        {compact ? <hr className="palette__divider" /> : <div className="palette__label">{t("editor.palette.flow")}</div>}
        <Item
          compact={compact}
          icon={GitBranch}
          label={t("editor.nodes.condition")}
          hint={t("editor.palette.conditionHint")}
          payload={add("condition")}
        />
        <Item compact={compact} icon={Hand} label={t("editor.nodes.approval")} hint={t("editor.palette.approvalHint")} payload={add("approval")} />
        <Item
          compact={compact}
          icon={Workflow}
          label={t("editor.nodes.subworkflow")}
          hint={t("editor.palette.subworkflowHint")}
          payload={add("subworkflow")}
        />
        <Item
          compact={compact}
          icon={Network}
          label={t("editor.nodes.orchestrator")}
          hint={t("editor.palette.orchestratorHint")}
          payload={add("orchestrator")}
        />
        {/* Teams and the library need names to be recognisable, so the collapsed palette leaves them out. */}
        {!compact && teams.length ? (
          <div className="palette__label">
            {t("editor.palette.teams")} <HelpTip id="workflow.contract" label={t("editor.palette.teams")} />
          </div>
        ) : null}
        {compact
          ? null
          : teams.slice(0, 8).map((team) => (
              <Item
                key={team.id}
                compact={false}
                icon={Users}
                label={team.name}
                hint={teamHint(t, team.capabilities ?? [], team.contract ?? [])}
                payload={{ type: "subworkflow", team: { workflow_id: team.id, name: team.name } }}
              />
            ))}
        {!compact && templates.data?.length ? <div className="palette__label">{t("editor.palette.library")}</div> : null}
        {compact
          ? null
          : templates.data?.slice(0, 8).map((template) => (
              <Item
                key={template.id}
                compact={false}
                icon={agentIcon(template.agent.icon)}
                label={template.agent.name}
                hint={template.agent.description || template.agent.model}
                payload={add("agent", template.agent)}
              />
            ))}
      </div>
    </aside>
  );
}
