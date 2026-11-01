import { AlertTriangle, BookOpen, Brain, ChevronRight, ExternalLink, History, ShieldCheck, Wrench } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useKnowledge } from "../api/hooks";
import type { AdoptSource, KnowledgeProposal, KnowledgeRef, NodeRun, Run, WorkflowNode } from "../api/types";
import { AdoptDialog } from "../components/AdoptDialog";
import { Output, outputFieldsOf } from "../components/Markdown";
import { Badge, Button, Callout, HelpTip, StatusBadge, Tooltip } from "../components/ui";
import { ApprovalCard } from "../runs/ApprovalCard";
import { NodeToolApprovals, ToolCallApprovalNote } from "../runs/ToolApprovalCard";
import { ProblemText, runProblem } from "../lib/errors";
import { formatCost, formatDuration, formatTime, formatNumber, formatTokens, tokenBreakdown } from "../lib/format";
import { type AgentContext, ContextView } from "./ContextView";
import { branchLabel } from "./nodes";
import { OrchestrationView } from "./OrchestrationView";

type RunTab = "result" | "prompt" | "context" | "tools" | "thinking" | "memory";

/** The run's start files, if this node got them (no inputs, or an input from the start node). */
export function startFiles(run: Run, nodeId: string): string[] {
  const sources = run.workflow.edges.filter((edge) => edge.target === nodeId).map((edge) => edge.source);
  const starts = new Set(run.workflow.nodes.filter((node) => node.type === "start").map((node) => node.id));
  return !sources.length || sources.some((source) => starts.has(source)) ? run.file_ids : [];
}

/** The context an agent had in a run, from the configuration stored with the run and its prompt. */
function RunContext({ node, state, runFiles }: { node: WorkflowNode; state: NodeRun; runFiles: string[] }) {
  const { t } = useTranslation();
  const knowledge = useKnowledge();
  const agent = node.agent!;
  const refs = (ids: string[]): KnowledgeRef[] =>
    ids.map((id) => {
      const file = knowledge.data?.find((item) => item.id === id);
      return { id, name: file?.name ?? null, missing: knowledge.data !== undefined && !file };
    });
  const context: AgentContext = {
    model: agent.model,
    system_prompt: agent.system_prompt,
    segments: [{ kind: "text", text: state.prompt ?? "–", node_id: null, label: null, truncated: false }],
    examples: agent.messages.filter((message) => message.content.trim()),
    tools: agent.tools,
    server_tools: agent.server_tools,
    knowledge_mode: agent.knowledge.mode,
    knowledge: refs(agent.knowledge.file_ids),
    // Runs record what each agent received and how; older runs only know the file ids.
    run_files: state.files?.length
      ? state.files.map((file) => ({
          id: file.file_id,
          name: file.name,
          missing: false,
          mode: file.mode,
          format: file.format,
          source: file.source,
          chars: file.chars,
          notes: file.notes,
        }))
      : refs(runFiles),
    memory_mode: agent.memory.mode,
    memory_space: agent.memory.space,
    memory_files: null,
    output: agent.output,
    quality: agent.quality.enabled,
    request_options: agent.request_options,
  };
  return (
    <>
      <p className="muted small">{t("context.runNote")}</p>
      <ContextView context={context} />
    </>
  );
}

/** Everything one node did in a run: prompt, live text, tool calls, result, memory, usage. */
/** How a decision node decided: the value it saw, each rule's result and the branches it opened. */
function DecisionView({ node, state }: { node: WorkflowNode; state: NodeRun }) {
  const { t } = useTranslation();
  const decision = state.decision;
  if (!decision) return null;
  return (
    <div className="decision-view">
      <p>
        {t("flow.run.branches", {
          names: decision.branches.map((handle) => branchLabel(node, handle, t)).join(", ") || "–",
        })}
      </p>
      {decision.fallback_code ? (
        <Callout tone="warning">
          {t("flow.run.fallback")} <ProblemText item={{ code: decision.fallback_code, params: decision.fallback_params }} compact />
        </Callout>
      ) : null}
      <ul className="decision-view__rules">
        {(node.condition?.rules ?? []).map((rule) => {
          const result = decision.results[rule.id];
          return (
            <li key={rule.id}>
              <Badge tone={result === true ? "success" : result === false ? "idle" : "warning"}>
                {result === true ? t("flow.run.holds") : result === false ? t("flow.run.notHolds") : t("flow.run.notEvaluable")}
              </Badge>{" "}
              {branchLabel(node, rule.id, t)}
            </li>
          );
        })}
      </ul>
      <span className="nd-field-label">{t("flow.run.value")}</span>
      <Output value={decision.value} />
    </div>
  );
}

