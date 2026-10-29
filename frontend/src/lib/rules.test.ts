import { describe, expect, it } from "vitest";

import { ApiError } from "../api/client";
import { fieldErrors, formDefaults } from "../components/FormFields";
import { parseRuleValue, ruleValueText } from "../editor/FlowInspectors";

describe("rule values", () => {
  it("reads lists, numbers and text by operator", () => {
    expect(parseRuleValue("in", "complaint, question , ,praise")).toEqual(["complaint", "question", "praise"]);
    expect(parseRuleValue("gt", "100")).toBe(100);
    expect(parseRuleValue("lte", "2026-10-01")).toBe("2026-10-01");
    expect(parseRuleValue("gt", "")).toBe("");
    expect(parseRuleValue("equals", "42")).toBe("42");
  });

  it("shows a value as typed text again", () => {
    expect(ruleValueText({ operator: "in", value: ["a", "b"] })).toBe("a, b");
    expect(ruleValueText({ operator: "gt", value: 3 })).toBe("3");
    expect(ruleValueText({ operator: "is_empty", value: null })).toBe("");
  });
});

describe("input forms", () => {
  it("maps the problems of a rejected start to their fields", () => {
    const error = new ApiError("invalid", 422, "form.invalid", {
      errors: [
        { field: "customer", code: "form.required" },
        { field: "amount", code: "form.not_number" },
      ],
    });
    expect(fieldErrors(error)).toEqual({
      customer: { field: "customer", code: "form.required" },
      amount: { field: "amount", code: "form.not_number" },
    });
    expect(fieldErrors(new Error("network"))).toEqual({});
  });

  it("presets only fields with a default", () => {
    const field = { label: "", description: "", required: false, options: [] };
    expect(
      formDefaults([
        { ...field, name: "tier", type: "select", default: "gold" },
        { ...field, name: "note", type: "text", default: null },
        { ...field, name: "urgent", type: "boolean", default: false },
      ]),
    ).toEqual({ tier: "gold", urgent: false });
  });
});
