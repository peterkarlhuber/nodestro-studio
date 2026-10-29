// AI providers on the interface side: model names are "provider:model" (Orkexa's convention); a
// name without a known provider prefix belongs to Anthropic, so configurations stored before
// several providers existed ("claude-sonnet-5-5") keep working.

import type { ProviderId, ProviderStatus, Settings } from "../api/types";

export const PROVIDER_IDS: readonly ProviderId[] = ["anthropic", "openai", "gemini", "compatible", "ollama", "vllm"];

export function isProvider(value: string): value is ProviderId {
  return (PROVIDER_IDS as readonly string[]).includes(value);
}

/** Provider and the provider's own model id of a model name. */
export function splitModel(model: string): { provider: ProviderId; id: string } {
  const index = model.indexOf(":");
  if (index > 0) {
    const prefix = model.slice(0, index);
    if (isProvider(prefix)) return { provider: prefix, id: model.slice(index + 1) };
  }
  return { provider: "anthropic", id: model };
}

export function providerOf(model: string): ProviderId {
  return splitModel(model).provider;
}

/** The qualified name "provider:model". */
export function qualifyModel(model: string): string {
  const { provider, id } = splitModel(model);
  return `${provider}:${id}`;
}

/** Whether two model names mean the same model ("claude-opus-5-5" and "anthropic:claude-opus-5-5"). */
export function sameModel(a: string, b: string): boolean {
  return qualifyModel(a) === qualifyModel(b);
}

/** The providers of ``models`` that are not configured yet (no key, no endpoint). */
export function missingProviders(settings: Settings | undefined, models: (string | null | undefined)[]): ProviderStatus[] {
  if (!settings) return [];
  const wanted = new Set(models.filter((model): model is string => Boolean(model)).map(providerOf));
  return settings.providers.filter((item) => wanted.has(item.id) && !item.configured);
}

/** The names of providers for a sentence ("OpenAI, Ollama"). */
export function providerNames(items: { label: string }[]): string {
  return items.map((item) => item.label).join(", ");
}

/** The catalog entry of a model name, also for bare Anthropic ids. */
export function findModel<T extends { id: string }>(models: T[] | undefined, model: string): T | undefined {
  return models?.find((item) => sameModel(item.id, model));
}
