// Texts that describe how the product behaves, checked against that behavior in every language: the run budget
// (attended runs pause for a decision), team runs below an orchestrator (no fixed budget share), the effort of
// Nodestro's Ollama connection, the test search of the knowledge page, adopting AI-created code and the model the
// Workflow Architect drafts with.

import { describe, expect, it } from "vitest";

const files = import.meta.glob<Record<string, unknown>>("./locales/*/*.json", { eager: true, import: "default" });
const LANGUAGES = ["en", "de", "fr", "es", "it", "pt-BR"];

function text(language: string, key: string): string {
  const [area, ...path] = key.split(".");
  let value: unknown = files[`./locales/${language}/${area}.json`];
  for (const part of path) value = (value as Record<string, unknown>)?.[part];
  expect(typeof value, `${language}: ${key}`).toBe("string");
  return String(value);
}

describe("product behavior in the texts", () => {
  it.each(LANGUAGES)("%s: an attended run pauses at its budget instead of stopping", (language) => {
    const pause: Record<string, RegExp> = {
      en: /pause/, de: /pausier/, fr: /pause/, es: /pausa/, it: /pausa/, "pt-BR": /pausa/,
    };
    expect(text(language, "editor.run.budgetText")).toMatch(pause[language]);
    // The settings hint names both: attended runs pause, unattended ones stop.
    expect(text(language, "settings.models.budgetHint")).toMatch(pause[language]);
    expect(text(language, "settings.models.budgetHint")).toContain("API");
  });

  it("no longer gives each team a share of the budget", () => {
    expect(text("en", "flow.orchestrator.safety")).not.toMatch(/share of the budget/);
    expect(text("de", "flow.orchestrator.safety")).not.toMatch(/Anteil am Budget/);
  });

  it.each(LANGUAGES)("%s: does not say that Ollama takes no effort (thinking models get one)", (language) => {
    expect(text(language, "admin.compat.effortText")).not.toMatch(/Ollama/);
  });

  it.each(LANGUAGES)("%s: the knowledge test search uses the configured method, not always full text", (language) => {
    const search = text(language, "knowledge.searchText");
    expect(search).toContain(text(language, "localModels.search.title"));
    expect(text(language, "help.knowledge.search")).not.toMatch(/BM25/);
  });

  it.each(LANGUAGES)("%s: adoption works for local use, not only in the desktop app", (language) => {
    const adoption = text(language, "errors.tool.adoption_desktop_only");
    expect(adoption).toContain("Nodestro Local Docker");
    expect(adoption).not.toMatch(/desktop app|Desktop-App|application de bureau|aplicación de escritorio|app desktop|aplicativo de desktop/);
  });

  it.each(LANGUAGES)("%s: the Workflow Architect drafts with the assistant model", (language) => {
    // The setting's own label, so the person finds it in Settings.
    const label = text(language, "settings.models.assistantModel").toLowerCase();
    const sentence = text(language, "workflows.start.aiModelNeeded").toLowerCase();
    const words = label.split(/\s+/).filter((word) => word.length > 3);
    for (const word of words) expect(sentence, `${language}: ${word}`).toContain(word);
  });
});
