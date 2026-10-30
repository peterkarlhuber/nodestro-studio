// Browser test of decisions, approvals, input forms, continued runs, result files, batch runs,
// test series and schedules against tests/e2e_flow_server.py, whose agents answer from a
// script (no API key, nothing paid).
// Usage: node e2e/flow.mjs [baseUrl] [screenshotDir]

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8040";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const browser = await chromium.launch();
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

async function api(path, method = "GET", data) {
  const response = await page.request.fetch(base + "/api" + path, { method, data });
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

  check(errors.length === 0, `No console errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
} finally {
  await browser.close();
}
