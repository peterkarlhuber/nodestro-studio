import { afterEach, describe, expect, it } from "vitest";

import { indexSettings, normalize, revealSetting, searchSettings, snippet } from "./settingsSearchIndex";

/** A page that follows the convention: sections with an h2, fields, toggles, groups, closed parts. */
function page(): HTMLElement {
  const root = document.createElement("div");
  root.className = "settings";
  root.innerHTML = `
    <section>
      <h2 class="panel__title" id="settings-models">Models and budget <button class="help-tip" data-help="models">?</button></h2>
      <p>Which models new agents use.</p>
      <div class="settings-group"><h3>Budget per run</h3>
        <div class="field">
          <div class="field__head"><span class="field__label"><label for="deadline">Budget decision deadline (hours)</label>
          <button class="help-tip" data-help="deadline">?</button></span></div>
          <input id="deadline" type="number" />
          <p class="field__hint">How long a run waits.</p>
        </div>
      </div>
    </section>
    <section>
      <h2 class="panel__title" id="settings-ocr">Text recognition</h2>
      <div class="toggle"><button role="switch" id="ocr"></button>
        <label class="toggle__label" for="ocr"><span>Use OCR for scans</span><small>Recognizes text in scanned PDFs.</small></label></div>
      <details class="section"><summary><span class="section__title">Règles avancées</span></summary>
        <div class="field"><span class="field__label"><label for="lang">Langue de reconnaissance</label></span><select id="lang"></select></div>
        <label data-setting="Streaming" data-setting-text="Answers arrive piece by piece"><select></select></label>
      </details>
      <div data-settings-search="skip"><div class="field"><span class="field__label"><label>Hidden internals</label></span></div></div>
    </section>`;
  document.body.appendChild(root);
  return root;
}

const HELP: Record<string, string> = {
  models: "Default model and budget for new agents.",
  deadline: "After this time without a decision the run ends as budget used up.",
};

describe("settings search", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("ignores case and accents", () => {
    expect(normalize("  Règles   AVANCÉES ")).toBe("regles avancees");
    expect(normalize("Übersetzung")).toBe("ubersetzung");
  });

  it("indexes sections, fields, toggles, groups, closed parts and marked settings, with their help texts", () => {
    const entries = indexSettings(page(), (id) => HELP[id]);
    const labels = entries.map((entry) => entry.label);
    expect(labels).toEqual([
      "Models and budget",
      "Budget per run",
      "Budget decision deadline (hours)",
      "Text recognition",
      "Use OCR for scans",
      "Règles avancées",
      "Langue de reconnaissance",
      "Streaming",
    ]);
    const deadline = entries.find((entry) => entry.label.startsWith("Budget decision"))!;
    expect(deadline.context).toBe("Models and budget › Budget per run");
    expect(deadline.text).toContain("How long a run waits.");
    expect(deadline.text).toContain("budget used up");
    expect(entries.find((entry) => entry.label === "Langue de reconnaissance")!.context).toBe("Text recognition › Règles avancées");
    expect(labels).not.toContain("Hidden internals");
  });

  it("finds a setting by its label, its help text or a word without accents, best match first", () => {
    const entries = indexSettings(page(), (id) => HELP[id]);
    expect(searchSettings(entries, "deadline")[0].label).toBe("Budget decision deadline (hours)");
    expect(searchSettings(entries, "without a decision")[0].label).toBe("Budget decision deadline (hours)");
    expect(searchSettings(entries, "regles")[0].label).toBe("Règles avancées");
    expect(searchSettings(entries, "piece by piece")[0].label).toBe("Streaming");
    expect(searchSettings(entries, "budget")[0].label).toMatch(/^Budget/);
    expect(searchSettings(entries, "nothing like this")).toEqual([]);
    expect(searchSettings(entries, "   ")).toEqual([]);
  });

  it("shortens a long explanation around the match", () => {
    const text = `${"a".repeat(200)} needle ${"b".repeat(200)}`;
    const short = snippet(text, "needle");
    expect(short).toContain("needle");
    expect(short.length).toBeLessThan(130);
    expect(short.startsWith("… ")).toBe(true);
  });

  it("opens the parts around a hit, focuses its control and highlights it", () => {
    const root = page();
    const entry = indexSettings(root).find((item) => item.label === "Langue de reconnaissance")!;
    const details = root.querySelector("details")!;
    expect(details.open).toBe(false);
    revealSetting(entry.element, true);
    expect(details.open).toBe(true);
    expect(document.activeElement).toBe(root.querySelector("#lang"));
    expect(entry.element.classList.contains("settings-hit")).toBe(true);
  });
});
