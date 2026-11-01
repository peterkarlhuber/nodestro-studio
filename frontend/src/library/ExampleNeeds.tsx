// "What you need" at the top of an example's preview (OB-12): the AI provider and models the copy will use, whether
// a run pauses for an approval, the knowledge files and sample files it brings and whether it needs a connection.
// Everything comes from the example's own data and the settings; nothing here is a guess or calls a model.

import { BookOpen, Check, FileText, KeyRound, PlugZap, UserCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useMeta, useSettings } from "../api/hooks";
import type { ExampleDetail, ModelInfo, Settings } from "../api/types";
import { providerLabel } from "../components/ModelPicker";
import { findModel, providerOf } from "../lib/providers";

/**
 * The model a copy gives an agent the example describes with ``model``: the example's own (tiered Anthropic) model
 * while the default model is Anthropic's, otherwise the default model, and the assistant model of the same provider
 * for the strong tier. This mirrors nodestro-examples' ``model_choice``, which the copy route applies.
 */
export function copiedModel(model: string, settings: Pick<Settings, "default_model" | "assistant_model"> | undefined, models?: ModelInfo[]): string {
  if (!settings || providerOf(settings.default_model) === "anthropic") return model;
  const provider = providerOf(settings.default_model);
  const strong = providerOf(settings.assistant_model) === provider ? settings.assistant_model : settings.default_model;
  return findModel(models, model)?.tier === "Opus" ? strong : settings.default_model;
}

/** Every agent model of the example, its teams included. */
function exampleModels(example: ExampleDetail): string[] {
  return [...example.agent_details, ...example.team_details.flatMap((team) => team.agents)].map((agent) => agent.model);
}

function Need({ icon: Icon, children, testId }: { icon: typeof Check; children: ReactNode; testId: string }) {
  return (
    <li data-testid={testId}>
      <Icon size={14} aria-hidden /> <span>{children}</span>
    </li>
  );
}

export function ExampleNeeds({ example }: { example: ExampleDetail }) {
  const { t } = useTranslation();
  const settings = useSettings();
  const meta = useMeta();
  const models = meta.data?.models;
  const copied = [...new Set(exampleModels(example).map((model) => copiedModel(model, settings.data, models)))];
  const providers = [...new Set(copied.map(providerOf))];
  const missing = (settings.data?.providers ?? []).filter((item) => providers.includes(item.id) && !item.configured);
  const names = copied.map((model) => findModel(models, model)?.label ?? model).join(", ");
  const approval = example.features.includes("approval") || example.team_details.some((team) => team.approval);
  const adapted = settings.data && providerOf(settings.data.default_model) !== "anthropic";
  return (
    <section className="example-needs" aria-labelledby="example-needs-title" data-testid="example-needs">
      <h3 id="example-needs-title">{t("library.needs.title")}</h3>
      <ul>
        {settings.data ? (
          <Need icon={missing.length ? KeyRound : Check} testId="example-needs-provider">
            {t(adapted ? "library.needs.modelsAdapted" : "library.needs.models", {
              provider: providers.map((item) => providerLabel(t, item)).join(", "),
              models: names,
            })}{" "}
            {missing.length ? (
              <strong className="example-needs__missing">
                {t("library.needs.providerMissing")} <Link to="/settings">{t("library.needs.setUp")}</Link>
              </strong>
            ) : (
              <span className="example-needs__ok">{t("library.needs.providerReady")}</span>
            )}
          </Need>
        ) : null}
        {approval ? (
          <Need icon={UserCheck} testId="example-needs-approval">
            {t("library.needs.approval")}
          </Need>
        ) : null}
        {example.knowledge.length ? (
          <Need icon={BookOpen} testId="example-needs-knowledge">
            {t("library.needs.knowledge", { count: example.knowledge.length })}
          </Need>
        ) : null}
        {example.samples.length ? (
          <Need icon={FileText} testId="example-needs-samples">
            {t("library.needs.samples", { count: example.samples.length })}
          </Need>
        ) : example.features.includes("documents") ? (
          <Need icon={FileText} testId="example-needs-files">
            {t("library.needs.files")}
          </Need>
        ) : null}
        <Need icon={PlugZap} testId="example-needs-connection">
          {example.integrations.length
            ? t("library.needs.connection", { names: example.integrations.map((item) => item.name).join(", ") })
            : t("library.needs.noConnection")}
        </Need>
      </ul>
    </section>
  );
}
