// The approval overview of Python libraries: every package with version, kind and status.

import { useTranslation } from "react-i18next";

import type { DependencyPlan, PlanPackage, PlanPackageStatus } from "../api/types";
import { Badge, Callout } from "../components/ui";
import { ProblemText } from "../lib/errors";

const STATUS_TONE: Record<PlanPackageStatus, "warning" | "success" | "idle" | "running"> = {
  new: "warning",
  changed: "warning",
  approved: "success",
  runtime: "idle",
  removed: "idle",
};

function PackageStatus({ item }: { item: PlanPackage }) {
  const { t } = useTranslation();
  return (
    <Badge tone={STATUS_TONE[item.status]}>
      {item.status === "changed"
        ? t("python.status.changed", { from: item.previous_version, to: item.version })
        : t(`python.status.${item.status}`)}
    </Badge>
  );
}

/** Direct packages first, then indirect ones; ``compact`` for the tool job panel. */
export function PlanTable({ plan }: { plan: DependencyPlan }) {
  const { t } = useTranslation();
  const direct = plan.packages.filter((item) => item.direct).length;
  const indirect = plan.packages.filter((item) => !item.direct && !item.runtime && item.status !== "removed").length;
  return (
    <div className="stack-sm">
      {plan.error ? (
        <Callout tone="danger">
          <ProblemText item={plan.error} />
        </Callout>
      ) : null}
      {plan.issues.length ? (
        <Callout tone={plan.issues.some((issue) => issue.blocking) ? "danger" : "info"}>
          <ul className="plain-list">
            {plan.issues.map((issue, index) => (
              <li key={index}>
                <code>{issue.tool}</code>: <ProblemText item={issue} compact />
              </li>
            ))}
          </ul>
        </Callout>
      ) : null}
      {plan.packages.length ? (
        <>
          <p className="muted small">
            {t("python.plan.summary", { direct, indirect, python: plan.python_version })}
          </p>
          <div className="table-wrap">
            <table className="table table--compact" data-testid="dependency-plan">
              <thead>
                <tr>
                  <th>{t("python.plan.package")}</th>
                  <th>{t("python.plan.version")}</th>
                  <th>{t("python.plan.kind")}</th>
                  <th>{t("python.plan.requiredBy")}</th>
                  <th>{t("python.plan.status")}</th>
                </tr>
              </thead>
              <tbody>
                {plan.packages.map((item) => (
                  <tr key={`${item.key}-${item.marker}`} data-package={item.key} data-status={item.status}>
                    <td className="table__primary">
                      <code>{item.name}</code>
                      {item.marker ? <div className="muted small">{t("python.plan.onlyWhen", { marker: item.marker })}</div> : null}
                    </td>
                    <td>
                      <code>{item.version}</code>
                    </td>
                    <td>
                      {item.runtime
                        ? t("python.plan.runtime")
                        : item.direct
                          ? t("python.plan.direct")
                          : t("python.plan.indirect")}
                    </td>
                    <td className="small">{item.required_by.join(", ")}</td>
                    <td>
                      <PackageStatus item={item} />
                      {item.approved_elsewhere.length && item.status !== "approved" ? (
                        <div className="muted small">
                          {t("python.plan.approvedElsewhere", { names: item.approved_elsewhere.join(", ") })}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
