import { describe, expect, it } from "vitest";

import type { Settings } from "../api/types";
import { mergeSettingsForm, modelsDirty } from "./settingsModelsForm";

const base = {
  default_model: "anthropic:a",
  assistant_model: "anthropic:b",
  default_budget_usd: 2,
  architect_budget_usd: 2,
  architect_max_repairs: 2,
  max_run_budget_usd: null,
  budget_decision_hours: 24,
  ocr_enabled: false,
} as unknown as Settings;

describe("models and budget form", () => {
  it("is dirty only when one of its own fields differs", () => {
    expect(modelsDirty(base, base)).toBe(false);
    expect(modelsDirty({ ...base, ocr_enabled: true }, base)).toBe(false);
    expect(modelsDirty({ ...base, default_budget_usd: 3 }, base)).toBe(true);
    expect(modelsDirty(null, base)).toBe(false);
  });

  it("keeps unsaved edits when new settings arrive and takes everything else", () => {
    const edited = { ...base, default_budget_usd: 3.5 };
    const next = { ...base, ocr_enabled: true, architect_max_repairs: 4 };
    const merged = mergeSettingsForm(edited, base, next);
    expect(merged.default_budget_usd).toBe(3.5);
    expect(merged.ocr_enabled).toBe(true);
    expect(merged.architect_max_repairs).toBe(4);
  });

  it("takes the new settings when nothing was edited or loaded before", () => {
    const next = { ...base, default_budget_usd: 5 };
    expect(mergeSettingsForm(base, base, next).default_budget_usd).toBe(5);
    expect(mergeSettingsForm(null, null, next)).toBe(next);
  });
});
