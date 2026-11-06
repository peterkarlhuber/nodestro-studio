// Progress of the local model server setup and of model downloads, against a running Nodestro.
// Usage: node e2e/localModels.mjs [baseUrl] [screenshotDir]
//
// The server must run in the managed mode without an installed runtime (a plain `nodestro --data-dir $(mktemp -d)`),
// and it must be allowed to download. The check then:
//   1. starts the real setup, waits for the measured download (a bar with aria-valuenow, bytes, a rate),
//      reloads the page and finds the same job again, then cancels it and expects "canceled" with a resume offer;
//   2. replays recorded job states through page.route (a step without measurable progress, a failure with a
//      remedy, two model downloads at once) and checks that only the measured bar has a value, that the step
//      change is announced in a polite live region and that technical details stay closed.
// It takes screenshots in the light and the dark theme, in English, German and French and at phone width.
// Set LOCAL_E2E_REAL=0 to skip part 1 (no download).

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];
const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8000";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
const real = process.env.LOCAL_E2E_REAL !== "0";
if (shots) mkdirSync(shots, { recursive: true });

let failures = 0;
function check(condition, message) {
  if (condition) {
    console.log(`ok   ${message}`);
  } else {
    failures += 1;
    console.log(`FAIL ${message}`);
  }
}

async function context(browser, { theme = "light", language = "en", width = 1280, height = 900 } = {}) {
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
  return ctx;
}

async function shot(page, name, target = "settings-local-models") {
  if (!shots) return;
  // The viewport, scrolled so that the part in question starts near the top (the whole panel is very tall).
  // The app shell scrolls its main area, not the window.
  await page.getByTestId(target).evaluate((node) => {
    node.scrollIntoView({ block: "start" });
    window.scrollTo(0, 0);
  });
  await page.screenshot({ path: join(shots, `${name}.png`), animations: "disabled" });
  console.log(`shot ${name}.png`);
}

async function open(page) {
  await page.goto(`${base}/settings#settings-local-models`);
  await page.getByTestId("settings-local-models").waitFor();
  await page.getByTestId("local-status").waitFor();
}

// ---- recorded job states ----

const SETUP = ["check", "prerequisites", "download", "verify", "install", "configure", "start", "reachable", "hardware", "ready"];
const PULL = ["check", "manifest", "download", "verify", "finalize"];
const MB = 1024 * 1024;

function steps(ids, running, patch = {}) {
  const at = ids.indexOf(running);
  return ids.map((id, index) => ({ id, state: index < at ? "done" : index === at ? "running" : "pending", note: null, detail: null, ...patch[id] }));
}

function job(patch) {
  const now = new Date().toISOString();
  return {
    id: "e2e-setup",
    kind: "setup",
    target: "server",
    state: "running",
    completed: 0,
    total: null,
    message: "",
    error_code: null,
    error: null,
    started_at: now,
    finished_at: null,
    updated_at: now,
    phase: null,
    progress_step: null,
    total_final: true,
    rate: null,
    eta_seconds: null,
    eta_scope: null,
    stalled_seconds: null,
    resumed_bytes: 0,
    retryable: false,
    steps: [],
    layers: [],
    log: [],
    ...patch,
  };
}

const STARTING = job({
  phase: "start",
  steps: steps(SETUP, "start", { check: { note: "missing" }, configure: { detail: "OLLAMA_CONTEXT_LENGTH=32768" } }),
  log: ["08:00:00 check: Ollama is not installed yet", "08:01:20 install: done", "08:01:21 start: started"],
});

const FAILED = job({
  state: "failed",
  error_code: "local.network",
  error: "https://github.com/ollama/ollama/releases/download/v0.40.14/ollama-linux-amd64.tgz cannot be reached: [Errno 111] Connection refused",
  retryable: true,
  finished_at: new Date().toISOString(),
  steps: steps(SETUP, "download", { check: { note: "missing" }, download: { state: "failed" } }),
  completed: 282 * MB,
  log: ["08:00:00 check: Ollama is not installed yet", "08:00:01 download: started", "08:00:16 download: network error"],
});

