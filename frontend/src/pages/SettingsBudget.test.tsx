import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Settings } from "../api/types";
import { BudgetPolicyFields, budgetPolicyUpdate, hasBudgetPolicy, settingsForm } from "./SettingsBudget";

afterEach(cleanup);

const form = (patch: Partial<Settings>) => ({ max_run_budget_usd: null, budget_decision_hours: 24, ...patch }) as Settings;

describe("the workspace's budget policy (BUDGET-1)", () => {
  it("sends the maximum as a decimal string and empty as no cap", () => {
    expect(budgetPolicyUpdate(form({ max_run_budget_usd: "10,5" }))).toEqual({
      update: { max_run_budget_usd: "10.50", budget_decision_hours: 24 },
      invalid: [],
    });
    expect(budgetPolicyUpdate(form({ max_run_budget_usd: "" })).update).toEqual({ clear_max_run_budget: true, budget_decision_hours: 24 });
    expect(budgetPolicyUpdate(form({ max_run_budget_usd: "1.005" })).invalid).toEqual(["max"]);
  });

  it("shows the stored maximum with the language's decimal mark and sends it back unchanged (NSL-14)", () => {
    const shown = settingsForm(form({ max_run_budget_usd: "8.00" }));
    expect(shown.max_run_budget_usd).toBe("8,00");
    expect(budgetPolicyUpdate(shown).update).toEqual({ max_run_budget_usd: "8.00", budget_decision_hours: 24 });
    expect(settingsForm(form({ max_run_budget_usd: null })).max_run_budget_usd).toBeNull();
  });

  it("names invalid values", () => {
    expect(budgetPolicyUpdate(form({ max_run_budget_usd: "viel" })).invalid).toEqual(["max"]);
    expect(budgetPolicyUpdate(form({ max_run_budget_usd: "0" })).invalid).toEqual(["max"]);
    expect(budgetPolicyUpdate(form({ budget_decision_hours: 0 })).invalid).toEqual(["hours"]);
    expect(budgetPolicyUpdate(form({ budget_decision_hours: 721 })).invalid).toEqual(["hours"]);
    expect(budgetPolicyUpdate(form({ budget_decision_hours: 1.5 })).invalid).toEqual(["hours"]);
  });

  it("shows both fields with labels and help for admins, and nothing on older backends", () => {
    const onChange = vi.fn();
    const view = render(<BudgetPolicyFields form={form({ max_run_budget_usd: "8.00" })} admin onChange={onChange} />);
    expect(screen.getByLabelText("Höchstes Budget pro Lauf (USD)")).toHaveValue("8.00");
    expect(screen.getByLabelText("Frist für Budget-Entscheidungen (Stunden)")).toHaveValue(24);
    expect(screen.getByRole("button", { name: /Höchstes Budget pro Lauf/ })).toBeInTheDocument();
    view.rerender(<BudgetPolicyFields form={form({ max_run_budget_usd: "8.00" })} admin={false} onChange={onChange} />);
    expect(screen.getByLabelText("Höchstes Budget pro Lauf (USD)")).toBeDisabled();
    expect(hasBudgetPolicy({} as Settings)).toBe(false);
    view.rerender(<BudgetPolicyFields form={{} as Settings} admin onChange={onChange} />);
    expect(screen.queryByLabelText("Höchstes Budget pro Lauf (USD)")).toBeNull();
  });
});
