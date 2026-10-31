// What the release gate says about the version to publish (Q-3), in three separate sections: blocking checks,
// deterministic results and AI verdicts (probabilistic).

import { CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import type { GateItem, GateItemKind, GateReport } from "../api/types";
import { Badge, Callout } from "../components/ui";

const pct = (value: number | null) => (value === null ? "–" : `${Math.round(value * 100)} %`);

function ItemRow({ item }: { item: GateItem }) {
  const { t } = useTranslation();
  const name = item.suite_name || item.suite_id;
  return (
    <li className="gate-report__item" data-testid="gate-item" data-code={item.code} data-passed={item.passed}>
      {item.passed ? <CheckCircle2 size={14} aria-hidden className="gate-report__ok" /> : <XCircle size={14} aria-hidden className="gate-report__fail" />}
      {item.run_id ? <Link to={`/tests/${encodeURIComponent(item.suite_id)}`}>{name}</Link> : <span>{name}</span>}
      <span className="small">
        {t(`publish.gate.items.${item.code.replace("gate.", "")}`, {
          value: pct(item.value),
          threshold: pct(item.threshold),
          version: item.params.tested_version ?? "–",
          clean: item.params.clean ?? 0,
          cases: item.params.cases ?? 0,
        })}
      </span>
    </li>
  );
}

function Group({ kind, items }: { kind: GateItemKind; items: GateItem[] }) {
  const { t } = useTranslation();
  if (!items.length) return null;
  return (
    <div className="gate-report__group" data-testid={`gate-group-${kind}`}>
      <p className="small">
        <strong>{t(`publish.gate.kinds.${kind}`)}</strong>
        {kind === "judge" ? (
          <>
            {" "}
            <Badge icon={Sparkles}>{t("publish.gate.probabilistic")}</Badge>
          </>
        ) : null}
      </p>
      {kind === "judge" ? <p className="muted small">{t("publish.gate.probabilisticHint")}</p> : null}
      <ul className="gate-report__list">
        {items.map((item, index) => (
          <ItemRow key={`${item.suite_id}-${item.code}-${index}`} item={item} />
        ))}
      </ul>
    </div>
  );
}

export function GateReportView({ report }: { report: GateReport }) {
  const { t } = useTranslation();
  if (report.status === "off") return null;
  const of = (kind: GateItemKind) => report.items.filter((item) => item.kind === kind);
  return (
    <div className="gate-report stack-sm" data-testid="gate-report" data-status={report.status}>
      {report.status === "passed" ? (
        <Callout tone="info">
          {t("publish.gate.passed")}
        </Callout>
      ) : null}
      {report.status === "blocked" ? (
        <Callout tone="danger">
          {t("publish.gate.blocked")}
        </Callout>
      ) : null}
      {report.status === "overridable" ? (
        <Callout tone="warning">
          {t("publish.gate.overridable")}
        </Callout>
      ) : null}
      <Group kind="critical" items={of("critical")} />
      <Group kind="deterministic" items={of("deterministic")} />
      <Group kind="judge" items={of("judge")} />
    </div>
  );
}
