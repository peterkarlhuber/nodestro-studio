// Missing local models, against tests/e2e_missing_model_server.py (a fake managed Ollama, scripted answers).
// Usage: node e2e/missingModel.mjs [baseUrl] [screenshotDir]
//
// Covers, in the real studio against the real API:
//   1. the Workflow Architect needs a model that is not installed: the dialog explains it, downloads it once (a second
//      tab follows the same download), checks it and continues with the inputs kept; a double click generates once;
//   2. the assistant: cancel the download, continue it (the partial download is kept), continue automatically after
//      the opt-in, the message is sent once;
//   3. another ready model for this action only (the setting stays), in French at phone width;
//   4. a download that fails (network, then a full disk) and is retried;
//   5. a model server that does not answer (a real dead address);
//   6. a remote model server, missing permission and the operator's server (recorded answers through page.route);
//   7. an unattended scheduled run never downloads: it reports the problem, and "Fix" opens the same dialog;
//   8. a batch stops on the missing model (no download), and "Fix" on the batch page opens the same dialog;
//   9. a model outside the catalog whose registry entry shows that it cannot call tools: the assistant's dialog says
//      so before any download (a stand-in registry, RT-062), in English (light, axe) and German (dark, phone width).
// Screenshots: light and dark, English, German and French, phone width.

import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const axe = axeSource();
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];
const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:9610";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const MISSING = "ollama:qwen3.5:9b";
const NO_TOOLS = "ollama:e2e-notools:1b";

