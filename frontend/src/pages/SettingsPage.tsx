import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Container, Cpu, Languages, Save, ScanText } from "lucide-react";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { useAccess } from "../api/access";
import { api } from "../api/client";
import { PermissionNote } from "../components/Access";
import { keys, useMeta, useSettings } from "../api/hooks";
import type { Settings } from "../api/types";
import { ModelPicker, useModelHint } from "../components/ModelPicker";
import { toast } from "../components/toast";
import { Badge, Button, Callout, Field, HelpTip, PageHeader, Segmented, Select, Spinner, TextInput, Toggle } from "../components/ui";
import { LANGUAGES, LANGUAGE_NAMES, type Language, currentLanguage, setLanguage, storedLanguage } from "../i18n";
import { ErrorText } from "../lib/errors";
import { PythonMaintenance } from "../python/PythonMaintenance";
import { BackupPanel, DiagnosticsPanel, InputStoragePanel } from "./SettingsMaintenance";
import { PricingPanel, ReconciliationPanel } from "./SettingsPricing";
import { ProviderSettings } from "./SettingsProviders";

const AUTOMATIC = "auto";

/** The interface language: switches at once and is remembered; nothing else is saved or run. */
function LanguagePicker() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const admin = useAccess().can("admin");
  const [choice, setChoice] = useState<string>(() => storedLanguage() ?? AUTOMATIC);
  const remember = useMutation({
    mutationFn: (language: Language | null) => api.saveSettings({ language }),
    onSuccess: (data) => queryClient.setQueryData(keys.settings, data),
    onError: toast.error,
  });
  const change = async (value: string) => {
    const language = value === AUTOMATIC ? null : (value as Language);
    setChoice(value);
    await setLanguage(language);
    // Without the right to change the settings the choice stays in this browser only (no refused request).
    if (admin) remember.mutate(language);
  };
  return (
    <section className="panel stack" aria-labelledby="settings-language">
      <h2 className="panel__title" id="settings-language">
        <Languages size={15} aria-hidden /> {t("settings.language.title")}{" "}
        <HelpTip id="settings.language" label={t("settings.language.title")} />
      </h2>
      <Field
        label={t("settings.language.label")}
        htmlFor="settings-language-select"
        hint={choice === AUTOMATIC ? t("settings.language.automaticHint", { language: LANGUAGE_NAMES[currentLanguage()] }) : t("settings.language.hint")}
      >
        <Select
          id="settings-language-select"
          value={choice}
          onChange={(value) => void change(value)}
          options={[
            { value: AUTOMATIC, label: t("settings.language.automatic") },
            ...LANGUAGES.map((code) => ({ value: code, label: LANGUAGE_NAMES[code] })),
          ]}
        />
      </Field>
      <p className="muted small" lang={i18n.language}>
        {t("settings.language.contentNote")}
      </p>
    </section>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const settings = useSettings();
  const meta = useMeta();
  const access = useAccess();
  const admin = access.can("admin");
  // Install-only panels (backup, diagnostics) only once it is known the principal holds "install" (AD-04).
  const install = access.profile !== "unknown" && access.can("install");
  const server = access.profile === "server";
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Settings | null>(null);
  const defaultHint = useModelHint(form?.default_model ?? "");
  const assistantHint = useModelHint(form?.assistant_model ?? "");

  useEffect(() => {
    if (settings.data) setForm(settings.data);
  }, [settings.data]);

  const save = useMutation({
    mutationFn: (body: Parameters<typeof api.saveSettings>[0]) => api.saveSettings(body),
    onSuccess: (data) => {
      queryClient.setQueryData(keys.settings, data);
      toast.success(t("settings.saved"));
    },
    onError: toast.error,
  });

  if (!form)
    return settings.error ? (
      <Callout tone="danger">
        <ErrorText error={settings.error} />
      </Callout>
    ) : (
      <Spinner />
    );

  return (
    <div className="page">
      <PageHeader
        title={t("settings.title")}
        doc="einstellungen"
        description={
          server ? t("admin.settings.serverDescription", { tenant: access.me?.tenant_id ?? "" }) : t("settings.description")
        }
      />
      <div className="page__body settings">
        <ProviderSettings settings={form} />

        <LanguagePicker />

        <section className="panel stack" aria-labelledby="settings-models">
          <h2 className="panel__title" id="settings-models">
            <Cpu size={15} aria-hidden /> {t("settings.models.title")}
          </h2>
          <Field label={t("settings.models.defaultModel")} tip="settings.defaultModel" hint={defaultHint ?? t("settings.models.defaultHint")}>
            <ModelPicker
              label={t("settings.models.defaultModel")}
              value={form.default_model}
              onChange={(value) => setForm({ ...form, default_model: value })}
            />
          </Field>
          <Field
            label={t("settings.models.assistantModel")}
            tip="settings.assistantModel"
            hint={assistantHint ?? t("settings.models.assistantHint")}
          >
            <ModelPicker
              label={t("settings.models.assistantModel")}
              value={form.assistant_model}
              onChange={(value) => setForm({ ...form, assistant_model: value })}
            />
          </Field>
          <Field label={t("settings.models.budget")} tip="settings.budget" hint={t("settings.models.budgetHint")}>
            <TextInput
              type="number"
              min={0}
              step={0.5}
              value={form.default_budget_usd ?? ""}
              onChange={(e) => setForm({ ...form, default_budget_usd: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </Field>
          <Field label={t("settings.models.architectBudget")} tip="settings.architectBudget" hint={t("settings.models.architectBudgetHint")}>
            <TextInput
              type="number"
              min={0}
              step={0.5}
              value={form.architect_budget_usd ?? ""}
              onChange={(e) => setForm({ ...form, architect_budget_usd: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </Field>
          <Field label={t("settings.models.architectRepairs")} tip="settings.architectRepairs" hint={t("settings.models.architectRepairsHint")}>
            <TextInput
              type="number"
              min={0}
              max={5}
              step={1}
              value={form.architect_max_repairs}
              onChange={(e) => setForm({ ...form, architect_max_repairs: Math.min(5, Math.max(0, Math.round(Number(e.target.value) || 0))) })}
            />
          </Field>
          <PermissionNote permission="admin" access={access} />
          <div>
            <Button
              variant="primary"
              icon={Save}
              disabled={!admin}
              busy={save.isPending}
              onClick={() =>
                save.mutate({
                  default_model: form.default_model,
                  assistant_model: form.assistant_model,
                  default_budget_usd: form.default_budget_usd,
                  architect_budget_usd: form.architect_budget_usd,
                  architect_max_repairs: form.architect_max_repairs,
                })
              }
            >
              {t("common.save")}
            </Button>
          </div>
        </section>

        <PricingPanel settings={form} onMode={(price_mode) => save.mutate({ price_mode })} />

        {admin ? <ReconciliationPanel /> : null}

        <section className="panel stack" aria-labelledby="settings-sandbox">
          <h2 className="panel__title" id="settings-sandbox">
            <Container size={15} aria-hidden /> {t("settings.sandbox.title")}{" "}
            <HelpTip id="settings.sandbox" label={t("settings.sandbox.label")} />
          </h2>
          <p className="muted small">{t("settings.sandbox.text")}</p>
          <div className="row-gap">
            <Segmented
              label={t("settings.sandbox.label")}
              value={form.sandbox}
              disabled={!admin}
              onChange={(sandbox) => save.mutate({ sandbox })}
              options={[
                { value: "subprocess", label: t("settings.sandbox.subprocess") },
                { value: "docker", label: "Docker" },
              ]}
            />
            <Badge tone={form.docker_available ? "success" : "idle"}>
              {form.docker_available ? t("settings.sandbox.dockerAvailable") : t("settings.sandbox.dockerMissing")}
            </Badge>
            {form.builtin_sandbox ? (
              <span data-testid="builtin-sandbox">
                <Badge tone={form.builtin_sandbox.available ? "success" : "idle"}>
                  {form.builtin_sandbox.available
                    ? t("settings.sandbox.builtinActive")
                    : t("settings.sandbox.builtinMissing")}
                </Badge>
              </span>
            ) : null}
          </div>
          {form.builtin_sandbox && !form.builtin_sandbox.available && form.builtin_sandbox.reason !== "server" ? (
            <p className="muted small" data-testid="builtin-sandbox-reason">
              {t(`settings.sandbox.reason.${form.builtin_sandbox.reason}`, {
                defaultValue: t("settings.sandbox.reason.failed"),
                system: form.builtin_sandbox.system,
              })}{" "}
              {form.builtin_sandbox.detail ? <code>{form.builtin_sandbox.detail}</code> : null}
            </p>
          ) : null}
          {form.sandbox === "docker" && !form.docker_available ? (
            <Callout tone="warning">{t("settings.sandbox.dockerUnreachable")}</Callout>
          ) : null}
        </section>

        <section className="panel stack" aria-labelledby="settings-ocr">
          <h2 className="panel__title" id="settings-ocr">
            <ScanText size={15} aria-hidden /> {t("settings.ocr.title")} <HelpTip id="files.ocr" label={t("settings.ocr.title")} />
          </h2>
          <p className="muted small">{t("settings.ocr.text")}</p>
          <div className="row-gap">
            <Toggle
              checked={Boolean(form.ocr_enabled)}
              disabled={!admin || !form.ocr_available}
              onChange={(ocr_enabled) => save.mutate({ ocr_enabled })}
              label={t("settings.ocr.label")}
            />
            <Badge tone={form.ocr_available ? "success" : "idle"}>
              {form.ocr_available ? t("settings.ocr.available") : t("settings.ocr.missing")}
            </Badge>
          </div>
        </section>

        {install ? <BackupPanel /> : null}

        <InputStoragePanel />

        <PythonMaintenance />

        {install ? <DiagnosticsPanel /> : null}

        <section className="panel stack" aria-label={t("settings.about.title")}>
          <h2 className="panel__title">{t("settings.about.title")}</h2>
          <p className="small">
            Nodestro {meta.data?.version ?? ""} · Orkexa {meta.data?.library_version ?? ""}
          </p>
          <p className="muted small">
            {server ? t("admin.settings.serverData") : <Trans i18nKey="settings.about.data" components={{ code: <code /> }} />}
          </p>
        </section>
      </div>
    </div>
  );
}
