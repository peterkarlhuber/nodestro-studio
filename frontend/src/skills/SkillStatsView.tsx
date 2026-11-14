// How skills were used in the last days (NAL-B4): how often each was offered and loaded, in how many runs, how those
// runs ended and how often their checks passed. An indication of what helps, not proof.

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { type SkillStats, useSkillStats } from "../api/skills";
import { Callout, Segmented, Spinner } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { formatDate, formatNumber } from "../lib/format";

export const STATS_DAYS = ["7", "30", "90"] as const;
type Days = (typeof STATS_DAYS)[number];

/** The share of finished runs that succeeded, or null without finished runs. */
export function successRate(stats: Pick<SkillStats, "succeeded" | "failed">): number | null {
  const finished = stats.succeeded + stats.failed;
  return finished ? stats.succeeded / finished : null;
}

const percent = (value: number | null) => (value === null ? "–" : formatNumber(value, { style: "percent", maximumFractionDigits: 0 }));

export function SkillStatsView({ onSelect }: { onSelect: (name: string) => void }) {
  const { t } = useTranslation();
  const [days, setDays] = useState<Days>("30");
  const stats = useSkillStats(Number(days));
  const rows = [...(stats.data ?? [])].sort((a, b) => b.loaded - a.loaded || a.name.localeCompare(b.name));
  return (
    <div className="stack" data-testid="skill-stats">
      <Segmented<Days>
        label={t("skills.stats.days")}
        value={days}
        onChange={setDays}
        options={STATS_DAYS.map((value) => ({ value, label: t("skills.stats.lastDays", { count: Number(value) }) }))}
      />
      <Callout tone="info">{t("skills.stats.indication")}</Callout>
      {stats.isLoading ? <Spinner /> : null}
      {stats.error ? (
        <Callout tone="danger">
          <ErrorText error={stats.error} />
        </Callout>
      ) : null}
      {stats.data && !rows.length ? <p className="muted">{t("skills.stats.empty", { count: Number(days) })}</p> : null}
      {rows.length ? (
        <div className="table-wrap">
          <table className="table table--compact skill-stats">
            <thead>
              <tr>
                <th scope="col">{t("skills.stats.skill")}</th>
                <th scope="col" className="num">
                  {t("skills.stats.offered")}
                </th>
                <th scope="col" className="num">
                  {t("skills.stats.loaded")}
                </th>
                <th scope="col" className="num">
                  {t("skills.stats.runs")}
                </th>
                <th scope="col" className="num">
                  {t("skills.stats.success")}
                </th>
                <th scope="col" className="num">
                  {t("skills.stats.checks")}
                </th>
                <th scope="col" className="num">
                  {t("skills.stats.recommended")}
                </th>
                <th scope="col">{t("skills.stats.lastUsed")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name}>
                  <th scope="row">
                    <button type="button" className="link-button" onClick={() => onSelect(row.name)}>
                      {row.name}
                    </button>
                    {row.versions.length ? (
                      <span className="muted small"> · {t("skills.stats.versions", { versions: row.versions.join(", ") })}</span>
                    ) : null}
                  </th>
                  <td className="num">{formatNumber(row.offered)}</td>
                  <td className="num">{formatNumber(row.loaded)}</td>
                  <td className="num">{formatNumber(row.runs)}</td>
                  <td className="num">{percent(successRate(row))}</td>
                  <td className="num">{row.checks ? `${formatNumber(row.checks_passed)} / ${formatNumber(row.checks)}` : "–"}</td>
                  <td className="num">{formatNumber(row.recommended)}</td>
                  <td>{formatDate(row.last_used)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
