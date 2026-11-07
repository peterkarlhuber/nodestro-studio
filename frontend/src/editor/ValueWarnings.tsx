// Key figures of an agent test that no computing tool call backs (nodestro-runtime RT-054, AgentTestResult.value_warnings).
// A workflow run would send such a value back to the agent once and then fail the step (run.value_unverified); the
// test only warns, one line per field, so the agent's configuration can be fixed before a run depends on it.

import { useId } from "react";
import { useTranslation } from "react-i18next";

import { VALUE_WARNING_REASONS, type ValueWarning, type ValueWarningReason } from "../api/types";
import { Callout } from "../components/ui";
import { formatNumber } from "../lib/format";

/** The value as people read it: numbers in the interface language, nothing for a missing value. */
function shownValue(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return formatNumber(value, { maximumFractionDigits: 10 });
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : JSON.stringify(value);
}

/** A reason this version knows, or "other" for one a newer API sends. */
function knownReason(reason: string): ValueWarningReason | "other" {
  return (VALUE_WARNING_REASONS as readonly string[]).includes(reason) ? (reason as ValueWarningReason) : "other";
}

export function ValueWarnings({ warnings }: { warnings: ValueWarning[] | undefined }) {
  const { t } = useTranslation();
  const titleId = useId();
  if (!warnings?.length) return null;
  return (
    <Callout tone="warning">
      <div role="group" aria-labelledby={titleId} className="stack-sm" data-testid="agent-test-value-warnings">
        <strong id={titleId}>{t("agentTest.valueWarnings.title", { count: warnings.length })}</strong>
        <ul className="value-warnings">
          {warnings.map((item, index) => {
            const reason = knownReason(item.reason);
            const value = shownValue(item.value);
            return (
              <li key={`${item.field}-${index}`} data-testid="agent-test-value-warning" data-field={item.field} data-reason={item.reason}>
                {t(`agentTest.valueWarnings.reason.${reason}`, {
                  field: item.field,
                  value: value || "–",
                  passed: item.rows_passed ?? "?",
                  total: item.rows_in_input ?? "?",
                })}
              </li>
            );
          })}
        </ul>
        <p className="small muted">{t("agentTest.valueWarnings.run")}</p>
      </div>
    </Callout>
  );
}
