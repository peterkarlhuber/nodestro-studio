import { Handle, type NodeProps, Position } from "@xyflow/react";
import { FileText, Flag, GitBranch, Hand, Play, ShieldCheck, Workflow } from "lucide-react";
import { type ReactNode, memo } from "react";
import { useTranslation } from "react-i18next";

import type { NodeRun, WorkflowNode } from "../api/types";
import { useMeta, useWorkflows } from "../api/hooks";
import { agentIcon } from "../components/icons";
import { StatusBadge, Tooltip } from "../components/ui";
import { formatCost, formatTokens } from "../lib/format";
import { findModel } from "../lib/providers";

export interface FlowNodeData extends Record<string, unknown> {
  node: WorkflowNode;
  state?: NodeRun;
  issues: number;
}

function modelLabel(models: { id: string; label: string }[] | undefined, id: string) {
  return findModel(models, id)?.label ?? id;
}

/** The loop round of a node that runs again ("Round 2"), shown from the second round on. */
export function roundOf(state: NodeRun | undefined): number | null {
  const last = state?.iteration?.at(-1);
  return last ? last + 1 : null;
}

function Round({ state }: { state?: NodeRun }) {
  const { t } = useTranslation();
  const round = roundOf(state);
  if (round === null) return null;
  return (
    <span className="flow-node__round" data-testid="node-round">
      {t("editor.loop.round", { n: round })}
    </span>
  );
}

function Footer({ state }: { state?: NodeRun }) {
  const { t } = useTranslation();
  if (!state || state.status === "waiting" || !state.usage?.requests) return null;
  return (
    <div className="flow-node__usage">
      {t("runs.tokens", { value: formatTokens(state.usage.total_tokens) })} · {formatCost(state.usage.estimated_cost_usd)}
    </div>
  );
}

export const AgentNode = memo(function AgentNode({ data, selected }: NodeProps) {
  const { node, state, issues } = data as FlowNodeData;
  const { t } = useTranslation();
  const meta = useMeta();
  const agent = node.agent;
  if (!agent) return null;
  const Icon = agentIcon(agent.icon);
  const toolCount = agent.tools.length + agent.server_tools.length;
  const facts = [
    toolCount ? t("editor.nodes.tools", { count: toolCount }) : null,
    agent.knowledge.file_ids.length ? t("editor.nodes.knowledge", { count: agent.knowledge.file_ids.length }) : null,
    agent.memory.mode !== "none" ? t("editor.nodes.memory") : null,
    agent.output.mode === "structured" ? t("editor.nodes.structured") : null,
  ].filter(Boolean);
  const status = state?.status ?? "idle";
  return (
    <div
      className={`nd-node flow-node ${selected ? "nd-node--selected" : ""} ${status === "running" ? "flow-node--running" : ""}`}
      data-testid={`node-${node.id}`}
    >
      <Handle type="target" position={Position.Left} className="port port--in" aria-label={t("editor.nodes.input")} />
      <div className="node-head">
        <div className="node-avatar">
          <Icon size={15} aria-hidden />
        </div>
        <div className="node-head__text">
          <div className="node-title">{node.label || agent.name}</div>
          <div className="node-type">{modelLabel(meta.data?.models, agent.model)}</div>
        </div>
      </div>
      <div className="node-divider" />
      <div className="node-row">
        <span className="node-row__description">{agent.description || t("editor.nodes.agent")}</span>
        <Round state={state} />
        <StatusBadge status={status} />
      </div>
      <div className="node-tools">
        {facts.length ? facts.join(" · ") : t("editor.nodes.noTools")}
        {agent.quality.enabled ? (
          <Tooltip content={t("editor.nodes.judgeTip")}>
            <span className="node-tools__flag">
              <ShieldCheck size={11} aria-hidden /> {t("editor.nodes.judge")}
            </span>
          </Tooltip>
        ) : null}
        {issues ? (
          <Tooltip content={t("editor.nodes.issuesTip")}>
            <span className="node-issues">
              {t("editor.nodes.issues", { count: issues })}
            </span>
          </Tooltip>
        ) : null}
      </div>
      <Footer state={state} />
      <Handle type="source" position={Position.Right} className="port port--out" aria-label={t("editor.nodes.outputPort")} />
    </div>
  );
});

