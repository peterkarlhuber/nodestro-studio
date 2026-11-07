// Local models end to end, against tests/e2e_local_models_server.py: the studio's managed model server is a fake
// Ollama (tests/fake_ollama.py) that answers over HTTP like the real one, and no model client is injected.
// Usage: node e2e/localModelsServer.mjs [baseUrl] [screenshotDir]
//
// Covers, in the real studio against the real API and runtime:
//   1. stop and start the managed server (the setup job with its steps, the status badge);
//   2. a download with measured progress that ends checked against the catalog digest;
//   3. a download that fails (a translated alert, no raw codes) and succeeds on "Try again";
//   4. the speed measurement (a request to the model server, stored with the model);
//   5. offline imports: a folder that is no package and a file that is no GGUF file are refused with their own
//      sentences, a renamed text file fails in the server, a real GGUF file and an offline package are imported;
//   6. the semantic index: built through the embedding model, then a semantic search finds the document;
//   7. a local agent runs a workflow from the editor; its answer comes from the model server over HTTP;
//   8. every language (six) shows the finished page without raw translation keys, with axe (WCAG A/AA, serious and
//      critical) in the light and the dark theme, at desktop and at phone width, without horizontal scrolling.

import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];
const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8027";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const here = dirname(fileURLToPath(import.meta.url));
const LANGUAGES = ["en", "de", "fr", "es", "it", "pt-BR"];
function locale(language, bundle) {
  return JSON.parse(readFileSync(join(here, "..", "src", "i18n", "locales", language, `${bundle}.json`), "utf8"));
}
const T = Object.fromEntries(
  LANGUAGES.map((language) => [
    language,
    { models: locale(language, "localModels"), jobs: locale(language, "localJobs"), errors: locale(language, "errors") },
  ]),
);
const fill = (text, values) => text.replace(/\{\{(\w+)\}\}/g, (_match, key) => String(values[key] ?? ""));
// Raw translation keys of the sections under test (a missing key shows itself, e.g. "localModels.index.build").
const RAW_KEY = /\b(localModels|localJobs|errors|common|settings)\.[a-z][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)*\b/;

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
const axe = axeSource();
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

let failures = 0;
function check(condition, message) {
  if (condition) console.log(`ok   ${message}`);
  else {
    failures += 1;
    console.log(`FAIL ${message}`);
  }
}

async function api(path, method = "GET", body) {
  const response = await fetch(base + path, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}
const json = async (path, method, body) => (await api(path, method, body)).body;

async function waitFor(test, timeout, what) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await test()) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`timed out: ${what}`);
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
  page.on("pageerror", (error) => errors.push(String(error)));
  return page;
}

async function shot(page, name, target) {
  if (!shots) return;
  if (target) await page.getByTestId(target).evaluate((node) => node.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: join(shots, `${name}.png`), animations: "disabled" });
  console.log(`shot ${name}.png`);
}

async function openSettings(page) {
  await page.goto(`${base}/settings#settings-local-models`);
  await page.getByTestId("settings-local-models").waitFor();
  await page.getByTestId("local-status").waitFor();
}

async function noHorizontalScroll(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(overflow <= 0, `${label}: no horizontal scrolling (${overflow}px)`);
}

