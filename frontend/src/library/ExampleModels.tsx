// The local model of each agent when an example is copied (EX-011). In a workspace with local models the copy gives
// every agent the model its task needs on this computer; the dialog shows that plan with the reason and lets the
// person choose another model per agent. A choice made here is sent with the copy and always wins.

import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { useLocalModels } from "../api/localModels";
import type { ExampleAgentModel, ExampleDetail, ExampleModelPlan as Plan } from "../api/types";
import { Badge, HelpTip, Select } from "../components/ui";
import { providerOf } from "../lib/providers";
import { useSettingsHref } from "../lib/settingsLink";

/** The plan of an example's copy; asked only when the default model is a local one. */
export function useExampleModels(id: string | null, language: string, local: boolean) {
  return useQuery({
    queryKey: ["library", id ?? "", "models", language],
    queryFn: () => api.exampleModels(id ?? "", language),
    enabled: id !== null && local,
    staleTime: 30_000,
    retry: false,
  });
}

/** Whether the workspace runs agents on local models (its default model is an Ollama model). */
export function usesLocalModels(defaultModel: string | undefined | null): boolean {
  return Boolean(defaultModel) && providerOf(defaultModel!) === "ollama";
}

const plain = (model: string) => model.replace(/^ollama:/, "");

/** Reasons of the copy route itself; the others are the codes of the local model recommendations. */
const PLAN_REASONS = new Set(["installed", "needs_download", "installed_alternative", "default_model", "manual"]);

/** The reasons of a suggestion in words. */
export function planReasons(t: TFunction, agent: ExampleAgentModel): string {
  return agent.reasons
    .map((reason) =>
      PLAN_REASONS.has(reason)
        ? t(`library.models.reason.${reason}`, { model: plain(agent.suggested ?? "") })
        : t(`localModels.reasons.${reason}`, { defaultValue: "" }),
    )
    .filter(Boolean)
    .join(" ");
}

/** The models the select offers: the plan's model, the suitable installed ones, then every other installed chat model. */
export function modelOptions(agent: ExampleAgentModel, installedChat: string[]): string[] {
  return [...new Set([...(agent.model ? [agent.model] : []), ...agent.alternatives, ...installedChat])];
}

/** Every chat model can complete text, so ``completion`` says nothing about the choice; the rest is shown. */
export function shownNeeds(needs: string[] | undefined): string[] {
  return (needs ?? []).filter((need) => need !== "completion");
}

/** Only the choices that differ from the suggestion go into the copy request. */
export function modelOverrides(plan: Plan | undefined, chosen: Record<string, string>): Record<string, string> {
  if (!plan?.local) return {};
  const suggested = Object.fromEntries(plan.agents.map((agent) => [agent.key, agent.model]));
  return Object.fromEntries(Object.entries(chosen).filter(([key, model]) => key in suggested && model && model !== suggested[key]));
}

/** The part ids of a library workflow's sub-workflow and team references ("library-part:<id>"). */
const PART_PREFIX = "library-part:";

/**
 * The names of an example's parts in its language, by part id: its teams, and the steps that call a part as a
 * sub-workflow. The plan names an agent's part by id only.
 */
export function partNames(example: Pick<ExampleDetail, "team_details" | "workflow">): Record<string, string> {
  const names: Record<string, string> = {};
  for (const node of example.workflow.nodes) {
    const target = node.subworkflow?.workflow_id ?? "";
    if (target.startsWith(PART_PREFIX) && node.label) names[target.slice(PART_PREFIX.length)] = node.label;
  }
  for (const team of example.team_details) names[team.part_id] = team.name;
  return names;
}

export function ExampleModelPlan({
  plan,
  value,
  onChange,
  parts = {},
}: {
  plan: Plan;
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  /** Part id -> its name in the example's language (``partNames``). */
  parts?: Record<string, string>;
}) {
  const { t } = useTranslation();
  const local = useLocalModels(plan.local);
  const setup = useSettingsHref("settings-local-models");
  if (!plan.local || !plan.agents.length) return null;
  const installedChat = (local.data?.status?.models ?? []).filter((model) => model.kind === "chat").map((model) => `ollama:${model.name}`);
  return (
    <section className="stack" aria-labelledby="example-models-title" data-testid="example-models">
      <h3 id="example-models-title">
        {t("library.models.title")} <HelpTip id="library.models" label={t("library.models.title")} />
      </h3>
      <p className="muted small">{t("library.models.text")}</p>
      <div className="table-wrap">
        <table className="table table--compact">
          <thead>
            <tr>
              <th>{t("library.models.agent")}</th>
              <th>{t("library.models.task")}</th>
              <th>{t("library.models.model")}</th>
            </tr>
          </thead>
          <tbody>
            {plan.agents.map((agent) => {
              const options = modelOptions(agent, installedChat);
              const current = value[agent.key] ?? agent.model ?? "";
              const why = planReasons(t, agent);
              const needs = shownNeeds(agent.needs).map((need) => t(`library.models.need.${need}`, { defaultValue: need }));
              return (
                <tr key={agent.key} data-testid={`example-model-${agent.key}`}>
                  <td>
                    <strong>{agent.name}</strong>
                    {agent.part ? <div className="muted small">{parts[agent.part] ?? agent.part}</div> : null}
                  </td>
                  <td>
                    {t(`library.models.tasks.${agent.task}`, { defaultValue: agent.task })}
                    {needs.length ? <div className="muted small">{t("library.models.needs", { needs: needs.join(", ") })}</div> : null}
                  </td>
                  <td>
                    <Select
                      aria-label={t("library.models.choose", { agent: agent.name })}
                      value={current}
                      placeholder={agent.model ? undefined : t("library.models.keepDefault")}
                      onChange={(model) => {
                        const next = { ...value };
                        if (model && model !== agent.model) next[agent.key] = model;
                        else delete next[agent.key];
                        onChange(next);
                      }}
                      options={options.map((model) => ({
                        value: model,
                        label: model === agent.model ? t("library.models.planned", { model: plain(model) }) : plain(model),
                      }))}
                    />
                    <div className="muted small">
                      {agent.model ? (
                        <Badge tone={agent.installed ? "success" : "warning"}>
                          {agent.installed ? t("library.models.installed") : t("library.models.download")}
                        </Badge>
                      ) : (
                        <Badge tone="warning">{t("library.models.defaultStays")}</Badge>
                      )}{" "}
                      {why}
                    </div>
                    {agent.suggested && agent.suggested !== agent.model ? (
                      <div className="small" data-testid={`example-model-better-${agent.key}`}>
                        <Download size={12} aria-hidden /> {t("library.models.better", { model: plain(agent.suggested) })}{" "}
                        <Link to={setup}>{t("library.models.toLocalModels")}</Link>
                      </div>
                    ) : null}
                    {value[agent.key] ? <div className="small">{t("library.models.overridden")}</div> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {plan.judge ? (
        <p className="small muted" data-testid="example-models-judge">
          {t("library.models.judge", { model: plain(plan.judge) })}
        </p>
      ) : null}
    </section>
  );
}
