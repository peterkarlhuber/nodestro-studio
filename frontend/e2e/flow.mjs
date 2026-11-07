// Browser test of decisions, approvals, input forms, continued runs, result files, batch runs,
// test series and schedules against tests/e2e_flow_server.py, whose agents answer from a
// script (no API key, nothing paid). Section 10: a copy of an example (sample data badge, sample files in the run
// dialog). Section 11: the value warnings of an agent test (German and light, English and dark at 390 px).
// Usage: node e2e/flow.mjs [baseUrl] [screenshotDir]

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
// Chromium by default; E2E_BROWSER=firefox or webkit runs the same checks in another engine.
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8040";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const browser = await browserType.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 940 }, locale: "de-DE" });
const errors = [];
page.on("console", (message) => {
  // A rejected start with an incomplete form answers 400 on purpose; the page shows it per field.
  if (message.type() === "error" && !/status of 4\d\d/.test(message.text())) errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

async function shot(name) {
  if (shots) await page.screenshot({ path: join(shots, `${name}.png`) });
}

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`ok  ${message}`);
}

// The test servers close idle keep-alive connections after 5 s; a request sent on a pooled connection at that moment
// fails with ECONNRESET. A fresh connection per API call avoids the race.
const FRESH_CONNECTION = { connection: "close" };

async function api(path, method = "GET", data) {
  const response = await page.request.fetch(base + "/api" + path, { method, data, headers: FRESH_CONNECTION });
  if (!response.ok()) throw new Error(`${method} ${path}: ${response.status()} ${await response.text()}`);
  return response.status() === 204 ? null : response.json();
}

async function until(probe, message, timeout = 20000) {
  const deadline = Date.now() + timeout;
  for (;;) {
    const value = await probe();
    if (value) return value;
    if (Date.now() > deadline) throw new Error(`Timed out: ${message}`);
    await page.waitForTimeout(250);
  }
}

const agent = (id, name, prompt, extra = {}) => ({
  id,
  type: "agent",
  label: name,
  position: { x: 0, y: 0 },
  agent: { name, system_prompt: prompt, ...extra },
});
const edge = (source, target, handle = null) => ({ id: `${source}-${target}`, source, target, source_handle: handle });
const field = (name, label, type = "text", required = true) => ({
  name,
  label,
  type,
  description: "",
  required,
  default: null,
  options: [],
});
const FORM = [field("kunde", "Kunde"), field("anliegen", "Anliegen", "textarea")];
// Columns from left to right, so the canvas shows every node.
const place = (nodes) => nodes.map((node, index) => ({ ...node, position: { x: index * 280, y: (index % 2) * 160 } }));
const start = { id: "start", type: "start", position: { x: 0, y: 0 }, start: { default_input: "", file_ids: [], fields: FORM } };

