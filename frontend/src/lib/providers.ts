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

/** Whether at least one AI provider is set up (a key, an endpoint or a local server). */
export function anyProviderConfigured(settings: Settings | undefined): boolean {
  return Boolean(settings?.providers.some((item) => item.configured));
}

/**
 * The catalog model new agents should use when ``provider`` is the one that is set up: its first recommended model,
 * else its first model. Undefined for providers without catalog models (compatible endpoints, Ollama, vLLM), where
 * only the person knows which model the server offers.
 */
export function suggestedModel<T extends { id: string; provider: string; recommended: boolean }>(
  models: T[] | undefined,
  provider: ProviderId,
): T | undefined {
  const own = (models ?? []).filter((item) => item.provider === provider);
  return own.find((item) => item.recommended) ?? own[0];
}

/**
 * When the default model's provider is not set up but another provider is: the configured provider with a catalog
 * model that new agents could use instead (``preferred`` first). Null when nothing needs to change or nothing fits.
 */
export function defaultModelSwitch<T extends { id: string; provider: string; recommended: boolean }>(
  settings: Settings | undefined,
  models: T[] | undefined,
  preferred?: ProviderId,
): { provider: ProviderStatus; model: T } | null {
  if (!settings || !missingProviders(settings, [settings.default_model]).length) return null;
  const configured = settings.providers.filter((item) => item.configured);
  const ordered = preferred ? [...configured.filter((item) => item.id === preferred), ...configured.filter((item) => item.id !== preferred)] : configured;
  for (const provider of ordered) {
    const model = suggestedModel(models, provider.id);
    if (model) return { provider, model };
  }
  return null;
}
