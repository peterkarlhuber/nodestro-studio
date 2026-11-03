// Browser test of budget decisions (BUDGET-1) against tests/e2e_budget_server.py (a scripted model, no key, no paid
// calls). A workflow with a budget of 0.0001 USD pauses before its first model request. Usage:
//   node e2e/budget.mjs [baseUrl] [screenshotDir]
// Covers: the card in the editor's run panel (status badges, validation, a raise that continues the run and a second
// decision), the run details after a reload, ending with the confirmation by keyboard only, raising by keyboard only,
// the Approvals page section and the navigation badge, a decision made elsewhere (409), the workspace maximum
// (client and server), the executions list, a 390 px phone width in dark mode, and the texts in all six languages.

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8150";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const TEXTS = Object.fromEntries(
  ["de", "en", "es", "fr", "it", "pt-BR"].map((language) => [language, require(`../src/i18n/locales/${language}/budget.json`)]),
);
const STATUS = Object.fromEntries(
  ["de", "en", "es", "fr", "it", "pt-BR"].map((language) => [language, require(`../src/i18n/locales/${language}/status.json`)]),
);

const browser = await browserType.launch();
let passed = 0;
const errors = [];

function check(condition, message) {
  if (!condition) throw new Error(message);
  passed += 1;
  console.log(`ok  ${message}`);
}

async function open({ language = "de", width = 1500, height = 940, dark = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, locale: language === "pt-BR" ? "pt-BR" : `${language}-${language.toUpperCase()}` });
  await context.addInitScript((value) => localStorage.setItem("nodestro-language", value), language);
  // The studio remembers its theme; each context sets it explicitly (light unless dark is asked for).
  await context.addInitScript((theme) => localStorage.setItem("nodestro-theme", theme), dark ? "dark" : "light");
  const page = await context.newPage();
  if (dark) await page.emulateMedia({ colorScheme: "dark" });
  page.on("console", (message) => {
    // Refused decisions answer 4xx on purpose; the browser logs those as failed requests.
    if (message.type() === "error" && !/status of 4\d\d/.test(message.text())) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page };
}

const { context: apiContext, page: apiPage } = await open();
const FRESH = { connection: "close" };
async function api(path, method = "GET", data) {
  const response = await apiPage.request.fetch(base + "/api" + path, { method, data, headers: FRESH });
  if (!response.ok()) throw new Error(`${method} ${path}: ${response.status()} ${await response.text()}`);
  return response.status() === 204 ? null : response.json();
}
async function raw(path, method, data) {
  return apiPage.request.fetch(base + "/api" + path, { method, data, headers: FRESH });
}