/** What is special about a decision, approval or sub-workflow step in a run. */
export function FlowNodeDetails({ run, node, state }: { run?: Run; node: WorkflowNode; state: NodeRun }) {
  const { t } = useTranslation();
  return (
    <>
      {state.reused_from ? (
        <Callout tone="info">
          <History size={13} aria-hidden /> {t("flow.run.reused")}{" "}
          <Link to={`/executions/${state.reused_from}`}>{t("flow.run.openEarlier")}</Link>
        </Callout>
      ) : null}
      {node.type === "condition" ? <DecisionView node={node} state={state} /> : null}
      {node.type === "approval" && state.approval ? (
        <Callout tone={state.approval.decision === "approved" ? "brand" : "warning"}>
          <strong>
            {state.approval.decision === "approved" ? t("flow.run.approved") : t("flow.run.rejected")}
          </strong>{" "}
          · {formatTime(state.approval.decided_at)} · {t("flow.run.decidedBy")}
          {state.approval.reused_from ? ` · ${t("flow.run.decisionReused")}` : ""}
          {state.approval.comment ? <blockquote className="approval-comment">{state.approval.comment}</blockquote> : null}
        </Callout>
      ) : null}
      {node.type === "approval" && state.status === "awaiting_approval" && run ? (
        <ApprovalCard runId={run.id} nodeId={node.id} />
      ) : null}
      {node.type === "orchestrator" ? <OrchestrationView node={node} state={state} run={run ?? undefined} /> : null}
      {state.status === "running" && run ? <NodeToolApprovals runId={run.id} nodeId={node.id} /> : null}
      {node.type === "subworkflow" && state.child_run_id ? (
        <p>
          <Link to={`/executions/${state.child_run_id}`}>
            {t("flow.run.childRun")} <ExternalLink size={11} aria-hidden />
          </Link>
          {state.child_version ? (
            <span className="muted small"> · {t("editor.subworkflow.versionN", { n: state.child_version })}</span>
          ) : null}
        </p>
      ) : null}
    </>
  );
}

interface NodeRunDetailsProps {
  node: WorkflowNode;
  state: NodeRun;
  /** Files given at the start of the run (agents fed by the start node see them). */
  runFiles?: string[];
  run?: Run;
}

/** The details of a node's result; a node inside a loop offers each of its rounds. */
export function NodeRunDetails(props: NodeRunDetailsProps) {
  const { t } = useTranslation();
  const rounds = [...(props.state.earlier ?? []), props.state];
  const [picked, setPicked] = useState<number | null>(null);
  if (rounds.length < 2) return <NodeRoundDetails {...props} />;
  const index = picked !== null && picked < rounds.length ? picked : rounds.length - 1;
  return (
    <div className="node-rounds">
      <div className="node-rounds__picker" role="group" aria-label={t("editor.loop.rounds")}>
        {rounds.map((round, position) => (
          <button
            key={position}
            type="button"
            className={`chip ${position === index ? "chip--active" : ""}`}
            aria-pressed={position === index}
            onClick={() => setPicked(position)}
            data-testid="round-pick"
          >
            {t("editor.loop.round", { n: (round.iteration?.at(-1) ?? position) + 1 })}
          </button>
        ))}
      </div>
      <NodeRoundDetails key={index} {...props} state={rounds[index]} />
    </div>
  );
}

