// Provider and model of an agent (or of a default in the settings): the provider from a list, the
// model from the catalog or typed freely, because every provider accepts its own model ids.

import type { TFunction } from "i18next";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { useMeta, useSettings } from "../api/hooks";
import type { ProviderId } from "../api/types";
import { modelDescription } from "../lib/catalog";
import { findModel, splitModel } from "../lib/providers";

import { Select, TextInput } from "./ui";

/** The provider's name in the interface language. */
export function providerLabel(t: TFunction, provider: ProviderId | string): string {
  return t(`providers.names.${provider}`, { defaultValue: provider });
}

/** Names of several providers for a sentence ("OpenAI, Ollama"). */
export function providerList(t: TFunction, providers: { id: string }[]): string {
  return providers.map((item) => providerLabel(t, item.id)).join(", ");
}

/** What the field hint says about a model: its description, unknown prices, a missing configuration. */
export function useModelHint(model: string): string | undefined {
  const { t } = useTranslation();
  const meta = useMeta();
  const settings = useSettings();
  const { provider } = splitModel(model);
  const status = settings.data?.providers.find((item) => item.id === provider);
  if (status && !status.configured) return t("providers.notConfiguredHint", { provider: providerLabel(t, provider) });
  const info = findModel(meta.data?.models, model);
  if (info) return modelDescription(t, info);
  return model.trim() ? t("providers.customModelHint") : undefined;
}

export function ModelPicker({
  value,
  onChange,
  id,
  label,
}: {
  value: string;
  onChange: (model: string) => void;
  /** The id of the model input (for a Field's label). */
  id?: string;
  /** The accessible name of the model input. */
  label?: string;
}) {
  const { t } = useTranslation();
  const meta = useMeta();
  const settings = useSettings();
  const listId = useId();
  const { provider, id: modelId } = splitModel(value);
  const models = meta.data?.models ?? [];
  const info = meta.data?.providers.find((item) => item.id === provider);
  const providerOptions = (meta.data?.providers ?? []).map((item) => {
    const configured = settings.data?.providers.find((status) => status.id === item.id)?.configured;
    const name = providerLabel(t, item.id);
    return { value: item.id, label: configured === false ? t("providers.notConfiguredOption", { provider: name }) : name };
  });
  const changeProvider = (next: string) => {
    if (next === provider) return;
    const own = models.filter((model) => model.provider === next);
    const first = own.find((model) => model.recommended) ?? own[0];
    onChange(`${next}:${first?.model ?? ""}`);
  };
  return (
    <div className="model-picker">
      <Select aria-label={t("providers.provider")} value={provider} options={providerOptions} onChange={changeProvider} />
      <TextInput
        id={id}
        list={listId}
        value={modelId}
        placeholder={info?.example_model || undefined}
        aria-label={label ?? t("providers.model")}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => onChange(`${provider}:${event.target.value.trim()}`)}
      />
      <datalist id={listId}>
        {models
          .filter((model) => model.provider === provider)
          .map((model) => (
            <option key={model.id} value={model.model}>
              {model.label}
            </option>
          ))}
      </datalist>
    </div>
  );
}