try {
  // The scripted model ignores the key; the editor only needs one to enable starting.
  await api("/settings", "PUT", { providers: { anthropic: { api_key: "e2e-placeholder-not-a-key" } } });

  // ---- set-up: a routed workflow with an approval, and a short one for automation ----------
  const routed = await api("/workflows", "POST", {
    name: "Reklamationen beantworten",
    nodes: place([
      start,
      agent("classify", "Klassifizierer", "CLASSIFY the request."),
      {
        id: "route",
        type: "condition",
        label: "Routing",
        position: { x: 0, y: 0 },
        condition: {
          mode: "first",
          on_invalid: "default",
          default_label: "Sonst",
          rules: [{ id: "complaint", label: "Beschwerde", field: "category", operator: "equals", value: "complaint", case_sensitive: false }],
        },
      },
      agent("complaints", "Beschwerdeteam", "COMPLAINTS team."),
      agent("general", "Allgemein", "GENERAL answers."),
      {
        id: "check",
        type: "approval",
        label: "Antwort freigeben",
        position: { x: 0, y: 0 },
        approval: { instructions: "Ton und Zusage prüfen.", show: [], allow_comment: true, require_comment_on_reject: true, on_reject: "branch" },
      },
      agent("summary", "Zusammenfassung", "SUMMARY of the case."),
      { id: "out", type: "output", position: { x: 0, y: 0 }, output: { files: [{ format: "md", name: "", sanitize: false }, { format: "json", name: "", sanitize: false }] } },
    ]),
    edges: [
      edge("start", "classify"),
      edge("classify", "route"),
      edge("route", "complaints", "complaint"),
      edge("route", "general", "default"),
      edge("complaints", "check"),
      edge("check", "summary", "approved"),
      edge("general", "summary"),
      edge("summary", "out"),
    ],
  });
  const short = await api("/workflows", "POST", {
    name: "Kurzantwort",
    nodes: place([start, agent("general", "Allgemein", "GENERAL answers."), { id: "out", type: "output" }]),
    edges: [edge("start", "general"), edge("general", "out")],
  });

  // ---- 1. the editor shows the new nodes and branches ---------------------------------------
  await page.goto(`${base}/workflows/${routed.id}`);
  if ((await page.locator(".palette__toggle").getAttribute("aria-expanded")) !== "true") {
    await page.getByRole("button", { name: "Bausteine einblenden", exact: true }).click();
  }
  await page.locator(".palette__label", { hasText: "Ablauf steuern" }).waitFor();
  check(await page.locator(".palette__item", { hasText: "Entscheidung" }).isVisible(), "The palette offers the decision node");
  const router = page.locator(".react-flow__node", { hasText: "Routing" });
  await router.waitFor();
  check(await router.getByText("Beschwerde").isVisible(), "The decision shows its rule as a branch");
  check(await router.getByText("Sonst").isVisible(), "The decision shows its otherwise branch");
  check(
    (await page.locator(".react-flow__node", { hasText: "Antwort freigeben" }).getByText("Freigegeben").count()) > 0,
    "The approval shows its approved branch",
  );
  await shot("flow-01-editor");

  // ---- 2. the input form checks values before the run starts -------------------------------
  await page.getByRole("button", { name: "Workflow starten" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByText("Fülle das Eingabeformular", { exact: false }).waitFor();
  await dialog.getByRole("button", { name: "Starten" }).click();
  await dialog.getByRole("alert").filter({ hasText: "Pflichtfeld." }).first().waitFor();
  check(true, "A missing required field is reported next to the field");
  await dialog.getByLabel("Kunde *").fill("Muster GmbH");
  await dialog.getByLabel("Anliegen *").fill("Das Gerät ist defekt.");
  await dialog.getByRole("button", { name: "Starten" }).click();

  // ---- 3. the run pauses at the approval ---------------------------------------------------
  await page.locator(".approval-card").first().waitFor({ timeout: 20000 });
  check(true, "The run panel shows the waiting approval");
  check((await page.locator(".nav-item__badge").first().textContent())?.trim() === "1", "The navigation counts one open approval");
  await shot("flow-02-paused");
  const first = await until(async () => (await api(`/runs?workflow_id=${routed.id}`))[0], "first run");
  check(first.status === "paused", "The run is paused");

  await page.goto(`${base}/approvals`);
  const card = page.locator(".approval-card").first();
  await card.getByText("Ton und Zusage prüfen.").waitFor();
  check(await card.getByText("Es tut uns leid", { exact: false }).isVisible(), "The reviewer sees the result to approve");
  await card.getByRole("textbox").fill("Zusage passt.");
  await card.getByRole("button", { name: "Freigeben" }).click();
  await page.getByText("Freigegeben. Der Lauf geht weiter.").waitFor();
  check(true, "Approving continues the run");
  const done = await until(async () => {
    const run = await api(`/runs/${first.id}`);
    return run.status === "succeeded" ? run : null;
  }, "run after approval");
  check(done.nodes.general.status === "skipped", "The branch that was not chosen is skipped");
  check(done.nodes.check.approval.comment === "Zusage passt.", "The decision and its comment are stored");

  // ---- 4. the run shows the decision and writes result files --------------------------------
  await page.goto(`${base}/executions/${first.id}`);
  await page.getByRole("heading", { name: "Ergebnisdateien" }).waitFor();
  const files = await until(async () => {
    const list = await api(`/runs/${first.id}/files`);
    return list.length === 2 ? list : null;
  }, "two result files");
  check(files.map((file) => file.format).sort().join() === "json,md", "The result node wrote Markdown and JSON");
  const markdown = await page.request.get(`${base}/api/runs/${first.id}/files/${files.find((file) => file.format === "md").id}`);
  check((await markdown.text()).includes("Nächster Schritt"), "The Markdown file holds the result");
  await page.getByRole("button", { name: /Routing/ }).first().click();
  await page.getByText("Gewählte Zweige: Beschwerde").waitFor();
  check(true, "The run explains which branch the decision chose");
  await shot("flow-03-run");

  // ---- 4b. the global search reaches runs and offers recent items (OB-09) --------------------
  await page.goto(`${base}/settings`);
  await page.getByTestId("search-open").waitFor();
  await page.keyboard.press("Control+k");
  const recent = page.getByTestId("search-group-recent");
  // Recent runs and recent workflows come from two requests that answer independently.
  await until(async () => (await recent.getByTestId("search-hit").count()) >= 2, "recent runs and workflows");
  check(true, "The empty search offers recent runs and workflows");
  await page.getByRole("combobox", { name: "Suchbegriff" }).fill("Reklamationen fertig");
  const runGroup = page.getByTestId("search-group-run");
  await runGroup.getByTestId("search-hit").first().waitFor();
  await shot("flow-03b-search-runs");
  await runGroup.getByTestId("search-hit").first().click();
  await page.waitForURL(/\/executions\/run_/);
  check(true, "The global search finds a run by workflow name and status and opens it");

  // ---- 5. a cancelled run continues without repeating finished steps -----------------------
  const second = await api(`/workflows/${routed.id}/runs`, "POST", {
    input: "",
    file_ids: [],
    values: { kunde: "Beispiel AG", anliegen: "Lieferung fehlt." },
  });
  await until(async () => (await api(`/runs/${second.id}`)).status === "paused", "second run paused");
  await api(`/runs/${second.id}/cancel`, "POST");
  await until(async () => (await api(`/runs/${second.id}`)).status === "cancelled", "second run cancelled");
  await page.goto(`${base}/executions/${second.id}`);
  await page.getByRole("button", { name: "Fortsetzen", exact: true }).click();
  const resume = page.getByRole("dialog");
  await resume.getByText("Übernehmen").first().waitFor();
  check((await resume.getByText("Übernehmen").count()) >= 2, "Finished steps are taken over");
  await resume.getByRole("button", { name: "Fortsetzen", exact: true }).click();
  await page.getByText("Fortsetzung eines fehlgeschlagenen Laufs.").waitFor();
  check(true, "The continued run links to the earlier one");
  const continued = await until(async () => {
    const runs = await api(`/runs?workflow_id=${routed.id}`);
    const run = runs.find((item) => item.resumed_from === second.id);
    return run && run.status === "paused" ? run : null;
  }, "continued run waits for the approval again");
  const full = await api(`/runs/${continued.id}`);
  check(full.nodes.classify.reused_from === second.id, "The classifier result was taken over, not computed again");
  await api(`/runs/${continued.id}/cancel`, "POST");

  // ---- 5b. a failed run becomes a redacted test case (Q-4) -----------------------------------
  const broken = await api("/workflows", "POST", {
    name: "Defekt",
    nodes: place([start, agent("broken", "Defekt", "BROKEN answers."), { id: "out", type: "output" }]),
    edges: [edge("start", "broken"), edge("broken", "out")],
  });
  const failedRun = await api(`/workflows/${broken.id}/runs`, "POST", {
    input: "",
    file_ids: [],
    values: { kunde: "anna@example.com", anliegen: "Schlüssel sk-ant-api03-abcdefghijklmnopqrstuvwxyz" },
  });
  await until(async () => (await api(`/runs/${failedRun.id}`)).status === "failed", "broken run failed");
  await page.goto(`${base}/executions/${failedRun.id}`);
  await page.getByTestId("case-from-run-open").click();
  const proposal = page.getByTestId("case-from-run");
  await proposal.getByText("[EMAIL_1]").waitFor();
  const proposed = await proposal.getByTestId("case-from-run-values").textContent();
  check(!proposed.includes("anna@example.com") && !proposed.includes("sk-ant-"), "The proposed test case hides personal data and keys");
  check((await api(`/benchmarks?workflow_id=${broken.id}`)).length === 0, "Nothing is saved before confirming");
  await shot("flow-03b-case-from-run");
  await page.getByTestId("case-from-run-add").click();
  await page.waitForURL(/\/tests\/suite_/);
  await page.getByTestId("case-origin").waitFor();
  const stored = await api(`/benchmarks?workflow_id=${broken.id}`);
  check(stored.length === 1 && stored[0].cases[0].origin.run_id === failedRun.id, "The case is added to a new series and keeps its origin");

  // ---- 6. a batch run over a table ----------------------------------------------------------
  await page.goto(`${base}/batches`);
  await page.getByRole("button", { name: "Neuer Stapellauf" }).first().click();
  const batch = page.getByRole("dialog");
  await batch.locator(".field", { hasText: "Workflow" }).locator("select").selectOption({ label: "Kurzantwort" });
  await batch.getByTestId("batch-file").setInputFiles({
    name: "anfragen.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Kunde;Anliegen\nAlpha;Frage zur Rechnung\nBeta;Lieferzeit?\n;ohne Kunde\n"),
  });
  await batch.getByText("2 gültige Zeilen").waitFor();
  check(await batch.getByText("1 ungültige Zeile").isVisible(), "The preview counts valid and invalid rows");
  await shot("flow-04-batch");
  await batch.getByRole("button", { name: "2 Läufe starten" }).click();
  await page.waitForURL(/\/batches\/[^/]+$/);
  await page.getByText("3 / 3").waitFor({ timeout: 30000 });
  check((await page.locator("tbody tr", { hasText: "Fertig" }).count()) === 2, "The batch ran both valid rows");
  check(await page.getByText("kunde: Pflichtfeld.").isVisible(), "The invalid row says what is missing");

  // ---- 7. a test series with checks --------------------------------------------------------
  const rule = (operator, value) => ({ id: `r_${value}`, label: "", field: "", operator, value, case_sensitive: false });
  const suite = await api("/benchmarks", "POST", {
    name: "Kurzantwort prüfen",
    description: "",
    workflow_id: short.id,
    judge_model: null,
    cases: [
      { id: "c1", name: "Dank", input: "", values: { kunde: "A", anliegen: "x" }, file_ids: [], checks: [rule("contains", "Danke")], judge_criteria: "", expected: "" },
      { id: "c2", name: "Rechnung", input: "", values: { kunde: "B", anliegen: "y" }, file_ids: [], checks: [rule("contains", "Rechnung")], judge_criteria: "", expected: "" },
    ],
  });
  await page.goto(`${base}/tests/${suite.id}`);
  await page.getByRole("button", { name: "Testreihe ausführen" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "2 Testfälle ausführen" }).click();
  await page.getByText("1 bestanden, 1 nicht bestanden", { exact: false }).first().waitFor({ timeout: 30000 });
  check(true, "The test series reports one passed and one failed case");
  await shot("flow-05-tests");

  // ---- 7b. the same series with another model for one agent (Q-2) -----------------------------
  const savedShort = await api(`/workflows/${short.id}`);
  const agentNode = savedShort.nodes.find((node) => node.type === "agent");
  await page.getByRole("button", { name: "Testreihe ausführen" }).click();
  const startDialog = page.getByRole("dialog");
  await startDialog.getByRole("switch", { name: /Andere Modelle testen/ }).click();
  const modelInput = startDialog.getByRole("combobox", { name: `Modell für ${agentNode.label || agentNode.agent.name}` });
  await modelInput.fill("claude-haiku-4-5");
  await startDialog.getByTestId("benchmark-needs-limit").waitFor();
  check(await startDialog.getByRole("button", { name: "2 Testfälle ausführen" }).isDisabled(), "Comparing models needs a cost limit");
  await startDialog.locator(".field", { hasText: "Kostengrenze" }).locator("input").fill("1");
  await startDialog.getByRole("button", { name: "2 Testfälle ausführen" }).click();
  const variantRow = page.getByTestId("benchmark-run-models").first();
  await variantRow.waitFor({ timeout: 30000 });
  check((await variantRow.textContent()).includes("anthropic:claude-haiku-4-5"), "The runs list names the replaced model");
  const variantRun = await until(
    async () => (await api(`/benchmarks/${suite.id}/runs`)).find((run) => Object.keys(run.models ?? {}).length && run.status === "finished"),
    "model comparison finished",
    30000,
  );
  check(variantRun.models[agentNode.id] === "anthropic:claude-haiku-4-5", "The run used the chosen model");
  check((await api(`/workflows/${short.id}`)).nodes.find((node) => node.id === agentNode.id).agent.model === agentNode.agent.model, "The saved workflow keeps its model");

  // ---- 8. a schedule stays off until it passes its check ------------------------------------
  // Without a budget per run a schedule must not switch on.
  await api("/settings", "PUT", { default_budget_usd: null });
  await page.goto(`${base}/schedules`);
  await page.getByRole("button", { name: "Neuer Zeitplan" }).first().click();
  const schedule = page.getByRole("dialog");
  await schedule.locator(".field", { hasText: "Name" }).first().locator("input").fill("Morgenrunde");
  await schedule.locator(".field", { hasText: "Workflow" }).locator("select").selectOption({ label: "Kurzantwort" });
  await schedule.getByLabel("Kunde *").fill("Gamma");
  await schedule.getByLabel("Anliegen *").fill("Täglicher Bericht");
  await schedule.getByText("Nächste Starts").waitFor();
  check(true, "The dialog previews the next starts");
  await schedule.getByRole("button", { name: "Speichern" }).click();
  await page.getByText("Zeitplan gespeichert.").waitFor();
  const toggle = page.getByRole("switch", { name: /Morgenrunde/ });
  check((await toggle.getAttribute("aria-checked")) === "false", "A new schedule is off");
  await toggle.click();
  await page.getByRole("dialog").getByText("Budget pro Lauf", { exact: false }).waitFor();
  check(true, "Switching on without a budget is refused with the reason");
  await page.keyboard.press("Escape");
  await api("/settings", "PUT", { default_budget_usd: 0.5 });
  await toggle.click();
  await until(async () => (await toggle.getAttribute("aria-checked")) === "true", "schedule switched on");
  check(true, "With a budget the schedule switches on");
  await shot("flow-06-schedules");

  // ---- 9. the runs table fits at 1280 px in every language, with real rows (NJR-20) ---------
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const language of ["de", "en", "es", "fr", "it", "pt-BR"]) {
    await page.evaluate((value) => localStorage.setItem("nodestro-language", value), language);
    await page.goto(`${base}/executions`);
    await page.locator(".table--runs tbody tr").first().waitFor();
    await page.waitForTimeout(200);
    const fit = await page.evaluate(() => {
      const frame = document.querySelector(".table--runs").parentElement;
      return frame.scrollWidth - frame.clientWidth;
    });
    check(fit <= 0, `${language}: the runs table fits at 1280 px without scrolling (${fit})`);
  }
  await page.evaluate(() => localStorage.setItem("nodestro-language", "de"));

  // ---- 10. a copy of an example: sample data badge (ST-031) and sample files in the run dialog (ST-007) ----------
  await page.setViewportSize({ width: 1500, height: 940 });
  const copy = await api("/library/customer-service/copy", "POST", { language: "de" });
  check(copy.origin?.example_id === "customer-service" && copy.origin.offline.length > 0, "An offline copy of an example records its origin");
  await page.goto(`${base}/workflows/${copy.id}`);
  const offline = page.getByTestId("offline-badge");
  await offline.waitFor();
  check((await offline.innerText()).includes("Beispieldaten"), "The editor header marks a copy that runs on sample data");
  await offline.focus();
  const offlineTip = page.locator("[role=tooltip]");
  await offlineTip.waitFor();
  check(/läuft offline|laufen offline/.test(await offlineTip.innerText()), "Its tooltip names the offline connection and how to get real data");
  await shot("flow-10-offline-badge");
  await page.keyboard.press("Escape");
  await page.getByTestId("start-workflow").click();
  const runDialog = page.getByRole("dialog");
  const offers = runDialog.getByTestId("upload-samples");
  await offers.first().waitFor();
  check((await offers.count()) === 2, "The run dialog offers the example's sample files at both file fields");
  const orders = runDialog.getByTestId("use-sample-orders");
  await until(async () => orders.isEnabled(), "sample button ready");
  await orders.click();
  await until(async () => /hinzugefügt/.test(await orders.innerText()), "sample uploaded");
  check(await orders.isDisabled(), "One click uploads the sample into the field; its button then says it was added");
  check((await runDialog.locator(".upload-row").count()) >= 1, "The uploaded sample is listed in the field like a chosen file");
  await shot("flow-10-run-samples");
  await page.setViewportSize({ width: 390, height: 844 });
  const narrow = await page.evaluate(() => {
    const dialog = document.querySelector("dialog[open]");
    const row = dialog?.querySelector("[data-testid=upload-samples]")?.getBoundingClientRect();
    return Boolean(row && row.left >= 0 && row.right <= window.innerWidth);
  });
  check(narrow, "The sample offers fit the run dialog at 390 px");
  await shot("flow-10-run-samples-390");
  await page.setViewportSize({ width: 1500, height: 940 });
  await page.keyboard.press("Escape");
  const sampleRun = await api(`/workflows/${copy.id}/runs`, "POST", { input: "Wo ist meine Bestellung?", file_ids: [], values: {} });
  await page.goto(`${base}/executions/${sampleRun.id}`);
  await page.getByTestId("offline-badge").waitFor();
  check(true, "The run page header marks a run of a copy on sample data");
  await shot("flow-10-run-offline-badge");
  const plain = (await api("/workflows")).find((item) => item.name === "Kurzantwort");
  await page.goto(`${base}/workflows/${plain.id}`);
  await page.locator(".titlebar__name").waitFor();
  check((await page.getByTestId("offline-badge").count()) === 0, "A workflow that is no example copy has no badge");

  // ---- 11. an agent test warns about a key figure no tool computed (RT-054 value_warnings) ----------------------
  const keyFigure = await api("/workflows", "POST", {
    name: "Kennzahlen",
    nodes: place([
      start,
      agent("margin", "Marge", "KEYFIGURE of the case.", {
        tools: ["calculator"],
        output: {
          mode: "structured",
          name: "Result",
          fields: [{ name: "margin", type: "number", description: "Marge in Prozent", required: true, source: "tool" }],
        },
      }),
      { id: "out", type: "output" },
    ]),
    edges: [edge("start", "margin"), edge("margin", "out")],
  });
  const testAgent = async (target, labels) => {
    await target.goto(`${base}/workflows/${keyFigure.id}`);
    await target.locator(".react-flow__node-agent").first().click();
    await target.getByRole("button", { name: labels.button, exact: true }).click();
    const dialog = target.getByRole("dialog");
    await dialog.getByRole("textbox", { name: labels.input }).fill("Umsatz 200, Kosten 175");
    await dialog.getByRole("button", { name: labels.start, exact: true }).click();
    await dialog.getByTestId("agent-test-result").waitFor({ timeout: 20000 });
    return dialog;
  };
  const tested = await testAgent(page, { button: "Agent testen", input: "Testeingabe", start: "Test starten" });
  const warnings = tested.getByRole("group", { name: "1 Kennzahl wurde nicht mit einem Tool berechnet" });
  await warnings.waitFor();
  const warning = warnings.getByTestId("agent-test-value-warning");
  check(
    (await warning.getAttribute("data-reason")) === "not_from_tool" &&
      (await warning.textContent()) === "margin = 12,5 ist in diesem Test nicht das Ergebnis eines Tool-Aufrufs.",
    "The agent test names the key figure that no tool computed, with its value",
  );
  check((await warnings.textContent()).includes("schlägt der Schritt fehl"), "It says what a workflow run would do with it");
  await shot("flow-11-agent-test-value-warning");
  await page.keyboard.press("Escape");
  // English, dark, at phone width: the warning wraps inside the dialog.
  const darkContext = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "en-US" });
  await darkContext.addInitScript(() => {
    localStorage.setItem("nodestro-theme", "dark");
    localStorage.setItem("nodestro-language", "en");
  });
  const phone = await darkContext.newPage();
  phone.on("pageerror", (error) => errors.push(error.message));
  const narrowTest = await testAgent(phone, { button: "Test agent", input: "Test input", start: "Start test" });
  const narrowWarnings = narrowTest.getByRole("group", { name: "1 key figure was not computed with a tool" });
  await narrowWarnings.waitFor();
  check(
    (await narrowWarnings.getByTestId("agent-test-value-warning").textContent()) === "margin = 12.5 is not the result of a tool call in this test.",
    "The warning reads in English",
  );
  const fits = await narrowWarnings.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return box.left >= 0 && box.right <= window.innerWidth && document.documentElement.scrollWidth <= window.innerWidth;
  });
  check(fits, "The value warning fits at 390 px in the dark theme without sideways scrolling");
  await narrowWarnings.scrollIntoViewIfNeeded();
  if (shots) await phone.screenshot({ path: join(shots, "flow-11-agent-test-value-warning-390-dark.png") });
  await darkContext.close();

  check(errors.length === 0, `No console errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
} finally {
  await browser.close();
}