function NodeRoundDetails({ node, state, runFiles = [], run }: NodeRunDetailsProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<RunTab>("result");
  const tabs: { id: RunTab; label: string }[] = [
    { id: "result", label: t("runs.tabs.result") },
    ...(node.agent ? [{ id: "prompt" as const, label: t("runs.tabs.prompt") }] : []),
    ...(node.agent ? [{ id: "context" as const, label: t("runs.tabs.context") }] : []),
    ...(node.agent ? [{ id: "tools" as const, label: t("runs.tabs.tools", { count: state.tool_calls.length }) }] : []),
    ...(state.thinking ? [{ id: "thinking" as const, label: t("runs.tabs.thinking") }] : []),
    ...(state.memory && Object.keys(state.memory).length ? [{ id: "memory" as const, label: t("runs.tabs.memory") }] : []),
  ];
  const live = state.status === "running" ? state.text : null;
  const [adopting, setAdopting] = useState<AdoptSource[] | null>(null);
  return (
    <div className="node-run">
      <AdoptDialog
        open={adopting !== null}
        onClose={() => setAdopting(null)}
        sources={adopting ?? []}
        collection={node.agent?.knowledge_proposals?.collection ?? ""}
      />
      <div className="node-run__head">
        <div>
          <strong>{node.label}</strong>
          <span className="muted small">
            {" "}
            · {formatDuration(state.started_at, state.finished_at)} ·{" "}
            <Tooltip content={tokenBreakdown(state.usage)}>
              <span className="has-tip" tabIndex={0}>{t("runs.tokens", { value: formatTokens(state.usage.total_tokens) })}</span>
            </Tooltip>{" "}
            · {t("runs.requests", { count: state.usage.requests, value: formatNumber(state.usage.requests) })} · {formatCost(state.usage.estimated_cost_usd)}
          </span>
          {state.started_at ? (
            <div className="muted small">
              {t("runs.startedAt", { time: formatTime(state.started_at) })}
              {state.finished_at ? ` · ${t("runs.finishedAt", { time: formatTime(state.finished_at) })}` : ""}
            </div>
          ) : null}
        </div>
        <StatusBadge status={state.status} />
      </div>
      <FlowNodeDetails run={run} node={node} state={state} />
      {state.error ? (
        <Callout tone={state.status === "failed" ? "danger" : "warning"}>
          <ProblemText item={runProblem(state)} />
        </Callout>
      ) : null}
      {state.evaluation ? (
        <Callout tone={state.evaluation.passed ? "brand" : "warning"}>
          <ShieldCheck size={13} aria-hidden />{" "}
          {t(state.evaluation.passed ? "runs.evaluation.passed" : "runs.evaluation.failed", {
            count: state.evaluation.attempts,
          })}{" "}
          <HelpTip id="runs.evaluation" label={t("agent.quality.title")} />
          <details>
            <summary>{t("runs.evaluation.feedback")}</summary>
            <pre className="code-block code-block--prose">{state.evaluation.feedback}</pre>
          </details>
        </Callout>
      ) : null}
      {run && state.proposals?.length ? (
        <Proposals run={run} node={node} proposals={state.proposals} onAdopt={setAdopting} />
      ) : null}
      <div className="tabs" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "selected" : undefined}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="tab-panel" role="tabpanel">
        {tab === "result" ? (
          live !== null ? (
            <div className="live-text">
              <Output value={live || "…"} />
            </div>
          ) : (
            <>
              <Output value={state.output} fields={node.agent?.output?.fields} />
              {run && !run.imported_at && node.agent && state.status === "succeeded" ? (
                <div className="row-gap">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={BookOpen}
                    onClick={() => setAdopting([{ kind: "node_output", run_id: run.id, node_id: node.id }])}
                  >
                    {t("inputs.adopt.result")}
                  </Button>
                  <HelpTip id="inputs.adopt" label={t("inputs.adopt.title")} />
                </div>
              ) : null}
            </>
          )
        ) : null}
        {tab === "prompt" ? (
          <>
            <p className="muted small">{t("runs.promptHint")}</p>
            <pre className="code-block code-block--prose">{state.prompt ?? "–"}</pre>
          </>
        ) : null}
        {tab === "context" && node.agent ? <RunContext node={node} state={state} runFiles={runFiles} /> : null}
        {tab === "thinking" ? <pre className="code-block code-block--prose">{state.thinking}</pre> : null}
        {tab === "tools" ? <ToolCalls state={state} /> : null}
        {tab === "memory" && state.memory ? (
          <div className="stack-sm">
            {Object.entries(state.memory).map(([path, content]) => (
              <div key={path}>
                <div className="small">
                  <Brain size={12} aria-hidden /> <code>{path}</code>
                </div>
                <pre className="code-block code-block--prose">{content}</pre>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** What the agent proposed for knowledge: nothing is stored before a person confirms it. */
function Proposals({
  run,
  node,
  proposals,
  onAdopt,
}: {
  run: Run;
  node: WorkflowNode;
  proposals: KnowledgeProposal[];
  onAdopt: (sources: AdoptSource[]) => void;
}) {
  const { t } = useTranslation();
  const open = proposals.filter((item) => !item.adopted_file_id);
  const source = (item: KnowledgeProposal): AdoptSource => ({ kind: "proposal", run_id: run.id, node_id: node.id, proposal_id: item.id });
  return (
    <Callout tone="brand">
      <div className="row-between">
        <strong>
          {t("inputs.proposals.title", { count: proposals.length })} <HelpTip id="inputs.proposals" label={t("inputs.proposals.label")} />
        </strong>
        {open.length > 1 && !run.imported_at ? (
          <Button size="sm" icon={BookOpen} onClick={() => onAdopt(open.map(source))}>
            {t("inputs.proposals.reviewAll", { count: open.length })}
          </Button>
        ) : null}
      </div>
      <ul className="proposal-list">
        {proposals.map((item) => (
          <li key={item.id}>
            <details>
              <summary>
                {item.title} <Badge tone="idle">{t(`inputs.adopt.kinds.${item.content_kind}`)}</Badge>
              </summary>
              <pre className="code-block code-block--prose">{item.content}</pre>
            </details>
            {item.adopted_file_id ? (
              <Badge tone="success">{t("inputs.proposals.adopted")}</Badge>
            ) : run.imported_at ? null : (
              <Button size="sm" variant="ghost" icon={BookOpen} onClick={() => onAdopt([source(item)])}>
                {t("inputs.proposals.review")}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <p className="small muted">{t("inputs.proposals.note")}</p>
    </Callout>
  );
}

function ToolCalls({ state }: { state: NodeRun }) {
  const { t } = useTranslation();
  if (!state.tool_calls.length) return <p className="muted">{t("runs.toolCalls.none")}</p>;
  return (
    <ol className="tool-calls">
      {state.tool_calls.map((call) => (
        <li key={call.id}>
          <details>
            <summary>
              <ChevronRight size={13} className="section__chevron" aria-hidden />
              {call.is_error ? <AlertTriangle size={13} aria-hidden className="text-danger" /> : <Wrench size={13} aria-hidden />}
              <code>{call.name}</code>
              <span className="muted small">
                {call.finished_at
                  ? `${call.is_error ? t("runs.toolCalls.error") : t("runs.toolCalls.succeeded")} · ${formatTime(call.started_at)} · ${formatDuration(call.started_at, call.finished_at)}`
                  : state.status === "running"
                    ? t("runs.toolCalls.running")
                    : t("runs.toolCalls.unfinished")}
              </span>
            </summary>
            <div className="tool-calls__body">
              <span className="nd-field-label">{t("runs.toolCalls.input")}</span>
              <pre className="code-block">{JSON.stringify(call.input, null, 2)}</pre>
              {call.provenance?.source === "mcp" ? (
                <p className="muted small" data-testid="tool-provenance">
                  {t("runs.toolCalls.mcp", {
                    server: call.provenance.server_name ?? "",
                    name: call.provenance.qualified_name ?? call.name,
                    hash: (call.provenance.definition_hash ?? "").slice(0, 12),
                  })}{" "}
                  {call.provenance.external_cost === "unknown" ? t("runs.toolCalls.externalCostUnknown") : null}
                </p>
              ) : null}
              {call.approval ? <ToolCallApprovalNote approval={call.approval} /> : null}
              <span className="nd-field-label">{t("runs.toolCalls.output")}</span>
              <pre className={`code-block ${call.is_error ? "code-block--error" : ""}`}>{call.output ?? "…"}</pre>
            </div>
          </details>
        </li>
      ))}
    </ol>
  );
}

export function RunOutput({ run }: { run: Run }) {
  return <Output value={run.output} fields={outputFieldsOf(run.workflow.nodes, "", run.output)} />;
}
