// Choosing an agent's model from the measured test runs of a series (AO M6). Only recorded measurements decide;
// nothing changes until a person applies the recommendation, which saves the workflow as a new version.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { ModelChoice, ModelMeasurement, ModelObjective, Workflow } from "../api/types";
import { toast } from "../components/toast";
import { Badge, Button, Callout, Field, HelpTip, Select, Spinner, TextInput } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { formatCost, formatDate, formatNumber } from "../lib/format";
import { agentNodes, nodeName } from "./models";

const percent = (value: number | null | undefined) => (value === null || value === undefined ? "–" : `${formatNumber(Math.round(value * 1000) / 10)} %`);

/** The workflow with ``nodeId`` using ``model``; everything else stays as saved. */
export function withModel(workflow: Workflow, nodeId: string, model: string): Workflow {
  return {
    ...workflow,
    nodes: workflow.nodes.map((node) => (node.id === nodeId && node.agent ? { ...node, agent: { ...node.agent, model } } : node)),
  };
}

export function ModelChoicePanel({ suiteId, workflow }: { suiteId: string; workflow: Workflow | undefined }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const agents = agentNodes(workflow);
  const [picked, setPicked] = useState<string>("");
  const [objective, setObjective] = useState<ModelObjective>("cost");
  const [minPassRate, setMinPassRate] = useState("");
  const [noNewFailures, setNoNewFailures] = useState(true);
  const nodeId = picked || agents[0]?.id || "";
  const parsedMin = minPassRate.trim() === "" ? null : Number(minPassRate.replace(",", ".")) / 100;
  const minValid = parsedMin === null || (Number.isFinite(parsedMin) && parsedMin >= 0 && parsedMin <= 1);
  const policy = { objective, min_pass_rate: minValid ? parsedMin : null, no_new_failures: noNewFailures };
  const choice = useQuery({
    queryKey: ["model-choice", suiteId, nodeId, policy, workflow?.updated_at],
    queryFn: () => api.modelChoice(suiteId, nodeId, policy),
    enabled: Boolean(nodeId && workflow && minValid),
  });
  const apply = useMutation({
    mutationFn: (model: string) =>
      api.saveWorkflow(workflow!.id, withModel(workflow!, nodeId, model), t("automation.modelChoice.versionNote", { model })),
    onSuccess: (saved: Workflow) => {
      queryClient.setQueryData(keys.workflow(saved.id), saved);
      void queryClient.invalidateQueries({ queryKey: ["model-choice", suiteId] });
      toast.success(t("automation.modelChoice.applied"));
    },
  });
  if (!workflow || !agents.length) return null;
  return (
    <section className="panel stack" aria-label={t("automation.modelChoice.title")} data-testid="model-choice">
      <h2 className="panel__title">
        {t("automation.modelChoice.title")} <HelpTip id="automation.modelChoice" label={t("automation.modelChoice.title")} />
      </h2>
      <p className="muted small">{t("automation.modelChoice.intro")}</p>
      <div className="grid-2">
        {agents.length > 1 ? (
          <Field label={t("automation.modelChoice.agent")}>
            <Select
              aria-label={t("automation.modelChoice.agent")}
              value={nodeId}
              onChange={setPicked}
              options={agents.map((node) => ({ value: node.id, label: nodeName(node, node.id) }))}
            />
          </Field>
        ) : null}
        <Field label={t("automation.modelChoice.objective")}>
          <Select
            aria-label={t("automation.modelChoice.objective")}
            value={objective}
            onChange={(value) => setObjective(value as ModelObjective)}
            options={(["cost", "duration", "quality"] as const).map((value) => ({
              value,
              label: t(`automation.modelChoice.objectives.${value}`),
            }))}
          />
        </Field>
        <Field
          label={t("automation.modelChoice.minPassRate")}
          hint={minValid ? t("automation.modelChoice.minPassRateHint") : t("automation.modelChoice.minPassRateInvalid")}
        >
          <TextInput
            inputMode="decimal"
            value={minPassRate}
            placeholder={t("automation.modelChoice.minPassRateDefault")}
            onChange={(e) => setMinPassRate(e.target.value)}
          />
        </Field>
        <label className="checkbox">
          <input type="checkbox" checked={noNewFailures} onChange={(e) => setNoNewFailures(e.target.checked)} />
          {t("automation.modelChoice.noNewFailures")}
        </label>
      </div>
      {choice.isLoading ? <Spinner /> : null}
      {choice.error ? (
        <Callout tone="danger">
          <ErrorText error={choice.error} />
        </Callout>
      ) : null}
      {apply.error ? (
        <Callout tone="danger">
          <ErrorText error={apply.error} />
        </Callout>
      ) : null}
      {choice.data ? <ChoiceView choice={choice.data} applying={apply.isPending} onApply={(model) => apply.mutate(model)} /> : null}
    </section>
  );
}

