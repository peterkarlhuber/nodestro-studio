// Settings > Model output limits: the output token limit of each of Nodestro's own AI operations (Workflow Architect,
// assistants, run chat, orchestrator, quality judge, tool generation) and the architect's handling of answers cut off
// at the limit. Agents keep their own "Max. tokens" in the agent editor.
//
// The value that is sent comes from three levels: this setting, else the built-in default, capped by the model's
// documented or declared maximum (nodestro_runtime.output_limits). The table shows all three for the assistant model,
// so a lowered value is never a surprise; the budget reserves exactly the value that is sent.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Gauge, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import { useModelProfile } from "../api/modelProfile";
import type { ModelProfile, OutputLimitOperation, Settings, SettingsUpdate } from "../api/types";
import { toast } from "../components/toast";
import { Button, Callout, Field, IconButton, TextInput, Toggle } from "../components/ui";

/** The operations by area, in the order of the table. ``assistant``: the request goes to the assistant model. */
export const OUTPUT_LIMIT_GROUPS: { group: string; operations: { name: OutputLimitOperation; assistant: boolean }[] }[] = [
  {
    group: "architect",
    operations: [
      { name: "architect_analysis", assistant: true },
      { name: "architect_plan", assistant: true },
      { name: "architect_agent", assistant: true },
      { name: "architect_repair", assistant: true },
      { name: "tool_generation", assistant: true },
    ],
  },
  {
    group: "assistants",
    operations: [
      { name: "assistant_chat", assistant: true },
      { name: "agent_design", assistant: true },
      { name: "memory_proposal", assistant: true },
      { name: "api_guide", assistant: true },
    ],
  },
  {
    group: "runs",
    operations: [
      { name: "run_chat", assistant: true },
      { name: "orchestrator", assistant: false },
      { name: "quality_judge", assistant: false },
    ],
  },
];

/** The range the backend accepts for a setting (nodestro_runtime.output_limits.SETTING_RANGE). */
export const LIMIT_MIN = 256;
export const LIMIT_MAX = 1_000_000;
const RETRY_MIN = 1024;

/** The value a model receives for ``configured`` tokens, and why it is lower (mirrors output_limits.effective). */
export function effectiveLimit(
  configured: number,
  profile: ModelProfile | undefined,
): { value: number; reduced: "model_maximum" | "context_window" | null } {
  const output = profile?.limits.max_output_tokens ?? null;
  if (output !== null) return configured > output ? { value: output, reduced: "model_maximum" } : { value: configured, reduced: null };
  const window = profile?.limits.context_window ?? null;
  if (window !== null) {
    const ceiling = Math.max(Math.floor(window / 2), LIMIT_MIN);
    if (configured > ceiling) return { value: ceiling, reduced: "context_window" };
  }
  return { value: configured, reduced: null };
}

type Draft = Partial<Record<OutputLimitOperation, string>>;

function draftOf(settings: Settings): Draft {
  const draft: Draft = {};
  for (const [name, value] of Object.entries(settings.output_limits ?? {})) draft[name as OutputLimitOperation] = String(value);
  return draft;
}

function invalid(text: string | undefined): boolean {
  if (text === undefined || text === "") return false;
  const value = Number(text);
  return !Number.isInteger(value) || value < LIMIT_MIN || value > LIMIT_MAX;
}