export const StartNode = memo(function StartNode({ data, selected }: NodeProps) {
  const { node, state } = data as FlowNodeData;
  const { t } = useTranslation();
  return (
    <div className={`nd-node flow-node flow-node--terminal ${selected ? "nd-node--selected" : ""}`}>
      <div className="node-head">
        <div className="node-avatar node-avatar--terminal">
          <Play size={14} aria-hidden />
        </div>
        <div className="node-head__text">
          <div className="node-title">{node.label || t("editor.nodes.start")}</div>
          <div className="node-type">{t("editor.palette.startHint")}</div>
        </div>
      </div>
      {state && state.status !== "waiting" ? (
        <div className="node-row">
          <Round state={state} />
          <StatusBadge status={state.status} />
        </div>
      ) : null}
      <Handle type="source" position={Position.Right} className="port port--out" aria-label={t("editor.nodes.outputPort")} />
    </div>
  );
});

export const OutputNode = memo(function OutputNode({ data, selected }: NodeProps) {
  const { node, state } = data as FlowNodeData;
  const { t } = useTranslation();
  const files = node.output?.files ?? [];
  return (
    <div className={`nd-node flow-node flow-node--terminal ${selected ? "nd-node--selected" : ""}`}>
      <Handle type="target" position={Position.Left} className="port port--in" aria-label={t("editor.nodes.input")} />
      <div className="node-head">
        <div className="node-avatar node-avatar--terminal">
          <Flag size={14} aria-hidden />
        </div>
        <div className="node-head__text">
          <div className="node-title">{node.label || t("editor.nodes.output")}</div>
          <div className="node-type">{t("editor.palette.outputHint")}</div>
        </div>
      </div>
      {files.length ? (
        <div className="node-tools">
          <FileText size={11} aria-hidden /> {files.map((file) => file.format.toUpperCase()).join(" · ")}
        </div>
      ) : null}
      {state && state.status !== "waiting" ? (
        <div className="node-row">
          <Round state={state} />
          <StatusBadge status={state.status} />
        </div>
      ) : null}
    </div>
  );
});

function NodeShell({
  node,
  state,
  selected,
  issues,
  icon: Icon,
  type,
  children,
  output = true,
}: FlowNodeData & {
  selected: boolean;
  icon: typeof Play;
  type: string;
  children?: ReactNode;
  output?: boolean;
}) {
  const { t } = useTranslation();
  const status = state?.status ?? "idle";
  const active = status === "running" || status === "awaiting_approval";
  return (
    <div
      className={`nd-node flow-node flow-node--logic ${selected ? "nd-node--selected" : ""} ${active ? "flow-node--running" : ""}`}
      data-testid={`node-${node.id}`}
    >
      <Handle type="target" position={Position.Left} className="port port--in" aria-label={t("editor.nodes.input")} />
      <div className="node-head">
        <div className="node-avatar node-avatar--logic">
          <Icon size={14} aria-hidden />
        </div>
        <div className="node-head__text">
          <div className="node-title">{node.label}</div>
          <div className="node-type">{type}</div>
        </div>
        <Round state={state} />
        {state && state.status !== "waiting" ? <StatusBadge status={state.status} /> : null}
      </div>
      {children}
      {issues ? (
        <div className="node-tools">
          <Tooltip content={t("editor.nodes.issuesTip")}>
            <span className="node-issues">{t("editor.nodes.issues", { count: issues })}</span>
          </Tooltip>
        </div>
      ) : null}
      {output ? (
        <Handle type="source" position={Position.Right} className="port port--out" aria-label={t("editor.nodes.outputPort")} />
      ) : null}
    </div>
  );
}

