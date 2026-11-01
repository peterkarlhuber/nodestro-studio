// Journey baseline (UX-J, docs/evolution/README.md): the six user tasks of the product evolution plan, walked
// through in the browser against tests/e2e_journey_server.py, whose model answers every request (no key, nothing
// paid). Each journey counts what the interface asks of a person until the goal: actions (clicks, typing into a
// field, choosing a file or an option, key presses), dialogs that open, page changes and the controls visible on
// the screen where the goal is reached.
//
// This measures interface cost, not comprehension: the script knows every label in advance, never hesitates and
// never takes a wrong turn. It says nothing about whether a person would find the way; only moderated task tests
// can (decision D7). A journey fails when its goal cannot be reached; the counts themselves are reported, not
// asserted, so a change that makes a path longer shows up in the report and in review, not as a red build.
//
// The journeys run in any of the six interface languages. Every visible label the script looks for is read from the
// locale files (src/i18n/locales/<lang>/*.json) by key, so a run checks the real translation. On each key screen the
// script also checks that no raw i18n key is visible and, for languages other than English, that no English text
// shows where the language has a translation of its own.
//
// Usage: node e2e/journeys.mjs [baseUrl] [reportDir] [lang]
// The report (journeys.json, journeys.md) is written to reportDir or $JOURNEY_REPORT when given. The language is
// argv[4] or $E2E_LANG (de, en, es, fr, it, pt-BR; default de). Screenshots of the key screens (and of every failure)
// go to $E2E_SHOTS when given.

import { createRequire } from "node:module";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8060";
const reportDir = process.argv[3] || process.env.JOURNEY_REPORT;
const LANG = process.argv[4] || process.env.E2E_LANG || "de";
const shotsDir = process.env.E2E_SHOTS;

// ---- Locale texts ------------------------------------------------------------------------------------------------
const LANGUAGE_NAMES = { de: "German", en: "English", es: "Spanish", fr: "French", it: "Italian", "pt-BR": "Brazilian Portuguese" };
const BROWSER_LOCALES = { de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", it: "it-IT", "pt-BR": "pt-BR" };
if (!LANGUAGE_NAMES[LANG]) throw new Error(`Unknown language ${LANG}; use one of ${Object.keys(LANGUAGE_NAMES).join(", ")}`);
const localesDir = fileURLToPath(new URL("../src/i18n/locales/", import.meta.url));

/** All texts of a language as a flat map "area.key.sub" -> text. */
function loadLocale(lang) {
  const flat = new Map();
  const walk = (value, path) => {
    if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) walk(child, [...path, key]);
    else flat.set(path.join("."), value);
  };
  for (const file of readdirSync(join(localesDir, lang))) {
    if (file.endsWith(".json")) walk(JSON.parse(readFileSync(join(localesDir, lang, file), "utf8")), [file.slice(0, -5)]);
  }
  return flat;
}
const texts = loadLocale(LANG);
const english = LANG === "en" ? texts : loadLocale("en");
const pluralRules = new Intl.PluralRules(LANG);

/** The raw text of a key as i18next picks it (plural form by count, English as the fallback); never interpolated. */
function raw(key, count) {
  const candidates = count === undefined ? [key] : [`${key}_${pluralRules.select(count)}`, `${key}_other`, key];
  for (const table of [texts, english]) {
    for (const candidate of candidates) if (typeof table.get(candidate) === "string") return table.get(candidate);
  }
  throw new Error(`No text for ${key} in ${LANG} or en`);
}

/** A text of the interface language, interpolated like i18next does. */
function T(key, params = {}) {
  return raw(key, params.count).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => String(params[name]));
}

const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A pattern for a text of the interface language: given params are filled in, others match anything, all plural forms
 * of the key are accepted. Matches anywhere in a name, like Playwright's non-exact string match.
 */
function TRe(key, params = {}) {
  const forms = [key, ...["zero", "one", "two", "few", "many", "other"].map((form) => `${key}_${form}`)]
    .map((candidate) => texts.get(candidate) ?? (texts.has(key) || texts.has(`${key}_other`) ? undefined : english.get(candidate)))
    .filter((text) => typeof text === "string");
  if (!forms.length) throw new Error(`No text for ${key} in ${LANG} or en`);
  const pattern = (text) =>
    text
      .split(/(\{\{\s*\w+\s*\}\})/)
      .map((part) => {
        const name = part.match(/^\{\{\s*(\w+)\s*\}\}$/)?.[1];
        if (!name) return escapeRe(part);
        return name in params ? escapeRe(String(params[name])) : ".+?";
      })
      .join("");
  return new RegExp(forms.map(pattern).join("|"), "i");
}

