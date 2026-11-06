import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Cpu, Languages, Save, ScanText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { useAccess } from "../api/access";
import { api } from "../api/client";
import { PermissionNote } from "../components/Access";
import { keys, useMeta, useSettings } from "../api/hooks";
import type { Settings } from "../api/types";
import { ModelPicker, useModelHint } from "../components/ModelPicker";
import { toast } from "../components/toast";
import { Badge, Button, Callout, Field, HelpTip, PageHeader, Select, Spinner, TextInput, Toggle } from "../components/ui";
import { LANGUAGES, LANGUAGE_NAMES, type Language, currentLanguage, setLanguage, storedLanguage } from "../i18n";
import { ErrorText } from "../lib/errors";
import { PythonMaintenance } from "../python/PythonMaintenance";
import { BackupPanel, DiagnosticsPanel, InputStoragePanel } from "./SettingsMaintenance";
import { PricingPanel, ReconciliationPanel } from "./SettingsPricing";
import { SettingsNav, useSettingsHash } from "./SettingsNav";
import { KnowledgeSearchPanel, LocalModelsPanel } from "./SettingsLocalModels";
import { ReasoningDisplayPanel } from "./SettingsReasoning";
import { SandboxPanel } from "./SettingsSandbox";
import { BudgetPolicyFields, budgetPolicyUpdate, hasBudgetPolicy, settingsForm } from "./SettingsBudget";
import { CHECK_KEY, DefaultModelNotice, ProviderSettings } from "./SettingsProviders";

const AUTOMATIC = "auto";

/** The interface language: switches at once and is remembered; nothing else is saved or run. */
function LanguagePicker() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const admin = useAccess().can("admin");
  const [choice, setChoice] = useState<string>(() => storedLanguage() ?? AUTOMATIC);
  // Every language but English is fetched on first use; the picker waits for it.
  const [loading, setLoading] = useState(false);
  const remember = useMutation({
    mutationFn: (language: Language | null) => api.saveSettings({ language }),
    onSuccess: (data) => queryClient.setQueryData(keys.settings, data),
    onError: toast.error,
  });
  const change = async (value: string) => {
    const language = value === AUTOMATIC ? null : (value as Language);
    const previous = choice;
    setChoice(value);
    setLoading(true);
    try {
      await setLanguage(language);
    } catch (error) {
      setChoice(previous);
      toast.errorAbout(t("settings.language.loadFailed"), error);
      return;
    } finally {
      setLoading(false);
    }
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
        hint={
          loading
            ? t("settings.language.loading")
            : choice === AUTOMATIC
              ? t("settings.language.automaticHint", { language: LANGUAGE_NAMES[currentLanguage()] })
              : t("settings.language.hint")
        }
      >
        <Select
          id="settings-language-select"
          value={choice}
          disabled={loading}
          aria-busy={loading || undefined}
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
  const body = useRef<HTMLDivElement>(null);
  useSettingsHash(Boolean(form));

  useEffect(() => {
    if (settings.data) setForm(settingsForm(settings.data));
  }, [settings.data]);

  const save = useMutation({
    mutationFn: (body: Parameters<typeof api.saveSettings>[0]) => api.saveSettings(body),
    onSuccess: (data) => {
      queryClient.setQueryData(keys.settings, data);
      // The default model decides which provider new agents need; the editor's check asks again.
      void queryClient.invalidateQueries({ queryKey: CHECK_KEY });
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
      <div className="page__body settings-layout">
        <div className="settings" ref={body}>
        <LocalModelsPanel settings={form} admin={admin} onOffline={(strict_offline) => save.mutate({ strict_offline })}
          onEurope={(prefer_european_models) => save.mutate({ prefer_european_models })}
          onReasoning={(local_reasoning) => save.mutate({ local_reasoning })}
        />

        <ProviderSettings settings={form} />

        <LanguagePicker />

        <ReasoningDisplayPanel settings={form} admin={admin} onSave={(change) => save.mutate(change)} />

        <section className="panel stack" aria-labelledby="settings-models">
          <h2 className="panel__title" id="settings-models">
            <Cpu size={15} aria-hidden /> {t("settings.models.title")}{" "}
            <HelpTip id="settings.defaultModel" label={t("settings.models.title")} />
          </h2>
          {settings.data ? <DefaultModelNotice settings={settings.data} /> : null}
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
          <BudgetPolicyFields form={form} admin={admin} onChange={(patch) => setForm({ ...form, ...patch })} />
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
              disabled={!admin || (hasBudgetPolicy(form) && budgetPolicyUpdate(form).invalid.length > 0)}
              busy={save.isPending}
              onClick={() =>
                save.mutate({
                  default_model: form.default_model,
                  assistant_model: form.assistant_model,
                  default_budget_usd: form.default_budget_usd,
                  architect_budget_usd: form.architect_budget_usd,
                  architect_max_repairs: form.architect_max_repairs,
                  // BUDGET-1: the budget policy, only where the backend knows it.
                  ...(hasBudgetPolicy(form) ? budgetPolicyUpdate(form).update : {}),
                })
              }
            >
              {t("common.save")}
            </Button>
          </div>
        </section>

        <PricingPanel settings={form} onMode={(price_mode) => save.mutate({ price_mode })} />

        {admin ? <ReconciliationPanel /> : null}

        <SandboxPanel settings={form} admin={admin} onMode={(sandbox) => save.mutate({ sandbox })} />

        <KnowledgeSearchPanel settings={form} admin={admin} onSave={(change) => save.mutate(change)} />

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

        <InputStoragePanel />

        <PythonMaintenance />

        {install ? <BackupPanel /> : null}

        {install ? <DiagnosticsPanel /> : null}

        <section className="panel stack" aria-labelledby="settings-about">
          <h2 className="panel__title" id="settings-about">
            {t("settings.about.title")}
          </h2>
          <p className="small">
            Nodestro {meta.data?.version ?? ""} · Orkexa {meta.data?.library_version ?? ""}
          </p>
          <p className="muted small">
            {server ? t("admin.settings.serverData") : <Trans i18nKey="settings.about.data" components={{ code: <code /> }} />}
          </p>
        </section>
        </div>
        <SettingsNav container={body} />
      </div>
    </div>
  );
}
