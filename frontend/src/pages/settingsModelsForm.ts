// The form of "Models and budget", the one part of the settings page that saves with its own button.

import type { Settings } from "../api/types";

/** The fields that "Models and budget" saves with its own button. */
export const MODEL_FIELDS = [
  "default_model",
  "assistant_model",
  "default_budget_usd",
  "architect_budget_usd",
  "architect_max_repairs",
  "max_run_budget_usd",
  "budget_decision_hours",
] as const satisfies readonly (keyof Settings)[];

function same(a: unknown, b: unknown): boolean {
  return String(a ?? "") === String(b ?? "");
}

/** Whether the form has changes of its own fields that are not saved yet. */
export function modelsDirty(form: Settings | null, saved: Settings | null): boolean {
  return Boolean(form && saved && MODEL_FIELDS.some((key) => !same(form[key], saved[key])));
}

/**
 * New settings from the server (another section saved, a refetch on focus) without losing the person's unsaved
 * edits: a field they changed keeps their value, every other field takes the new one.
 */
export function mergeSettingsForm(current: Settings | null, previous: Settings | null, next: Settings): Settings {
  if (!current || !previous) return next;
  const merged: Record<string, unknown> = { ...next };
  for (const key of MODEL_FIELDS) if (!same(current[key], previous[key])) merged[key] = current[key];
  return merged as unknown as Settings;
}
