// Recovery mode (TABRION MIG-NOD-9), against tests/e2e_recovery_server.py: a database other users may change, behind a
// stand-in for the desktop shell that restarts the backend on its exit codes.
// Usage: NODESTRO_E2E_SECRET=<launch secret> NODESTRO_E2E_DATA=<data dir> node e2e/recovery.mjs [baseUrl] [screenshotDir]
//
// Covers, in the real studio against the real API, in the desktop app's launch session (every restart ends it, and
// the page opens a new one as the desktop window does):
//   1. the start with a group-writable database shows only the repair page (every other API route is closed): the
//      file with its old and new mode, the manual chmod command; the repair button waits for the confirmation;
//   2. cancel changes nothing and keeps Nodestro locked; the dry run still shows the same file;
//   3. the confirmed repair restarts into the regular studio;
//   4. the diagnosis reports the (now world-readable) database, its button asks first and restarts into recovery
//      mode (0644 -> 0600 shown); cancel there returns to the studio unchanged;
//   5. the diagnosis' way again, the user repairs the files by hand meanwhile: the page says they are private already
//      and only restarts; the diagnosis is clean afterwards;
//   6. German at phone width and dark (screenshots), with an accessibility check when axe-core is installed.

import { createRequire } from "node:module";
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];
const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:9620";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
const secret = process.env.NODESTRO_E2E_SECRET;
const dataDir = process.env.NODESTRO_E2E_DATA;
if (!secret || !dataDir) throw new Error("NODESTRO_E2E_SECRET and NODESTRO_E2E_DATA are needed (scripts/e2e.sh recovery)");
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

/** A new window in a new launch session, as the desktop app opens one, on ``path``. */
async function newPage({ theme = "light", language = "en", width = 1280, height = 900, path = "/" } = {}) {
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
  await page.goto(`${base}/api/launch?token=${encodeURIComponent(secret)}`);
  await page.goto(base + path);
  return page;
}

