// The workspace's budget policy (BUDGET-1), next to the default budget: the most a run may have as its limit (at the
// start or after raises) and how long a run waits for a budget decision. Administrators only; older backends do not
// send these fields, and then nothing is shown.

import { useTranslation } from "react-i18next";

import type { Settings } from "../api/types";
import { Field, TextInput } from "../components/ui";
import { formatMoney, normalizeMoneyInput } from "../lib/money";

export const DECISION_HOURS_MIN = 1;
export const DECISION_HOURS_MAX = 720;

/** Whether the backend knows the budget policy (it sends ``budget_decision_hours``). */
export function hasBudgetPolicy(settings: Pick<Settings, "budget_decision_hours"> | null | undefined): boolean {
  return typeof settings?.budget_decision_hours === "number";
}

/**
 * The policy fields as the API takes them, or which of them is invalid. An empty maximum is sent as
 * ``clear_max_run_budget`` (a null value would keep the stored one); the API takes at most two decimals.
 */
export function budgetPolicyUpdate(form: Pick<Settings, "max_run_budget_usd" | "budget_decision_hours">): {
  update: Pick<Settings, "max_run_budget_usd" | "budget_decision_hours" | "clear_max_run_budget">;
  invalid: ("max" | "hours")[];
} {
  const invalid: ("max" | "hours")[] = [];
  const text = (form.max_run_budget_usd ?? "").trim();
  const max = text ? normalizeMoneyInput(text) : null;
  if (text && (max === null || Number(max) <= 0 || Number(max) > 1_000_000 || !/^\d+\.\d{2}$/.test(max))) invalid.push("max");
  const hours = form.budget_decision_hours;
  if (typeof hours !== "number" || !Number.isInteger(hours) || hours < DECISION_HOURS_MIN || hours > DECISION_HOURS_MAX) invalid.push("hours");
  const update = text ? { max_run_budget_usd: max, budget_decision_hours: hours } : { clear_max_run_budget: true, budget_decision_hours: hours };
  return { update, invalid };
}

export function BudgetPolicyFields({
  form,
  admin,
  onChange,
}: {
  form: Settings;
  admin: boolean;
  onChange: (patch: Pick<Settings, "max_run_budget_usd" | "budget_decision_hours">) => void;
}) {
  const { t } = useTranslation();
  if (!hasBudgetPolicy(form)) return null;
  const { invalid } = budgetPolicyUpdate(form);
  const maxInvalid = invalid.includes("max");
  const hoursInvalid = invalid.includes("hours");
  return (
    <>
      <Field
        label={t("budget.settings.maxRunBudget")}
        tip="budget.maxRunBudget"
        hint={
          maxInvalid ? (
            <span className="text-danger">{t("budget.settings.invalidMax")}</span>
          ) : (
            <>
              {t("budget.settings.maxRunBudgetHint")}
              {form.operator_max_run_budget_usd ? ` ${t("budget.settings.operatorCap", { max: formatMoney(form.operator_max_run_budget_usd) })}` : ""}
            </>
          )
        }
      >
        <TextInput
          inputMode="decimal"
          autoComplete="off"
          disabled={!admin}
          value={form.max_run_budget_usd ?? ""}
          aria-invalid={maxInvalid || undefined}
          onChange={(event) => onChange({ max_run_budget_usd: event.target.value === "" ? null : event.target.value })}
          data-testid="settings-max-run-budget"
        />
      </Field>
      <Field
        label={t("budget.settings.decisionHours")}
        tip="budget.decisionHours"
        hint={hoursInvalid ? <span className="text-danger">{t("budget.settings.invalidHours")}</span> : t("budget.settings.decisionHoursHint")}
      >
        <TextInput
          type="number"
          min={DECISION_HOURS_MIN}
          max={DECISION_HOURS_MAX}
          step={1}
          disabled={!admin}
          value={Number.isNaN(form.budget_decision_hours) ? "" : (form.budget_decision_hours ?? "")}
          aria-invalid={hoursInvalid || undefined}
          onChange={(event) => onChange({ budget_decision_hours: event.target.value === "" ? Number.NaN : Number(event.target.value) })}
          data-testid="settings-budget-decision-hours"
        />
      </Field>
    </>
  );
}
