// "Test agent": run one agent with its current configuration on a test task. The result is shown
// here only; it is not a workflow run and changes no run, result or memory space.

import { useMutation } from "@tanstack/react-query";
import { FlaskConical, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { useMeta, useSettings } from "../api/hooks";
import type { AgentConfig, AgentTestResult, NodeRun, WorkflowNode } from "../api/types";
import { providerList } from "../components/ModelPicker";
import { Badge, Button, Callout, Field, Modal, Stat, TextArea, Toggle } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { formatCost, formatDuration, formatPrice, formatTokens } from "../lib/format";
import { findModel, missingProviders } from "../lib/providers";
import { NodeRunDetails } from "./RunDetails";
import { useEditor } from "./store";

/** The test result in the shape of a node of a run, so the run view can show it. */
export function asNodeRun(result: AgentTestResult): NodeRun {
  return {
    status: result.status,
    prompt: result.prompt,
    output: result.output,
    text: result.text,
    thinking: "",
    error: result.error,
    error_code: result.error_code,
    error_params: result.error_params,
    tool_calls: result.tool_calls,
    usage: result.usage,
    evaluation: result.evaluation,
    memory: result.memory,
    started_at: result.started_at,
    finished_at: result.finished_at,
  };
}

export function AgentTestDialog({
  open,
  onClose,
  agent,
  defaultInput = "",
}: {
  open: boolean;
  onClose: () => void;
  agent: AgentConfig;
  defaultInput?: string;
}) {
  const { t } = useTranslation();
  const meta = useMeta();
  const settings = useSettings();
  const [input, setInput] = useState(defaultInput);
  const [raw, setRaw] = useState(false);
  const test = useMutation({ mutationFn: () => api.testAgent(agent, input, raw, useEditor.getState().workflowId ?? undefined) });
  useEffect(() => {
    if (open) {
      setInput(defaultInput);
      test.reset();
    }
    // Only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const model = findModel(meta.data?.models, agent.model);
  const missing = missingProviders(settings.data, [agent.model, agent.quality.enabled ? agent.quality.judge_model : null]);
  const result = test.data;
  const node: WorkflowNode = { id: "agent-test", type: "agent", position: { x: 0, y: 0 }, label: agent.name, agent, start: null };
  return (
    <Modal
      title={t("agentTest.title", { name: agent.name })}
      open={open}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.close")}
          </Button>
          <Button variant="primary" icon={Play} busy={test.isPending} onClick={() => test.mutate()}>
            {result ? t("agentTest.again") : t("agentTest.start")}
          </Button>
        </>
      }
    >
      <Callout tone="brand">
        <FlaskConical size={13} aria-hidden /> {t("agentTest.note")}
      </Callout>
      {missing.length ? <Callout tone="warning">{t("agentTest.providerMissing", { providers: providerList(t, missing) })}</Callout> : null}
      <Field label={t("agentTest.input")} htmlFor="agent-test-input" hint={raw ? t("agentTest.rawHint") : t("agentTest.inputHint")}>
        <TextArea
          id="agent-test-input"
          rows={5}
          autoFocus
          value={input}
          placeholder={t("agentTest.placeholder")}
          onChange={(event) => setInput(event.target.value)}
        />
      </Field>
      <Toggle checked={raw} onChange={setRaw} label={t("agentTest.raw")} description={t("agentTest.rawDescription")} />
      <p className="muted small">
        {t("agentTest.costNote", {
          model: model?.label ?? agent.model,
          input: model ? formatPrice(model.input_usd_per_mtok) : "?",
          output: model ? formatPrice(model.output_usd_per_mtok) : "?",
        })}
        {agent.memory.mode === "persistent" ? ` ${t("agentTest.memoryNote")}` : ""}
      </p>
      {test.error ? (
        <Callout tone="danger">
          <ErrorText error={test.error} />
        </Callout>
      ) : null}
      {result ? (
        <section className="agent-test-result stack-sm" aria-label={t("agentTest.result")} data-testid="agent-test-result">
          <div className="row-gap">
            <Badge tone="running" icon={FlaskConical}>
              {t("agentTest.badge")}
            </Badge>
            {result.memory_isolated ? <Badge>{t("agentTest.memoryIsolated")}</Badge> : null}
          </div>
          <div className="stats stats--compact">
            <Stat label={t("runs.stats.requests")} value={result.usage.requests} tip="runs.requests" />
            <Stat label={t("runs.stats.tokens")} value={formatTokens(result.usage.total_tokens)} tip="runs.tokens" />
            <Stat label={t("runs.stats.cost")} value={formatCost(result.usage.estimated_cost_usd)} tip="runs.cost" />
            <Stat label={t("agentTest.duration")} value={formatDuration(result.started_at, result.finished_at)} />
          </div>
          <NodeRunDetails node={node} state={asNodeRun(result)} />
        </section>
      ) : null}
    </Modal>
  );
}
