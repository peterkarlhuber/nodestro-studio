import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Cpu, Languages, Save, ScanText } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useBlocker } from "react-router-dom";

import { useAccess } from "../api/access";
import { api } from "../api/client";
import { PermissionNote } from "../components/Access";
import { keys, useMeta, useSettings } from "../api/hooks";
import type { Settings } from "../api/types";
import { ModelPicker, providerLabel, useModelHint, useModelName } from "../components/ModelPicker";
import { toast } from "../components/toast";
import { UnsavedChangesModal } from "../components/UnsavedChanges";
import { Badge, Button, Callout, Field, HelpTip, PageHeader, Select, Spinner, TextInput, Toggle } from "../components/ui";
import { LANGUAGES, LANGUAGE_NAMES, type Language, currentLanguage, setLanguage, storedLanguage } from "../i18n";
import { ErrorText } from "../lib/errors";
import { formatCost } from "../lib/format";
import { PythonMaintenance } from "../python/PythonMaintenance";
import { BackupPanel, DiagnosticsPanel, InputStoragePanel } from "./SettingsMaintenance";
import { MembersPanel } from "./SettingsMembers";
import { PricingPanel, ReconciliationPanel } from "./SettingsPricing";
import { SettingsNav, useSettingsHash } from "./SettingsNav";
import { DefaultMark } from "./SettingsDefaults";
import { SettingsGroup } from "./SettingsParts";
import { mergeSettingsForm, modelsDirty } from "./settingsModelsForm";
import { SettingsResizer } from "./SettingsResizer";
import { SETTINGS_WIDTH, useSettingsWidth } from "./settingsWidth";
import { KnowledgeSearchPanel, LocalModelsPanel } from "./SettingsLocalModels";
import { ReasoningDisplayPanel } from "./SettingsReasoning";
import { SandboxPanel } from "./SettingsSandbox";
import { OutputLimitsPanel } from "./SettingsOutputLimits";
import { BudgetPolicyFields, budgetPolicyUpdate, hasBudgetPolicy, settingsForm } from "./SettingsBudget";
import { CHECK_KEY, DefaultModelNotice, ProviderSettings, unsavedProviderIds, useUnsavedProviders } from "./SettingsProviders";

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
        action={
          <DefaultMark
            setting="language"
            value={choice === AUTOMATIC ? null : choice}
            label={t("settings.language.label")}
            disabled={loading}
            onReset={() => void change(AUTOMATIC)}
            format={(value) => (value && value in LANGUAGE_NAMES ? LANGUAGE_NAMES[value as Language] : t("settings.language.automatic"))}
          />
        }
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
  const modelName = useModelName();
  /** A budget default for the reset action's tooltip (null: no limit). */
  const money = (value: number | string | null) => (value === null ? t("editor.run.unlimited") : formatCost(Number(value)));
  const body = useRef<HTMLDivElement>(null);
  const layout = useRef<HTMLDivElement>(null);
  const nav = useRef<HTMLElement>(null);
  const width = useSettingsWidth();
  useSettingsHash(Boolean(form));

  // New data from the server (another section saved, a refetch) keeps the unsaved edits of "Models and budget".
  const lastSaved = useRef<Settings | null>(null);
  useEffect(() => {
    if (!settings.data) return;
    const next = settingsForm(settings.data);
    const previous = lastSaved.current;
    setForm((current) => mergeSettingsForm(current, previous, next));
    lastSaved.current = next;
  }, [settings.data]);

  // "Models and budget" is the one part of the page with a Save button: leaving it with changes asks first.
  const dirty = modelsDirty(form, lastSaved.current);
  // So does a provider card with a typed key, address, capabilities or limits that are not saved yet (ST-058).
  const unsavedProviders = unsavedProviderIds(useUnsavedProviders((state) => state.dirty));
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => (dirty || unsavedProviders.length > 0) && currentLocation.pathname !== nextLocation.pathname,
  );

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

  const modelsInvalid = Boolean(form && hasBudgetPolicy(form) && budgetPolicyUpdate(form).invalid.length > 0);
  const saveModels = (then?: () => void) => {
    if (!form) return;
    save.mutate(
      {
        default_model: form.default_model,
        assistant_model: form.assistant_model,
        default_budget_usd: form.default_budget_usd,
        architect_budget_usd: form.architect_budget_usd,
        architect_max_repairs: form.architect_max_repairs,
        // BUDGET-1: the budget policy, only where the backend knows it.
        ...(hasBudgetPolicy(form) ? budgetPolicyUpdate(form).update : {}),
      },
      { onSuccess: () => then?.() },
    );
  };

  if (!form)
    return settings.error ? (
      <Callout tone="danger">
        <ErrorText error={settings.error} />
      </Callout>
    ) : (
      <Spinner />
    );

  return (
    <div className="page settings-page">
      <PageHeader
        title={t("settings.title")}
        doc="einstellungen"
        description={
          server ? t("admin.settings.serverDescription", { tenant: access.me?.tenant_id ?? "" }) : t("settings.description")
        }
      />
      {/* The content column, its draggable right edge and the navigation (styles/settings.css). */}
      <div className="page__body settings-layout" ref={layout} style={{ "--settings-width": `${width.width}px` } as CSSProperties}>
        <div className="settings" id="settings-content" ref={body}>
        <LocalModelsPanel settings={form} admin={admin} onOffline={(strict_offline) => save.mutate({ strict_offline })}
          onEurope={(prefer_european_models) => save.mutate({ prefer_european_models })}
          onReasoning={(local_reasoning) => save.mutate({ local_reasoning })}
        />

        <ProviderSettings settings={form} />

        <LanguagePicker />

        <MembersPanel />

        <ReasoningDisplayPanel settings={form} admin={admin} onSave={(change) => save.mutate(change)} />

        <section className="panel stack" aria-labelledby="settings-models">
          <h2 className="panel__title" id="settings-models">
            <Cpu size={15} aria-hidden /> {t("settings.models.title")}{" "}
            <HelpTip id="settings.defaultModel" label={t("settings.models.title")} />
          </h2>
          {settings.data ? <DefaultModelNotice settings={settings.data} /> : null}
          <SettingsGroup title={t("settingsUi.models.groupModels")}>
            <Field
              label={t("settings.models.defaultModel")}
              tip="settings.defaultModel"
              hint={defaultHint ?? t("settings.models.defaultHint")}
              action={
                <DefaultMark
                  setting="default_model"
                  value={form.default_model}
                  label={t("settings.models.defaultModel")}
                  disabled={!admin}
                  format={modelName}
                  onReset={(default_model) => setForm({ ...form, default_model })}
                />
              }
            >
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
              action={
                <DefaultMark
                  setting="assistant_model"
                  value={form.assistant_model}
                  label={t("settings.models.assistantModel")}
                  disabled={!admin}
                  format={modelName}
                  onReset={(assistant_model) => setForm({ ...form, assistant_model })}
                />
              }
            >
              <ModelPicker
                label={t("settings.models.assistantModel")}
                value={form.assistant_model}
                onChange={(value) => setForm({ ...form, assistant_model: value })}
              />
            </Field>
          </SettingsGroup>
          <SettingsGroup title={t("settingsUi.models.groupBudget")} columns>
            <Field
              label={t("settings.models.budget")}
              tip="settings.budget"
              hint={t("settings.models.budgetHint")}
              action={
                <DefaultMark
                  setting="default_budget_usd"
                  value={form.default_budget_usd}
                  label={t("settings.models.budget")}
                  disabled={!admin}
                  format={money}
                  onReset={(default_budget_usd) => setForm({ ...form, default_budget_usd })}
                />
              }
            >
              <TextInput
                type="number"
                min={0}
                step={0.5}
                value={form.default_budget_usd ?? ""}
                onChange={(e) => setForm({ ...form, default_budget_usd: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </Field>
            <BudgetPolicyFields form={form} admin={admin} onChange={(patch) => setForm({ ...form, ...patch })} money={money} />
          </SettingsGroup>
          <SettingsGroup title={t("settingsUi.models.groupArchitect")} columns>
            <Field
              label={t("settings.models.architectBudget")}
              tip="settings.architectBudget"
              hint={t("settings.models.architectBudgetHint")}
              action={
                <DefaultMark
                  setting="architect_budget_usd"
                  value={form.architect_budget_usd}
                  label={t("settings.models.architectBudget")}
                  disabled={!admin}
                  format={money}
                  onReset={(architect_budget_usd) => setForm({ ...form, architect_budget_usd })}
                />
              }
            >
              <TextInput
                type="number"
                min={0}
                step={0.5}
                value={form.architect_budget_usd ?? ""}
                onChange={(e) => setForm({ ...form, architect_budget_usd: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </Field>
            <Field
              label={t("settings.models.architectRepairs")}
              tip="settings.architectRepairs"
              hint={t("settings.models.architectRepairsHint")}
              action={
                <DefaultMark
                  setting="architect_max_repairs"
                  value={form.architect_max_repairs}
                  label={t("settings.models.architectRepairs")}
                  disabled={!admin}
                  onReset={(architect_max_repairs) => setForm({ ...form, architect_max_repairs })}
                />
              }
            >
              <TextInput
                type="number"
                min={0}
                max={5}
                step={1}
                value={form.architect_max_repairs}
                onChange={(e) => setForm({ ...form, architect_max_repairs: Math.min(5, Math.max(0, Math.round(Number(e.target.value) || 0))) })}
              />
            </Field>
          </SettingsGroup>
          <PermissionNote permission="admin" access={access} />
          <div>
            <Button
              variant="primary"
              icon={Save}
              disabled={!admin || modelsInvalid}
              busy={save.isPending}
              onClick={() => saveModels()}
            >
              {t("common.save")}
            </Button>
          </div>
        </section>

        {settings.data ? <OutputLimitsPanel settings={settings.data} admin={admin} /> : null}

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
              action={
                <DefaultMark
                  setting="ocr_enabled"
                  value={form.ocr_enabled}
                  label={t("settings.ocr.label")}
                  disabled={!admin}
                  onReset={(ocr_enabled) => save.mutate({ ocr_enabled })}
                />
              }
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
        <SettingsResizer host={layout} content={body} nav={nav} width={width.width} onWidth={width.setWidth} onReset={width.reset} />
        <UnsavedChangesModal
          open={blocker.state === "blocked"}
          text={
            unsavedProviders.length
              ? t("settingsUi.providers.unsaved", { providers: unsavedProviders.map((id) => providerLabel(t, id)).join(", ") })
              : t("settingsUi.models.unsaved")
          }
          onStay={() => blocker.reset?.()}
          onDiscard={() => {
            if (settings.data) setForm(settingsForm(settings.data));
            blocker.proceed?.();
          }}
          // Saving first covers "Models and budget" only: a provider's input is saved in its own card.
          onSave={admin && !modelsInvalid && !unsavedProviders.length ? () => saveModels(() => blocker.proceed?.()) : undefined}
          saving={save.isPending}
        />
        <SettingsNav
          container={body}
          navRef={nav}
          widthChanged={width.width !== SETTINGS_WIDTH.default}
          onResetWidth={width.reset}
        />
      </div>
    </div>
  );
}