export function OutputLimitsPanel({ settings, admin }: { settings: Settings; admin: boolean }) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const defaults = settings.output_limit_defaults;
  const [draft, setDraft] = useState<Draft>(() => draftOf(settings));
  const [retry, setRetry] = useState(settings.architect_retry_truncated ?? true);
  const [retryMax, setRetryMax] = useState(String(settings.architect_retry_max_tokens ?? 64_000));
  const profile = useModelProfile(settings.assistant_model);
  useEffect(() => {
    setDraft(draftOf(settings));
    setRetry(settings.architect_retry_truncated ?? true);
    setRetryMax(String(settings.architect_retry_max_tokens ?? 64_000));
  }, [settings]);

  const save = useMutation({
    mutationFn: (body: SettingsUpdate) => api.saveSettings(body),
    onSuccess: (data) => {
      queryClient.setQueryData(keys.settings, data);
      toast.success(t("settings.saved"));
    },
    onError: toast.error,
  });

  // An older backend has no output limits: nothing to configure here.
  if (!defaults) return null;

  const number = (value: number) => value.toLocaleString(i18n.language);
  const retryValue = Number(retryMax);
  const retryInvalid = !Number.isInteger(retryValue) || retryValue < RETRY_MIN || retryValue > LIMIT_MAX;
  const anyInvalid = Object.values(draft).some(invalid) || retryInvalid;
  const submit = () => {
    const limits: Partial<Record<OutputLimitOperation, number>> = {};
    for (const { operations } of OUTPUT_LIMIT_GROUPS)
      for (const { name } of operations) {
        const text = draft[name];
        // 0 removes an override: the default applies again.
        limits[name] = text === undefined || text === "" ? 0 : Number(text);
      }
    save.mutate({ output_limits: limits, architect_retry_truncated: retry, architect_retry_max_tokens: retryValue });
  };

  return (
    <section className="panel stack" aria-labelledby="settings-output-limits" data-testid="output-limits">
      <h2 className="panel__title" id="settings-output-limits">
        <Gauge size={15} aria-hidden /> {t("modelParams.settings.title")}
      </h2>
      <p className="muted small">{t("modelParams.settings.intro")}</p>
      <p className="muted small">{t("modelParams.settings.budgetNote")}</p>
      {profile ? (
        <p className="small" data-testid="output-limits-model">
          {profile.limits.max_output_tokens !== null
            ? t("modelParams.settings.modelMaximum", { model: settings.assistant_model, tokens: number(profile.limits.max_output_tokens) })
            : t("modelParams.settings.modelMaximumUnknown", { model: settings.assistant_model })}
        </p>
      ) : null}
      {OUTPUT_LIMIT_GROUPS.map(({ group, operations }) => (
        <div key={group} className="table-wrap">
          <table className="table table--compact" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "38%" }} />
              <col style={{ width: "32%" }} />
              <col style={{ width: "30%" }} />
            </colgroup>
            <caption className="small" style={{ textAlign: "start", fontWeight: 600, padding: "4px 0" }}>
              {t(`modelParams.settings.group.${group}`)}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t("modelParams.settings.column.operation")}</th>
                <th scope="col">{t("modelParams.settings.column.limit")}</th>
                <th scope="col">{t("modelParams.settings.column.sent")}</th>
              </tr>
            </thead>
            <tbody>
              {operations.map(({ name, assistant }) => {
                const text = draft[name] ?? "";
                const configured = text !== "" && !invalid(text) ? Number(text) : defaults[name];
                const sent = effectiveLimit(configured, assistant ? profile : undefined);
                const label = t(`modelParams.operation.${name}`);
                const bad = invalid(text);
                return (
                  <tr key={name} data-operation={name}>
                    <th scope="row" style={{ fontWeight: 500, textTransform: "none", letterSpacing: "normal", fontSize: "inherit" }}>
                      {label}
                    </th>
                    <td>
                      <TextInput
                        type="number"
                        inputMode="numeric"
                        min={LIMIT_MIN}
                        max={LIMIT_MAX}
                        step={1000}
                        style={{ width: "100%", maxWidth: "9rem" }}
                        aria-label={t("modelParams.settings.inputLabel", { operation: label })}
                        aria-invalid={bad || undefined}
                        placeholder={number(defaults[name])}
                        disabled={!admin}
                        value={text}
                        onChange={(e) => setDraft({ ...draft, [name]: e.target.value })}
                      />
                      <div className="field__hint" style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                        <span>
                          {bad
                            ? t("modelParams.settings.invalid", { min: number(LIMIT_MIN), max: number(LIMIT_MAX) })
                            : text === ""
                              ? t("modelParams.settings.default")
                              : t("modelParams.settings.defaultIs", { tokens: number(defaults[name]) })}
                        </span>
                        {text !== "" ? (
                          <IconButton
                            icon={RotateCcw}
                            label={t("modelParams.settings.reset", { operation: label })}
                            disabled={!admin}
                            onClick={() => setDraft({ ...draft, [name]: "" })}
                          />
                        ) : null}
                      </div>
                    </td>
                    <td data-testid={`output-limit-sent-${name}`}>
                      {assistant ? number(sent.value) : t("modelParams.settings.perModel", { tokens: number(configured) })}
                      {sent.reduced ? (
                        <div className="field__hint" data-reduced={sent.reduced}>
                          {t(`modelParams.settings.reduced.${sent.reduced}`)}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
      <Toggle
        label={t("modelParams.settings.retry")}
        description={t("modelParams.settings.retryHint")}
        checked={retry}
        disabled={!admin}
        onChange={setRetry}
      />
      {retry ? (
        <Field label={t("modelParams.settings.retryMax")} hint={t("modelParams.settings.retryMaxHint")}>
          <TextInput
            type="number"
            inputMode="numeric"
            min={RETRY_MIN}
            max={LIMIT_MAX}
            step={1000}
            style={{ maxWidth: "9rem" }}
            aria-invalid={retryInvalid || undefined}
            disabled={!admin}
            value={retryMax}
            onChange={(e) => setRetryMax(e.target.value)}
          />
        </Field>
      ) : null}
      {anyInvalid ? (
        <Callout tone="warning">{t("modelParams.settings.fixInvalid", { min: number(LIMIT_MIN), max: number(LIMIT_MAX) })}</Callout>
      ) : null}
      <div>
        <Button variant="primary" icon={Save} disabled={!admin || anyInvalid} busy={save.isPending} onClick={submit}>
          {t("common.save")}
        </Button>
      </div>
    </section>
  );
}
