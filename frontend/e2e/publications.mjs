// Browser test of the Publications page: its place in the navigation, the list in two languages, the export
// history's download, search and filter, and the one quick link per entry that opens the workflow in the editor with
// the "API & Export" dialog open on that publication, also after a reload. Against tests/e2e_api_server.py, whose
// agents answer from a script (nothing paid).
// Usage: node e2e/publications.mjs [baseUrl] [screenshotDir]

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8050";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const browser = await browserType.launch();
const errors = [];

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`ok  ${message}`);
}

const FRESH_CONNECTION = { connection: "close" };

async function newPage({ locale = "de-DE", width = 1440, height = 900, scheme = "light" } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, locale, colorScheme: scheme });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return page;
}

async function api(page, path, method = "GET", data) {
  const response = await page.request.fetch(base + "/api" + path, { method, data, headers: FRESH_CONNECTION });
  if (!response.ok()) throw new Error(`${method} ${path}: ${response.status()} ${await response.text()}`);
  return response.status() === 204 ? null : response.json();
}

async function shot(page, name) {
  if (shots) await page.screenshot({ path: join(shots, `${name}.png`), fullPage: false });
}

const field = (name, label) => ({ name, label, type: "text", description: "", required: true, default: null, options: [] });
const flow = (prompt) => ({
  nodes: [
    { id: "start", type: "start", position: { x: 0, y: 0 }, start: { default_input: "", file_ids: [], fields: [field("kunde", "Kunde")] } },
    { id: "writer", type: "agent", label: "Text", position: { x: 280, y: 0 }, agent: { name: "Text", system_prompt: prompt } },
    { id: "out", type: "output", position: { x: 560, y: 0 } },
  ],
  edges: [
    { id: "start-writer", source: "start", target: "writer", source_handle: null },
    { id: "writer-out", source: "writer", target: "out", source_handle: null },
  ],
});