/** The text of the <a>…</a> part of a Trans text (a link inside a sentence). */
const linkText = (key) => raw(key).match(/<a>(.*?)<\/a>/)[1];

// English texts that must not show in another language: texts whose key this language translates differently (or
// does not translate at all), and that are not a text of this language anywhere else. Short and interpolated texts are
// left out, they cannot be told apart from content.
const englishOnly = new Map();
if (LANG !== "en") {
  const own = new Set([...texts.values()].filter((text) => typeof text === "string").map((text) => text.trim()));
  for (const [key, text] of english) {
    if (typeof text !== "string" || /\{\{|<|\$t\(/.test(text) || text.trim().length < 4 || !/[a-z]{3}/i.test(text)) continue;
    const translated = texts.get(key);
    if (translated === text || own.has(text.trim())) continue;
    englishOnly.set(text.trim(), translated === undefined ? `${key} (no ${LANG} text)` : key);
  }
}

// A raw i18n key ("agent.quality.title") shown instead of its text. File names such as "faq.md" look the same.
const RAW_KEY = /^[a-z]+(\.[a-zA-Z_]+)+$/;
const FILE_NAME = /\.(md|markdown|pdf|txt|csv|tsv|json|jsonl|xlsx|xls|docx|pptx|png|jpe?g|gif|svg|webp|py|js|ts|html?|ya?ml|toml|zip|xml)$/i;

const browser = await browserType.launch();
const context = await browser.newContext({ viewport: { width: 1500, height: 940 }, locale: BROWSER_LOCALES[LANG] });
// The interface language as if picked in the settings (the browser locale alone would decide the same).
await context.addInitScript((language) => {
  try {
    localStorage.setItem("nodestro-language", language);
  } catch {
    // no storage: the browser locale decides
  }
}, LANG);
// Count every dialog that opens: native <dialog open> and role="dialog", across client-side navigation.
await context.addInitScript(() => {
  const seen = new WeakSet();
  window.__journeyDialogs = 0;
  const scan = () => {
    for (const element of document.querySelectorAll("dialog[open], [role=dialog]")) {
      if (!seen.has(element)) {
        seen.add(element);
        window.__journeyDialogs += 1;
      }
    }
  };
  new MutationObserver(scan).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["open"] });
});
const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  // A start refused by the preflight answers 4xx on purpose; the page shows the reason.
  if (message.type() === "error" && !/status of 4\d\d/.test(message.text())) errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

const checks = [];
let current = "setup";
let shotNumber = 0;

/** A check that ends the journey when it fails. */
function check(condition, message) {
  checks.push({ journey: current, message, ok: Boolean(condition) });
  if (!condition) throw new Error(message);
  console.log(`ok  ${message}`);
}

/** A check that is reported but lets the journey go on (the language checks of a screen). */
function softCheck(condition, message, detail) {
  checks.push({ journey: current, message, ok: Boolean(condition), ...(detail ? { detail } : {}) });
  console.log(`${condition ? "ok  " : "FAIL"} ${message}${detail && !condition ? `: ${detail}` : ""}`);
}

async function screenshot(name) {
  if (!shotsDir) return undefined;
  mkdirSync(shotsDir, { recursive: true });
  shotNumber += 1;
  const file = `${String(shotNumber).padStart(2, "0")}-${current}-${name}.png`.replace(/[^\w.-]+/g, "-");
  await page.screenshot({ path: join(shotsDir, file) });
  return file;
}

/** Texts a person sees: visible text nodes and the aria-label, placeholder and title of visible elements. */
async function visibleTexts() {
  return page.evaluate(() => {
    const seen = new Set();
    const visible = (element) => element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    const skip = (element) => element.closest("script, style, code, pre, kbd, textarea, .react-flow__minimap, [aria-hidden=true]");
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent.trim();
      const parent = node.parentElement;
      if (text && parent && !skip(parent) && visible(parent)) seen.add(text);
    }
    for (const element of document.body.querySelectorAll("[aria-label], [placeholder], [title]")) {
      if (skip(element) || !visible(element)) continue;
      for (const name of ["aria-label", "placeholder", "title"]) {
        const text = element.getAttribute(name)?.trim();
        if (text) seen.add(text);
      }
    }
    return [...seen];
  });
}

