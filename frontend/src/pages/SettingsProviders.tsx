// The AI providers in the settings: keys, endpoints and the declared capabilities of
// OpenAI-compatible servers (Amazon Bedrock has its own card: SettingsBedrock.tsx). Keys are only ever sent, never shown: the backend reports where a
// key comes from, not the key.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Plug, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys, useMeta } from "../api/hooks";
import type { CapabilityState, DeclaredModelLimits, ProviderId, ProviderInfo, ProviderStatus, Settings } from "../api/types";
import { providerLabel } from "../components/ModelPicker";
import { modelLabel } from "../lib/catalog";
import { toast } from "../components/toast";
import { useAccess } from "../api/access";
import { PermissionNote } from "../components/Access";
import { Badge, Button, Callout, Field, HelpTip, Section, Select, TextInput } from "../components/ui";
import i18n from "../i18n";
import { ErrorText } from "../lib/errors";
import { defaultModelSwitch, providerOf } from "../lib/providers";
import { BedrockCard } from "./SettingsBedrock";
import { CheckRow } from "./SettingsMaintenance";
import { SettingsAdvanced } from "./SettingsParts";

const STATES: CapabilityState[] = ["unknown", "supported", "unsupported"];

/** The editor's check asks whether the providers of a workflow are set up: after a change it must ask again. */
export const CHECK_KEY = ["check"] as const;

/**
 * Lets new agents follow the providers that are set up: switches the default model (and the assistant model when
 * its provider is not set up either) to a catalog model of ``provider``. Settings only; stored workflows keep the
 * models they have.
 */
export function useFollowProvider() {
  const { t } = useTranslation();
  const meta = useMeta();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ settings, provider }: { settings: Settings; provider?: ProviderId }) => {
      const next = defaultModelSwitch(settings, meta.data?.models, provider);
      if (!next) return Promise.resolve(null);
      const assistantMissing = settings.providers.some((item) => item.id === providerOf(settings.assistant_model) && !item.configured);
      return api
        .saveSettings({ default_model: next.model.id, ...(assistantMissing ? { assistant_model: next.model.id } : {}) })
        .then((data) => ({ data, model: modelLabel(next.model), provider: providerLabel(t, next.provider.id) }));
    },
    onSuccess: (result) => {
      if (!result) return;
      queryClient.setQueryData(keys.settings, result.data);
      void queryClient.invalidateQueries({ queryKey: CHECK_KEY });
      toast.success(t("settings.providers.defaultFollowed", { model: result.model, provider: result.provider }));
    },
    onError: toast.error,
  });
}

/** The token limits an endpoint's models may declare (nodestro-runtime providers.LIMIT_NAMES, DECLARED_LIMIT_RANGE). */
const LIMIT_NAMES = ["max_output_tokens", "context_window"] as const;
type LimitName = (typeof LIMIT_NAMES)[number];
export const DECLARED_LIMIT_MIN = 256;
export const DECLARED_LIMIT_MAX = 10_000_000;

type LimitDraft = Record<LimitName, string>;

function limitDraft(limits: DeclaredModelLimits | null | undefined): LimitDraft {
  return {
    max_output_tokens: limits?.max_output_tokens ? String(limits.max_output_tokens) : "",
    context_window: limits?.context_window ? String(limits.context_window) : "",
  };
}

/** What is wrong with the declared limits (null: nothing), checked as the API checks them. */
export function limitProblem(draft: LimitDraft): { name: LimitName; max: number } | null {
  for (const name of LIMIT_NAMES) {
    const text = draft[name].trim();
    if (!text) continue;
    const value = Number(text);
    if (!Number.isInteger(value) || value < DECLARED_LIMIT_MIN || value > DECLARED_LIMIT_MAX) return { name, max: DECLARED_LIMIT_MAX };
  }
  const output = Number(draft.max_output_tokens.trim() || 0);
  const window = Number(draft.context_window.trim() || 0);
  if (output && window && output > window) return { name: "max_output_tokens", max: window };
  return null;
}

/** The limits to save: empty fields are sent as 0, which removes a declared limit. */
function limitsOf(draft: LimitDraft): DeclaredModelLimits {
  return { max_output_tokens: Number(draft.max_output_tokens.trim() || 0), context_window: Number(draft.context_window.trim() || 0) };
}

