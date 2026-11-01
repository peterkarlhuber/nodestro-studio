// Start a workflow test series: pick the version, limits and whether the AI judge rates the results,
// and optionally other models for single agents to compare them with the same cases (Q-2).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { BenchmarkRun, BenchmarkStart, Suite } from "../api/types";
import { ModelPicker } from "../components/ModelPicker";
import { Button, Callout, Field, Modal, Select, Spinner, Toggle } from "../components/ui";
import { ErrorText, problemText } from "../lib/errors";
import { agentNodes, changedModels, nodeName } from "./models";
import { EstimateView, type Limits, LimitFields } from "./shared";

export function BenchmarkStartDialog({
  suite,
  open,
  onClose,
  onStarted,
}: {
  suite: Suite;
  open: boolean;
  onClose: () => void;
  onStarted: (run: BenchmarkRun) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [version, setVersion] = useState<number | null>(null);
  const [limits, setLimits] = useState<Limits>({ concurrency: 2, max_cost_usd: null, max_failures: null });
  const [judge, setJudge] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const workflow = useQuery({ queryKey: keys.workflow(suite.workflow_id), queryFn: () => api.workflow(suite.workflow_id), enabled: open });
  const agents = agentNodes(workflow.data);
  const models = comparing ? changedModels(chosen, agents) : {};
  const variant = Object.keys(models).length > 0;
  const body: BenchmarkStart = { version, judge, confirm_external: confirmed, ...limits, models };
  const versions = useQuery({ queryKey: keys.versions(suite.workflow_id), queryFn: () => api.versions(suite.workflow_id), enabled: open });
  const plan = useQuery({ queryKey: ["benchmark-plan", suite.id, body], queryFn: () => api.planBenchmark(suite.id, body), enabled: open });
  const start = useMutation({
    mutationFn: () => api.startBenchmark(suite.id, body),
    onSuccess: (run) => {
      void queryClient.invalidateQueries({ queryKey: keys.benchmarkRuns(suite.id) });
      onStarted(run);
      onClose();
    },
  });
  const needsConfirm = (plan.data?.external_tools.length ?? 0) > 0 && !confirmed;
  // Earlier runs used the saved models, so only a cost limit bounds a run with other models.
  const needsLimit = variant && limits.max_cost_usd === null;
  return (
    <Modal
      title={t("automation.benchmark.startTitle", { name: suite.name })}
      open={open}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            icon={Play}
            busy={start.isPending}
            disabled={!plan.data || needsConfirm || needsLimit}
            onClick={() => start.mutate()}
          >
            {t("automation.benchmark.start", { count: suite.cases.length })}
          </Button>
        </>
      }
    >
      <Field label={t("automation.benchmark.version")} hint={t("automation.benchmark.versionHint")}>
        <Select
          value={version === null ? "" : String(version)}
          placeholder={t("automation.benchmark.currentVersion")}
          onChange={(value) => setVersion(value ? Number(value) : null)}
          options={(versions.data ?? []).map((item) => ({
            value: String(item.number),
            label: `${t("editor.subworkflow.versionN", { n: item.number })}${item.description ? ` – ${item.description}` : ""}`,
          }))}
        />
      </Field>
      <LimitFields value={limits} onChange={setLimits} />
      <Toggle
        checked={judge}
        onChange={setJudge}
        label={t("automation.benchmark.judge")}
        description={t("automation.benchmark.judgeHint")}
        tip="automation.benchmarkJudge"
      />
      <Toggle
        checked={comparing}
        onChange={setComparing}
        label={t("automation.benchmark.compareModels")}
        description={t("automation.benchmark.compareModelsHint")}
        tip="automation.benchmarkModels"
      />
      {comparing ? (
        <div className="stack-sm" data-testid="benchmark-models">
          {agents.map((node) => {
            const saved = node.agent?.model ?? "";
            const name = nodeName(node, node.id);
            return (
              <Field
                key={node.id}
                label={t("automation.benchmark.agentModel", { agent: name })}
                hint={t("automation.benchmark.savedModel", { model: saved })}
              >
                <ModelPicker
                  value={chosen[node.id] ?? saved}
                  label={t("automation.benchmark.agentModel", { agent: name })}
                  onChange={(model) => setChosen({ ...chosen, [node.id]: model })}
                />
              </Field>
            );
          })}
          {variant ? (
            <p className="muted small">{t("automation.benchmark.modelsChanged", { count: Object.keys(models).length })}</p>
          ) : null}
          {needsLimit ? (
            <Callout tone="warning">
              <span data-testid="benchmark-needs-limit">{t("automation.benchmark.needsLimit")}</span>
            </Callout>
          ) : null}
        </div>
      ) : null}
      {plan.isLoading ? <Spinner /> : null}
      {plan.error && !needsLimit ? (
        <Callout tone="danger">
          <ErrorText error={plan.error} />
        </Callout>
      ) : null}
      {plan.data ? (
        <>
          {plan.data.problems.map((problem, index) => (
            <Callout key={index} tone="warning">
              {t("automation.benchmark.caseProblem", {
                name: problem.case,
                errors: problem.errors.map((error) => `${error.field}: ${problemText(t, error)}`).join("; "),
              })}
            </Callout>
          ))}
          {judge && plan.data.judged_cases ? (
            <p className="muted small">{t("automation.benchmark.judgedCases", { count: plan.data.judged_cases })}</p>
          ) : null}
          <EstimateView
            estimate={plan.data.estimate}
            externalTools={plan.data.external_tools}
            approvals={plan.data.approvals}
            toolWarnings={plan.data.tool_warnings}
            confirmed={confirmed}
            onConfirm={setConfirmed}
          />
        </>
      ) : null}
      {start.error ? (
        <Callout tone="danger">
          <ErrorText error={start.error} />
        </Callout>
      ) : null}
    </Modal>
  );
}
