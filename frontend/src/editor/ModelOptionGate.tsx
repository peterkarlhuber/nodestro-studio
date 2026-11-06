// Agent options that depend on the model: shown when the model supports them, otherwise a reason instead
// (GET /api/models/profile). Replaces the former "Anthropic only" wrapper: the decision follows the model's
// capabilities, not the provider's name. A value that is set stays visible next to the reason, so it can be reset;
// the backend refuses the same options with the same reasons (config.option_unsupported).

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { type ModelOption, optionSupport } from "../api/modelProfile";
import { Callout } from "../components/ui";
import type { ModelProfile, NativeToolSupport, OptionSupport } from "../api/types";

/** The support of ``option``; without a profile (loading, older API) the former rule: Anthropic models only. */
export function supportOf(profile: ModelProfile | undefined, option: ModelOption, provider: string | null): OptionSupport {
  const known = optionSupport(profile, option);
  if (known) return known;
  if (option === "thinking_budget") return { available: provider === "gemini", reason: "unknown", values: null };
  return { available: provider === "anthropic", reason: "provider", values: null };
}

/** Why an option is not available, in the interface language. */
export function OptionReason({ option, support }: { option: string; support: OptionSupport }) {
  const { t } = useTranslation();
  const reason = support.reason ?? "unknown";
  return (
    <p className="field__hint" data-testid={`option-unavailable-${option}`} data-reason={reason}>
      {t(`modelParams.reason.${reason}`, { defaultValue: t("modelParams.reason.unknown") })}
    </p>
  );
}

export function ModelOptionGate({
  profile,
  provider,
  option,
  set,
  children,
}: {
  profile: ModelProfile | undefined;
  provider: string | null;
  option: ModelOption;
  /** The agent sets a value other than "not used": it stays visible (to reset it) next to the reason. */
  set: boolean;
  children: ReactNode;
}) {
  const support = supportOf(profile, option, provider);
  if (support.available) return <>{children}</>;
  const reason = <OptionReason option={option} support={support} />;
  return set ? (
    <>
      {children}
      {reason}
    </>
  ) : (
    reason
  );
}

/** A provider-native tool's support; without a profile the former rule (Anthropic models only). */
export function nativeToolSupport(profile: ModelProfile | undefined, key: string, provider: string | null): NativeToolSupport {
  const known = profile?.native_tools?.find((tool) => tool.key === key);
  return known ?? { key, available: provider === "anthropic", reason: provider === "anthropic" ? null : "provider" };
}

/** Why a provider-native tool cannot be used with the model. */
export function NativeToolReason({ tool, label }: { tool: NativeToolSupport; label: string }) {
  const { t } = useTranslation();
  const reason = tool.reason ?? "provider";
  return (
    <p className="field__hint" data-testid={`native-tool-unavailable-${tool.key}`} data-reason={reason}>
      {t(`modelParams.nativeTool.${reason}`, { tool: label, defaultValue: t("modelParams.nativeTool.provider", { tool: label }) })}
    </p>
  );
}

/**
 * The model's token limits next to an agent's max. tokens: the maximum output (documented or declared) and the
 * context window; a value above the maximum is named here and refused by the validation (config.max_tokens_above_model).
 */
export function ModelTokenLimits({ profile, maxTokens }: { profile: ModelProfile | undefined; maxTokens: number }) {
  const { t, i18n } = useTranslation();
  if (!profile) return null;
  const number = (value: number) => value.toLocaleString(i18n.language);
  const { max_output_tokens: output, context_window: window, source } = profile.limits;
  const parts: string[] = [];
  if (output !== null) parts.push(t("modelParams.limits.maxOutput", { tokens: number(output) }));
  if (window !== null) parts.push(t("modelParams.limits.contextWindow", { tokens: number(window) }));
  const above = output !== null && maxTokens > output;
  return (
    <>
      <p className="field__hint" data-testid="model-token-limits" data-source={source}>
        {parts.length
          ? `${parts.join(" · ")} (${t(`modelParams.limits.source.${source}`, { defaultValue: source })})`
          : t("modelParams.limits.unknown")}
      </p>
      {above ? (
        <Callout tone="danger">
          <span data-testid="max-tokens-above-model">
            {t("errors.config.max_tokens_above_model", { max_tokens: number(maxTokens), maximum: number(output) })}
          </span>
        </Callout>
      ) : null}
    </>
  );
}
