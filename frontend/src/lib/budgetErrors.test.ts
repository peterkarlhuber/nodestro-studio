import { describe, expect, it } from "vitest";

import i18n from "../i18n";
import { problemCode, problemHint, problemText } from "./errors";

describe("budget codes (BUDGET-1)", () => {
  it("reads a deadline that passed as its own outcome", () => {
    expect(problemCode({ code: "run.budget_exceeded", params: { expired: true } })).toBe("run.budget_request_expired");
    expect(problemCode({ code: "run.budget_exceeded", params: {} })).toBe("run.budget_exceeded");
    expect(problemText(i18n.t, { code: "run.budget_exceeded", params: { expired: true } })).toBe(i18n.t("errors.run.budget_request_expired"));
    expect(problemHint(i18n.t, { code: "run.budget_exceeded", params: { expired: true } })).toBe(
      i18n.t("errors.hints.run.budget_request_expired"),
    );
  });

  it.each([
    "run.budget_ended",
    "run.budget_checkpoint_lost",
    "run.budget_waits_interrupted",
    "budget.limit_not_higher",
    "budget.limit_invalid",
    "budget.not_pending",
  ])("has its own sentence for %s", (code) => {
    expect(problemText(i18n.t, { code })).toBe(i18n.t(`errors.${code}`));
    expect(problemText(i18n.t, { code })).not.toBe(i18n.t("errors.unknown"));
  });

  it("explains a refusal of someone who did not start the run", () => {
    expect(problemCode({ code: "access.forbidden", params: { reason: "budget.not_starter" } })).toBe("budget.not_starter");
    expect(problemText(i18n.t, { code: "access.forbidden", params: { reason: "budget.not_starter" } })).toBe(i18n.t("errors.budget.not_starter"));
    expect(problemHint(i18n.t, { code: "budget.not_starter" })).toBe(i18n.t("errors.hints.budget.not_starter"));
  });

  it("names the workspace's maximum", () => {
    expect(problemText(i18n.t, { code: "budget.over_policy", params: { max_limit_usd: "5.00" } })).toContain("5.00 USD");
  });
});
