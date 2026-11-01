// Browser test of "API & Export": publish a workflow, create a key, call the published API like
// a client, decide its approval, roll back, validate in the dialog and generate the export,
// against tests/e2e_api_server.py, whose agents answer from a script (nothing paid).
// Usage: node e2e/api.mjs [baseUrl] [screenshotDir]

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
// Chromium by default; E2E_BROWSER=firefox or webkit runs the same checks in another engine.
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8050";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const browser = await browserType.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 940 }, locale: "de-DE" });
const errors = [];
page.on("console", (message) => {
  // Checking an invalid request answers 422 on purpose; the dialog shows the fields.
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

const field = (name, label, type = "text", required = true) => ({
  name,
  label,
  type,
  description: "",
  required,
  default: null,
  options: [],
});
const edge = (source, target, handle = null) => ({ id: `${source}-${target}`, source, target, source_handle: handle });
const nodes = (instructions) => [
  { id: "start", type: "start", position: { x: 0, y: 0 }, start: { default_input: "", file_ids: [], fields: [field("kunde", "Kunde"), field("menge", "Menge", "number", false)] } },
  { id: "writer", type: "agent", label: "Angebot", position: { x: 280, y: 0 }, agent: { name: "Angebot", system_prompt: "WRITER of offers." } },
  {
    id: "check",
    type: "approval",
    label: "Angebot freigeben",
    position: { x: 560, y: 0 },
    approval: { instructions, show: [], allow_comment: true, require_comment_on_reject: false, on_reject: "stop" },
  },
  { id: "out", type: "output", position: { x: 840, y: 0 } },
];
const edges = [edge("start", "writer"), edge("writer", "check"), edge("check", "out", "approved")];

try {
  // The scripted model ignores the key; published runs only need one to be set.
  await api("/settings", "PUT", { providers: { anthropic: { api_key: "e2e-placeholder-not-a-key" } } });
  const workflow = await api("/workflows", "POST", { name: "Angebote schreiben", budget_usd: 1, nodes: nodes("Preis prüfen."), edges });

  // ---- publish from the editor ------------------------------------------------------------------
  await page.goto(`${base}/workflows/${workflow.id}`);
  await page.getByTestId("open-api").click();
  const dialog = page.getByTestId("api-dialog");
  await dialog.getByText("Dieser Workflow ist noch nicht veröffentlicht.", { exact: false }).waitFor();
  check(await dialog.getByTestId("api-tab-try").isDisabled(), "Tabs other than the overview wait for a first version");
  await dialog.getByTestId("api-check-summary").waitFor();
  check((await dialog.getByTestId("api-check-summary").textContent()).includes("Bereit"), "The check before publishing passes");
  await dialog.getByTestId("test-status").getByText("Für diesen Workflow gibt es keine Testreihe.").waitFor();
  check(true, "The publish dialog says the workflow has no test series (Q-1)");
  await shot("api-01-publish");
  await dialog.getByTestId("api-publish").click();
  await dialog.getByTestId("api-status").waitFor();
  const url = (await dialog.getByTestId("api-url").textContent()).trim();
  check(url.endsWith("/api/published/angebote-schreiben"), `The API has its address (${url})`);
  check((await dialog.getByTestId("api-versions").textContent()).includes("v1"), "Version 1 is listed");

  // ---- a key, shown once ----------------------------------------------------------------------
  await dialog.getByTestId("api-tab-access").click();
  await dialog.getByTestId("api-key-name").fill("CRM");
  for (const scope of ["Freigaben entscheiden"]) await dialog.getByLabel(scope).check();
  await dialog.getByTestId("api-key-create").click();
  const token = (await page.getByTestId("api-new-key").textContent()).trim();
  check(token.startsWith("ndk_"), "The new key is shown once");
  await shot("api-02-key");
  await page.getByRole("button", { name: "Ich habe den Schlüssel gesichert" }).click();
  check((await dialog.getByTestId("api-key-row").count()) === 1, "The key is listed without its secret");
  check(!(await dialog.textContent()).includes(token), "The secret is not shown again");

  // ---- call it like a client ----------------------------------------------------------------
  const call = (path, method = "GET", data, key = token) =>
    page.request.fetch(url + path, { method, data, headers: key ? { Authorization: `Bearer ${key}` } : {} });
  check((await call("/runs", "POST", { values: { kunde: "ACME" } }, null)).status() === 401, "Without a key the API answers 401");
  const invalid = await call("/runs", "POST", { values: { menge: "viele" } });
  const problem = await invalid.json();
  check(invalid.status() === 422 && problem.error.code === "request.invalid", "An invalid body answers 422 with a code");
  const started = await call("/runs", "POST", { values: { kunde: "ACME", menge: 10 } }, token);
  check(started.status() === 202, "Starting answers 202 at once");
  const run = await started.json();
  const waiting = await until(async () => {
    const status = await (await call(`/runs/${run.run_id}`)).json();
    return status.status === "awaiting_approval" ? status : null;
  }, "run waits for approval");
  check(waiting.approvals.length === 1 && waiting.version === 1, "The run waits for its approval with version 1");

  // The studio shows the API run and its approval.
  await page.goto(`${base}/approvals`);
  await page.getByText("aus der veröffentlichten API", { exact: false }).first().waitFor();
  check(true, "The approvals page marks the approval as coming from the API");
  const decided = await call(`/runs/${run.run_id}/approve`, "POST", { decision: "approved", comment: "passt" });
  check(decided.ok(), "The client approves through the API");
  const done = await until(async () => {
    const status = await (await call(`/runs/${run.run_id}`)).json();
    return status.status === "succeeded" ? status : null;
  }, "run succeeds");
  const result = await (await call(`/runs/${run.run_id}/result`)).json();
  check(JSON.stringify(result).includes("Wir liefern 10 Stück"), "The result comes from the workflow");
  check(done.usage !== undefined, "The status reports usage");
  await page.goto(`${base}/executions/${run.run_id}`);
  await page.getByText("Über die veröffentlichte API gestartet", { exact: false }).waitFor();
  check(true, "The run shows its API origin");
  await shot("api-03-run");

  // ---- a second version and rollback ------------------------------------------------------------
  await api(`/workflows/${workflow.id}`, "PUT", { ...workflow, nodes: nodes("Preis und Termin prüfen."), edges });
  await api("/benchmarks", "POST", {
    name: "Angebote Regression",
    description: "",
    workflow_id: workflow.id,
    judge_model: null,
    cases: [{ id: "c1", name: "ACME", input: "", values: { kunde: "ACME", menge: 10 }, file_ids: [], checks: [], judge_criteria: "", expected: "" }],
  });
  await page.goto(`${base}/workflows/${workflow.id}`);
  await page.getByTestId("open-api").click();
  await dialog.getByTestId("api-check-summary").waitFor();
  const testRow = dialog.getByTestId("test-status-row");
  await testRow.waitFor();
  check((await testRow.textContent()).includes("Angebote Regression") && (await testRow.textContent()).includes("ungetestet"), "The publish dialog shows the untested series of the new version (Q-1)");
  await dialog.getByTestId("api-publish").click();
  await until(async () => (await dialog.getByTestId("api-versions").textContent()).includes("v2"), "version 2 listed");
  await until(async () => (await (await call("")).json()).version === 2, "version 2 active");
  check(true, "The new version is active");
  await dialog.getByTestId("api-versions").getByRole("button", { name: "Aktiv machen" }).click();
  await until(async () => (await (await call("")).json()).version === 1, "rolled back");
  check(true, "Making version 1 active rolls back without publishing");

  // ---- release gate (Q-3) ---------------------------------------------------------------------
  await dialog.getByTestId("api-tab-settings").click();
  const gateSettings = dialog.getByTestId("gate-settings");
  await gateSettings.getByRole("switch").click();
  await gateSettings.getByRole("checkbox", { name: "Angebote Regression" }).check();
  await gateSettings.getByTestId("gate-save").click();
  await until(async () => (await api("/publications"))[0] && (await api(`/workflows/${workflow.id}/api`)).publication.gate, "gate saved");
  check(true, "The release gate is switched on in the API settings");
  await api(`/workflows/${workflow.id}`, "PUT", { ...workflow, nodes: nodes("Preis, Termin und Menge prüfen."), edges });
  await page.reload();
  await page.getByTestId("open-api").click();
  const gateReport = dialog.getByTestId("gate-report");
  await gateReport.waitFor();
  check((await gateReport.getAttribute("data-status")) === "blocked", "An untested version is blocked by the gate");
  check(await dialog.getByTestId("api-publish").isDisabled(), "A blocked version cannot be published");
  check((await dialog.getByTestId("gate-reason").count()) === 0, "A blocked version offers no override");
  await shot("api-04-gate");

  // ---- validate in the dialog ---------------------------------------------------------------
  await dialog.getByTestId("api-tab-try").click();
  await dialog.getByTestId("api-try-validate").click();
  await dialog.getByTestId("api-try-valid").waitFor();
  check(true, "The example request is valid");
  await dialog.getByTestId("api-try-body").fill('{"values": {"menge": 3}}');
  await dialog.getByTestId("api-try-validate").click();
  await dialog.getByRole("alert").first().waitFor();
  const refusal = await dialog.getByRole("alert").first().textContent();
  check(/kunde/i.test(refusal) && refusal.includes("fehlt"), "A missing field is named, with what is wrong");
  check(!/\.(int|float)\b/.test(refusal), "No technical union branches in the field problems");
  await dialog.getByTestId("api-try-body").fill('{"values": {"kunde": "ACME", "menge": "viele"}}');
  await dialog.getByTestId("api-try-validate").click();
  await dialog.getByTestId("request-problems").getByText("muss eine Zahl sein", { exact: false }).waitFor();
  const numberRefusal = await dialog.getByTestId("request-problems").textContent();
  check(/Menge/.test(numberRefusal) && !/\.(int|float)\b/.test(numberRefusal), "A number field is reported once, by its label (AD-15)");
  await shot("api-05-try");

  // ---- documentation and export -------------------------------------------------------------
  await dialog.getByTestId("api-tab-docs").click();
  await dialog.getByText("/runs/{run_id}/approve", { exact: false }).first().waitFor();
  check(true, "The documentation lists the endpoints");
  await dialog.getByRole("radio", { name: "Python-SDK" }).click();
  const sdk = await dialog.getByTestId("api-sdk").textContent();
  check(sdk.includes("PublishedWorkflow(") && sdk.includes("wait_for_result"), "The documentation offers the Python SDK (AD-16)");
  await dialog.getByRole("radio", { name: "TypeScript-SDK" }).click();
  check((await dialog.getByTestId("api-sdk").textContent()).includes("waitForResult"), "The documentation offers the TypeScript SDK");
  await dialog.getByTestId("api-tab-export").click();
  await dialog.getByTestId("api-export-create").click();
  await dialog.getByTestId("api-exports").waitFor();
  const [publication] = await api("/publications");
  const [record] = await api(`/publications/${publication.id}/exports`);
  const zip = await page.request.fetch(`${base}/api/exports/${record.id}/download`);
  const body = await zip.body();
  check(zip.ok() && body.subarray(0, 2).toString() === "PK", "The export downloads as a ZIP");
  const text = body.toString("latin1");
  const contents = ["app/main.py", "nodestro_runtime/engine.py", "nodestro_api/standalone.py", "RUNTIME.json"];
  for (const name of [...contents, "workflow/release.json", "tests/test_api.py", "README.md"])
    check(text.includes(name), `The ZIP contains ${name}`);
  check(!text.includes(token.split("_").slice(2).join("_")), "The ZIP does not contain the key");
  await shot("api-06-export");

  check(errors.length === 0, `No console errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
} finally {
  await browser.close();
}