const PULLS = [
  job({
    id: "e2e-pull-1",
    kind: "pull",
    target: "qwen3.5:4b",
    phase: "download",
    progress_step: "download",
    steps: steps(PULL, "download"),
    completed: 1_900 * MB,
    total: 2_600 * MB,
    total_final: false,
    rate: 31 * MB,
    eta_seconds: 22,
    eta_scope: "file",
    layers: [
      { digest: "sha256:" + "b".repeat(64), total: 1_200 * MB, completed: 1_200 * MB },
      { digest: "sha256:" + "a".repeat(64), total: 1_400 * MB, completed: 700 * MB },
    ],
  }),
  job({
    id: "e2e-pull-2",
    kind: "pull",
    target: "qwen3-embedding:0.6b",
    state: "cancelled",
    error_code: "local.cancelled",
    retryable: true,
    finished_at: new Date().toISOString(),
    steps: steps(PULL, "download", { download: { state: "pending" } }),
  }),
];

async function replay(page, jobs) {
  await page.unroute("**/api/local-models/jobs");
  await page.route("**/api/local-models/jobs", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(jobs()) }),
  );
}

async function bar(page, kind) {
  const node = page.getByTestId(`local-job-bar-${kind}`);
  return { now: await node.getAttribute("aria-valuenow"), text: await node.getAttribute("aria-valuetext"), role: await node.getAttribute("role") };
}

async function recorded(browser) {
  // A step without measurable progress: no value, an explaining text, nothing for the user to do.
  for (const variant of [
    { theme: "dark", language: "de", width: 390, name: "setup-indeterminate-de-dark-narrow" },
    { theme: "light", language: "en", width: 1280, name: "setup-indeterminate-en-light" },
  ]) {
    const ctx = await context(browser, variant);
    const page = await ctx.newPage();
    let current = [STARTING];
    await replay(page, () => current);
    await open(page);
    await page.getByTestId("local-setup-progress").waitFor();
    const startBar = await bar(page, "setup");
    check(startBar.role === "progressbar" && startBar.now === null, `${variant.name}: the start step has no aria-valuenow`);
    const status = page.getByTestId("local-setup-progress").getByRole("status");
    check((await status.getAttribute("aria-live")) === "polite", `${variant.name}: the step is announced politely`);
    const announced = await status.textContent();
    check(/7/.test(announced ?? ""), `${variant.name}: the live region names step 7 (${announced})`);
    check(!(await page.getByTestId("local-job-details").evaluate((node) => node.open)), `${variant.name}: details are closed`);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(scrollWidth <= 0, `${variant.name}: no horizontal scrolling (${scrollWidth}px)`);
    await shot(page, variant.name);
    // The next step: the live region follows.
    current = [job({ ...STARTING, phase: "reachable", steps: steps(SETUP, "reachable") })];
    await page.waitForFunction(
      (old) => document.querySelector('[data-testid="local-setup-progress"] [role="status"]')?.textContent !== old,
      announced,
      { timeout: 10_000 },
    );
    check(/8/.test((await status.textContent()) ?? ""), `${variant.name}: the live region moves to step 8`);
    await ctx.close();
  }

  // A failure: the alert names the problem and what to do; retry is offered, the details open on request.
  for (const variant of [
    { theme: "light", language: "fr", width: 1280, name: "setup-error-fr-light" },
    { theme: "dark", language: "en", width: 390, name: "setup-error-en-dark-narrow" },
  ]) {
    const ctx = await context(browser, variant);
    const page = await ctx.newPage();
    await replay(page, () => [FAILED]);
    await open(page);
    const problem = page.getByTestId("local-job-problem");
    await problem.waitFor();
    check((await problem.getAttribute("role")) === "alert", `${variant.name}: the failure is an alert`);
    const retry = page.getByTestId("local-setup-progress").getByRole("button").filter({ hasText: /./ });
    check((await retry.count()) >= 1, `${variant.name}: a retry button is offered`);
    await shot(page, variant.name);
    await page.getByTestId("local-job-details").locator("summary").click();
    check(await page.getByTestId("local-job-details").evaluate((node) => node.open), `${variant.name}: details open on request`);
    if (variant.width > 600) await shot(page, `${variant.name}-details`);
    await ctx.close();
  }

  // Two downloads at once: each has its own card; the running one measures the current file.
  for (const variant of [
    { theme: "dark", language: "en", width: 1280, name: "pulls-determinate-en-dark" },
    { theme: "light", language: "de", width: 390, name: "pulls-determinate-de-light-narrow" },
  ]) {
    const ctx = await context(browser, variant);
    const page = await ctx.newPage();
    await replay(page, () => PULLS);
    await open(page);
    await page.getByTestId("local-jobs").waitFor();
    const cards = page.getByTestId("local-job-pull");
    check((await cards.count()) === 2, `${variant.name}: one card per model`);
    const first = cards.first().getByRole("progressbar");
    check((await first.getAttribute("aria-valuenow")) === "50", `${variant.name}: the current file is measured (50 %)`);
    check((await cards.nth(1).getAttribute("data-state")) === "cancelled", `${variant.name}: the second model is canceled`);
    check((await cards.nth(1).getByRole("progressbar").count()) === 0, `${variant.name}: a canceled download has no bar`);
    const card = cards.first();
    await card.scrollIntoViewIfNeeded();
    await shot(page, variant.name, "local-jobs");
    await ctx.close();
  }
}

