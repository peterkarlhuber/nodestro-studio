// The opt-in release gate of a published API (Q-3): which test series a new version must pass, and how well.

import { useMutation } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { useSuites } from "../api/hooks";
import type { Publication, ReleaseGate } from "../api/types";
import { toast } from "../components/toast";
import { Button, Callout, Field, Spinner, TextInput, Toggle } from "../components/ui";

const percent = (value: number) => String(Math.round(value * 100));
const share = (raw: string) => Math.min(100, Math.max(0, Number(raw) || 0)) / 100;

export function GateSettings({ publication, onChanged }: { publication: Publication; onChanged: () => void }) {
  const { t } = useTranslation();
  const suites = useSuites();
  const own = (suites.data ?? []).filter((suite) => suite.workflow_id === publication.workflow_id);
  const saved = publication.gate ?? null;
  const [enabled, setEnabled] = useState(saved !== null);
  const [suiteIds, setSuiteIds] = useState<string[]>(saved?.suite_ids ?? []);
  const [passRate, setPassRate] = useState(percent(saved?.min_pass_rate ?? 1));
  const [judge, setJudge] = useState(saved?.judge_min_score == null ? "" : percent(saved.judge_min_score));
  const gate: ReleaseGate | null = enabled
    ? { suite_ids: suiteIds, min_pass_rate: share(passRate), judge_min_score: judge === "" ? null : share(judge) }
    : null;
  const save = useMutation({
    mutationFn: () => api.setReleaseGate(publication.id, gate),
    onSuccess: () => {
      toast.success(t("common.saved"));
      onChanged();
    },
    onError: (error) => toast.error(error),
  });
  const toggleSuite = (id: string, on: boolean) => setSuiteIds(on ? [...suiteIds, id] : suiteIds.filter((item) => item !== id));

  return (
    <section className="stack-sm" data-testid="gate-settings">
      <h3 className="api-heading">{t("publish.gate.title")}</h3>
      <p className="muted small">{t("publish.gate.intro")}</p>
      <Toggle checked={enabled} onChange={setEnabled} label={t("publish.gate.enable")} description={t("publish.gate.enableHint")} tip="publish.gate" />
      {enabled ? (
        <>
          {suites.isLoading ? <Spinner /> : null}
          {suites.data && !own.length ? (
            <Callout tone="warning">
              {t("testStatus.noSuite")} <Link to="/tests">{t("testStatus.createSuite")}</Link>
            </Callout>
          ) : null}
          {own.length ? (
            <Field label={t("publish.gate.suites")} hint={t("publish.gate.suitesHint")}>
              <div className="stack-sm">
                {own.map((suite) => (
                  <label key={suite.id} className="check-row">
                    <input type="checkbox" checked={suiteIds.includes(suite.id)} onChange={(event) => toggleSuite(suite.id, event.target.checked)} />
                    {suite.name || t("automation.benchmark.unnamed")}
                  </label>
                ))}
              </div>
            </Field>
          ) : null}
          <div className="grid-2">
            <Field label={t("publish.gate.passRate")} hint={t("publish.gate.passRateHint")}>
              <TextInput type="number" min={0} max={100} step={5} value={passRate} onChange={(event) => setPassRate(event.target.value)} />
            </Field>
            <Field label={t("publish.gate.judgeScore")} hint={t("publish.gate.judgeScoreHint")}>
              <TextInput type="number" min={0} max={100} step={5} value={judge} onChange={(event) => setJudge(event.target.value)} />
            </Field>
          </div>
        </>
      ) : null}
      <div>
        <Button
          variant="primary"
          icon={Save}
          busy={save.isPending}
          disabled={enabled && !suiteIds.length}
          onClick={() => save.mutate()}
          data-testid="gate-save"
        >
          {t("publish.gate.save")}
        </Button>
      </div>
    </section>
  );
}
