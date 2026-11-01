import { Handle, type NodeProps, Position } from "@xyflow/react";
import { AlertTriangle, FileText, Flag, GitBranch, Hand, Network, Play, ShieldCheck, Workflow, XCircle } from "lucide-react";
import { type ReactNode, memo } from "react";
import { useTranslation } from "react-i18next";

import type { NodeRun, WorkflowNode } from "../api/types";
import { useMeta, useWorkflows } from "../api/hooks";
import { agentIcon } from "../components/icons";
import { StatusBadge, Tooltip } from "../components/ui";
import { WaitingForYouBadge } from "../runs/WaitingForYouBadge";
import { formatCost, formatTokens } from "../lib/format";
import { waitsForToolApproval } from "./store";
import { modelName } from "../components/ModelPicker";
import { branchLabel } from "./branches";

export interface FlowNodeData extends Record<string, unknown> {
  node: WorkflowNode;
  state?: NodeRun;
  /** Errors of the workflow check on this node (they block the start). */
  issues: number;
  /** Warnings of the workflow check on this node. */
  warnings?: number;
  /** The workflow cannot start for a reason outside the nodes (e.g. a provider without a key). */
  blocked?: boolean;
  /** A read-only picture (the example preview): it never runs, so it shows no run state, not even "Ready" (F11). */
  preview?: boolean;
}

/** Errors and warnings of the check on a node: icon, count and words, never colour alone. */
export function NodeProblems({ issues, warnings = 0 }: { issues: number; warnings?: number }) {
  const { t } = useTranslation();
  if (!issues && !warnings) return null;
  return (
    <span className="node-problems" data-testid="node-problems">
      {issues ? (
        <Tooltip content={t("editor.nodes.issuesTip")}>
          <span className="node-issues" data-level="error">
            <XCircle size={11} aria-hidden /> {t("editor.nodes.issues", { count: issues })}
          </span>
        </Tooltip>
      ) : null}
      {warnings ? (
        <Tooltip content={t("editor.nodes.warningsTip")}>
          <span className="node-issues node-issues--warning" data-level="warning">
            <AlertTriangle size={11} aria-hidden /> {t("editor.nodes.warnings", { count: warnings })}
          </span>
        </Tooltip>
      ) : null}
    </span>
  );
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
  const { node, state, issues, warnings, blocked, preview } = data as FlowNodeData;
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
      <Handle type="target" position={Position.Left} className="port port--in" />
      <div className="node-head">
        <div className="node-avatar">
          <Icon size={15} aria-hidden />
        </div>
        <div className="node-head__text">
          <div className="node-title">{node.label || agent.name}</div>
          <div className="node-type">{modelName(meta.data?.models, agent.model)}</div>
        </div>
      </div>
      <div className="node-divider" />
      <div className="node-row">
        <span className="node-row__description">{agent.description || t("editor.nodes.agent")}</span>
        <Round state={state} />
        {waitsForToolApproval(state) ? (
          <WaitingForYouBadge />
        ) : state || !(blocked || preview) ? (
          // "Ready" would be wrong while the workflow cannot start at all.
          <StatusBadge status={status} />
        ) : null}
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
        <NodeProblems issues={issues} warnings={warnings} />
      </div>
      <Footer state={state} />
      <Handle type="source" position={Position.Right} className="port port--out" />
    </div>
  );
});

export const StartNode = memo(function StartNode({ data, selected }: NodeProps) {
  const { node, state, issues, warnings } = data as FlowNodeData;
  const { t } = useTranslation();
  return (
    <div className={`nd-node flow-node flow-node--terminal ${selected ? "nd-node--selected" : ""}`} data-testid={`node-${node.id}`}>
      <div className="node-head">
        <div className="node-avatar node-avatar--terminal">
          <Play size={14} aria-hidden />
        </div>
        <div className="node-head__text">
          <div className="node-title">{node.label || t("editor.nodes.start")}</div>
          <div className="node-type">{t("editor.palette.startHint")}</div>
        </div>
      </div>
      {issues || warnings ? (
        <div className="node-tools">
          <NodeProblems issues={issues} warnings={warnings} />
        </div>
      ) : null}
      {state && state.status !== "waiting" ? (
        <div className="node-row">
          <Round state={state} />
          <StatusBadge status={state.status} />
        </div>
      ) : null}
      <Handle type="source" position={Position.Right} className="port port--out" />
    </div>
  );
});

export const OutputNode = memo(function OutputNode({ data, selected }: NodeProps) {
  const { node, state, issues, warnings } = data as FlowNodeData;
  const { t } = useTranslation();
  const files = node.output?.files ?? [];
  return (
    <div className={`nd-node flow-node flow-node--terminal ${selected ? "nd-node--selected" : ""}`} data-testid={`node-${node.id}`}>
      <Handle type="target" position={Position.Left} className="port port--in" />
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
      {issues || warnings ? (
        <div className="node-tools">
          <NodeProblems issues={issues} warnings={warnings} />
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
  warnings,
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
  const status = state?.status ?? "idle";
  const active = status === "running" || status === "awaiting_approval";
  return (
    <div
      className={`nd-node flow-node flow-node--logic ${selected ? "nd-node--selected" : ""} ${active ? "flow-node--running" : ""}`}
      data-testid={`node-${node.id}`}
    >
      <Handle type="target" position={Position.Left} className="port port--in" />
      <div className="node-head">
        <div className="node-avatar node-avatar--logic">
          <Icon size={14} aria-hidden />
        </div>
        <div className="node-head__text">
          <div className="node-title">{node.label}</div>
          <div className="node-type">{type}</div>
        </div>
      </div>
      {state && state.status !== "waiting" ? (
        // Its own row, as on agent nodes: next to the title the badge would leave the title one letter wide.
        <div className="node-row node-row--status">
          <Round state={state} />
          <StatusBadge status={state.status} />
        </div>
      ) : null}
      {children}
      {issues || warnings ? (
        <div className="node-tools">
          <NodeProblems issues={issues} warnings={warnings} />
        </div>
      ) : null}
      {output ? (
        <Handle type="source" position={Position.Right} className="port port--out" />
      ) : null}
    </div>
  );
}

/** One outgoing branch with its own port; the port id is what a connection stores as ``source_handle``. */
function Branch({ id, label, taken, tone }: { id: string; label: string; taken?: boolean; tone?: string }) {
  return (
    <div className={`node-branch ${taken ? "node-branch--taken" : ""} ${tone ? `node-branch--${tone}` : ""}`}>
      <span className="node-branch__label">{label}</span>
      <Handle
        type="source"
        id={id}
        position={Position.Right}
        className="port port--out port--branch"
      />
    </div>
  );
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

export const OrchestratorNode = memo(function OrchestratorNode({ data, selected }: NodeProps) {
  const flow = data as FlowNodeData;
  const { t } = useTranslation();
  const config = flow.node.orchestrator;
  const teams = config?.members.length ?? 0;
  const tags = config?.select?.capabilities ?? [];
  return (
    <NodeShell {...flow} selected={selected} icon={Network} type={t("editor.nodes.orchestrator")}>
      <div className="node-divider" />
      <div className="node-row">
        <span className="node-row__description">
          {teams
            ? t("editor.orchestrator.teams", { count: teams })
            : tags.length
              ? t("editor.orchestrator.byCapability", { tags: tags.join(", ") })
              : t("editor.orchestrator.noTeams")}
        </span>
        <span className="node-type">{t("editor.orchestrator.decisions", { count: config?.max_decisions ?? 0 })}</span>
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
  orchestrator: OrchestratorNode,
};