let pausedMs = 0;

/** A key screen: language checks and a screenshot. Its time is not counted in the journey's seconds. */
async function screen(name) {
  const started = Date.now();
  try {
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => undefined);
    const shown = await visibleTexts();
    const rawKeys = shown.filter((text) => RAW_KEY.test(text) && !FILE_NAME.test(text));
    softCheck(rawKeys.length === 0, `${current} ${name}: no raw i18n keys visible`, rawKeys.join(", "));
    if (LANG !== "en") {
      const leftovers = shown.filter((text) => englishOnly.has(text)).map((text) => `"${text}" (${englishOnly.get(text)})`);
      softCheck(leftovers.length === 0, `${current} ${name}: no English texts visible`, leftovers.join(", "));
    }
    // Longer translations must not push the page sideways or cut a button label off.
    const layout = await page.evaluate(() => {
      const clipped = [...document.querySelectorAll("button, a.nd-button, [role=tab]")]
        .filter((element) => element.checkVisibility() && element.textContent.trim() && element.scrollWidth > element.clientWidth + 1)
        .map((element) => element.textContent.trim().slice(0, 60));
      return { overflow: document.documentElement.scrollWidth - window.innerWidth, clipped };
    });
    softCheck(layout.overflow <= 0, `${current} ${name}: no horizontal page overflow`, `${layout.overflow}px wider than the window`);
    softCheck(layout.clipped.length === 0, `${current} ${name}: no clipped button labels`, layout.clipped.join(", "));
    await screenshot(name);
  } finally {
    pausedMs += Date.now() - started;
  }
}

// The test servers close idle keep-alive connections after 5 s; a request sent on a pooled connection at that moment
// fails with ECONNRESET. A fresh connection per API call avoids the race.
const FRESH_CONNECTION = { connection: "close" };

async function api(path, method = "GET", data) {
  const response = await page.request.fetch(base + "/api" + path, { method, data, headers: FRESH_CONNECTION });
  if (!response.ok()) throw new Error(`${method} ${path}: ${response.status()} ${await response.text()}`);
  return response.status() === 204 ? null : response.json();
}

async function until(probe, message, timeout = 30000) {
  const deadline = Date.now() + timeout;
  for (;;) {
    const value = await probe();
    if (value) return value;
    if (Date.now() > deadline) throw new Error(`Timed out: ${message}`);
    await page.waitForTimeout(250);
  }
}

