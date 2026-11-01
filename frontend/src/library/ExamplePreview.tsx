import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Brain, Copy, Download, FlaskConical, ListChecks, Network, PlugZap, Scale, ShieldAlert, ShieldCheck } from "lucide-react";
import { Suspense, lazy, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { keys, useExample, useMeta } from "../api/hooks";
import type { ExampleDetail } from "../api/types";
import { agentIcon } from "../components/icons";
import { toast } from "../components/toast";
import { Badge, Button, Callout, Field, HelpTip, Hint, Modal, Select, Spinner, Toggle } from "../components/ui";
import { LANGUAGE_NAMES, LANGUAGES, type Language, currentLanguage } from "../i18n";
import { ErrorText } from "../lib/errors";
import { formatCost } from "../lib/format";
import { findModel } from "../lib/providers";
import { ExampleConnections, KnowledgeList, TeamList } from "./ExampleSections";
import { OFFLINE, PATTERN_ICONS, copyRequest } from "./examples";

function PatternLabel({ pattern }: { pattern: ExampleDetail["pattern"] }) {
  const { t } = useTranslation();
  const Icon = PATTERN_ICONS[pattern];
  return (
    <span className="example-card__pattern">
      <Icon size={12} aria-hidden /> {t(`library.pattern.${pattern}`)}
    </span>
  );
}

// The canvas library loads when a preview opens, not with the examples page.
const ExampleCanvas = lazy(() => import("./ExampleCanvas"));

/** The workflow of an example as a small canvas that can be looked at but not changed. */
function ExampleGraph({ example }: { example: ExampleDetail }) {
  const { t } = useTranslation();
  return (
    <Suspense
      // The same empty frame as the canvas, so the dialog keeps its layout while the canvas loads.
      fallback={<div className="example-graph nd-workflow-canvas" aria-label={t("library.preview.graph")} role="img" aria-busy="true" />}
    >
      <ExampleCanvas example={example} />
    </Suspense>
  );
}

function AgentList({ example }: { example: ExampleDetail }) {
  const { t } = useTranslation();
  const meta = useMeta();
  const icons = Object.fromEntries(example.workflow.nodes.map((node) => [node.id, node.agent?.icon ?? "bot"]));
  return (
    <ol className="example-agents">
      {example.agent_details.map((agent) => {
        const Icon = agentIcon(icons[agent.node_id]);
        const model = findModel(meta.data?.models, agent.model)?.label ?? agent.model;
        return (
          <li key={agent.node_id} className="example-agents__item">
            <span className="card__avatar">
              <Icon size={15} aria-hidden />
            </span>
            <div className="example-agents__text">
              <div className="example-agents__head">
                <strong>{agent.name}</strong>
                {agent.kind === "orchestrator" ? (
                  <Badge tone="running" icon={Network}>
                    {t("library.feature.orchestrator")}
                  </Badge>
                ) : null}
                {agent.role ? <Badge tone="idle">{t(`library.role.${agent.role}`)}</Badge> : null}
                {agent.judge ? (
                  <Badge tone="success" icon={ShieldCheck}>
                    {t("library.feature.judge")}
                  </Badge>
                ) : null}
                {agent.structured ? <Badge tone="running">{t("library.feature.structured")}</Badge> : null}
                {agent.memory ? (
                  <Badge tone="idle" icon={Brain}>
                    {t("library.feature.memory")}
                  </Badge>
                ) : null}
              </div>
              <p className="muted small">{agent.description}</p>
              <p className="small">
                {t("library.preview.receives", { names: agent.receives.join(", ") })} · {model}
                {agent.tools.length ? <> · {t("library.preview.tools", { tools: agent.tools.join(", ") })}</> : null}
              </p>
              {agent.kind === "orchestrator" ? <p className="muted small">{t("library.preview.orchestratorNote")}</p> : null}
              {agent.knowledge.length ? (
                <p className="small">
                  <BookOpen size={12} aria-hidden /> {t("library.preview.searches", { names: agent.knowledge.join(", ") })}
                </p>
              ) : null}
              {agent.integrations.length ? (
                <p className="small">
                  <PlugZap size={12} aria-hidden /> {t("library.preview.connection", { names: agent.integrations.join(", ") })}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const GUIDE_PARTS = ["problem", "flow", "input", "result", "adapt"] as const;
/** Guide parts with a section of their own (format 2; empty in older templates). */
const GUIDE_SECTIONS = ["control", "why"] as const;

/**
 * The preview of an example: its graph, agents, guide and test task. Looking at it is free;
 * "copy" creates an independent workflow in the chosen language and opens it in the editor.
 */
export function ExamplePreview({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [language, setLanguage] = useState<Language>(currentLanguage);
  const [tests, setTests] = useState(true);
  /** integration id -> MCP server id, or OFFLINE. */
  const [connections, setConnections] = useState<Record<string, string>>({});
  const example = useExample(id, language);
  const connected = Object.values(connections).some((server) => server !== OFFLINE);

  const copy = useMutation({
    mutationFn: () =>
      api.copyExample(id ?? "", copyRequest(example.data ?? { tests: [], integrations: [] }, language, tests, connections)),
    onSuccess: (workflow) => {
      void queryClient.invalidateQueries({ queryKey: keys.workflows });
      toast.success(t("library.copied", { name: workflow.name }));
      navigate(`/workflows/${workflow.id}`);
    },
    onError: toast.error,
  });

  const data = example.data;
  return (
    <Modal
      title={data?.name ?? t("library.preview.loading")}
      open={id !== null}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Hint id="library.copy">
            <Button variant="primary" icon={Copy} busy={copy.isPending} disabled={!data} onClick={() => copy.mutate()}>
              {t("library.copy")}
            </Button>
          </Hint>
        </>
      }
    >
      <div className="example-preview__language">
        <Field label={t("library.preview.language")} htmlFor="example-language" tip="library.language">
          <Select
            id="example-language"
            value={language}
            onChange={(value) => setLanguage(value as Language)}
            options={LANGUAGES.map((item) => ({ value: item, label: LANGUAGE_NAMES[item] }))}
          />
        </Field>
      </div>
      {example.isLoading ? <Spinner /> : null}
      {example.error ? (
        <Callout tone="danger">
          <ErrorText error={example.error} />
        </Callout>
      ) : null}
      {data ? (
        <div className="stack example-preview" data-testid="example-preview">
          <p className="muted">
            {data.field} · {t("library.agents", { count: data.agents })}
            {data.teams ? <> · {t("library.teams", { count: data.teams })}</> : null} · <PatternLabel pattern={data.pattern} /> ·{" "}
            {t(`library.level.${data.level}`)}
          </p>
          <p>{data.description}</p>
          {data.features.length ? (
            <div className="row-gap example-card__features" aria-label={t("library.preview.features")}>
              {data.features.map((feature) => (
                <Badge key={feature} tone="running">
                  {t(`library.feature.${feature}`)}
                </Badge>
              ))}
            </div>
          ) : null}
          {data.budget_usd ? (
            <p className="small">
              <Scale size={12} aria-hidden /> {t("library.preview.budget", { amount: formatCost(data.budget_usd) })}
            </p>
          ) : null}
          {data.sensitive ? (
            <Callout tone="warning">
              <ShieldAlert size={13} aria-hidden /> {t("library.preview.sensitiveNote", { field: data.field })}
            </Callout>
          ) : null}
          <Callout tone="info">{t("library.preview.costNote")}</Callout>
          <ExampleGraph example={data} />
          <h3>{t("library.preview.agents")}</h3>
          <AgentList example={data} />
          {data.team_details.length ? <TeamList teams={data.team_details} /> : null}
          <h3>{t("library.preview.guide")}</h3>
          <dl className="example-guide">
            {GUIDE_PARTS.map((part) => (
              <div key={part}>
                <dt>{t(`library.guide.${part}`)}</dt>
                <dd>{data.guide[part]}</dd>
              </div>
            ))}
          </dl>
          {GUIDE_SECTIONS.filter((part) => data.guide[part]?.trim()).map((part) => (
            <section key={part} data-testid={`example-guide-${part}`} aria-labelledby={`example-guide-${part}`}>
              <h3 id={`example-guide-${part}`}>{t(`library.guide.${part}`)}</h3>
              <p>{data.guide[part]}</p>
            </section>
          ))}
          {data.knowledge.length ? <KnowledgeList files={data.knowledge} /> : null}
          {data.integrations.length ? (
            <ExampleConnections
              example={data}
              value={connections}
              onChange={(value) => {
                setConnections(value);
                copy.reset();
              }}
              error={copy.error}
            />
          ) : null}
          <h3 className="example-preview__input-title">
            <FlaskConical size={14} aria-hidden /> {t("library.preview.testInput")}
            <HelpTip id="library.synthetic" label={t("library.preview.testInput")} />
          </h3>
          <p className="muted small">{t("library.preview.syntheticNote")}</p>
          <pre className="example-input">{data.input}</pre>
          {data.samples.length ? (
            <>
              <h3>{t("library.preview.samples")}</h3>
              <p className="muted small">{t("library.preview.samplesNote")}</p>
              <ul className="example-samples" data-testid="example-samples">
                {data.samples.map((sample) => (
                  <li key={sample.id}>
                    <a href={api.exampleSampleUrl(data.id, sample.id, language)} download={sample.file_name}>
                      <Download size={13} aria-hidden /> {sample.file_name}
                    </a>
                    <span className="muted small">
                      {" "}
                      · {sample.field_label} · {sample.description}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {data.tests.length ? (
            <>
              <h3>
                <ListChecks size={14} aria-hidden /> {t("library.preview.tests")}
              </h3>
              <ul className="example-tests" data-testid="example-tests">
                {data.tests.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
              <Toggle
                checked={tests && !connected}
                onChange={setTests}
                disabled={connected}
                label={t("library.preview.copyTests")}
                description={connected ? t("library.preview.copyTestsConnected") : t("library.preview.copyTestsNote")}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