/** One outgoing branch with its own port; the port id is what a connection stores as ``source_handle``. */
function Branch({ id, label, taken, tone }: { id: string; label: string; taken?: boolean; tone?: string }) {
  const { t } = useTranslation();
  return (
    <div className={`node-branch ${taken ? "node-branch--taken" : ""} ${tone ? `node-branch--${tone}` : ""}`}>
      <span className="node-branch__label">{label}</span>
      <Handle
        type="source"
        id={id}
        position={Position.Right}
        className="port port--out port--branch"
        aria-label={t("editor.nodes.branchPort", { name: label })}
      />
    </div>
  );
}

/** Whether a run went along this branch of a decision or approval node. */
export function isBranchTaken(state: NodeRun | undefined, handle: string): boolean {
  if (!state) return false;
  if (state.decision) return state.decision.branches.includes(handle);
  if (state.approval) return state.approval.decision === handle;
  return false;
}

/** The label of a branch of a decision or approval node, as shown on the node and on its connections. */
export function branchLabel(
  node: WorkflowNode,
  handle: string | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (!handle) return "";
  if (node.type === "approval") return handle === "rejected" ? t("editor.approval.rejected") : t("editor.approval.approved");
  if (node.type !== "condition") return "";
  if (handle === "default") return node.condition?.default_label || t("editor.condition.otherwise");
  const index = node.condition?.rules.findIndex((rule) => rule.id === handle) ?? -1;
  if (index < 0) return handle;
  return node.condition?.rules[index].label || t("editor.condition.branchN", { n: index + 1 });
}

export const ConditionNode = memo(function ConditionNode({ data, selected }: NodeProps) {
  const flow = data as FlowNodeData;
  const { t } = useTranslation();
  const config = flow.node.condition;
  const taken = new Set(flow.state?.decision?.branches ?? []);
  const rules = config?.rules ?? [];
  return (
    <NodeShell {...flow} selected={selected} icon={GitBranch} type={t("editor.nodes.condition")} output={false}>
      <div className="node-divider" />
      <div className="node-branches">
        {rules.map((rule) => (
          <Branch key={rule.id} id={rule.id} label={branchLabel(flow.node, rule.id, t)} taken={taken.has(rule.id)} />
        ))}
        <Branch id="default" label={branchLabel(flow.node, "default", t)} taken={taken.has("default")} tone="muted" />
      </div>
    </NodeShell>
  );
});

export const ApprovalNode = memo(function ApprovalNode({ data, selected }: NodeProps) {
  const flow = data as FlowNodeData;
  const { t } = useTranslation();
  const decision = flow.state?.approval?.decision;
  return (
    <NodeShell {...flow} selected={selected} icon={Hand} type={t("editor.nodes.approval")} output={false}>
      <div className="node-divider" />
      <div className="node-branches">
        <Branch id="approved" label={t("editor.approval.approved")} taken={decision === "approved"} />
        <Branch id="rejected" label={t("editor.approval.rejected")} taken={decision === "rejected"} tone="danger" />
      </div>
    </NodeShell>
  );
});

export const SubworkflowNode = memo(function SubworkflowNode({ data, selected }: NodeProps) {
  const flow = data as FlowNodeData;
  const { t } = useTranslation();
  const workflows = useWorkflows();
  const config = flow.node.subworkflow;
  const target = workflows.data?.find((item) => item.id === config?.workflow_id);
  const name = target?.name ?? (config?.workflow_id ? t("editor.subworkflow.missing") : t("editor.subworkflow.none"));
  return (
    <NodeShell {...flow} selected={selected} icon={Workflow} type={t("editor.nodes.subworkflow")}>
      <div className="node-divider" />
      <div className="node-row">
        <span className="node-row__description">{name}</span>
        <span className="node-type">
          {config?.version ? t("editor.subworkflow.versionN", { n: config.version }) : t("editor.subworkflow.latest")}
        </span>
      </div>
    </NodeShell>
  );
});

export const nodeTypes = {
  agent: AgentNode,
  start: StartNode,
  output: OutputNode,
  condition: ConditionNode,
  approval: ApprovalNode,
  subworkflow: SubworkflowNode,
};