function ProviderCard({ info, status, settings }: { info: ProviderInfo; status: ProviderStatus; settings: Settings }) {
  const { t } = useTranslation();
  const meta = useMeta();
  const queryClient = useQueryClient();
  const follow = useFollowProvider();
  const access = useAccess();
  const admin = access.can("admin");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(status.base_url ?? "");
  const [capabilities, setCapabilities] = useState<Record<string, CapabilityState>>(status.capabilities);
  const [limits, setLimits] = useState<LimitDraft>(() => limitDraft(status.limits));
  useEffect(() => {
    setBaseUrl(status.base_url ?? "");
    setCapabilities(status.capabilities);
    setLimits(limitDraft(status.limits));
  }, [status.base_url, status.capabilities, status.limits]);
  const save = useMutation({
    mutationFn: (change: Parameters<typeof api.saveProvider>[1]) => api.saveProvider(info.id, change),
    onSuccess: (data, change) => {
      queryClient.setQueryData(keys.settings, data);
      // Checks made before the change still say the provider is missing (or set up); ask again.
      void queryClient.invalidateQueries({ queryKey: CHECK_KEY });
      setApiKey("");
      toast.success(t("settings.saved"));
      // The first provider set up becomes the one of new agents when the default model's provider has no key.
      if (change.api_key && data.providers.some((item) => item.id === info.id && item.configured))
        follow.mutate({ settings: data, provider: info.id });
    },
    onError: toast.error,
  });
  const connection = useMutation({ mutationFn: () => api.checkConnection(info.id) });
  const name = providerLabel(t, info.id);
  const used = [settings.default_model, settings.assistant_model].some((model) => providerOf(model) === info.id);
  const limitsChanged = JSON.stringify(limitDraft(limitsOf(limits))) !== JSON.stringify(limitDraft(status.limits));
  const problem = info.declare_capabilities ? limitProblem(limits) : null;
  const changed =
    baseUrl.trim() !== (status.base_url ?? "") ||
    JSON.stringify(capabilities) !== JSON.stringify(status.capabilities) ||
    (info.declare_capabilities && limitsChanged);
  const number = (value: number) => value.toLocaleString(i18n.language);
  return (
    <Section
      id={`provider-${info.id}`}
      title={name}
      icon={KeyRound}
      defaultOpen={status.configured || used}
      summary={
        <Badge tone={status.configured ? "success" : used ? "warning" : "idle"}>
          {status.configured ? t("settings.providers.configured") : t("settings.providers.notConfigured")}
        </Badge>
      }
    >
      <div className="stack" data-provider={info.id}>
        {status.key_source === "environment" ? (
          <Callout tone="brand">
            <Trans i18nKey="settings.providers.fromEnvironment" values={{ variable: status.env_var }} components={{ code: <code /> }} />
          </Callout>
        ) : status.key_source === "settings" ? (
          <Callout tone="brand">{t("settings.providers.keyStored")}</Callout>
        ) : info.needs_key ? (
          <Callout tone={used ? "warning" : "info"}>
            <Trans
              i18nKey="settings.providers.keyMissing"
              values={{ variables: info.env_vars.join(" / ") }}
              components={{ code: <code /> }}
            />
          </Callout>
        ) : null}
        <Field label={info.needs_key ? t("settings.providers.apiKey") : t("settings.providers.apiKeyOptional")}>
          <form
            className="row-gap"
            onSubmit={(event) => {
              event.preventDefault();
              if (apiKey.trim()) save.mutate({ api_key: apiKey.trim() });
            }}
          >
            <TextInput
              type="password"
              autoComplete="off"
              value={apiKey}
              placeholder={status.key_stored ? "••••••••" : undefined}
              onChange={(e) => setApiKey(e.target.value)}
              aria-label={t("settings.providers.apiKeyFor", { provider: name })}
            />
            <Button type="submit" variant="primary" icon={Save} disabled={!admin || !apiKey.trim()} busy={save.isPending}>
              {t("common.save")}
            </Button>
            {status.key_stored ? (
              <Button variant="danger" icon={Trash2} disabled={!admin} onClick={() => save.mutate({ api_key: "" })}>
                {t("common.remove")}
              </Button>
            ) : null}
          </form>
        </Field>
        {info.base_url ? (
          <Field
            label={t("settings.providers.baseUrl")}
            hint={
              info.default_base_url
                ? t("settings.providers.baseUrlDefault", { url: info.default_base_url })
                : t("settings.providers.baseUrlHint")
            }
          >
            <TextInput
              value={baseUrl}
              placeholder={info.default_base_url ?? "https://…/v1"}
              spellCheck={false}
              onChange={(e) => setBaseUrl(e.target.value)}
              aria-label={t("settings.providers.baseUrlFor", { provider: name })}
            />
          </Field>
        ) : null}
        {info.declare_capabilities ? (
          // Progressive disclosure: eleven expert choices, closed until needed; the badge counts the declared ones.
          <SettingsAdvanced
            title={t("settings.providers.capabilities")}
            hint={t("settings.providers.capabilitiesHint")}
            changed={Object.values(capabilities).filter((state) => state && state !== "unknown").length}
          >
            <div className="settings-columns">
              {(meta.data?.capabilities ?? []).map((capability) => (
                <label
                  key={capability}
                  className="stack-sm small"
                  data-setting={t(`settings.providers.capability.${capability}`, { defaultValue: capability })}
                >
                  <span>{t(`settings.providers.capability.${capability}`, { defaultValue: capability })}</span>
                  <Select
                    value={capabilities[capability] ?? "unknown"}
                    options={STATES.map((state) => ({ value: state, label: t(`settings.providers.state.${state}`) }))}
                    onChange={(value) => setCapabilities({ ...capabilities, [capability]: value as CapabilityState })}
                  />
                </label>
              ))}
            </div>
          </SettingsAdvanced>
        ) : null}
        {info.declare_capabilities ? (
          // Token limits of the endpoint's models (ST-057): used only where Orkexa documents nothing for a model.
          <SettingsAdvanced
            title={t("settings.providers.limits.title")}
            hint={t("settings.providers.limits.hint")}
            changed={LIMIT_NAMES.filter((name) => limits[name].trim()).length}
            testId={`provider-limits-${info.id}`}
          >
            <div className="settings-columns">
              {LIMIT_NAMES.map((name) => (
                <Field
                  key={name}
                  label={t(`settings.providers.limits.${name}`)}
                  hint={
                    problem?.name === name ? (
                      <span className="field__error" data-testid={`provider-limit-error-${name}`}>
                        {t("settings.providers.limits.invalid", { min: number(DECLARED_LIMIT_MIN), max: number(problem.max) })}
                      </span>
                    ) : (
                      t("settings.providers.limits.range", { min: number(DECLARED_LIMIT_MIN), max: number(DECLARED_LIMIT_MAX) })
                    )
                  }
                >
                  <TextInput
                    type="number"
                    inputMode="numeric"
                    min={DECLARED_LIMIT_MIN}
                    max={DECLARED_LIMIT_MAX}
                    step={1024}
                    value={limits[name]}
                    disabled={!admin}
                    placeholder={t("settings.providers.limits.placeholder")}
                    aria-invalid={problem?.name === name || undefined}
                    onChange={(event) => setLimits({ ...limits, [name]: event.target.value })}
                    data-testid={`provider-limit-${name}`}
                  />
                </Field>
              ))}
            </div>
          </SettingsAdvanced>
        ) : null}
        <div className="row-gap">
          {info.base_url || info.declare_capabilities ? (
            <Button
              variant="primary"
              icon={Save}
              disabled={!admin || !changed || Boolean(problem)}
              busy={save.isPending}
              onClick={() =>
                save.mutate({
                  ...(info.base_url ? { base_url: baseUrl.trim() } : {}),
                  ...(info.declare_capabilities ? { capabilities, limits: limitsOf(limits) } : {}),
                })
              }
            >
              {t("settings.providers.saveEndpoint")}
            </Button>
          ) : null}
          <Button icon={Plug} busy={connection.isPending} disabled={!status.configured || !access.can("install")} onClick={() => connection.mutate()}>
            {t("settings.providers.test")}
          </Button>
        </div>
        {connection.data ? (
          <ul className="diagnostics">
            <CheckRow check={connection.data} />
          </ul>
        ) : null}
        {connection.error ? (
          <Callout tone="danger">
            <ErrorText error={connection.error} />
          </Callout>
        ) : null}
      </div>
    </Section>
  );
}