/** Another window in the same launch session (the launch link works once per backend process). */
async function samePage(from, { theme, language, width, height }) {
  const page = await from.context().newPage();
  await page.setViewportSize({ width, height });
  await page.addInitScript(
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
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  return page;
}

/** Wait until the backend answers again in ``mode`` after a restart; then the old window is closed and a new one opened
 * (the old launch session ended with the old process). */
async function restarted(old, mode, options = {}) {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    try {
      const response = await old.request.get(`${base}/api/health`);
      if (response.ok() && ((await response.json()).mode === "recovery") === (mode === "recovery")) break;
    } catch {
      // stopped for the moment
    }
    await old.waitForTimeout(250);
  }
  await old.context().close();
  return newPage(options);
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

// 1. Recovery mode at start: only the repair page.
let page = await newPage();
await page.getByTestId("recovery").waitFor();
check(await page.getByRole("heading", { name: "Protect your Nodestro data" }).isVisible(), "the repair page opens");
check((await page.getByRole("dialog").count()) === 0, "the page is no modal dialog");
check(
  await page.evaluate(() => document.activeElement?.id === "recovery-title"),
  "the heading takes the focus",
);
const files = page.getByTestId("recovery-files");
const row = await files.locator('[data-file="nodestro.db"]').textContent();
check(row.includes("rw-rw-r--") && row.includes("(0664)") && row.includes("rw-------"), "old and new mode are shown");
check((await page.getByTestId("recovery-manual").textContent()).includes("chmod 600 "), "the manual command is shown");
check(await page.getByTestId("recovery-repair").isDisabled(), "the repair waits for the confirmation");
for (const path of ["/api/workflows", "/api/settings", "/api/diagnostics", "/api/openapi.json"]) {
  check((await api(page, "GET", path)).status === 404, `${path} is closed in recovery mode`);
}
await accessible(page, "repair page");
await shot(page, "1-dialog-light");

// 2. Cancel changes nothing and keeps Nodestro locked.
await page.getByTestId("recovery-cancel").click();
await page.getByTestId("recovery-cancelled").waitFor();
check(
  (await page.getByTestId("recovery-cancelled").textContent()).includes("close and restart Nodestro"),
  "cancel names the way back after a manual repair",
);
const plan = await api(page, "GET", "/api/recovery/database-permissions");
check(plan.data.files[0].status === "not_confirmed" && plan.data.files[0].old_mode === "0664", "cancel changed nothing");
const unconfirmed = await api(page, "POST", "/api/recovery/database-permissions/repair", { plan: plan.data.plan });
check(unconfirmed.status === 400 && unconfirmed.data.code === "recovery.not_confirmed", "a repair without confirm is refused");
const back = await api(page, "POST", "/api/recovery/database-permissions/repair", { action: "return" });
check(back.status === 409 && back.data.code === "recovery.locked", "after a refused start there is no way back unrepaired");
await shot(page, "2-cancelled");

// German, dark, phone width.
const german = await samePage(page, { language: "de", theme: "dark", width: 390, height: 844 });
await german.getByRole("heading", { name: "Schütze deine Nodestro-Daten" }).waitFor();
check(
  await german.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  "German at phone width: no horizontal scrolling",
);
await accessible(german, "German repair page (dark)");
await shot(german, "3-dialog-de-dark-phone");
await german.close();

// 3. The confirmed repair restarts into the regular studio.
await page.getByRole("button", { name: "Show the repair again" }).click();
await page.getByTestId("recovery-confirm").check();
await page.getByTestId("recovery-repair").click();
await page.getByTestId("recovery-done").waitFor();
await shot(page, "4-repaired");
page = await restarted(page, "normal");
check((await api(page, "GET", "/api/workflows")).status === 200, "after the repair the regular studio runs");

/** The diagnosis' button into recovery mode (the database is world-readable). */
async function intoRecoveryFromDiagnosis(current, name) {
  await current.goto(base + "/settings#settings-diagnostics");
  await current.getByRole("button", { name: "Run diagnosis" }).click();
  const finding = current.locator('[data-check="database_permissions"][data-status="warning"]');
  await finding.waitFor();
  check((await finding.textContent()).includes("(0644)"), `${name}: the diagnosis names the readable file and its mode`);
  await finding.getByTestId("database-permissions-repair").click();
  await current.getByText("Restart in repair mode?").waitFor();
  await shot(current, `${name}-restart-question`);
  await current.getByTestId("database-permissions-restart").click();
  await current.getByText("Nodestro restarts in repair mode…").waitFor();
  const next = await restarted(current, "recovery");
  await next.getByTestId("recovery").waitFor({ timeout: 60_000 });
  await next.getByText("You asked to restrict the database files to your user.").waitFor();
  return next;
}

// 4. The diagnosis' way into the repair (the stand-in shell made the database world-readable again); cancel returns.
page = await intoRecoveryFromDiagnosis(page, "5");
const requested = await page.getByTestId("recovery-files").locator('[data-file="nodestro.db"]').textContent();
check(requested.includes("rw-r--r--") && requested.includes("rw-------"), "recovery mode shows 0644 -> 0600");
await page.getByTestId("recovery-cancel").click();
await page.getByText("Nothing was changed. Nodestro returns to the studio.").waitFor();
await shot(page, "6-returning");
page = await restarted(page, "normal");
check((await api(page, "GET", "/api/workflows")).status === 200, "cancel in the diagnosis' repair returns to the studio");

// 5. Again, and the user repairs the files by hand meanwhile: nothing left to change, the page only restarts.
page = await intoRecoveryFromDiagnosis(page, "7");
for (const name of readdirSync(dataDir)) {
  if (name.startsWith("nodestro.db")) chmodSync(join(dataDir, name), 0o600);
}
await page.reload();
await page.getByTestId("recovery-private").waitFor();
await accessible(page, "already private");
await shot(page, "8-already-private");
await page.getByTestId("recovery-continue").click();
await page.getByText("Already private: nothing had to be changed. Nodestro restarts.").waitFor();
page = await restarted(page, "normal", { path: "/settings#settings-diagnostics" });
await page.getByRole("button", { name: "Run diagnosis" }).click();
await page.locator('[data-check="database_permissions"][data-status="ok"]').waitFor();
check(true, "the diagnosis is clean afterwards");

check(errors.length === 0, `no page errors ${errors.join(" | ")}`);
await browser.close();
if (failures) {
  console.log(`${failures} check(s) failed`);
  process.exit(1);
}