/** A one-page PDF with a line of text, so the upload goes through the real document reader. */
function pdf(line) {
  const content = `BT /F1 12 Tf 72 720 Td (${line}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let body = "%PDF-1.4\n";
  const offsets = objects.map((object, index) => {
    const offset = body.length;
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(body, "latin1");
}

/** Interactive controls a person sees on the current screen: the open dialog, or else the page content. */
async function visibleControls() {
  return page.evaluate(() => {
    const dialogs = [...document.querySelectorAll("dialog[open], [role=dialog]")].filter((element) => element.checkVisibility());
    const scope = dialogs.at(-1) ?? document.querySelector("main") ?? document.body;
    const controls = scope.querySelectorAll("button, a[href], input:not([type=hidden]), select, textarea, [role=switch], [role=tab], [role=radio]");
    return [...controls].filter((element) => element.checkVisibility() && element.getAttribute("aria-hidden") !== "true").length;
  });
}

const results = [];

/** Runs one journey: `walk` gets the counting helpers and returns a short description of the goal reached. */
async function journey(id, task, walk) {
  current = id;
  pausedMs = 0;
  // Every journey starts from the start page, with a fresh page load and no remembered sections.
  try {
    await page.goto(base);
    await page.evaluate(() => localStorage.removeItem("nodestro-agent-sections"));
    await page.goto(base);
    await page.getByRole("heading", { name: T("workflows.title"), exact: true }).waitFor();
  } catch (error) {
    await failed(id, task, error);
    return;
  }
  const dialogsBefore = await page.evaluate(() => window.__journeyDialogs);
  let actions = 0;
  let pages = 0;
  let path = new URL(page.url()).pathname;
  const onNavigate = (frame) => {
    if (frame !== page.mainFrame()) return;
    const next = new URL(frame.url()).pathname;
    if (next !== path) pages += 1;
    path = next;
  };
  page.on("framenavigated", onNavigate);
  const act = async (promise) => {
    await promise;
    actions += 1;
  };
  const steps = {
    click: (locator) => act(locator.click()),
    fill: (locator, value) => act(locator.fill(value)),
    select: (locator, value) => act(locator.selectOption(value)),
    upload: (locator, files) => act(locator.setInputFiles(files)),
    press: (key) => act(page.keyboard.press(key)),
  };
  const started = Date.now();
  try {
    const goal = await walk(steps);
    const result = {
      id,
      task,
      goal,
      actions,
      dialogs: (await page.evaluate(() => window.__journeyDialogs)) - dialogsBefore,
      pages,
      controls: await visibleControls(),
      seconds: Math.round((Date.now() - started - pausedMs) / 100) / 10,
    };
    await screen("goal");
    results.push(result);
    check(true, `${id} reached: ${goal} (${actions} actions, ${result.dialogs} dialogs, ${pages} page changes)`);
  } catch (error) {
    await failed(id, task, error, { actions, seconds: Math.round((Date.now() - started - pausedMs) / 100) / 10 });
  } finally {
    page.off("framenavigated", onNavigate);
  }
}

/** A journey that did not reach its goal: reported with a screenshot; the following journeys still run. */
async function failed(id, task, error, counts = {}) {
  // The first lines name the step and, for an ambiguous locator, the elements it found.
  const message = (error instanceof Error ? error.message : String(error)).split("\n").slice(0, 4).join(" ").replace(/\s+/g, " ").slice(0, 600);
  if (!checks.some((item) => item.journey === id && !item.ok && item.message === message)) checks.push({ journey: id, message, ok: false });
  const shot = await screenshot("FAILED").catch(() => undefined);
  results.push({ id, task, failed: true, error: message, ...counts, ...(shot ? { screenshot: shot } : {}) });
  console.log(`FAIL ${id} not reached: ${message}`);
}

/** Checks outside the journeys (not counted): a failure is reported like a journey failure. */
async function outside(id, task, walk) {
  current = id;
  try {
    await walk();
  } catch (error) {
    await failed(id, task, error);
  }
}

const field = (name) => (scope) => scope.locator(".field", { hasText: name }).first();

try {
  // The scripted model ignores the key; the editor only needs one to enable starting.
  await api("/settings", "PUT", { providers: { anthropic: { api_key: "e2e-placeholder-not-a-key" } } });
  // Example names come from the backend in the interface language.
  const examples = new Map((await api(`/library?language=${encodeURIComponent(LANG)}`)).map((example) => [example.id, example]));
  const contractName = examples.get("contract-review").name;
  const blogName = examples.get("blog-article").name;
  const save = () => page.getByRole("button", { name: T("common.save"), exact: true });
  // By test id: in English the node palette has a "Start … workflow" entry as well.
  const startWorkflow = () => page.getByTestId("start-workflow");
  const navLink = (key) => page.getByRole("navigation").getByRole("link", { name: T(key), exact: true }).first();
  const workflowsLink = () => page.getByRole("link", { name: T("nav.workflows"), exact: true }).first();

  // ---- J1 "I want a structured evaluation of a PDF" -----------------------------------------------
  // Stand-in: the contract review example (structured output from an uploaded PDF). There is no invoice example.
  await journey("J1", "Structured evaluation of a PDF", async ({ click, fill, upload }) => {
    await screen("start-page");
    // The navigation names the main areas in this language (a sample of labels).
    for (const key of ["nav.workflows", "nav.knowledge", "nav.tests"]) await navLink(key).waitFor();
    check(true, "J1 the navigation shows Workflows, Knowledge and Tests in the interface language");
    await click(page.getByTestId("example-gallery").getByRole("link", { name: TRe("library.showAll", { count: 24 }) }));
    await fill(page.getByRole("searchbox", { name: T("library.searchLabel") }), contractName);
    await screen("examples-search");
    await click(page.getByTestId("example-contract-review").getByRole("button").first());
    await page.getByTestId("example-preview").locator(".react-flow__node").first().waitFor();
    await screen("example-preview");
    await click(page.getByRole("button", { name: T("library.copy") }));
    await page.waitForURL(/\/workflows\/wf_/);
    await page.locator(".react-flow__node-agent").first().waitFor();
    await screen("editor");
    check((await startWorkflow().textContent()).trim() === T("editor.run.title"), `J1 the start button reads "${T("editor.run.title")}"`);
    await click(startWorkflow());
    const dialog = page.getByRole("dialog");
    await upload(dialog.locator("input[type=file]").first(), { name: "vertrag.pdf", mimeType: "application/pdf", buffer: pdf("Mietvertrag Muster GmbH") });
    await dialog.getByText("vertrag.pdf").first().waitFor();
    await screen("run-dialog");
    await click(dialog.getByRole("button", { name: T("editor.run.start") }));
    const workflowId = page.url().match(/\/workflows\/(wf_[^/?#]+)/)[1];
    await until(async () => (await api(`/runs?workflow_id=${workflowId}`))[0]?.status === "succeeded", "J1 run succeeded", 60000);
    await page.getByTestId("run-panel").getByText(T("status.succeeded.label"), { exact: true }).first().waitFor({ timeout: 30000 });
    return "run succeeded with the PDF; result in the execution overview";
  });

  // ---- J2 "I want to take an example, understand it, change it and start it" -------------------
  await journey("J2", "Copy, understand, change and start an example", async ({ click, fill }) => {
    // A returning person sees the last run (J1's) under "Continue" on the start page.
    await page.getByTestId("continue-runs").waitFor();
    check(true, "J2: the start page offers the latest run under Continue");
    await screen("start-page-returning");
    // With workflows of their own (J1), the gallery on the start page is a closed section; it opens with one click.
    const folded = page.locator("details[data-section='example-gallery']");
    if ((await folded.count()) && !(await folded.evaluate((element) => element.open))) await click(folded.locator("summary"));
    await click(page.getByTestId("example-gallery").locator(".card", { hasText: blogName }).getByRole("button").first());
    await page.getByTestId("example-preview").locator(".react-flow__node").first().waitFor();
    await click(page.getByRole("button", { name: T("library.copy") }));
    await page.waitForURL(/\/workflows\/wf_/);
    await click(page.locator(".react-flow__node-agent").first());
    await screen("inspector");
    const prompt = page.getByTestId("inspector").locator("textarea").first();
    await fill(prompt, `${await prompt.inputValue()}\nSchreibe in kurzen Sätzen.`);
    await page.getByText(T("editor.canvas.unsaved")).first().waitFor();
    await screen("unsaved");
    await click(save());
    await page.getByText(T("editor.canvas.unsaved")).first().waitFor({ state: "hidden" });
    await click(startWorkflow());
    await click(page.getByRole("dialog").getByRole("button", { name: T("editor.run.start") }));
    const workflowId = page.url().match(/\/workflows\/(wf_[^/?#]+)/)[1];
    await until(async () => (await api(`/runs?workflow_id=${workflowId}`))[0]?.status === "succeeded", "J2 run succeeded", 60000);
    await page.getByTestId("run-panel").getByText(T("status.succeeded.label"), { exact: true }).first().waitFor({ timeout: 30000 });
    return "changed prompt saved, run succeeded";
  });

  // ---- J3 "I want to give an agent knowledge" -------------------------------------------------
  const plain = await api("/workflows", "POST", {
    name: "Kundenfragen beantworten",
    nodes: [
      { id: "start", type: "start", position: { x: 0, y: 0 } },
      { id: "answer", type: "agent", label: "Beantworter", position: { x: 300, y: 0 }, agent: { name: "Beantworter", system_prompt: "Beantworte Kundenfragen." } },
      { id: "out", type: "output", position: { x: 600, y: 0 } },
    ],
    edges: [
      { id: "a", source: "start", target: "answer" },
      { id: "b", source: "answer", target: "out" },
    ],
  });
  await journey("J3", "Give an agent knowledge", async ({ click, upload }) => {
    await click(page.locator("a.card__main", { hasText: "Kundenfragen beantworten" }).first());
    await click(page.locator(".react-flow__node-agent").first());
    await click(page.locator('[data-section="knowledge"] .section__title'));
    // With an empty knowledge base the section says to upload under Knowledge first and links there. J1 copied an
    // example that brings its own knowledge file, so the section lists files instead: go there via the navigation.
    // Wait until the section has loaded the knowledge list: either the hint link or the file search is shown.
    const section = page.locator('[data-section="knowledge"]');
    const hint = section.getByRole("link", { name: linkText("agent.knowledge.noFiles") });
    await hint.or(section.getByRole("textbox")).first().waitFor();
    await screen("inspector-knowledge");
    await click((await hint.count()) ? hint : navLink("nav.knowledge"));
    await page.getByRole("heading", { name: T("nav.knowledge"), exact: true }).waitFor();
    await upload(page.locator("main input[type=file]").first(), { name: "preise.md", mimeType: "text/markdown", buffer: Buffer.from("# Preise\n\nDas Abo kostet 9 Euro im Monat.\n") });
    await page.getByText("preise.md").first().waitFor();
    await screen("knowledge-page");
    await click(workflowsLink());
    await click(page.locator("a.card__main", { hasText: "Kundenfragen beantworten" }).first());
    await click(page.locator(".react-flow__node-agent").first());
    const knowledge = page.locator('[data-section="knowledge"]');
    if (!(await knowledge.evaluate((element) => element.open))) await click(knowledge.locator(".section__title"));
    await click(knowledge.getByText("preise.md").first());
    await click(save());
    const saved = await until(async () => {
      const workflow = await api(`/workflows/${plain.id}`);
      const node = workflow.nodes.find((item) => item.id === "answer");
      return node.agent.knowledge.file_ids.length === 1 ? workflow : null;
    }, "knowledge file assigned and saved");
    check(Boolean(saved), "J3 the file is assigned to the agent");
    return "file uploaded and assigned to the agent, saved";
  });

  // ---- J3b the same task, uploading from the agent's Knowledge section (UX-K) ----------------
  const second = await api("/workflows", "POST", {
    name: "Supportfragen beantworten",
    nodes: [
      { id: "start", type: "start", position: { x: 0, y: 0 } },
      { id: "answer", type: "agent", label: "Support", position: { x: 300, y: 0 }, agent: { name: "Support", system_prompt: "Beantworte Supportfragen." } },
      { id: "out", type: "output", position: { x: 600, y: 0 } },
    ],
    edges: [
      { id: "a", source: "start", target: "answer" },
      { id: "b", source: "answer", target: "out" },
    ],
  });
  await journey("J3b", "Give an agent knowledge, uploading in the inspector", async ({ click, upload }) => {
    await click(page.locator("a.card__main", { hasText: "Supportfragen beantworten" }).first());
    await click(page.locator(".react-flow__node-agent").first());
    await click(page.locator('[data-section="knowledge"] .section__title'));
    await upload(page.getByTestId("agent-knowledge-file"), { name: "faq.md", mimeType: "text/markdown", buffer: Buffer.from("# FAQ\n\nVersand dauert zwei Tage.\n") });
    await page.locator('[data-section="knowledge"] .chip', { hasText: "faq.md" }).waitFor();
    await screen("inspector-uploaded");
    await click(save());
    await until(async () => {
      const workflow = await api(`/workflows/${second.id}`);
      return workflow.nodes.find((item) => item.id === "answer").agent.knowledge.file_ids.length === 1;
    }, "uploaded file assigned and saved");
    check((await api("/knowledge")).some((file) => file.name === "faq.md"), "J3b the file is stored in Knowledge");
    return "file uploaded in the inspector, stored in Knowledge, assigned and saved";
  });

  // ---- "Used in" (UX-7), outside the journeys so their counts stay comparable ------------------
  await outside("UX-7", "Knowledge names the users of a file", async () => {
    await page.goto(base + "/knowledge");
    const faqRow = page.locator(".file-row", { hasText: "faq.md" });
    await faqRow.locator(".used-by a", { hasText: "Supportfragen beantworten / Support" }).waitFor();
    check(true, "Knowledge names the agent that uses a file");
    await screen("knowledge-used-by");
    await faqRow.getByRole("button", { name: T("knowledge.deleteFile", { name: "faq.md" }) }).click();
    const deleteDialog = page.getByRole("dialog");
    await deleteDialog.getByText(T("usedBy.warning", { count: 1 })).waitFor();
    check((await deleteDialog.textContent()).includes("Supportfragen beantworten / Support"), "The delete dialog names the users");
    await screen("delete-dialog");
    await deleteDialog.getByRole("button", { name: T("common.cancel") }).click();
    check((await api("/knowledge")).some((file) => file.name === "faq.md"), "Cancelling keeps the file");
    await faqRow.locator(".used-by a").first().click();
    await page.waitForURL(/\/workflows\/.+\?node=answer/);
    check(true, "A user link opens the workflow at the agent");
  });

  // ---- J4 "My workflow does not start: where is the problem and how do I fix it?" -------------
  // A design-time problem (quality check without criteria) blocks the start; the run itself cannot fail with a
  // model that answers everything.
  await api("/workflows", "POST", {
    name: "Antwort mit Prüfung",
    nodes: [
      { id: "start", type: "start", position: { x: 0, y: 0 } },
      {
        id: "writer",
        type: "agent",
        label: "Schreiber",
        position: { x: 300, y: 0 },
        agent: { name: "Schreiber", system_prompt: "Schreibe eine Antwort.", quality: { enabled: true, criteria: [], max_revisions: 1, judge_model: "claude-sonnet-5-5" } },
      },
      { id: "out", type: "output", position: { x: 600, y: 0 } },
    ],
    edges: [
      { id: "a", source: "start", target: "writer" },
      { id: "b", source: "writer", target: "out" },
    ],
  });
  await journey("J4", "Find and fix why a workflow does not start", async ({ click, fill }) => {
    await click(page.locator("a.card__main", { hasText: "Antwort mit Prüfung" }).first());
    const start = startWorkflow();
    await until(async () => await start.isDisabled(), "start is blocked");
    await screen("start-blocked");
    // The editor lists the problem; it selects the agent, and the inspector names the section that holds it.
    await click(page.getByRole("button", { name: new RegExp(`Schreiber: ${escapeRe(T("errors.config.quality_no_criteria"))}`) }).first());
    await screen("problem-selected");
    const sectionChip = `${T("agent.quality.title")}: ${T("common.sectionErrors", { count: 1 })}`;
    await click(page.getByRole("button", { name: new RegExp(escapeRe(sectionChip)) }));
    const quality = page.locator('[data-section="quality"]');
    await click(quality.getByRole("button", { name: new RegExp(escapeRe(T("agent.quality.addCriterion"))) }));
    await fill(quality.locator("input").last(), "korrekt");
    await until(async () => !(await start.isDisabled()), "start enabled after the fix");
    return "problem located, criterion added, start enabled";
  });

  // ---- J5 "I want to set an advanced property precisely" --------------------------------------
  await journey("J5", "Set an advanced property precisely", async ({ click, fill }) => {
    await click(page.locator("a.card__main", { hasText: "Kundenfragen beantworten" }).first());
    await click(page.locator(".react-flow__node-agent").first());
    const advanced = page.locator('[data-section="advanced"]');
    await click(advanced.locator(".section__title"));
    await screen("advanced-open");
    await fill(field(T("agent.advanced.maxTokens"))(advanced).locator("input"), "2000");
    await advanced.locator("summary").getByText(T("agent.summary.limits"), { exact: false }).waitFor();
    await click(save());
    await until(async () => {
      const workflow = await api(`/workflows/${plain.id}`);
      return workflow.nodes.find((item) => item.id === "answer").agent.max_tokens === 2000;
    }, "max tokens saved");
    return "max tokens set and named in the closed summary";
  });

  // The copy of the contract example (J1) and its test series, by name in this language.
  const contractCopy = async () => {
    const workflow = (await api("/workflows")).find((item) => item.name.includes(contractName));
    if (!workflow) throw new Error(`No copy of "${contractName}" (J1)`);
    return workflow;
  };
  const publishReady = () =>
    page.getByText(new RegExp(["publish.check.ready", "publish.check.ok"].map((key) => TRe(key).source).join("|"), "i"));

  // ---- J6 "Can I trust this workflow version on quality, cost and allowed actions?" -----------
  await journey("J6", "Check quality, cost and allowed actions of a version", async ({ click }) => {
    const copy = await contractCopy();
    const suites = await api(`/benchmarks?workflow_id=${copy.id}`);
    if (!suites.length) throw new Error(`The copy of "${contractName}" has no test series`);
    await click(page.locator("a.card__main", { hasText: contractName }).first());
    await page.locator(".react-flow__node-agent").first().waitFor();
    await click(page.getByRole("link", { name: T("nav.tests"), exact: true }));
    await click(page.getByRole("link", { name: suites[0].name }).first());
    await screen("test-series");
    await click(page.getByRole("button", { name: T("automation.benchmark.run") }));
    await screen("benchmark-dialog");
    await click(page.getByRole("dialog").getByRole("button", { name: TRe("automation.benchmark.start") }));
    // "passed": the pass counts of the run or the pass badge of a case.
    const passedText = new RegExp(`${TRe("automation.benchmark.passCounts").source}|^${escapeRe(T("automation.benchmark.passed"))}$`, "i");
    await page.getByText(passedText).first().waitFor({ timeout: 60000 });
    await screen("test-result");
    await click(workflowsLink());
    await click(page.locator("a.card__main", { hasText: contractName }).first());
    await page.locator(".react-flow__node-agent").first().waitFor();
    await click(page.getByRole("button", { name: T("publish.button") }));
    await publishReady().first().waitFor();
    return "test series results seen, release pre-check seen";
  });

  // ---- J6b: J6's check once a result exists, read in the publish dialog (Q-1) --------------------
  // Running the series still happens on the test page (J6); this measures checking the version before publishing.
  await journey("J6b", "Check quality and allowed actions of a tested version in the publish dialog", async ({ click }) => {
    await click(page.locator("a.card__main", { hasText: contractName }).first());
    await page.locator(".react-flow__node-agent").first().waitFor();
    await click(page.getByRole("button", { name: T("publish.button") }));
    await publishReady().first().waitFor();
    const row = page.getByRole("dialog").getByTestId("test-status-row").first();
    await row.getByText(TRe("testStatus.passed")).waitFor();
    return "test result of this version seen in the publish dialog, release pre-check seen";
  });

  softCheck(errors.length === 0, `No browser errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
} finally {
  await browser.close();
}