function ChoiceView({ choice, applying, onApply }: { choice: ModelChoice; applying: boolean; onApply: (model: string) => void }) {
  const { t } = useTranslation();
  const skipped = Object.entries(choice.skipped);
  return (
    <div className="stack-sm">
      <Callout tone={choice.outcome === "switch" ? "brand" : "info"}>
        <span data-testid="model-choice-outcome">
          {t(`automation.modelChoice.outcome.${choice.outcome}`, {
            model: choice.recommended ?? choice.current_model,
            current: choice.current_model,
            rate: percent(choice.required_pass_rate),
          })}
        </span>
        {choice.outcome === "switch" && choice.recommended ? (
          <div>
            <Button size="sm" icon={Check} busy={applying} onClick={() => onApply(choice.recommended!)}>
              {t("automation.modelChoice.apply", { model: choice.recommended })}
            </Button>
          </div>
        ) : null}
      </Callout>
      {choice.warnings.map((code) => (
        <p key={code} className="muted small">
          {t(`automation.modelChoice.warnings.${code.replace("model_choice.", "")}`)}
        </p>
      ))}
      {choice.measurements.length ? (
        <table className="table table--compact">
          <thead>
            <tr>
              <th>{t("automation.modelChoice.columns.model")}</th>
              <th className="num">{t("automation.modelChoice.columns.passRate")}</th>
              <th className="num">{t("automation.modelChoice.columns.costPerCase")}</th>
              <th className="num">{t("automation.modelChoice.columns.duration")}</th>
              <th className="num">{t("automation.modelChoice.columns.aiScore")}</th>
              <th>{t("automation.modelChoice.columns.status")}</th>
            </tr>
          </thead>
          <tbody>
            {choice.measurements.map((item) => (
              <MeasurementRow key={item.model} item={item} recommended={item.model === choice.recommended} />
            ))}
          </tbody>
        </table>
      ) : null}
      {skipped.length ? (
        <p className="muted small" data-testid="model-choice-skipped">
          {t("automation.modelChoice.skippedIntro")}{" "}
          {skipped.map(([reason, count]) => t(`automation.modelChoice.skipped.${reason}`, { count })).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

function MeasurementRow({ item, recommended }: { item: ModelMeasurement; recommended: boolean }) {
  const { t } = useTranslation();
  return (
    <tr className={recommended ? "table__row--picked" : undefined}>
      <td>
        <code>{item.model}</code>
        {item.current ? <span className="muted small"> · {t("automation.modelChoice.current")}</span> : null}
        <div className="muted small">
          {t("automation.modelChoice.measuredAt", { date: formatDate(item.created_at), passed: item.passed, cases: item.cases })}
        </div>
      </td>
      <td className="num">{percent(item.pass_rate)}</td>
      <td className="num">{formatCost(item.cost_per_case_usd)}</td>
      <td className="num">{item.avg_duration_s === null ? "–" : `${formatNumber(item.avg_duration_s)} s`}</td>
      <td className="num" title={t("automation.benchmark.aiNote")}>
        {percent(item.judge_score)}
      </td>
      <td>
        {recommended ? <Badge tone="success">{t("automation.modelChoice.recommended")}</Badge> : null}
        {item.excluded.map((code) => (
          <div key={code} className="small muted">
            {t(`automation.modelChoice.excluded.${code.replace("model.", "")}`, { cases: item.new_failures.length })}
          </div>
        ))}
      </td>
    </tr>
  );
}