try {
  const page = await newPage();
  await api(page, "/settings", "PUT", { providers: { anthropic: { api_key: "e2e-placeholder-not-a-key" } } });

  // ---- empty state, navigation position -----------------------------------------------------
  await page.goto(`${base}/publications`);
  await page.getByText("Noch keine API veröffentlicht").waitFor();
  check(true, "Without publications the page says so");
  const group = page.locator(".nav-group").filter({ has: page.locator('a[href="/publications"]') });
  check((await group.locator(".nav-group__title").textContent()).trim() === "Automatisieren & testen", "Publications sits in the group Automate & test");
  const hrefs = await group.locator("a.nav-item").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  check(hrefs.indexOf("/publications") === hrefs.indexOf("/tests") - 1, `Publications comes directly before Test series (${hrefs.join(", ")})`);
  check((await page.locator('.sidebar a[href="/publications"]').textContent()).trim() === "Veröffentlichungen", "The navigation names it Veröffentlichungen");
  check(await page.locator('.sidebar a[href="/publications"]').evaluate((link) => link.classList.contains("active")), "The entry is marked as the current page");

  // ---- two published workflows, one export, one switched off ---------------------------------
  const offers = await api(page, "/workflows", "POST", { name: "Angebote schreiben", budget_usd: 1, ...flow("WRITER of offers.") });
  const invoices = await api(page, "/workflows", "POST", { name: "Rechnungen prüfen", budget_usd: 1, ...flow("WRITER of invoices.") });
  const offersPub = (await api(page, `/workflows/${offers.id}/api/publish`, "POST", { note: "v1" })).publication;
  const invoicesPub = (await api(page, `/workflows/${invoices.id}/api/publish`, "POST", { note: "v1" })).publication;
  await api(page, `/publications/${invoicesPub.id}/enabled`, "POST", { enabled: false });
  const record = await api(page, `/publications/${offersPub.id}/exports`, "POST", { options: {} });

  await page.goto(`${base}/publications`);
  await page.getByTestId("publications-table").waitFor();
  const rows = page.getByTestId("publication-row");
  check((await rows.count()) === 2, "Both publications are listed");
  const offersRow = rows.filter({ hasText: "Angebote schreiben" });
  const offersText = await offersRow.textContent();
  check(offersText.includes("/api/published/angebote-schreiben") && offersText.includes("Aktiv") && offersText.includes("v1"), "An entry shows address, status and active version");
  check((await rows.filter({ hasText: "Rechnungen prüfen" }).textContent()).includes("Ausgeschaltet"), "A switched-off API says so");
  await offersRow.locator("summary").click();
  const download = offersRow.getByTestId("publication-exports").getByRole("link");
  check((await download.getAttribute("href")) === `/api/exports/${record.id}/download`, "The export history links the download");
  const zip = await page.request.fetch(base + (await download.getAttribute("href")), { headers: FRESH_CONNECTION });
  check(zip.ok() && (await zip.body()).subarray(0, 2).toString() === "PK", "The download is the export's ZIP");
  check((await offersRow.getByTestId("publication-exports").textContent()).includes("Quellprojekt (FastAPI)"), "The export's type is named");
  await shot(page, "publications-de-light");

  // Search and filter.
  await page.getByTestId("publications-search").fill("rechnung");
  await page.waitForFunction(() => document.querySelectorAll("[data-testid=publication-row]").length === 1);
  check((await rows.first().textContent()).includes("Rechnungen prüfen"), "Searching narrows the list");
  await page.getByTestId("publications-search").fill("");
  await page.getByTestId("publications-status").selectOption("off");
  await page.waitForFunction(() => document.querySelectorAll("[data-testid=publication-row]").length === 1);
  check((await rows.first().textContent()).includes("Rechnungen prüfen"), "The status filter shows the switched-off API");
  await page.getByTestId("publications-status").selectOption("");
  await page.waitForFunction(() => document.querySelectorAll("[data-testid=publication-row]").length === 2);

  // ---- the quick link -----------------------------------------------------------------------
  const quick = offersRow.getByTestId("publication-open-api");
  check((await offersRow.locator("a[href]:not([download])").count()) === 1, "Each entry has exactly one link besides its downloads");
  check((await quick.getAttribute("href")) === `/workflows/${offers.id}?api=1`, "The quick link leads to the workflow's editor");
  await quick.click();
  const dialog = page.getByTestId("api-dialog");
  await dialog.waitFor();
  await page.waitForURL(new RegExp(`/workflows/${offers.id}\\?api=1$`));
  await dialog.getByTestId("api-url").waitFor();
  check((await dialog.getByTestId("api-url").textContent()).trim().endsWith("/api/published/angebote-schreiben"), "The editor opens with API & Export on this publication");
  check(await dialog.getByTestId("api-tab-overview").getAttribute("aria-selected") === "true", "The dialog starts on its overview");
  await shot(page, "publications-quicklink-dialog");

  await page.reload();
  await dialog.getByTestId("api-url").waitFor();
  check((await dialog.getByTestId("api-url").textContent()).trim().endsWith("/api/published/angebote-schreiben"), "After a reload the dialog opens again on the same publication");

  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  check(new URL(page.url()).search === "", "Closing the dialog removes the parameter from the address");
  await page.reload();
  await page.getByTestId("open-api").waitFor();
  check((await dialog.count()) === 0, "After closing, a reload keeps the editor without the dialog");

  // A fresh start of the app on the link itself (bookmark), for the other workflow.
  const direct = await newPage();
  await direct.goto(`${base}/workflows/${invoices.id}?api=1`);
  await direct.getByTestId("api-dialog").getByTestId("api-url").waitFor();
  check((await direct.getByTestId("api-dialog").getByTestId("api-url").textContent()).endsWith(`/api/published/${invoicesPub.slug}`), "The link opens the right publication on a fresh app start");
  await direct.context().close();

  // ---- English, dark mode, narrow width ------------------------------------------------------
  const english = await newPage({ locale: "en-US", scheme: "dark" });
  await english.goto(`${base}/publications`);
  await english.getByTestId("publications-table").waitFor();
  check((await english.locator("h1").textContent()).trim() === "Publications", "In English the page is called Publications");
  check((await english.getByTestId("publication-open-api").first().textContent()).trim() === "Open API & Export", "The quick link is translated");
  await shot(english, "publications-en-dark");
  await english.context().close();

  const germanDark = await newPage({ scheme: "dark" });
  await germanDark.goto(`${base}/publications`);
  await germanDark.getByTestId("publications-table").waitFor();
  await shot(germanDark, "publications-de-dark");
  await germanDark.context().close();

  const englishLight = await newPage({ locale: "en-US" });
  await englishLight.goto(`${base}/publications`);
  await englishLight.getByTestId("publications-table").waitFor();
  await shot(englishLight, "publications-en-light");
  await englishLight.context().close();

  const narrow = await newPage({ width: 390, height: 844 });
  await narrow.goto(`${base}/publications`);
  await narrow.getByTestId("publications-table").waitFor();
  const overflow = await narrow.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 1, `The narrow page does not scroll sideways (${overflow}px)`);
  await shot(narrow, "publications-de-narrow");
  await narrow.context().close();

  check(errors.length === 0, `No errors in the browser console${errors.length ? `: ${errors.join(" | ")}` : ""}`);
} finally {
  await browser.close();
}