// ---- a real setup ----

async function setupJobs(page) {
  const response = await page.request.get(`${base}/api/local-models/jobs`);
  return (await response.json()).filter((item) => item.kind === "setup");
}

async function realSetup(browser) {
  const overview = await (await fetch(`${base}/api/local-models`)).json();
  if (overview.status?.mode !== "managed" || overview.status?.runtime_installed || overview.status?.offline) {
    console.log(`skip real setup: mode ${overview.status?.mode}, installed ${overview.status?.runtime_installed}, offline ${overview.status?.offline}`);
    return;
  }
  const ctx = await context(browser, { theme: "light", language: "en" });
  const page = await ctx.newPage();
  await open(page);
  await page.getByTestId("local-setup-start").click();
  await page.getByTestId("local-setup-progress").waitFor({ timeout: 20_000 });
  // Wait until the download is measured and a rate is known (after about three seconds of data).
  await page.waitForFunction(
    () => {
      const node = document.querySelector('[data-testid="local-job-bar-setup"]');
      const facts = document.querySelector('[data-testid="local-job-facts"]')?.textContent ?? "";
      return node?.hasAttribute("aria-valuenow") && /\/s/.test(facts);
    },
    null,
    { timeout: 60_000 },
  );
  const measured = await bar(page, "setup");
  check(measured.now !== null && Number(measured.now) >= 0 && Number(measured.now) <= 100, `real: the download has a value (${measured.now} %)`);
  check(/download/i.test((await page.getByTestId("local-job-now").textContent()) ?? ""), "real: the running step is the download");
  const resumed = /Continued/.test((await page.getByTestId("local-setup-progress").textContent()) ?? "");
  console.log(`info real: ${resumed ? "the download continued a partial file" : "the download started from zero"}`);
  await shot(page, resumed ? "setup-download-resumed-real-en-light" : "setup-download-real-en-light");

  // A reload finds the same job again.
  const [before] = await setupJobs(page);
  await page.reload();
  await page.getByTestId("local-setup-progress").waitFor();
  const [after] = await setupJobs(page);
  check(before && after && before.id === after.id, "real: the reloaded page shows the same setup job");
  check((await page.getByTestId("local-setup-start").count()) === 0, "real: setup cannot be started twice while it runs");
  const twice = await page.request.post(`${base}/api/local-models/setup`, { data: { download: true } });
  const refusal = await twice.json();
  check(twice.status() === 400 && refusal.code === "local.job_running", `real: a second setup is refused (${twice.status()} ${refusal.code})`);

  const dark = await context(browser, { theme: "dark", language: "de", width: 390 });
  const phone = await dark.newPage();
  await open(phone);
  await phone.getByTestId("local-job-facts").waitFor();
  await shot(phone, "setup-download-real-de-dark-narrow");
  await dark.close();

  // Cancel: the partial download is kept and the setup offers to continue.
  await page.getByTestId("local-setup-progress").getByRole("button", { name: /^Cancel/ }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="local-job-setup"]')?.getAttribute("data-state") === "cancelled", null, {
    timeout: 20_000,
  });
  check(
    (await page.getByTestId("local-setup-progress").getByRole("button", { name: /^(Continue|Try again)/ }).count()) === 1,
    "real: a canceled setup offers to continue",
  );
  await shot(page, "setup-cancelled-real-en-light");
  await ctx.close();
}

const browser = await browserType.launch();
try {
  if (real) await realSetup(browser);
  await recorded(browser);
} finally {
  await browser.close();
}
console.log(failures ? `${failures} check(s) failed` : "all local model progress checks passed");
process.exit(failures ? 1 : 0);