async function scan(page, label) {
  if (!axe) {
    console.log(`skip axe on ${label}: axe-core not found (set AXE_CORE_PATH or run npm install in frontend/)`);
    return;
  }
  await page.evaluate(axe);
  const violations = await page.evaluate(async (tags) => {
    const result = await window.axe.run(
      { include: [["[data-testid=settings-local-models]"], ["[data-testid=settings-knowledge-search]"]] },
      { runOnly: { type: "tag", values: tags }, resultTypes: ["violations"] },
    );
    return result.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id}×${v.nodes.length} (${v.nodes[0]?.target.join(" ")})`);
  }, AXE_TAGS);
  check(violations.length === 0, `${label}: axe finds no serious or critical violation${violations.length ? `: ${violations.join(", ")}` : ""}`);
}

const installed = async () => (await json("/api/local-models")).status.models;
const jobsOf = async (kind) => (await json("/api/local-models/jobs")).filter((job) => job.kind === kind);
const calls = async (kind) => (await json("/__e2e/calls")).filter((call) => call.kind === kind);
const files = await json("/__e2e/files");

try {
  // ---- 1. stop and start the managed server ---------------------------------------------------------------------
  {
    const en = T.en.models;
    await waitFor(async () => (await json("/api/local-models")).status.running, 30000, "the managed server runs");
    const page = await newPage();
    await openSettings(page);
    const badge = page.getByTestId("local-status").locator(".nd-badge").first();
    await page.getByTestId("local-status").getByText(en.status.running, { exact: true }).waitFor();
    check(true, "The managed fake Ollama runs after the start and the status says so");
    check(((await page.getByTestId("local-status").textContent()) ?? "").includes("Ollama 0.40.14"), "The status names the server's version");
    await page.getByTestId("settings-local-models").getByRole("button", { name: en.stop, exact: true }).click();
    await page.getByTestId("local-status").getByText(en.status.stopped, { exact: true }).waitFor({ timeout: 15000 });
    check(!(await json("/api/local-models")).status.running, "Stop stops the server (the API agrees)");
    await page.getByTestId("settings-local-models").getByRole("button", { name: en.start, exact: true }).click();
    await page.getByTestId("local-setup-progress").waitFor({ timeout: 15000 });
    await page.waitForFunction(() => document.querySelector('[data-testid="local-job-setup"]')?.getAttribute("data-state") === "done", null, {
      timeout: 30000,
    });
    const [setup] = await jobsOf("setup");
    const steps = Object.fromEntries(setup.steps.map((step) => [step.id, step]));
    check(steps.start.state === "done" && steps.reachable.state === "done", "Start runs the setup job: the server starts and answers");
    check(String(steps.reachable.detail).startsWith("Ollama 0.40.14 at http://127.0.0.1"), `The reachability step names the server (${steps.reachable.detail})`);
    check(steps.download.state === "skipped", "Nothing is downloaded for a server that ships with the app");
    await page.getByTestId("local-status").getByText(en.status.running, { exact: true }).waitFor({ timeout: 15000 });
    check((await badge.textContent()) === en.status.running, "The badge shows the running server again");
    await shot(page, "local-server-01-started-en-light", "settings-local-models");
    await page.context().close();
  }

  // ---- 2. a download with measured progress, checked against the catalog ----------------------------------------
  {
    const de = T.de.models;
    await json("/__e2e/control", "POST", { pull: "ok", seconds: 6 });
    const page = await newPage({ theme: "dark", language: "de", width: 390, height: 844 });
    await openSettings(page);
    const row = page.getByTestId("local-model-qwen3.5:4b");
    await row.getByRole("button", { name: `${de.downloadShort}: qwen3.5:4b` }).click();
    const inline = row.getByTestId("local-inline-qwen3.5:4b");
    await inline.waitFor({ timeout: 15000 });
    const bar = inline.getByRole("progressbar");
    await page.waitForFunction(
      () => Number(document.querySelector('[data-testid="local-model-qwen3.5:4b"] [data-testid="local-inline-qwen3.5:4b"] [role=progressbar]')?.getAttribute("aria-valuenow") ?? -1) > 0,
      null,
      { timeout: 15000 },
    );
    const first = Number(await bar.getAttribute("aria-valuenow"));
    await shot(page, "local-server-02-download-de-dark-narrow", "local-catalog");
    await page.waitForFunction(
      (seen) => {
        const now = document.querySelector('[data-testid="local-model-qwen3.5:4b"] [data-testid="local-inline-qwen3.5:4b"] [role=progressbar]')?.getAttribute("aria-valuenow");
        return now === undefined || now === null || Number(now) > seen;
      },
      first,
      { timeout: 15000 },
    );
    check(true, `The download's bar is measured and moves (from ${first} %)`);
    await row.getByText(de.verified, { exact: true }).waitFor({ timeout: 30000 });
    check(true, "The finished download is checked against the catalog digest (badge Geprüft)");
    const model = (await installed()).find((item) => item.name === "qwen3.5:4b");
    check(model?.verified === true && model?.kind === "chat", "The API lists the model as installed and verified");
    check((await calls("pull")).some((call) => call.model === "qwen3.5:4b"), "The download went to the model server (/api/pull)");
    await noHorizontalScroll(page, "German, dark, phone width");
    await page.context().close();
  }

  // ---- 3. a download that fails, then succeeds on "Try again" ----------------------------------------------------
  {
    const fr = T.fr;
    await json("/__e2e/control", "POST", { pull: "error", seconds: 2 });
    const page = await newPage({ language: "fr" });
    await openSettings(page);
    const row = page.getByTestId("local-model-qwen3-embedding:0.6b");
    await row.getByRole("button", { name: `${fr.models.downloadShort}: qwen3-embedding:0.6b` }).click();
    const failed = page.locator('[data-testid="local-job-pull"][data-state="failed"]').first();
    await failed.waitFor({ timeout: 20000 });
    const problem = failed.getByTestId("local-job-problem");
    check((await problem.getAttribute("role")) === "alert", "French: the failed download is an alert");
    const text = (await problem.textContent()) ?? "";
    check(!RAW_KEY.test(text) && !/local\.[a-z_]+/.test(text), `French: the failure is a sentence, not a code (${text.slice(0, 80)})`);
    await shot(page, "local-server-03-download-failed-fr-light", "local-jobs");
    await json("/__e2e/control", "POST", { pull: "ok", seconds: 2 });
    await failed.getByRole("button", { name: new RegExp(`^${fr.jobs.retry}`) }).click();
    await row.getByText(fr.models.verified, { exact: true }).waitFor({ timeout: 30000 });
    check(true, "French: Try again downloads the model");
    check((await jobsOf("pull")).some((job) => job.target === "qwen3-embedding:0.6b" && job.state === "done"), "French: the retried download is done");
    await page.context().close();
  }

  // ---- 4. the speed measurement ----------------------------------------------------------------------------------
  {
    const en = T.en.models;
    const page = await newPage({ theme: "dark" });
    await openSettings(page);
    const speed = page.getByTestId("local-speed-qwen3.5:4b");
    await speed.getByRole("button", { name: en.speed.measure }).click();
    await speed.getByText(fill(en.speed.value, { speed: "10.0" }), { exact: false }).waitFor({ timeout: 20000 });
    check(true, "The speed is measured by a request to the model server (10.0 tokens/s)");
    check((await calls("generate")).some((call) => call.model === "qwen3.5:4b"), "The measurement asked the server (/api/generate)");
    await page.context().close();
  }

  // ---- 5. offline imports: refusals with their own sentences, a GGUF file and an offline package ------------------
  for (const [language, theme, width] of [
    ["es", "light", 1280],
    ["pt-BR", "dark", 390],
  ]) {
    const t = T[language];
    const page = await newPage({ language, theme, width });
    await openSettings(page);
    const form = page.getByTestId("local-import");
    await form.scrollIntoViewIfNeeded();
    const importButton = form.getByRole("button", { name: t.models.import.start, exact: true });
    const toastText = async (expected) => {
      const toast = page.locator(".toaster .toast__text", { hasText: expected });
      await toast.first().waitFor({ timeout: 10000 });
      return (await toast.first().textContent()) ?? "";
    };
    // A folder that is no offline package.
    await form.getByRole("radio", { name: t.models.import.package }).click();
    await form.getByLabel(t.models.import.packagePath).fill(files.not_package);
    await importButton.click();
    const notPackage = await toastText(fill(t.errors.local.invalid_package_path, { path: files.not_package }).slice(0, 60));
    check(notPackage.includes("orkexa-models.json"), `${language}: a folder that is no package is refused with its own sentence`);
    // A file that is no GGUF file.
    await form.getByRole("radio", { name: t.models.import.gguf }).click();
    await form.getByLabel(t.models.import.ggufPath).fill(files.text);
    await form.getByLabel(t.models.import.name, { exact: true }).fill(`notes-${language.toLowerCase()}:1`);
    await importButton.click();
    const notGguf = await toastText(fill(t.errors.local.not_gguf, { path: files.text }));
    check(notGguf.includes("notes.txt"), `${language}: a file that is no GGUF file is refused and named`);
    if (language === "es") {
      // A text file with the extension: the model server refuses it; the job card says so.
      await form.getByLabel(t.models.import.ggufPath).fill(files.fake_gguf);
      await form.getByLabel(t.models.import.name, { exact: true }).fill("renamed:1");
      await importButton.click();
      const failed = page.locator('[data-testid="local-job-import_gguf"][data-state="failed"]').first();
      await failed.waitFor({ timeout: 20000 });
      const problem = (await failed.getByTestId("local-job-problem").textContent()) ?? "";
      check(problem.includes(t.errors.local.http_error.slice(0, 20)), `${language}: a renamed text file fails in the model server, translated`);
      await shot(page, `local-server-04-import-failed-${language}-${theme}`, "local-jobs");
      // A real GGUF file.
      await form.getByLabel(t.models.import.ggufPath).fill(files.gguf);
      await form.getByLabel(t.models.import.name, { exact: true }).fill("my-tiny:q4");
      await importButton.click();
      await waitFor(async () => (await installed()).some((item) => item.name === "my-tiny:q4"), 20000, "the GGUF import");
      await page.getByTestId("local-catalog").getByText("my-tiny:q4", { exact: true }).waitFor({ timeout: 15000 });
      check(true, `${language}: a GGUF file is imported through the model server and listed as an own model`);
      check((await calls("create")).some((call) => call.model === "my-tiny:q4"), `${language}: the import created the model (/api/blobs, /api/create)`);
    } else {
      // An offline package, copied and checked by SHA-256 into the managed model folder.
      await form.getByRole("radio", { name: t.models.import.package }).click();
      await form.getByLabel(t.models.import.packagePath).fill(files.package);
      await importButton.click();
      await waitFor(async () => (await installed()).some((item) => item.name === files.package_model), 20000, "the package import");
      await page.getByTestId("local-catalog").getByText(files.package_model, { exact: true }).waitFor({ timeout: 15000 });
      check(true, `${language}: an offline package is imported and the model server lists its model`);
      await noHorizontalScroll(page, `${language}, ${theme}, width ${width}`);
      await shot(page, `local-server-05-imported-${language}-${theme}`, "local-import");
    }
    await page.context().close();
  }

  // ---- 6. the semantic index, built through the embedding model --------------------------------------------------
  {
    const it = T.it.models;
    const form = new FormData();
    form.append("files", new Blob(["Refunds are paid back within 30 days after the return arrives."], { type: "text/markdown" }), "refunds.md");
    const uploaded = await fetch(`${base}/api/knowledge`, { method: "POST", body: form });
    check(uploaded.ok, "A knowledge document is uploaded");
    const saved = await api("/api/settings", "PUT", { knowledge_retrieval: "hybrid", embedding_model: "qwen3-embedding:0.6b" });
    check(saved.status === 200, "Combined search with the downloaded embedding model is chosen");
    const page = await newPage({ language: "it", theme: "dark" });
    await page.goto(`${base}/settings#settings-knowledge-search`);
    const panel = page.getByTestId("settings-knowledge-search");
    await panel.getByTestId("knowledge-index").waitFor();
    await panel.getByText(it.index.needed, { exact: true }).waitFor();
    check(true, "Italian: the panel says the combined search needs the index");
    await panel.getByRole("button", { name: it.index.build, exact: true }).click();
    await panel.getByTestId("knowledge-index").getByText(it.index.badge.ready, { exact: true }).waitFor({ timeout: 30000 });
    check(true, "Italian: the index is built and ready");
    check(
      ((await panel.getByTestId("knowledge-index").textContent()) ?? "").includes(fill(it.index.state.ready, { embedded: 1, chunks: 1 })),
      "Italian: every section has its vector",
    );
    const status = await json("/api/knowledge/index");
    check(status.state === "ready" && status.active?.model === "qwen3-embedding:0.6b" && status.active?.dimensions === 1024, "The index belongs to the embedding model and its dimensions");
    const hits = await api("/api/knowledge/search?q=" + encodeURIComponent("when are refunds paid") + "&mode=vector");
    check(hits.status === 200 && hits.body[0]?.title === "refunds.md" && hits.body[0]?.ranks?.vector === 1, "A semantic search finds the document through its vector");
    check((await calls("embed")).length >= 2, "The model server embedded the document and the query (/api/embed)");
    await shot(page, "local-server-06-index-ready-it-dark", "settings-knowledge-search");
    await page.context().close();
  }

  // ---- 7. a local agent runs a workflow from the editor ----------------------------------------------------------
  {
    const workflow = await json("/api/workflows", "POST", {
      name: "Local summary",
      nodes: [
        { id: "s", type: "start", position: { x: 0, y: 0 } },
        { id: "a", type: "agent", position: { x: 260, y: 0 }, agent: { name: "Summarizer", model: "ollama:qwen3.5:4b", task: "Summarize the input." } },
        { id: "o", type: "output", position: { x: 520, y: 0 } },
      ],
      edges: [
        { id: "e1", source: "s", target: "a" },
        { id: "e2", source: "a", target: "o" },
      ],
    });
    const page = await newPage();
    await page.goto(`${base}/workflows/${workflow.id}`);
    await page.locator(".react-flow__node").first().waitFor();
    await page.getByTestId("start-workflow").click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox", { name: "Input" }).first().fill("Three boxes arrived damaged.");
    await dialog.getByRole("button", { name: "Start", exact: true }).click();
    const answer = "Local answer from qwen3.5:4b: Three boxes arrived damaged.";
    await page.getByTestId("run-panel").getByText(answer, { exact: false }).first().waitFor({ timeout: 30000 });
    check(true, "The run panel shows the local agent's answer");
    const [run] = await json(`/api/runs?workflow_id=${workflow.id}`);
    check(run?.status === "succeeded", `The run succeeded (${run?.status})`);
    check((await calls("chat")).some((call) => call.model === "qwen3.5:4b" && call.text === answer), "The answer came from the model server (/v1/chat/completions)");
    await shot(page, "local-server-07-run-en-light");
    await page.context().close();
  }

  // ---- 8. six languages, both themes, desktop and phone width: no raw keys, axe, no horizontal scrolling -----------
  for (const [index, language] of LANGUAGES.entries()) {
    const theme = index % 2 ? "dark" : "light";
    for (const width of [1280, 390]) {
      const label = `${language}, ${theme}, width ${width}`;
      const page = await newPage({ language, theme, width, height: width > 600 ? 900 : 844 });
      await openSettings(page);
      const t = T[language].models;
      await page.getByTestId("local-status").getByText(t.status.running, { exact: true }).waitFor({ timeout: 15000 });
      await page.getByTestId("local-model-qwen3.5:4b").getByText(t.verified, { exact: true }).waitFor();
      await page.getByTestId("knowledge-index").getByText(t.index.badge.ready, { exact: true }).waitFor();
      const text = (await page.getByTestId("settings-local-models").textContent()) + (await page.getByTestId("settings-knowledge-search").textContent());
      const raw = text.match(RAW_KEY);
      check(!raw, `${label}: no raw translation keys${raw ? ` (${raw[0]})` : ""}`);
      check(text.includes(t.catalog.title) && text.includes(t.search.title), `${label}: the sections are translated`);
      await noHorizontalScroll(page, label);
      await scan(page, label);
      await page.context().close();
    }
  }
} catch (error) {
  failures += 1;
  console.log(`FAIL ${error.stack ?? error}`);
} finally {
  await browser.close();
}

const unexpected = errors.filter((text) => !/ResizeObserver/.test(text));
check(unexpected.length === 0, `No page errors${unexpected.length ? `: ${unexpected.join(" | ")}` : ""}`);
console.log(failures ? `${failures} failure(s)` : "all local model server checks passed");
process.exit(failures ? 1 : 0);
