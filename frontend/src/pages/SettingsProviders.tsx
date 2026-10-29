// The AI providers in the settings: keys, endpoints and the declared capabilities of
// OpenAI-compatible servers. Keys are only ever sent, never shown: the backend reports where a
// key comes from, not the key.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Plug, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys, useMeta } from "../api/hooks";
import type { CapabilityState, ProviderInfo, ProviderStatus, Settings } from "../api/types";
import { providerLabel } from "../components/ModelPicker";
import { toast } from "../components/toast";
import { Badge, Button, Callout, Field, HelpTip, Section, Select, TextInput } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { providerOf } from "../lib/providers";
import { CheckRow } from "./SettingsMaintenance";

const STATES: CapabilityState[] = ["unknown", "supported", "unsupported"];

function ProviderCard({ info, status, settings }: { info: ProviderInfo; status: ProviderStatus; settings: Settings }) {
  const { t } = useTranslation();
  const meta = useMeta();
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(status.base_url ?? "");
  const [capabilities, setCapabilities] = useState<Record<string, CapabilityState>>(status.capabilities);
  useEffect(() => {
    setBaseUrl(status.base_url ?? "");
    setCapabilities(status.capabilities);
  }, [status.base_url, status.capabilities]);
  const save = useMutation({
    mutationFn: (change: Parameters<typeof api.saveProvider>[1]) => api.saveProvider(info.id, change),
    onSuccess: (data) => {
      queryClient.setQueryData(keys.settings, data);
      setApiKey("");
      toast.success(t("settings.saved"));
    },
    onError: toast.error,
  });
  const connection = useMutation({ mutationFn: () => api.checkConnection(info.id) });
  const name = providerLabel(t, info.id);
  const used = [settings.default_model, settings.assistant_model].some((model) => providerOf(model) === info.id);
  const changed =
    baseUrl.trim() !== (status.base_url ?? "") || JSON.stringify(capabilities) !== JSON.stringify(status.capabilities);
  return (
    <Section
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
            <Button type="submit" variant="primary" icon={Save} disabled={!apiKey.trim()} busy={save.isPending}>
              {t("common.save")}
            </Button>
            {status.key_stored ? (
              <Button variant="danger" icon={Trash2} onClick={() => save.mutate({ api_key: "" })}>
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
          <Field label={t("settings.providers.capabilities")} hint={t("settings.providers.capabilitiesHint")}>
            <div className="grid-2">
              {(meta.data?.capabilities ?? []).map((capability) => (
                <label key={capability} className="stack-sm small">
                  <span>{t(`settings.providers.capability.${capability}`, { defaultValue: capability })}</span>
                  <Select
                    value={capabilities[capability] ?? "unknown"}
                    options={STATES.map((state) => ({ value: state, label: t(`settings.providers.state.${state}`) }))}
                    onChange={(value) => setCapabilities({ ...capabilities, [capability]: value as CapabilityState })}
                  />
                </label>
              ))}
            </div>
          </Field>
        ) : null}
        <div className="row-gap">
          {info.base_url || info.declare_capabilities ? (
            <Button
              variant="primary"
              icon={Save}
              disabled={!changed}
              busy={save.isPending}
              onClick={() =>
                save.mutate({
                  ...(info.base_url ? { base_url: baseUrl.trim() } : {}),
                  ...(info.declare_capabilities ? { capabilities } : {}),
                })
              }
            >
              {t("settings.providers.saveEndpoint")}
            </Button>
          ) : null}
          <Button icon={Plug} busy={connection.isPending} disabled={!status.configured} onClick={() => connection.mutate()}>
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
      {(meta.data?.providers ?? []).map((info) => {
        const status = settings.providers.find((item) => item.id === info.id);
        return status ? <ProviderCard key={info.id} info={info} status={status} settings={settings} /> : null;
      })}
    </section>
  );
}