const LIMITS = [
  "Interface cost only: a script that knows every label never searches, hesitates or takes a wrong turn.",
  "No statement about comprehension or satisfaction; that needs moderated task tests (decision D7).",
  `Chromium, ${LANGUAGE_NAMES[LANG]} interface, 1500x940 window; other languages and narrow windows can differ.`,
  "A model that answers every request instantly: no waiting for a real provider, no failing runs.",
  "Seconds depend on the machine and are informational only.",
];
const cell = (value) => (value === undefined ? "–" : value);
const table = [
  "| Journey | Task | Actions | Dialogs | Page changes | Controls at goal | Seconds |",
  "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
  ...results.map((r) =>
    r.failed
      ? `| ${r.id} | ${r.task} (**not reached**) | ${cell(r.actions)} | – | – | – | ${cell(r.seconds)} |`
      : `| ${r.id} | ${r.task} | ${r.actions} | ${r.dialogs} | ${r.pages} | ${r.controls} | ${r.seconds} |`,
  ),
].join("\n");
const failedChecks = checks.filter((item) => !item.ok);
console.log(`\n${table}\n`);
console.log(`${LANG}: ${checks.length - failedChecks.length} checks passed, ${failedChecks.length} failed`);
if (reportDir) {
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(join(reportDir, "journeys.json"), JSON.stringify({ base, language: LANG, results, checks, limits: LIMITS }, null, 2) + "\n");
  const goals = results.map((r) => (r.failed ? `- **${r.id}:** not reached: ${r.error}` : `- **${r.id}:** ${r.goal}`)).join("\n");
  const limits = LIMITS.map((line) => `- ${line}`).join("\n");
  const failures = failedChecks.length
    ? `\n\n## Failed checks\n\n${failedChecks.map((item) => `- ${item.journey}: ${item.message}${item.detail ? `: ${item.detail}` : ""}`).join("\n")}`
    : "";
  writeFileSync(
    join(reportDir, "journeys.md"),
    `# Journey report\n\n${table}\n\n## Goals reached\n\n${goals}${failures}\n\n## What this cannot show\n\n${limits}\n`,
  );
}
if (failedChecks.length || results.some((r) => r.failed)) process.exitCode = 1;