function axeSource() {
  const candidates = [];
  const fromEnv = process.env.AXE_CORE_PATH;
  if (fromEnv) candidates.push(existsSync(fromEnv) && statSync(fromEnv).isDirectory() ? join(fromEnv, "axe.min.js") : fromEnv);
  try {
    candidates.push(require.resolve("axe-core/axe.min.js"));
  } catch {
    // not installed
  }
  const found = candidates.find((path) => existsSync(path));
  return found ? readFileSync(found, "utf8") : null;
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

async function context({ theme = "light", language = "en", width = 1280, height = 900 } = {}) {
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

async function newPage(options) {
  const ctx = await context(options);
  const page = await ctx.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  return page;
}

async function shot(page, name) {
  if (!shots) return;
  await page.screenshot({ path: join(shots, `${name}.png`), animations: "disabled" });
  console.log(`shot ${name}.png`);
}

async function api(path, method = "GET", body) {
  const response = await fetch(base + path, {
    method,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}
const json = async (path, method, body) => (await api(path, method, body)).body;
const calls = () => json("/__e2e/calls");
const pullJobs = async () => (await json("/api/local-models/jobs")).filter((job) => job.kind === "pull" && job.target === "qwen3.5:9b");
const pullMode = (mode, seconds = 6) => api("/__e2e/pull", "POST", { mode, seconds });
const removeModel = () => api("/api/local-models/models/qwen3.5:9b", "DELETE");

async function waitFor(predicate, timeout = 30000, what = "condition") {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await predicate()) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`timed out waiting for ${what}`);
}

const LABELS = {
  en: { start: "Start new", create: /Create with AI/, describe: "Describe your goal", design: "Design with AI" },
  de: { start: "Neu beginnen", create: /Mit KI erstellen/, describe: "Beschreibe dein Vorhaben", design: "Mit KI entwerfen" },
};

async function openArchitect(page, description, language = "en") {
  const labels = LABELS[language];
  await page.goto(base);
  const choices = page.getByRole("group", { name: labels.start });
  await choices.locator(".start-choice").nth(2).waitFor();
  await choices.getByRole("button", { name: labels.create }).click();
  await page.getByLabel(labels.describe).fill(description);
  await page.getByRole("button", { name: labels.design }).click();
}

async function openAssistant(page) {
  await page.goto(base);
  await page.getByTestId("assistant-toggle").click();
  await page.getByTestId("assistant-input").waitFor();
}

const dialog = (page) => page.getByTestId("missing-model");

async function scan(page, label) {
  if (!axe) {
    console.log(`skip axe on ${label}: axe-core not found (set AXE_CORE_PATH or run npm install in frontend/)`);
    return;
  }
  await page.evaluate(axe);
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(
      { include: [["dialog[open]"]] },
      { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] },
    );
    return result.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id}×${v.nodes.length} (${v.nodes[0]?.target.join(" ")})`);
  });
  check(violations.length === 0, `${label}: axe finds no serious or critical violation${violations.length ? `: ${violations.join(", ")}` : ""}`);
}

try {
  // ---- 1. Workflow Architect: download, continue with the inputs kept, once ----------------------------------------
  await pullMode("ok", 8);
  const description = "Turn a topic into a blog article with SEO notes for the spring campaign.";
  const page = await newPage();
  await openArchitect(page, description);
  await dialog(page).waitFor();
  check((await dialog(page).getAttribute("data-cause")) === "model_missing", "The architect's missing model opens the dialog");
  check(
    (await page.getByRole("dialog").getByRole("heading", { name: "Required model not installed" }).count()) === 1,
    "The dialog says the required model is not installed",
  );
  const cause = await page.getByTestId("missing-model-cause").textContent();
  check(cause.includes("qwen3.5:9b") && cause.includes("this computer"), "It names the model and where it is missing");
  const facts = await page.getByTestId("missing-model-facts").textContent();
  check(/6\.6\s?GB/.test(facts) && facts.includes("Free space"), "It shows the download size and the free space");
  check((await page.getByTestId("missing-model-keep").textContent()).includes("kept"), "It says the inputs are kept");
  check(!(await calls()).by_role.analyst, "Nothing was generated before the model is ready");
  await shot(page, "missing-01-architect-en-light");

  await page.getByTestId("missing-model-download").click();
  await page.getByTestId("local-job-pull").waitFor();
  await waitFor(async () => (await page.getByTestId("local-job-pull").getAttribute("data-state")) === "running", 10000, "a running pull");
  await page.waitForTimeout(1500);
  await shot(page, "missing-02-download-en-light");
  const jobs = await pullJobs();
  check(jobs.length === 1 && jobs[0].state === "running", "One download runs");

  // Another tab needs the same model: it follows the same download instead of starting another.
  const attach = await json("/api/local-models/pull", "POST", { model: "qwen3.5:9b", attach: true });
  check(attach.id === jobs[0].id, "A second start of the same download follows the running one");
  const second = await newPage();
  await openAssistant(second);
  await second.getByTestId("assistant-input").fill("Please summarize my workflows.");
  await second.getByTestId("assistant-send").click();
  await dialog(second).waitFor();
  check((await dialog(second).getAttribute("data-stage")) === "job", "The second tab shows the running download");
  check(await second.getByText("This model is already being downloaded", { exact: false }).isVisible(), "It says the model is downloading already");
  await second.getByTestId("missing-model-cancel").click();
  check((await second.getByTestId("assistant-input").inputValue()) === "Please summarize my workflows.", "Closing it keeps the message");
  check((await pullJobs()).length === 1, "Still one download");
  await second.context().close();

  await waitFor(async () => (await dialog(page).getAttribute("data-stage")) === "ready", 40000, "the ready check");
  await shot(page, "missing-03-ready-en-light");
  await page.getByTestId("missing-model-continue").dblclick();
  await dialog(page).waitFor({ state: "detached" });
  await page.getByTestId("architect-dialog").waitFor();
  await waitFor(async () => ((await calls()).by_role.analyst ?? 0) >= 1, 20000, "the analysis");
  await page.waitForTimeout(2500);
  const afterArchitect = await calls();
  check(afterArchitect.by_role.analyst === 1, "The architect generated once (a double click continues once)");
  check(afterArchitect.prompts.analyst[0].includes("spring campaign"), "It started with the description entered before");
  check((await json("/api/settings")).assistant_model === MISSING, "The configured model stays");
  await page.context().close();

  // ---- 2. Assistant: cancel and continue the download, then continue automatically (German, dark) -----------------
  await removeModel();
  await pullMode("ok", 14);
  const de = await newPage({ theme: "dark", language: "de" });
  await openAssistant(de);
  await de.getByTestId("assistant-input").fill("Was kann der lokale Assistent?");
  await de.getByTestId("assistant-send").click();
  await dialog(de).waitFor();
  check((await de.getByTestId("missing-model-cause").textContent()).includes("qwen3.5:9b"), "German: the dialog names the model");
  await shot(de, "missing-04-assistant-de-dark");
  await de.getByTestId("missing-model-download").click();
  await de.getByTestId("local-job-pull").waitFor();
  await de.waitForTimeout(4000);
  await de.getByRole("button", { name: /^Abbrechen:/ }).click();
  await waitFor(async () => (await de.getByTestId("local-job-pull").getAttribute("data-state")) === "cancelled", 15000, "cancelled");
  await shot(de, "missing-05-canceled-de-dark");
  const stopped = await json("/api/local-models/readiness", "POST", { model: MISSING, action: "assistant" });
  check(stopped.problem.partial_bytes > 0 && stopped.problem.previous_job?.state === "cancelled", "The partial download is kept and offered");
  check((await de.getByTestId("assistant-input").inputValue()) === "Was kann der lokale Assistent?", "The message stays in the input");
  await de.getByRole("button", { name: /^Fortsetzen:/ }).click();
  await waitFor(async () => (await de.getByTestId("local-job-pull").getAttribute("data-state")) === "running", 10000, "running again");
  await de.getByTestId("missing-model-auto").check();
  await shot(de, "missing-06-auto-de-dark");
  await dialog(de).waitFor({ state: "detached", timeout: 40000 });
  await de.getByTestId("chat-assistant").filter({ hasText: "The local model answered." }).waitFor({ timeout: 20000 });
  await de.waitForTimeout(1000);
  check((await calls()).by_role.assistant === 1, "The message was sent once, automatically after the opt-in");
  check((await de.getByTestId("assistant-input").inputValue()) === "", "The input is empty after sending");
  await de.context().close();

  // ---- 3. Another model for this action only (French, phone width) ------------------------------------------------
  await removeModel();
  const fr = await newPage({ language: "fr", width: 390, height: 844 });
  await openAssistant(fr);
  await fr.getByTestId("assistant-input").fill("Bonjour, que puis-je automatiser ?");
  await fr.getByTestId("assistant-send").click();
  await dialog(fr).waitFor();
  await shot(fr, "missing-07-assistant-fr-narrow");
  const overflow = await fr.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(overflow <= 0, "No horizontal scrolling at phone width");
  await fr.getByTestId("missing-model-choose").click();
  const list = fr.getByTestId("missing-model-alternatives");
  await list.waitFor();
  await list.getByRole("radio", { name: /qwen3\.5:4b/ }).check();
  await shot(fr, "missing-08-choose-fr-narrow");
  const beforeChoice = (await calls()).by_role.assistant ?? 0;
  await fr.getByTestId("missing-model-use").click();
  await fr.getByTestId("chat-assistant").last().waitFor();
  await waitFor(async () => ((await calls()).by_role.assistant ?? 0) === beforeChoice + 1, 15000, "the answer");
  check((await json("/api/settings")).assistant_model === MISSING, "The chosen model applies to this message only");
  check((await pullJobs()).filter((job) => job.state === "running").length === 0, "Choosing another model downloads nothing");
  await fr.context().close();

  // ---- 4. A failing download: network, then a full disk, then it works --------------------------------------------
  await pullMode("error", 3);
  const failing = await newPage();
  await openAssistant(failing);
  await failing.getByTestId("assistant-input").fill("Check the download errors.");
  await failing.getByTestId("assistant-send").click();
  await failing.getByTestId("missing-model-download").click();
  await waitFor(async () => (await failing.getByTestId("local-job-pull").getAttribute("data-state")) === "failed", 20000, "failed");
  const network = await failing.getByTestId("local-job-problem").textContent();
  check(network.length > 0, "A network error is reported with what to do");
  await shot(failing, "missing-09-network-error-en-light");
  await pullMode("disk_full", 3);
  await failing.getByRole("button", { name: /^(Try again|Continue):/ }).click();
  await waitFor(async () => (await failing.getByTestId("local-job-pull").getAttribute("data-state")) === "failed", 20000, "failed again");
  await failing.waitForTimeout(500);
  const disk = await failing.getByTestId("local-job-problem").textContent();
  check(/disk|space/i.test(disk), "A full disk is reported as such");
  await shot(failing, "missing-10-disk-full-en-light");
  await pullMode("ok", 3);
  await failing.getByRole("button", { name: /^(Try again|Continue):/ }).click();
  await waitFor(async () => (await dialog(failing).getAttribute("data-stage")) === "ready", 30000, "ready after the retry");
  await failing.getByTestId("missing-model-cancel").click();
  check((await failing.getByTestId("assistant-input").inputValue()) === "Check the download errors.", "Cancelling keeps the message unsent");
  await failing.context().close();

  // ---- 5. A model server that does not answer (a real dead address) -----------------------------------------------
  const saved = await api("/api/settings", "PUT", { providers: { ollama: { base_url: "http://127.0.0.1:9699/v1" } } });
  check(saved.status === 200, "The Ollama address is set to a server that does not run");
  const dead = await newPage();
  await openArchitect(dead, "A workflow while the model server is down.");
  await dialog(dead).waitFor();
  check((await dialog(dead).getAttribute("data-cause")) === "server_unreachable", "An unreachable server is not called a missing model");
  check((await dead.getByTestId("missing-model-download").count()) === 0, "Nothing is offered for download then");
  check((await dead.getByTestId("missing-model-retry").count()) === 1, "It offers to check again");
  await shot(dead, "missing-11-unreachable-en-light");
  await dead.getByTestId("missing-model-cancel").click();
  await dead.context().close();
  await api("/api/settings", "PUT", { providers: { ollama: { base_url: "" } } });

  // ---- 6. Remote server, missing permission, the operator's server (recorded answers) -----------------------------
  const live = await json("/api/local-models/readiness", "POST", { model: "ollama:qwen3.5:27b", action: "architect" });
  const variants = {
    remote: { ...live.problem, cause: "model_missing", mode: "external", location: "remote", host: "gpu-box.lan:11434", actions: ["download", "choose_model"], blocked: null, free_bytes: null, fits: null },
    permission: { ...live.problem, cause: "model_missing", actions: ["choose_model", "ask_admin"], blocked: "permission" },
    operator: { ...live.problem, cause: "model_missing", mode: "external", location: "server", actions: ["choose_model", "ask_admin"], blocked: "operator", free_bytes: null },
  };
  for (const [name, problem] of Object.entries(variants)) {
    const language = name === "permission" ? "de" : "en";
    const recorded = await newPage({ language });
    await recorded.route("**/api/architect/jobs", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({
            status: 409,
            contentType: "application/json",
            body: JSON.stringify({
              detail: "The local model is not ready",
              code: "model.local_unavailable",
              params: { model: problem.model, cause: problem.cause, problem, alternatives: live.alternatives },
            }),
          })
        : route.continue(),
    );
    await openArchitect(recorded, `Recorded: ${name}`, language);
    await dialog(recorded).waitFor();
    const download = await recorded.getByTestId("missing-model-download").count();
    if (name === "remote") {
      check((await recorded.getByTestId("missing-model-cause").textContent()).includes("gpu-box.lan"), "Remote: it names the server the model goes to");
      check(download === 1, "Remote: downloading to that server is offered");
    } else {
      check(download === 0, `${name}: no download is offered`);
      check((await recorded.getByTestId("missing-model-blocked").count()) === 1, `${name}: it says why and who can install it`);
      check((await recorded.getByTestId("missing-model-copy").count()) === 1, `${name}: the model name can be copied for the administrator`);
    }
    await shot(recorded, `missing-12-${name}`);
    await recorded.context().close();
  }

  // ---- 7. Unattended: a scheduled run reports the problem and never downloads -------------------------------------
  await removeModel();
  await api("/api/settings", "PUT", { default_budget_usd: 1 });
  const workflow = await json("/api/workflows", "POST", {
    name: "Nightly summary",
    nodes: [
      { id: "s", type: "start", position: { x: 0, y: 0 } },
      { id: "a", type: "agent", position: { x: 200, y: 0 }, agent: { name: "Summarizer", model: MISSING, task: "Summarize the input." } },
      { id: "o", type: "output", position: { x: 400, y: 0 } },
    ],
    edges: [
      { id: "e1", source: "s", target: "a" },
      { id: "e2", source: "a", target: "o" },
    ],
  });
  const pullsBefore = (await pullJobs()).length;
  const schedule = await json("/api/schedules", "POST", { name: "Every night", workflow_id: workflow.id, kind: "daily", at: "03:00", input: "x" });
  const ticked = await json("/__e2e/tick", "POST", { id: schedule.id });
  check(ticked.started.length === 0, "The scheduled run does not start without the model");
  const stored = await json(`/api/schedules/${schedule.id}`);
  check(
    stored.last_error_code === "workflow.blocked" && stored.last_error_params.problems.some((item) => item.code === "check.local_model_missing"),
    "The schedule reports the missing model as a traceable problem",
  );
  check((await pullJobs()).length === pullsBefore, "The unattended run downloaded nothing");
  const sched = await newPage();
  await sched.goto(`${base}/schedules`);
  const fix = sched.getByTestId("model-fix");
  await fix.waitFor();
  await shot(sched, "missing-13-schedule-fix-en-light");
  await fix.click();
  await dialog(sched).waitFor();
  check((await dialog(sched).getAttribute("data-cause")) === "model_missing", "Fix opens the same dialog for the schedule's model");
  check(
    (await sched.getByTestId("missing-model-download").count()) === 1 && (await sched.getByTestId("missing-model-keep").count()) === 0,
    "Fix offers the download and promises no continuation (nothing continues by itself)",
  );
  await shot(sched, "missing-14-fix-dialog-en-light");
  await sched.getByTestId("missing-model-cancel").click();
  check((await pullJobs()).length === pullsBefore, "Opening Fix downloads nothing by itself");
  await sched.context().close();

  // ---- 8. Unattended: a batch stops on the missing model, and "Fix" on its page opens the same dialog -------------
  const created = await api("/api/batches", "POST", {
    workflow_id: workflow.id,
    name: "Nightly batch",
    rows: [{ input: "first" }, { input: "second" }],
    concurrency: 1,
  });
  check(created.status === 200 || created.status === 201, `The batch is accepted (${created.status})`);
  const batchId = created.body?.id;
  let batch = created.body;
  await waitFor(
    async () => {
      batch = await json(`/api/batches/${batchId}`);
      return batch.status === "stopped";
    },
    20000,
    "the batch stops",
  );
  check(
    batch.stop_code === "workflow.blocked" && (batch.stop_params?.problems ?? []).some((item) => item.code === "check.local_model_missing"),
    "The batch reports the missing model as a traceable problem",
  );
  check((await pullJobs()).length === pullsBefore, "The batch downloaded nothing");
  const batchPage = await newPage({ theme: "dark" });
  await batchPage.goto(`${base}/batches/${batchId}`);
  const batchFix = batchPage.getByTestId("model-fix");
  await batchFix.waitFor();
  await shot(batchPage, "missing-15-batch-fix-en-dark");
  await batchFix.click();
  await dialog(batchPage).waitFor();
  check((await dialog(batchPage).getAttribute("data-cause")) === "model_missing", "Fix on the batch opens the same dialog for its model");
  check(
    (await batchPage.getByTestId("missing-model-download").count()) === 1 && (await batchPage.getByTestId("missing-model-keep").count()) === 0,
    "Fix on the batch offers the download and continues nothing by itself",
  );
  await batchPage.getByTestId("missing-model-cancel").click();
  check((await pullJobs()).length === pullsBefore, "Opening Fix on the batch downloads nothing by itself");
  await batchPage.context().close();

  // ---- 9. The registry says the model cannot call tools: no download, said in plain words -------------------------
  await api("/api/settings", "PUT", { assistant_model: NO_TOOLS });
  const pullsBeforeRegistry = (await json("/api/local-models/jobs")).length;
  const registry = await newPage();
  await openAssistant(registry);
  await registry.getByTestId("assistant-input").fill("Which tools can you call?");
  await registry.getByTestId("assistant-send").click();
  await dialog(registry).waitFor();
  check((await dialog(registry).getAttribute("data-cause")) === "capability_missing", "Registry: the cause is the missing capability");
  const registryCause = registry.getByTestId("missing-model-cause");
  check((await registryCause.getAttribute("data-from-registry")) === "true", "Registry: the facts are marked as read from the registry");
  check(
    (await registryCause.textContent()) ===
      "e2e-notools:1b does not support what this step needs: tool calls. Its entry in the model registry says so, so it was not downloaded.",
    "Registry: the dialog says in plain words that the registry entry shows the model cannot call tools",
  );
  check(!(await registryCause.textContent()).includes("is installed"), "Registry: it never calls the model installed");
  check((await registry.getByTestId("missing-model-download").count()) === 0, "Registry: no download is offered");
  check((await registry.getByTestId("missing-model-choose").count()) === 1, "Registry: another ready model can be chosen");
  check((await registry.getByRole("dialog", { name: "The model cannot do what is needed" }).count()) === 1, "Registry: the dialog is named by its title");
  await scan(registry, "Registry dialog (English, light)");
  await shot(registry, "missing-16-registry-en-light");
  await registry.getByTestId("missing-model-cancel").click();
  check((await registry.getByTestId("assistant-input").inputValue()) === "Which tools can you call?", "Registry: cancelling keeps the message");
  await registry.context().close();
  const registryDe = await newPage({ theme: "dark", language: "de", width: 390, height: 844 });
  await openAssistant(registryDe);
  await registryDe.getByTestId("assistant-input").fill("Welche Tools kannst du aufrufen?");
  await registryDe.getByTestId("assistant-send").click();
  await dialog(registryDe).waitFor();
  check(
    (await registryDe.getByTestId("missing-model-cause").textContent()).includes("Eintrag in der Modell-Registry"),
    "Registry: German names the registry entry",
  );
  const registryOverflow = await registryDe.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(registryOverflow <= 0, "Registry: no horizontal scrolling at phone width in the dark theme");
  await scan(registryDe, "Registry dialog (German, dark, 390 px)");
  await shot(registryDe, "missing-17-registry-de-dark-narrow");
  await registryDe.getByTestId("missing-model-cancel").click();
  await registryDe.context().close();
  check((await json("/api/local-models/jobs")).length === pullsBeforeRegistry, "Registry: nothing was downloaded");
  await api("/api/settings", "PUT", { assistant_model: MISSING });
} catch (error) {
  failures += 1;
  console.log(`FAIL ${error.stack ?? error}`);
} finally {
  await browser.close();
}

const unexpected = errors.filter((text) => !/ResizeObserver/.test(text));
check(unexpected.length === 0, `No page errors${unexpected.length ? `: ${unexpected.join(" | ")}` : ""}`);
console.log(failures ? `${failures} failure(s)` : "all passed");
process.exit(failures ? 1 : 0);