async function until(probe, message, timeout = 20000) {
  const deadline = Date.now() + timeout;
  for (;;) {
    const value = await probe();
    if (value) return value;
    if (Date.now() > deadline) throw new Error(`Timed out: ${message}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

async function shot(page, name) {
  if (shots) await page.screenshot({ path: join(shots, `${name}.png`), fullPage: true });
}

// The scripted model answers everything; the editor only needs a key to be set (never sent anywhere).
await api("/settings", "PUT", { providers: { anthropic: { api_key: "e2e-placeholder-not-a-key" } } });

// Earlier, unfinished runs of this instance would add cards of their own: end them first.
for (const request of await api("/budget-requests?status=pending")) await api(`/runs/${request.run_id}/cancel`, "POST");

const workflow = await api("/workflows", "POST", {
  name: "Angebot mit Budget",
  budget_usd: 0.0001,
  nodes: [
    { id: "start", type: "start", position: { x: 0, y: 0 } },
    { id: "a", type: "agent", label: "Entwurf", position: { x: 280, y: 0 }, agent: { name: "Entwurf", system_prompt: "BUDGETA", max_tokens: 1000 } },
    { id: "b", type: "agent", label: "Prüfung", position: { x: 560, y: 0 }, agent: { name: "Prüfung", system_prompt: "BUDGETB", max_tokens: 1000 } },
    { id: "out", type: "output", position: { x: 840, y: 0 } },
  ],
  edges: [
    { id: "e1", source: "start", target: "a" },
    { id: "e2", source: "a", target: "b" },
    { id: "e3", source: "b", target: "out" },
  ],
});

async function pausedRun() {
  const run = await api(`/workflows/${workflow.id}/runs`, "POST", { input: "Angebot für Muster GmbH" });
  await until(async () => (await api(`/runs/${run.id}`)).budget?.pending_request_id, "run waits for a budget decision");
  return run.id;
}

try {
  // ---- 1. editor: the run pauses before its first request; validation; raise; a second decision; raise again ----
  {
    const { context, page } = await open();
    await page.goto(`${base}/workflows/${workflow.id}`);
    await page.getByRole("button", { name: "Workflow starten" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Starten" }).click();
    const card = page.getByTestId("run-panel").getByTestId("budget-decision");
    await card.waitFor({ timeout: 20000 });
    check(true, "editor: the budget card appears in the run panel");
    check(await page.getByTestId("run-panel").locator(".run-panel__head [data-status=awaiting_budget]").isVisible(), "editor: the run panel head shows Waiting for budget decision");
    check((await page.locator(".react-flow__node [data-status=awaiting_budget]").count()) >= 1, "editor: the waiting agent's node shows awaiting_budget");
    check((await card.getByTestId("budget-reason").textContent()).includes("kann bis zu"), "editor: the reason names the most the next request can cost");
    check((await card.getByTestId("budget-blocked").textContent()).includes("anthropic:claude-sonnet-5-5"), "editor: the blocked request names its model");
    const input = card.getByTestId("budget-limit-input");
    // The suggestion is written with the language's decimal mark (NSL-14); German writes "0,03".
    check((await input.inputValue()) === "0,03", "editor: the suggested limit is prefilled with the decimal comma");
    check((await card.getByTestId("budget-difference").textContent()).includes("+"), "editor: the difference to the current limit is shown");
    const pendingCount = (await api("/budget-requests?status=pending")).length;
    await until(async () => Number((await page.locator(".nav-item__badge").first().textContent())?.trim()) >= pendingCount, "navigation badge counts the decision");
    check(true, "editor: the navigation badge counts the budget decision");
    await shot(page, "budget-01-editor-card-de");

    await input.fill("0");
    check((await card.getByRole("alert").textContent()).includes("Betrag"), "validation: 0 is refused as an invalid amount");
    check((await input.getAttribute("aria-invalid")) === "true", "validation: the input is marked invalid");
    await input.fill("0.00005");
    check((await card.getByRole("alert").textContent()).includes("höher sein"), "validation: a value below the current limit is refused");
    await input.fill("abc");
    await card.getByTestId("budget-raise").click();
    check((await card.getByRole("alert").isVisible()), "validation: nothing is sent while the value is invalid");
    await shot(page, "budget-02-validation-de");

    const first = await card.getAttribute("data-request");
    await input.fill("0,03");
    await card.getByTestId("budget-raise").click();
    // The suggestion covers exactly the first request: the second agent pauses with a new decision.
    const second = await until(async () => {
      const id = await page.getByTestId("run-panel").getByTestId("budget-decision").getAttribute("data-request", { timeout: 1000 }).catch(() => null);
      return id && id !== first ? id : null;
    }, "a second decision", 30000);
    check(Boolean(second), "editor: a raise continues the run and the next request asks again");
    const again = page.getByTestId("run-panel").getByTestId("budget-decision");
    check((await again.getByTestId("budget-history").textContent()).includes("→"), "editor: the card lists the earlier raise");
    await again.getByTestId("budget-limit-input").fill("1");
    await again.getByTestId("budget-raise").click();
    const runs = await api(`/runs?workflow_id=${workflow.id}`);
    const editorRun = runs[0].id;
    await until(async () => (await api(`/runs/${editorRun}`)).status === "succeeded", "the run succeeds after the second raise", 30000);
    check(true, "editor: the run succeeds after the second raise");
    await page.goto(`${base}/executions/${editorRun}`);
    await page.getByTestId("budget-history").waitFor();
    check((await page.getByTestId("budget-history").locator("li").count()) === 2, "details: two raises in the history");
    check(await page.getByTestId("budget-raised-from").isVisible(), "details: the cost shows raised from the starting limit");
    check((await page.getByTestId("run-summary-budget").textContent()).includes("2-mal erhöht"), "details: the summary counts the raises");
    await shot(page, "budget-03-details-history-de");
    await context.close();
  }

  // ---- 2. run details: a reload finds the decision again; end with the confirmation, keyboard only ----
  {
    const id = await pausedRun();
    const { context, page } = await open();
    await page.goto(`${base}/executions/${id}`);
    await page.getByTestId("budget-decision").waitFor();
    await page.reload();
    await page.getByTestId("budget-decision").waitFor();
    check(true, "reload: the decision is found again after reloading the page");
    check(await page.locator(".stats [data-status=awaiting_budget]").isVisible(), "details: the status shows Waiting for budget decision");
    await page.getByTestId("budget-end").focus();
    await page.keyboard.press("Enter");
    check(await page.getByTestId("budget-end-confirm").evaluate((element) => element === document.activeElement), "keyboard: the confirmation takes the focus");
    await page.keyboard.press("Escape");
    check(await page.getByTestId("budget-end").evaluate((element) => element === document.activeElement), "keyboard: Escape returns the focus to End run");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await until(async () => (await api(`/runs/${id}`)).error_code === "run.budget_ended", "the run is ended");
    check(true, "end: the run ends with run.budget_ended");
    await page.getByText("bei einer Budget-Entscheidung beendet").first().waitFor({ timeout: 20000 });
    check(true, "end: the run details explain the end in German");
    await shot(page, "budget-04-ended-de");
    await context.close();
  }

  // ---- 3. keyboard only: Tab into the input, type the new total, Enter raises ----
  {
    const id = await pausedRun();
    const { context, page } = await open({ language: "en" });
    await page.goto(`${base}/executions/${id}`);
    const card = page.getByTestId("budget-decision");
    await card.waitFor();
    check((await card.getByRole("heading").count()) >= 0 && (await card.textContent()).includes(TEXTS.en.card.title), "en: the card title is English");
    check((await card.getByTestId("budget-scope-note").textContent()).includes(TEXTS.en.card.thisRunOnly), "en: the card says it applies to this run only");
    await page.getByTestId("budget-limit-input").focus();
    let tabs = 0;
    // Shift+Tab out of the field and Tab back in: the field is reachable by keyboard.
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    tabs += 1;
    check(await page.getByTestId("budget-limit-input").evaluate((element) => element === document.activeElement), "keyboard: Tab reaches the limit field");
    await page.keyboard.press("Control+A");
    await page.keyboard.type("1");
    await page.keyboard.press("Enter");
    await until(async () => (await api(`/runs/${id}`)).status === "succeeded", "keyboard raise lets the run finish", 30000);
    check(tabs === 1, "keyboard: Enter in the field raises the limit and the run finishes");
    await shot(page, "budget-05-keyboard-en");
    await context.close();
  }

  // ---- 4. Approvals page, executions list and a decision made elsewhere (409) ----
  {
    const id = await pausedRun();
    const { context, page } = await open();
    await page.goto(`${base}/executions`);
    await page.locator(`[data-status=awaiting_budget]`).first().waitFor();
    check(true, "list: the executions list shows Waiting for budget decision");
    await page.goto(`${base}/approvals`);
    const section = page.getByTestId("approvals-budget");
    await section.waitFor();
    check((await section.getByRole("heading").first().textContent()).includes("Budget-Entscheidungen"), "approvals: the page has a Budget decisions section");
    const mine = section.getByTestId("budget-decision").filter({ has: page.locator(`a[href="/executions/${id}"]`) });
    await mine.waitFor({ timeout: 15000 });
    check((await mine.count()) === 1, "approvals: the card links to its run");
    await shot(page, "budget-06-approvals-de");
    // On the run's own page: someone decides over the API while the card is open, then the person clicks.
    await page.goto(`${base}/executions/${id}`);
    await page.getByTestId("budget-decision").waitFor();
    const budget = await api(`/runs/${id}/budget`);
    await api(`/runs/${id}/budget/decisions`, "POST", { request_id: budget.pending.id, action: "raise", limit_usd: "1.00", idempotency_key: "e2e-elsewhere" });
    await page.getByTestId("budget-raise").click({ timeout: 2000 }).catch(() => undefined);
    const outcome = await until(async () => {
      if (await page.getByTestId("budget-conflict").isVisible().catch(() => false)) return "conflict";
      if (await page.getByTestId("budget-decided").isVisible().catch(() => false)) return "decided";
      if (await page.getByTestId("budget-decided-elsewhere").isVisible().catch(() => false)) return "elsewhere";
      return null;
    }, "the card reacts to the decision made elsewhere");
    const said = await page.locator("[data-testid=budget-conflict], [data-testid=budget-decided], [data-testid=budget-decided-elsewhere]").first().textContent();
    check(/bereits entschieden|erhöht/.test(said), `elsewhere: the card says the decision was already made (${outcome}: ${said.trim()})`);
    await shot(page, "budget-07-decided-elsewhere-de");
    await until(async () => (await api(`/runs/${id}`)).status === "succeeded", "the run decided elsewhere succeeds", 30000);
    await context.close();
  }

  // ---- 5. the workspace maximum: settings, the client check and the server's refusal ----
  {
    const { context, page } = await open();
    await page.goto(`${base}/settings`);
    const max = page.getByTestId("settings-max-run-budget");
    await max.fill("0,50");
    await page.getByTestId("settings-budget-decision-hours").fill("48");
    await page.locator("section", { has: max }).getByRole("button", { name: "Speichern" }).click();
    await until(async () => (await api("/settings")).budget_decision_hours === 48, "settings saved");
    check(Number((await api("/settings")).max_run_budget_usd) === 0.5, "settings: the maximum run budget is saved as 0.50");
    await page.reload();
    check((await page.getByTestId("settings-max-run-budget").inputValue()) === "0,50", "settings: the saved maximum is shown after a reload, with the decimal comma");
    await shot(page, "budget-08-settings-de");
    const id = await pausedRun();
    await page.goto(`${base}/executions/${id}`);
    const input = page.getByTestId("budget-limit-input");
    await input.fill("0.60");
    check((await page.getByTestId("budget-limit-error").textContent()).includes("höchstens"), "maximum: the card refuses a value above the maximum");
    const budget = await api(`/runs/${id}/budget`);
    const refused = await raw(`/runs/${id}/budget/decisions`, "POST", { request_id: budget.pending.id, action: "raise", limit_usd: "0.60" });
    check(refused.status() === 403 && (await refused.json()).code === "budget.over_policy", "maximum: the server refuses it with budget.over_policy");
    await input.fill("0.50");
    await page.getByTestId("budget-raise").click();
    await until(async () => (await api(`/runs/${id}`)).status !== "paused" || (await api(`/runs/${id}`)).budget?.raises?.length, "raised to the maximum");
    check(true, "maximum: a raise up to the maximum is accepted");
    // Clean up: no cap again (an empty field clears it).
    await page.goto(`${base}/settings`);
    await page.getByTestId("settings-max-run-budget").fill("");
    await page.getByTestId("settings-budget-decision-hours").fill("24");
    await page.locator("section", { has: page.getByTestId("settings-max-run-budget") }).getByRole("button", { name: "Speichern" }).click();
    await until(async () => (await api("/settings")).max_run_budget_usd === null, "maximum cleared");
    check(true, "settings: an empty maximum clears the cap");
    await context.close();
    const left = await api(`/runs/${id}`);
    if (left.budget?.pending_request_id) await api(`/runs/${id}/cancel`, "POST");
  }

  // ---- 6. a phone width in dark mode, and the other languages ----
  for (const [language, dark, width] of [
    ["de", true, 390],
    ["en", true, 390],
    ["es", false, 1280],
    ["fr", false, 1280],
    ["it", true, 1280],
    ["pt-BR", false, 390],
  ]) {
    const id = await pausedRun();
    const { context, page } = await open({ language, dark, width, height: 844 });
    await page.goto(`${base}/executions/${id}`);
    const card = page.getByTestId("budget-decision");
    await card.waitFor();
    const text = await card.textContent();
    check(text.includes(TEXTS[language].card.title) && text.includes(TEXTS[language].card.raise), `${language}: the card's title and button are translated`);
    check((await page.locator(".stats [data-status=awaiting_budget]").textContent()).includes(STATUS[language].awaiting_budget.label), `${language}: the status badge is translated`);
    if (width === 390) {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(overflow <= 1, `${language}: no horizontal scrolling at 390 px (${overflow})`);
      const box = await card.boundingBox();
      check(box && box.width <= 390, `${language}: the card fits the phone width`);
    }
    if (dark) {
      const background = await page.evaluate(() => getComputedStyle(document.querySelector("[data-testid=budget-decision]")).backgroundColor);
      check(!/rgb\(255, 255, 255\)/.test(background), `${language}: the card is dark in dark mode (${background})`);
    } else {
      const theme = await page.evaluate(() => document.documentElement.dataset.theme);
      check(theme === "light", `${language}: the light theme is shown`);
    }
    await card.scrollIntoViewIfNeeded();
    await shot(page, `budget-09-${language}-${width}${dark ? "-dark" : ""}`);
    await api(`/runs/${id}/cancel`, "POST");
    await context.close();
  }

  check(errors.length === 0, `no console errors (${errors.join(" | ")})`);
  console.log(`\n${passed} checks passed`);
} finally {
  await apiContext.close();
  await browser.close();
}
