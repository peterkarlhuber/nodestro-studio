import { AlertTriangle, ArrowRight, Info, XCircle } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useMeta } from "../api/hooks";
import type { ArchitectJob, CheckIssue, ConfigIssue, ToolDraft, WorkflowNode } from "../api/types";
import { agentIcon } from "../components/icons";
import { TextDiff } from "../components/TextDiff";
import { HelpTip } from "../components/Tooltip";
import { Badge, Callout, Chip, Field, TextInput } from "../components/ui";
import { findings } from "../editor/CheckList";
import { ProblemText } from "../lib/errors";
import { formatCost, formatNumber } from "../lib/format";
import { findModel } from "../lib/providers";
import { ArchitectGraph, MarkLegend } from "./ArchitectGraph";
import { type AgentDiff, draftDiff } from "./draftDiff";
import { latestGraph } from "./progress";
import { ToolDraftPanel } from "./ToolDraftPanel";

type Tab = "overview" | "agents" | "flow" | "tools" | "changes";

const KIND_TONE = { added: "success", changed: "running", removed: "danger", kept: "idle" } as const;

function List({ items }: { items: string[] }) {
  const { t } = useTranslation();
  if (!items.length) return <span className="muted">{t("common.none")}</span>;
  return (
    <ul className="architect-list">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

const ISSUE_ICONS = { error: XCircle, warning: AlertTriangle, info: Info };

function Validation({ job }: { job: ArchitectJob }) {
  const { t } = useTranslation();
  const labels = Object.fromEntries((job.draft?.nodes ?? []).map((node) => [node.id, node.label]));
  const shown = findings(job.check ?? undefined).filter((item) => item.item.code !== "check.api_key_missing" && item.item.code !== "check.provider_not_configured");
  const errors = shown.filter((item) => item.level === "error");
  return (
    <section className="stack-sm" data-testid="architect-validation">
      <h4 className="architect-panel__title">
        {t("architect.review.validation")} <HelpTip id="architect.validation" label={t("architect.review.validation")} />
      </h4>
      {!errors.length ? (
        <Callout tone="brand">{t("architect.review.validOk")}</Callout>
      ) : (
        <Callout tone="warning">{t("architect.review.validErrors", { count: errors.length })}</Callout>
      )}
      <p className="muted small">{t("architect.review.notAGuarantee")}</p>
      {shown.length ? (
        <ul className="check-list">
          {shown.map((finding) => {
            const Icon = ISSUE_ICONS[finding.level];
            const name = finding.nodeId ? labels[finding.nodeId] : "";
            return (
              <li key={finding.key} data-level={finding.level}>
                <span className="check-list__item">
                  <Icon size={13} aria-hidden className={`check-list__icon check-list__icon--${finding.level}`} />
                  <span className="check-list__text">
                    {name && !("node_id" in finding.item) ? <strong>{name}: </strong> : null}
                    <ProblemText item={finding.item as CheckIssue | ConfigIssue} compact />
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function Overview({ job, name, onName }: { job: ArchitectJob; name: string; onName: (value: string) => void }) {
  const { t } = useTranslation();
  const graph = latestGraph(job);
  const agents = job.draft?.nodes.filter((node) => node.type === "agent").length ?? 0;
  const pending = job.tool_drafts.filter((tool) => tool.status === "draft");
  return (
    <div className="architect-review__overview">
      {job.mode === "create" ? (
        <Field label={t("architect.review.name")} htmlFor="architect-name">
          <TextInput id="architect-name" value={name} onChange={(event) => onName(event.target.value)} />
        </Field>
      ) : null}
      {job.summary ? <Callout tone="brand">{job.summary}</Callout> : null}
      {pending.length ? (
        <Callout tone="warning">{t("architect.review.toolsPending", { names: pending.map((tool) => tool.name).join(", ") })}</Callout>
      ) : null}
      <div className="architect-review__graph">
        <ArchitectGraph graph={graph} base={job.mode === "revise" ? job.base : null} />
        <MarkLegend marks={graph?.marks ?? {}} />
      </div>
      <dl className="draft__facts">
        {job.analysis ? (
          <>
            <dt>{t("architect.review.goal")}</dt>
            <dd>{job.analysis.goal}</dd>
            <dt>{t("architect.review.inputs")}</dt>
            <dd>
              <List items={job.analysis.inputs} />
            </dd>
            <dt>{t("architect.review.outputs")}</dt>
            <dd>
              <List items={job.analysis.outputs} />
            </dd>
            {job.analysis.constraints.length ? (
              <>
                <dt>{t("architect.review.constraints")}</dt>
                <dd>
                  <List items={job.analysis.constraints} />
                </dd>
              </>
            ) : null}
          </>
        ) : null}
        <dt>{t("architect.review.facts")}</dt>
        <dd data-testid="architect-facts">
          {t("architect.review.factsValue", {
            agents,
            connections: job.draft?.edges.length ?? 0,
            fixes: job.fixes,
            repairs: job.repairs,
          })}
        </dd>
        <dt>{t("architect.review.cost")}</dt>
        <dd>
          {t("architect.review.costValue", {
            cost: formatCost(job.usage.estimated_cost_usd),
            requests: formatNumber(job.usage.requests),
          })}
        </dd>
      </dl>
      <section className="stack-sm">
        <h4 className="architect-panel__title">
          {t("architect.review.assumptions")} <HelpTip id="architect.assumptions" label={t("architect.review.assumptions")} />
        </h4>
        {job.assumptions.length ? <List items={job.assumptions} /> : <p className="muted small">{t("architect.review.noAssumptions")}</p>}
      </section>
      <Validation job={job} />
      {job.notes.length ? (
        <section className="stack-sm">
          <h4 className="architect-panel__title">{t("architect.review.notes")}</h4>
          <ul className="architect-list">
            {job.notes.map((note, index) => (
              <li key={index}>
                <ProblemText item={note} compact />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function FieldDiff({ change }: { change: AgentDiff["fields"][number] }) {
  const { t } = useTranslation();
  if (change.field === "other") return <p className="small muted">{t("architect.review.otherSettings")}</p>;
  return (
    <div className="stack-sm">
      <strong className="small">{t(`architect.field.${change.field}`)}</strong>
      <TextDiff a={change.before} b={change.after} />
    </div>
  );
}

function AgentCard({ node, diff, issues, mode }: { node: WorkflowNode; diff?: AgentDiff; issues: ConfigIssue[]; mode: ArchitectJob["mode"] }) {
  const { t } = useTranslation();
  const meta = useMeta();
  const agent = node.agent!;
  const Icon = agentIcon(agent.icon);
  const model = findModel(meta.data?.models, agent.model)?.label ?? agent.model;
  return (
    <article className={`architect-agent architect-agent--${diff?.kind ?? "added"}`} data-testid={`architect-agent-${node.id}`}>
      <header className="architect-agent__head">
        <span className="card__avatar">
          <Icon size={15} aria-hidden />
        </span>
        <div>
          <h4>{node.label}</h4>
          <p className="muted small">{agent.description}</p>
        </div>
        {mode === "revise" && diff ? <Badge tone={KIND_TONE[diff.kind]}>{t(`architect.kind.${diff.kind}`)}</Badge> : null}
      </header>
      <dl className="draft__facts">
        <dt>{t("agent.model")}</dt>
        <dd>
          <code>{model}</code> · {t("agent.thinking.effortShort")} {t(`agent.options.effortShort.${agent.effort ?? "default"}`)}
        </dd>
        <dt>{t("architect.review.receives")}</dt>
        <dd>{diff?.inputsAfter.length ? diff.inputsAfter.join(", ") : t("common.none")}</dd>
        <dt>{t("agent.tools.title")}</dt>
        <dd className="chip-row">
          {[...agent.tools, ...agent.server_tools].map((tool) => (
            <Chip key={tool}>{tool}</Chip>
          ))}
          {!agent.tools.length && !agent.server_tools.length ? <span className="muted">{t("common.none")}</span> : null}
        </dd>
        {agent.knowledge.file_ids.length ? (
          <>
            <dt>{t("architect.review.knowledge")}</dt>
            <dd>{t("editor.nodes.knowledge", { count: agent.knowledge.file_ids.length })}</dd>
          </>
        ) : null}
        {agent.memory.mode !== "none" ? (
          <>
            <dt>{t("architect.review.memory")}</dt>
            <dd>
              {t(`architect.memory.${agent.memory.mode}`, { space: agent.memory.space ?? "" })}{" "}
              <Badge tone="warning">{t("architect.review.draftResource")}</Badge>
            </dd>
          </>
        ) : null}
        {agent.output.mode === "structured" ? (
          <>
            <dt>{t("architect.review.output")}</dt>
            <dd className="chip-row">
              {agent.output.fields.map((field) => (
                <Chip key={field.name}>
                  {field.name}: {field.type}
                </Chip>
              ))}
            </dd>
          </>
        ) : null}
        <dt>{t("architect.review.limits")}</dt>
        <dd>{t("editor.design.limitsValue", { tokens: formatNumber(agent.max_tokens), rounds: formatNumber(agent.max_tool_rounds) })}</dd>
      </dl>
      <Field label={t("agent.task")}>
        <pre className="code-block code-block--prose">{agent.task_template}</pre>
      </Field>
      <details className="architect-agent__prompt" open={mode === "create" ? undefined : diff?.kind === "added"}>
        <summary>{t("agent.systemPrompt")}</summary>
        <pre className="code-block code-block--prose">{agent.system_prompt}</pre>
      </details>
      {diff && diff.kind === "changed" ? (
        <details className="architect-agent__diff" open>
          <summary>{t("architect.review.whatChanged", { count: diff.fields.length })}</summary>
          {diff.inputsBefore.join("|") !== diff.inputsAfter.join("|") ? (
            <p className="small">
              {t("architect.review.inputsChanged", {
                before: diff.inputsBefore.join(", ") || t("common.none"),
                after: diff.inputsAfter.join(", ") || t("common.none"),
              })}
            </p>
          ) : null}
          {diff.fields.map((change) => (
            <FieldDiff key={change.field} change={change} />
          ))}
        </details>
      ) : null}
      {issues.filter((issue) => issue.level !== "info").map((issue, index) => (
        <p key={index} className={`field__hint ${issue.level === "error" ? "field__hint--error" : ""}`}>
          <ProblemText item={issue} compact />
        </p>
      ))}
    </article>
  );
}

function Flow({ job }: { job: ArchitectJob }) {
  const { t } = useTranslation();
  const diff = useMemo(() => draftDiff(job.mode === "revise" ? job.base : null, job.draft!), [job]);
  return (
    <ul className="architect-flow" data-testid="architect-flow">
      {diff.edges.map((edge) => (
        <li key={edge.key} className={`architect-flow__item architect-flow__item--${edge.kind}`}>
          <span>{edge.source}</span>
          <ArrowRight size={13} aria-hidden />
          <span>{edge.target}</span>
          {job.mode === "revise" && edge.kind !== "kept" ? <Badge tone={KIND_TONE[edge.kind]}>{t(`architect.kind.${edge.kind}`)}</Badge> : null}
        </li>
      ))}
    </ul>
  );
}

function Tools({ job, onTool }: { job: ArchitectJob; onTool: (name: string, draft: ToolDraft | null) => void }) {
  const { t } = useTranslation();
  if (!job.tool_drafts.length && !job.missing_tools.length) return <p className="muted">{t("architect.review.noTools")}</p>;
  // Libraries the drafted tools need: never installed by the architect, approved later per workflow.
  const libraries = [...new Set(job.tool_drafts.flatMap((draft) => draft.dependencies ?? []))].sort();
  return (
    <div className="stack">
      <p className="muted small">
        {t("architect.review.toolsIntro")} <HelpTip id="architect.toolDraft" label={t("architect.review.tabTools")} />
      </p>
      {libraries.length ? (
        <Callout tone="warning">
          <span data-testid="architect-libraries">{t("architect.review.libraries", { names: libraries.join(", ") })}</span>{" "}
          <HelpTip id="python.architect" label={t("python.panel.title")} />
        </Callout>
      ) : null}
      {job.tool_drafts.map((draft) => (
        <ToolDraftPanel key={draft.id} draft={draft} onChange={(next) => onTool(draft.name, next)} />
      ))}
      {job.missing_tools.length ? (
        <Callout tone="warning">
          {t("architect.review.missingTools")}
          <ul>
            {job.missing_tools.map((tool) => (
              <li key={tool.name}>
                <code>{tool.name}</code>: {tool.requirement}
              </li>
            ))}
          </ul>
        </Callout>
      ) : null}
    </div>
  );
}

function Changes({ job }: { job: ArchitectJob }) {
  const { t } = useTranslation();
  const diff = useMemo(() => draftDiff(job.base, job.draft!), [job]);
  const { counts } = diff;
  return (
    <div className="stack" data-testid="architect-changes">
      <Callout tone="brand">{t("architect.review.changeSummary", counts)}</Callout>
      <ul className="architect-changes">
        {diff.agents
          .filter((agent) => agent.kind !== "kept")
          .map((agent) => (
            <li key={agent.nodeId}>
              <Badge tone={KIND_TONE[agent.kind]}>{t(`architect.kind.${agent.kind}`)}</Badge> <strong>{agent.name}</strong>
              {agent.kind === "changed" && agent.fields.length ? (
                <span className="muted small"> · {agent.fields.map((change) => t(`architect.field.${change.field}`)).join(", ")}</span>
              ) : null}
            </li>
          ))}
        {diff.agents.filter((agent) => agent.kind === "kept").length ? (
          <li className="muted small">
            {t("architect.review.keptAgents", {
              names: diff.agents
                .filter((agent) => agent.kind === "kept")
                .map((agent) => agent.name)
                .join(", "),
            })}
          </li>
        ) : null}
      </ul>
    </div>
  );
}

/** Everything to look at before taking a draft: structure, prompts, data flow, tools, checks, changes. */
export function ArchitectReview({
  job,
  name,
  onName,
  onTool,
  extra,
}: {
  job: ArchitectJob;
  name: string;
  onName: (value: string) => void;
  onTool: (name: string, draft: ToolDraft | null) => void;
  extra?: ReactNode;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("overview");
  const draft = job.draft!;
  const diff = useMemo(() => draftDiff(job.mode === "revise" ? job.base : null, draft), [job, draft]);
  const agents = draft.nodes.filter((node) => node.type === "agent" && node.agent);
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: t("architect.review.tabOverview") },
    ...(job.mode === "revise" ? [{ id: "changes" as const, label: t("architect.review.tabChanges") }] : []),
    { id: "agents", label: t("architect.review.tabAgents", { count: agents.length }) },
    { id: "flow", label: t("architect.review.tabFlow") },
    { id: "tools", label: t("architect.review.tabToolsCount", { count: job.tool_drafts.length + job.missing_tools.length }) },
  ];
  return (
    <div className="architect-review" data-testid="architect-review">
      {extra}
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
        {tab === "overview" ? <Overview job={job} name={name} onName={onName} /> : null}
        {tab === "changes" ? <Changes job={job} /> : null}
        {tab === "agents" ? (
          <div className="stack">
            {agents.map((node) => (
              <AgentCard
                key={node.id}
                node={node}
                mode={job.mode}
                diff={diff.agents.find((agent) => agent.nodeId === node.id)}
                issues={job.check?.agents[node.id] ?? []}
              />
            ))}
            {diff.agents
              .filter((agent) => agent.kind === "removed")
              .map((agent) => (
                <p key={agent.nodeId} className="architect-agent architect-agent--removed">
                  <Badge tone="danger">{t("architect.kind.removed")}</Badge> <strong>{agent.name}</strong>
                </p>
              ))}
          </div>
        ) : null}
        {tab === "flow" ? <Flow job={job} /> : null}
        {tab === "tools" ? <Tools job={job} onTool={onTool} /> : null}
      </div>
    </div>
  );
}
