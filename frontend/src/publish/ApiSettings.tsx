// Name in the URL, description and limits of a published API.

import { useMutation } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import type { ApiLimits, Publication } from "../api/types";
import { toast } from "../components/toast";
import { Button, Callout, Field, TextArea, TextInput, Toggle } from "../components/ui";
import { GateSettings } from "./GateSettings";

type NumberLimit = Exclude<keyof ApiLimits, "sync_enabled">;

const NUMBERS: { key: NumberLimit; step: number; optional?: boolean }[] = [
  { key: "max_concurrent_runs", step: 1 },
  { key: "max_waiting_runs", step: 1 },
  { key: "runs_per_minute", step: 1 },
  { key: "requests_per_minute", step: 1 },
  { key: "daily_budget_usd", step: 0.5, optional: true },
  { key: "run_budget_usd", step: 0.1, optional: true },
  { key: "sync_timeout_seconds", step: 5 },
  { key: "max_upload_mb", step: 1 },
];

export function ApiSettings({ publication, onChanged }: { publication: Publication; onChanged: () => void }) {
  const { t } = useTranslation();
  const [slug, setSlug] = useState(publication.slug);
  const [description, setDescription] = useState(publication.description);
  const [limits, setLimits] = useState<ApiLimits>(publication.limits);
  const save = useMutation({
    mutationFn: () => api.updatePublication(publication.id, { slug, description, limits }),
    onSuccess: () => {
      toast.success(t("common.saved"));
      onChanged();
    },
    onError: (error) => toast.error(error),
  });
  const setNumber = (key: NumberLimit, raw: string, optional?: boolean) =>
    setLimits({ ...limits, [key]: raw === "" && optional ? null : Number(raw) });

  return (
    <div className="stack">
      <div className="grid-2">
        <Field label={t("publish.overview.slug")} hint={t("publish.settings.slugHint")} tip="publish.slug">
          <TextInput value={slug} maxLength={48} onChange={(event) => setSlug(event.target.value.toLowerCase())} />
        </Field>
        <Field label={t("publish.settings.description")}>
          <TextArea rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
      </div>
      <h3 className="api-heading">{t("publish.settings.limits")}</h3>
      <p className="muted small">{t("publish.settings.limitsIntro")}</p>
      <div className="grid-2">
        {NUMBERS.map(({ key, step, optional }) => (
          <Field key={key} label={t(`publish.limits.${key}`)} hint={optional ? t("publish.settings.emptyNoLimit") : undefined}>
            <TextInput
              type="number"
              min={0}
              step={step}
              value={limits[key] ?? ""}
              onChange={(event) => setNumber(key, event.target.value, optional)}
            />
          </Field>
        ))}
      </div>
      <Toggle
        checked={limits.sync_enabled}
        onChange={(value) => setLimits({ ...limits, sync_enabled: value })}
        label={t("publish.limits.sync_enabled")}
        description={t("publish.settings.syncHint")}
        tip="publish.sync"
      />
      {limits.daily_budget_usd === null ? <Callout tone="warning">{t("publish.settings.noBudget")}</Callout> : null}
      <div>
        <Button variant="primary" icon={Save} busy={save.isPending} onClick={() => save.mutate()}>
          {t("common.save")}
        </Button>
      </div>
      <GateSettings publication={publication} onChanged={onChanged} />
    </div>
  );
}