export function ProviderSettings({ settings }: { settings: Settings }) {
  const { t } = useTranslation();
  const meta = useMeta();
  return (
    <section className="panel stack" aria-labelledby="settings-providers" data-testid="providers">
      <h2 className="panel__title" id="settings-providers">
        <KeyRound size={15} aria-hidden /> {t("settings.providers.title")}{" "}
        <HelpTip id="settings.providers" label={t("settings.providers.title")} />
      </h2>
      <p className="muted small">{t("settings.providers.intro")}</p>
      <PermissionNote permission="admin" />
      {(meta.data?.providers ?? []).map((info) => {
        const status = settings.providers.find((item) => item.id === info.id);
        if (!status) return null;
        // Amazon Bedrock signs in with AWS credentials: region and sign-in method, never an API key field.
        if (info.auth === "aws" || info.id === "bedrock")
          return <BedrockCard key={info.id} info={info} status={status} settings={settings} />;
        return <ProviderCard key={info.id} info={info} status={status} settings={settings} />;
      })}
    </section>
  );
}

/**
 * Above the model choice: the default model belongs to a provider that is not set up. Offers the model of a provider
 * that is set up (a change of the settings only; existing workflows keep their models).
 */
export function DefaultModelNotice({ settings }: { settings: Settings }) {
  const { t } = useTranslation();
  const meta = useMeta();
  const follow = useFollowProvider();
  const current = settings.providers.find((item) => item.id === providerOf(settings.default_model));
  if (!current || current.configured) return null;
  const configured = settings.providers.filter((item) => item.configured);
  if (!configured.length) return null;
  const next = defaultModelSwitch(settings, meta.data?.models);
  return (
    <Callout tone="warning">
      <span data-testid="default-model-notice">
        {t("settings.models.defaultProviderMissing", { provider: providerLabel(t, current.id) })}{" "}
        {next
          ? t("settings.models.defaultSwitchHint")
          : t("settings.models.defaultPickHint", { providers: configured.map((item) => providerLabel(t, item.id)).join(", ") })}
      </span>
      {next ? (
        <>
          {" "}
          <Button size="sm" busy={follow.isPending} onClick={() => follow.mutate({ settings })}>
            {t("settings.models.defaultSwitch", { model: modelLabel(next.model), provider: providerLabel(t, next.provider.id) })}
          </Button>
        </>
      ) : null}
    </Callout>
  );
}
