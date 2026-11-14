// Recovery mode (TABRION MIG-NOD-9), against tests/e2e_recovery_server.py: a database other users may change, behind a
// stand-in for the desktop shell that restarts the backend on its exit codes.
// Usage: node e2e/recovery.mjs [baseUrl] [screenshotDir]
//
// Covers, in the real studio against the real API:
//   1. the start with a group-writable database shows only the repair dialog (every other API route is closed): the
//      file with its old and new mode, the manual chmod command; the repair button waits for the confirmation;
//   2. cancel changes nothing and keeps Nodestro locked; the dry run still shows the same file;
//   3. the confirmed repair restarts into the regular studio;
//   4. the diagnosis reports the (now world-readable) database, its button asks first, restarts into recovery mode,
//      where the same dialog repairs it; the diagnosis is clean afterwards;
//   5. German at phone width and dark (screenshots), with an accessibility check when axe-core is installed.

import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];
const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:9620";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

let axe = null;
try {
  const path = require.resolve("axe-core/axe.min.js");
  if (existsSync(path)) axe = readFileSync(path, "utf8");
} catch {
  // not installed
}

let failures = 0;
function check(condition, message) {
  if (condition) console.log(`ok   ${message}`);
  else {
    failures += 1;
    console.log(`FAIL ${message}`);
  }
}

const browser = await browserType.launch();
const errors = [];

async function newPage({ theme = "light", language = "en", width = 1280, height = 900 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, locale: "en-US" });
  await ctx.addInitScript(
    ([t, l]) => {
      try {
        localStorage.setItem("nodestro-theme", t);
        localStorage.setItem("nodestro-language", l);
      } catch {
        // no storage
      }
    },
    [theme, language],
  );
  const page = await ctx.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  return page;
}

async function shot(page, name) {
  if (shots) await page.screenshot({ path: join(shots, `recovery-${name}.png`) });
}

async function api(page, method, path, body) {
  return page.evaluate(
    async ([m, p, b]) => {
      const response = await fetch(p, {
        method: m,
        headers: b === undefined ? {} : { "Content-Type": "application/json" },
        body: b === undefined ? undefined : JSON.stringify(b),
      });
      let data = null;
      try {
        data = await response.json();
      } catch {
        // not JSON
      }
      return { status: response.status, data };
    },
    [method, path, body],
  );
}

async function accessible(page, label) {
  if (!axe) {
    console.log(`skip axe on ${label}: axe-core not found (run npm install in frontend/)`);
    return;
  }
  await page.evaluate(axe);
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      resultTypes: ["violations"],
    });
    return result.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id}×${v.nodes.length} (${v.nodes[0]?.target.join(" ")})`);
  });
  check(violations.length === 0, `${label}: axe finds no serious or critical violation${violations.length ? `: ${violations.join(", ")}` : ""}`);
}

// 1. Recovery mode at start: only the dialog.
const page = await newPage();
await page.goto(base);
await page.getByTestId("recovery").waitFor();
check(await page.getByRole("heading", { name: "Protect your Nodestro data" }).isVisible(), "the repair dialog opens");
const files = page.getByTestId("recovery-files");
const row = await files.locator('[data-file="nodestro.db"]').textContent();
check(row.includes("rw-rw-r--") && row.includes("(0664)") && row.includes("rw-------"), "old and new mode are shown");
check((await page.getByTestId("recovery-manual").textContent()).includes("chmod 600 "), "the manual command is shown");
check(await page.getByTestId("recovery-repair").isDisabled(), "the repair waits for the confirmation");
for (const path of ["/api/workflows", "/api/settings", "/api/diagnostics", "/api/openapi.json"]) {
  check((await api(page, "GET", path)).status === 404, `${path} is closed in recovery mode`);
}
await accessible(page, "repair dialog");
await shot(page, "1-dialog-light");

// 2. Cancel changes nothing.
await page.getByRole("button", { name: "Cancel" }).click();
await page.getByTestId("recovery-cancelled").waitFor();
const plan = await api(page, "GET", "/api/recovery/database-permissions");
check(plan.data.files[0].status === "not_confirmed" && plan.data.files[0].old_mode === "0664", "cancel changed nothing");
const unconfirmed = await api(page, "POST", "/api/recovery/database-permissions/repair", { plan: plan.data.plan });
check(unconfirmed.status === 400 && unconfirmed.data.code === "recovery.not_confirmed", "a repair without confirm is refused");
await shot(page, "2-cancelled");

// German, dark, phone width.
const german = await newPage({ language: "de", theme: "dark", width: 390, height: 844 });
await german.goto(base);
await german.getByRole("heading", { name: "Schütze deine Nodestro-Daten" }).waitFor();
check(
  await german.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  "German at phone width: no horizontal scrolling",
);
await accessible(german, "German repair dialog (dark)");
await shot(german, "3-dialog-de-dark-phone");
await german.context().close();

// 3. The confirmed repair restarts into the regular studio.
await page.getByRole("button", { name: "Show the repair again" }).click();
await page.getByTestId("recovery-confirm").check();
await page.getByTestId("recovery-repair").click();
await page.getByTestId("recovery-done").waitFor();
await shot(page, "4-repaired");
await page.getByTestId("recovery").waitFor({ state: "detached", timeout: 60_000 });
check((await api(page, "GET", "/api/workflows")).status === 200, "after the repair the regular studio runs");

// 4. The diagnosis' way into the repair (the stand-in shell made the database world-readable again).
await page.goto(base + "/settings#settings-diagnostics");
await page.getByRole("button", { name: "Run diagnosis" }).click();
const finding = page.locator('[data-check="database_permissions"][data-status="warning"]');
await finding.waitFor();
check((await finding.textContent()).includes("(0644)"), "the diagnosis names the readable file and its mode");
await shot(page, "5-diagnosis");
await finding.getByTestId("database-permissions-repair").click();
await page.getByText("Restart in repair mode?").waitFor();
await shot(page, "6-restart-question");
await page.getByTestId("database-permissions-restart").click();
await page.getByTestId("recovery").waitFor({ timeout: 60_000 });
await page.getByText("You asked to restrict the database files to your user.").waitFor();
const requested = await page.getByTestId("recovery-files").locator('[data-file="nodestro.db"]').textContent();
check(requested.includes("rw-r--r--") && requested.includes("rw-------"), "recovery mode shows 0644 -> 0600");
await page.getByTestId("recovery-confirm").check();
await page.getByTestId("recovery-repair").click();
await page.getByTestId("recovery").waitFor({ state: "detached", timeout: 60_000 });
await page.goto(base + "/settings#settings-diagnostics");
await page.getByRole("button", { name: "Run diagnosis" }).click();
await page.locator('[data-check="database_permissions"][data-status="ok"]').waitFor();
check(true, "the diagnosis is clean after the repair");

check(errors.length === 0, `no page errors ${errors.join(" | ")}`);
await browser.close();
if (failures) {
  console.log(`${failures} check(s) failed`);
  process.exit(1);
}
