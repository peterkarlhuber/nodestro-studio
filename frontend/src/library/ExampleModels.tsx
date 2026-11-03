// The local model of each agent when an example is copied (EX-011). In a workspace with local models the copy gives
// every agent the model its task needs on this computer; the dialog shows that plan with the reason and lets the
// person choose another model per agent. A choice made here is sent with the copy and always wins.

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import { api } from "../api/client";
import type { ExampleAgentModel, ExampleModelPlan as Plan } from "../api/types";
import { Badge, HelpTip, Select } from "../components/ui";
import { providerOf } from "../lib/providers";

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

/** The reasons of a suggestion in words (the codes of the local model recommendations). */
export function planReasons(t: TFunction, agent: ExampleAgentModel): string {
  return agent.reasons
    .map((reason) =>
      reason === "installed" || reason === "needs_download"
        ? t(`library.models.reason.${reason}`)
        : t(`localModels.reasons.${reason}`, { defaultValue: "" }),
    )
    .filter(Boolean)
    .join(" ");
}

/** Only the choices that differ from the suggestion go into the copy request. */
export function modelOverrides(plan: Plan | undefined, chosen: Record<string, string>): Record<string, string> {
  if (!plan?.local) return {};
  const suggested = Object.fromEntries(plan.agents.map((agent) => [agent.key, agent.model]));
  return Object.fromEntries(Object.entries(chosen).filter(([key, model]) => key in suggested && model && model !== suggested[key]));
}

export function ExampleModelPlan({
  plan,
  value,
  onChange,
}: {
  plan: Plan;
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}) {
  const { t } = useTranslation();
  if (!plan.local || !plan.agents.length) return null;
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
              const options = [...new Set([...(agent.model ? [agent.model] : []), ...agent.alternatives])];
              const current = value[agent.key] ?? agent.model ?? "";
              const why = planReasons(t, agent);
              return (
                <tr key={agent.key} data-testid={`example-model-${agent.key}`}>
                  <td>
                    <strong>{agent.name}</strong>
                    {agent.part ? <div className="muted small">{agent.part}</div> : null}
                  </td>
                  <td>{t(`localModels.tasks.${agent.task}`, { defaultValue: agent.task })}</td>
                  <td>
                    <Select
                      aria-label={t("library.models.choose", { agent: agent.name })}
                      value={current}
                      placeholder={agent.model ? undefined : t("library.models.none")}
                      onChange={(model) => {
                        const next = { ...value };
                        if (model && model !== agent.model) next[agent.key] = model;
                        else delete next[agent.key];
                        onChange(next);
                      }}
                      options={options.map((model) => ({
                        value: model,
                        label: model === agent.model ? t("library.models.suggested", { model: plain(model) }) : plain(model),
                      }))}
                    />
                    <div className="muted small">
                      {agent.model ? (
                        <Badge tone={agent.installed ? "success" : "warning"}>
                          {agent.installed ? t("library.models.installed") : t("library.models.download")}
                        </Badge>
                      ) : (
                        <Badge tone="danger">{t("library.models.noFit")}</Badge>
                      )}{" "}
                      {why}
                    </div>
                    {value[agent.key] ? <div className="small">{t("library.models.overridden")}</div> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
