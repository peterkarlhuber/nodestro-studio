// Browser smoke test against a running Nodestro (default http://127.0.0.1:8000).
// Usage: node e2e/smoke.mjs [baseUrl] [screenshotDir]
// Walks through every page, copies examples from the gallery and checks for console errors.

import { createRequire } from "node:module";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);
// Chromium by default; E2E_BROWSER=firefox or webkit runs the same checks in another engine.
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8000";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const browser = await browserType.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 940 }, locale: "de-DE" });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

async function shot(name) {
  if (shots) await page.screenshot({ path: join(shots, `${name}.png`) });
}

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`ok  ${message}`);
}

try {
  // A fresh installation has no workflows; the gallery below offers the examples.
  await page.goto(base);
  await page.getByRole("heading", { name: "Workflows", exact: true }).waitFor();
  const gallery = page.getByTestId("example-gallery");
  await gallery.locator(".card").first().waitFor();
  check((await gallery.locator(".card").count()) >= 4, "Workflow page shows featured examples below the own workflows");
  check((await page.locator(".page__body > .card-grid > .card").count()) === 0, "No example is installed automatically");
  await shot("01-workflows");

  await gallery.getByRole("link", { name: /Alle 24 Beispiele/ }).click();
  await page.waitForURL(/\/workflows\/examples/);
  await page.waitForFunction(() => document.querySelectorAll(".example-card").length === 24, null, { timeout: 10000 });
  check(true, "The full gallery lists all 24 examples");
  await page.getByRole("searchbox", { name: "Beispiele durchsuchen" }).fill("8D");
  await page.waitForFunction(() => document.querySelectorAll(".example-card").length === 1);
  check(true, "Gallery search narrows the examples");
  await page.getByRole("searchbox", { name: "Beispiele durchsuchen" }).fill("");
  await page.getByRole("radio", { name: "Recht, Personal und Verwaltung" }).click();
  await page.waitForFunction(() => document.querySelectorAll(".example-card").length === 3);
  check(true, "Category filter shows the examples of one category");
  await page.getByRole("radio", { name: "Alle" }).click();
  await shot("01b-gallery");

  // Preview: graph, agents and test task without any request to a model.
  await page.getByTestId("example-financial-analysis").getByRole("button").first().click();
  const preview = page.getByTestId("example-preview");
  await preview.waitFor();
  await preview.locator(".react-flow__node").first().waitFor();
  check((await preview.locator(".react-flow__node").count()) === 5, "Preview draws the example's graph");
  check(await preview.getByText("SYNTHETISCHE BEISPIELDATEN", { exact: false }).isVisible(), "Preview shows the synthetic test task");
  check(await preview.getByText("Prüfe jedes Ergebnis fachlich", { exact: false }).isVisible(), "Sensitive example asks for a human check");
  const sample = preview.getByRole("link", { name: /Kennzahlen_Beispiel_Industrie_AG\.xlsx/ });
  check(
    ((await sample.getAttribute("href")) ?? "").includes("/samples/") && (await sample.getAttribute("download")) !== null,
    "Preview offers the synthetic sample file as a download",
  );
  const sampleResponse = await page.request.get(base + (await sample.getAttribute("href")));
  check(sampleResponse.ok() && (await sampleResponse.body()).length > 0, "The sample file downloads without a model call");
  check(await preview.getByText("Kennzahlen als Excel-Datei").isVisible(), "Preview lists the test cases");
  check(
    (await page.getByRole("switch", { name: "Testfälle als Testreihe übernehmen" }).getAttribute("aria-checked")) === "true",
    "Copying the test cases is offered and on by default",
  );
  await shot("01c-preview");
  await page.getByLabel("Sprache der Kopie", { exact: true }).selectOption("en");
  await page.getByRole("dialog").getByRole("heading", { name: "Financial analysis" }).waitFor();
  check(true, "The preview switches the language of the copy");
  await page.getByLabel("Sprache der Kopie", { exact: true }).selectOption("de");
  await page.getByRole("dialog").getByRole("heading", { name: "Finanzanalyse" }).waitFor();
  await page.getByRole("button", { name: "Als Kopie übernehmen" }).click();
  await page.waitForURL(/\/workflows\/wf_/);
  // Count the editor's nodes, not those of the preview dialog that is still closing.
  await page.getByTestId("example-preview").waitFor({ state: "detached" });
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length >= 4, null, { timeout: 15000 });
  check((await page.locator(".react-flow__node").count()) >= 4, "Copying opens the example as an own workflow");
  const copiedId = page.url().match(/\/workflows\/(wf_[^/?#]+)/)[1];
  const suites = await (await page.request.get(`${base}/api/benchmarks?workflow_id=${copiedId}`)).json();
  check(suites.length === 1 && suites[0].cases.length === 2, "The copy brings its test cases as a test series");
  const copiedRuns = await (await page.request.get(`${base}/api/runs?workflow_id=${copiedId}`)).json();
  check(copiedRuns.length === 0, "Copying starts no run");
  await shot("02-editor");

  // A second example, for the lists below.
  await page.goto(base + "/workflows/examples?template=blog-article");
  await page.getByRole("button", { name: "Als Kopie übernehmen" }).click();
  await page.waitForURL(/\/workflows\/wf_/);
  await page.goto(base);
  await page.locator(".page__body > .card-grid > .card").first().waitFor();
  check((await page.locator(".page__body > .card-grid > .card").count()) === 2, "Copied examples appear among the own workflows");

  await page.locator(".page__body > .card-grid > .card", { hasText: "Finanzanalyse" }).first().click();
  await page.waitForURL(/\/workflows\/wf_/);
  await page.locator(".react-flow__node").first().waitFor();
  await page.locator(".react-flow__node-agent").first().click();
  await page.getByLabel("Name des Agenten").waitFor();
  check(true, "Inspector opens for an agent");
  await page.locator(".inspector summary", { hasText: "Tools" }).click();
  await shot("03-inspector");

  await page.getByRole("button", { name: "Agent hinzufügen" }).click();
  check(await page.getByText("Ungespeicherte Änderungen").first().isVisible(), "Adding an agent marks the workflow dirty");
  await page.getByRole("button", { name: "Rückgängig (Strg+Z)" }).click();

  check((await page.locator(".palette__toggle").getAttribute("aria-expanded")) === "true", "Building blocks start open in a wide window");

  // The input preview shows the task with marked inputs, without an API call.
  await page.locator(".react-flow__node-agent").first().click();
  await page.locator(".inspector summary", { hasText: "Eingabe-Vorschau" }).click();
  await page.getByTestId("prompt-preview").waitFor();
  check(true, "Input preview shows the prompt");

  // Agent test: the dialog explains that it is not a workflow run (no key here, so no request).
  await page.getByRole("button", { name: "Agent testen" }).click();
  await page.getByRole("dialog").getByText("kein Workflow-Lauf", { exact: false }).first().waitFor();
  check(true, "Agent test dialog opens");
  await shot("03b-agent-test");
  await page.getByRole("dialog").getByRole("button", { name: "Schließen", exact: true }).first().click();

  // Edges: click selects, Delete removes, undo restores, discard drops everything unsaved.
  const edges = page.locator(".react-flow__edge");
  const edgeCount = await edges.count();
  await page.locator(".react-flow__pane").click({ position: { x: 20, y: 20 } });
  await edges.first().dispatchEvent("click");
  await page.locator(".react-flow__edge.edge--selected").waitFor();
  check(true, "Clicking a connection selects it");
  await shot("02b-edge-selected");
  await page.keyboard.press("Delete");
  await page.waitForFunction((count) => document.querySelectorAll(".react-flow__edge").length === count - 1, edgeCount);
  check(true, "Delete removes the selected connection");
  await page.keyboard.press("Control+z");
  await page.waitForFunction((count) => document.querySelectorAll(".react-flow__edge").length === count, edgeCount);
  check(true, "Undo restores the connection");
  await edges.first().dispatchEvent("click");
  await page.keyboard.press("Backspace");
  await page.waitForFunction((count) => document.querySelectorAll(".react-flow__edge").length === count - 1, edgeCount);
  await page.locator(".title-actions").getByRole("button", { name: "Verwerfen" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Verwerfen" }).click();
  await page.waitForFunction((count) => document.querySelectorAll(".react-flow__edge").length === count, edgeCount);
  check(!(await page.getByText("Ungespeicherte Änderungen").first().isVisible()), "Discard reloads the saved workflow");
  await page.keyboard.press("Control+z");
  check((await edges.count()) === edgeCount, "Discard also clears the undo history");

  await page.getByRole("button", { name: "Versionen" }).click();
  await page.getByRole("heading", { name: "Versionsverlauf" }).waitFor();
  check(true, "Version history opens");
  await shot("02c-versions");
  await page.keyboard.press("Escape");

  // Global search jumps to an agent inside its workflow.
  await page.goto(base + "/settings");
  await page.getByTestId("search-open").waitFor();
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox", { name: "Suchbegriff" }).fill("Finanz");
  await page.getByTestId("search-hit").first().waitFor();
  check((await page.getByTestId("search-hit").count()) >= 1, "Global search finds workflows");
  await shot("02d-search");
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/workflows\//);
  check(true, "Enter opens the search hit");

  // The global search also finds examples and opens their preview.
  await page.goto(base + "/settings");
  await page.getByTestId("search-open").waitFor();
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox", { name: "Suchbegriff" }).fill("Speisekarte");
  // Help hits come from the browser, examples from the server: wait for the example group before Enter,
  // otherwise the first hit can still be the help section about the example.
  await page.locator(".global-search__heading", { hasText: "Beispiel-Workflows" }).waitFor();
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/workflows\/examples\?template=restaurant-menu/);
  await page.getByTestId("example-preview").waitFor();
  check(true, "Global search opens an example's preview");

  // Favorites come first and can be filtered.
  await page.goto(base);
  await page.locator(".page__body > .card-grid > .card").first().waitFor();
  await page.getByTestId("favorite").last().click();
  await page.getByTestId("favorites-filter").click();
  await page.waitForFunction(() => document.querySelectorAll(".page__body > .card-grid > .card").length === 1);
  check(true, "Favorites filter shows the marked workflow");
  await page.getByTestId("favorites-filter").click();

  for (const [path, heading, name] of [
    ["/agents", "Agenten", "04-agents"],
    ["/tools", "Tools", "05-tools"],
    ["/tools?tab=write", "Tools", "06-tools-write"],
    ["/knowledge", "Wissen", "07-knowledge"],
    ["/memory", "Memory", "08-memory"],
    ["/executions", "Ausführungen", "09-executions"],
    ["/usage", "Nutzung", "10-usage"],
    ["/settings", "Einstellungen", "11-settings"],
    ["/docs", "Dokumentation", "13-docs"],
  ]) {
    await page.goto(base + path);
    await page.getByRole("heading", { name: heading, exact: true }).waitFor();
    await page.waitForTimeout(300);
    check(true, `${path} renders`);
    await shot(name);
  }

  await page.goto(base + "/docs");
  await page.getByRole("searchbox").fill("trace importieren");
  await page.locator(".docs-result").first().waitFor();
  check((await page.locator(".docs-result").count()) >= 1, "Documentation search finds the trace import");
  await page.locator(".docs-result").first().click();
  await page.waitForURL(/\/docs\/ausfuehrungen/);
  check(true, "Search hit opens its chapter");
  await shot("14-docs-chapter");

  const trace = process.env.NODESTRO_TRACE;
  if (trace) {
    await page.goto(base + "/executions");
    await page.getByTestId("trace-file").setInputFiles(trace);
    await page.waitForURL(/\/executions\/run_/);
    await page.getByText("Importierter Trace").first().waitFor();
    check(true, "Imported trace opens in the run view");
    await shot("16-imported-trace");
  }

  await page.goto(base + "/executions/compare");
  await page.getByText("Wähle in der Liste der Ausführungen zwei Läufe aus.").waitFor();
  check(true, "Comparison page explains how to pick runs");

  // Diagnosis runs locally; the backup downloads and is checked before any restore.
  await page.goto(base + "/settings");
  await page.getByRole("button", { name: "Diagnose starten" }).click();
  await page.locator('[data-check="database"][data-status="ok"]').waitFor();
  check(true, "Diagnosis reports a healthy database");
  await shot("17-diagnostics");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("backup-download").click()]);
  const file = join(mkdtempSync(join(tmpdir(), "nodestro-e2e-")), "backup.zip");
  await download.saveAs(file);
  await page.getByTestId("backup-file").setInputFiles(file);
  await page.getByTestId("backup-contents").waitFor();
  check(await page.getByRole("button", { name: "Jetzt wiederherstellen" }).isDisabled(), "Restore needs a confirmation");
  await shot("18-backup-check");
  await page.getByRole("dialog").getByRole("button", { name: "Abbrechen" }).click();

  await page.goto(base + "/settings");
  await page.locator(".help-tip").first().click();
  await page.getByRole("tooltip").waitFor();
  check(await page.getByRole("tooltip").getByRole("link").isVisible(), "Help tip opens on click with a documentation link");
  await shot("15-help-tip");

  await page.goto(base + "/tools");
  await page.getByText("calculator").first().click();
  await page.getByRole("button", { name: "Ausführen" }).waitFor();
  check(true, "Tool detail opens");

  await page.goto(base);
  await page.getByRole("radio", { name: "Hell" }).click();
  // Click the own workflow's card once the list has loaded, not an example of the same name.
  await page.locator(".page__body > .card-grid > .card", { hasText: "Finanzanalyse" }).first().click();
  await page.waitForURL(/\/workflows\/wf_/);
  await page.locator(".react-flow__node").first().waitFor();
  await shot("12-editor-light");
  await page.getByRole("radio", { name: "Dunkel" }).click();

  const relevant = errors.filter((text) => !/Failed to load resource/.test(text));
  check(relevant.length === 0, `No console errors${relevant.length ? `: ${relevant.join(" | ")}` : ""}`);
} finally {
  await browser.close();
}
