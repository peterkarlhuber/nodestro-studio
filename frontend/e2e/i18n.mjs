// Browser check of the interface languages against a running Nodestro (default http://127.0.0.1:8000).
// Usage: node e2e/i18n.mjs [baseUrl] [screenshotDir]
// Covers browser language detection, switching in the settings (immediately, without a workflow run
// or AI request), persistence across reloads, and long texts: every page in every language must
// render without horizontal scrolling and without text that spills out of buttons, tabs or badges.

import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
// Chromium by default; E2E_BROWSER=firefox or webkit runs the same checks in another engine.
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8000";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const LANGUAGES = ["de", "en", "es", "fr", "pt-BR", "it"];
const PAGES = [
  "/", "/workflows/examples", "/workflows/examples?template=financial-analysis", "/agents", "/tools", "/tools?tab=write", "/knowledge",
  "/memory", "/executions", "/approvals", "/batches", "/tests", "/schedules", "/usage", "/docs", "/settings",
];
// Pages named in the navigation: the browser tab names them too ("Approvals · Nodestro Studio").
const TITLED = { "/agents": "agents", "/tools": "tools", "/knowledge": "knowledge", "/memory": "memory", "/executions": "executions",
  "/approvals": "approvals", "/batches": "batches", "/tests": "tests", "/schedules": "schedules", "/usage": "usage", "/settings": "settings" };
const VIEWPORTS = [
  { width: 1500, height: 940 },
  { width: 1100, height: 800 },
];

const localeDir = join(dirname(fileURLToPath(import.meta.url)), "../src/i18n/locales");
const nav = Object.fromEntries(
  LANGUAGES.map((language) => [language, JSON.parse(readFileSync(join(localeDir, language, "nav.json"), "utf8"))]),
);
const errors_ = Object.fromEntries(
  LANGUAGES.map((language) => [language, JSON.parse(readFileSync(join(localeDir, language, "errors.json"), "utf8"))]),
);
const editor = Object.fromEntries(
  LANGUAGES.map((language) => [language, JSON.parse(readFileSync(join(localeDir, language, "editor.json"), "utf8"))]),
);

let failures = 0;
function check(condition, message) {
  if (condition) console.log(`ok    ${message}`);
  else {
    failures += 1;
    console.log(`FAIL  ${message}`);
  }
}

const browser = await browserType.launch();

async function open(options) {
  const context = await browser.newContext({ viewport: VIEWPORTS[0], ...options });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !/Failed to load resource/.test(message.text())) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page, errors };
}

async function settingsLabel(page) {
  return (await page.locator('.sidebar a[href="/settings"]').innerText()).trim();
}

/** Text that does not fit its box: horizontal page scroll, or controls whose label is cut off unannounced. */
async function overflow(page) {
  return page.evaluate(() => {
    const problems = [];
    const root = document.documentElement;
    if (root.scrollWidth > window.innerWidth + 1) problems.push(`page scrolls sideways (${root.scrollWidth}px > ${window.innerWidth}px)`);
    const selector =
      "button, .nd-btn, .nav-item, .nav-group__title, [role=tab], [role=radio], .badge, .chip, .tag, label, th, h1, h2, .page-header *";
    for (const element of document.querySelectorAll(selector)) {
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden" || element.closest("[aria-hidden=true]")) continue;
      if (element.scrollWidth <= element.clientWidth + 1 || element.clientWidth === 0) continue;
      if (style.textOverflow === "ellipsis" || ["auto", "scroll"].includes(style.overflowX)) continue;
      const text = (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
      if (!text) continue;
      problems.push(`<${element.tagName.toLowerCase()} class="${element.className}"> "${text}" ${element.scrollWidth}px > ${element.clientWidth}px`);
    }
    return [...new Set(problems)];
  });
}

try {
  // Detection: a supported browser language is used, anything else falls back to English.
  for (const [locale, expected] of [
    ["fr-FR", "fr"],
    ["pt-PT", "pt-BR"],
    ["ja-JP", "en"],
  ]) {
    const { context, page } = await open({ locale });
    await page.goto(base + "/settings");
    await page.locator(".sidebar").waitFor();
    check((await page.evaluate(() => document.documentElement.lang)) === expected, `browser ${locale} → <html lang="${expected}">`);
    check((await settingsLabel(page)) === nav[expected].settings, `browser ${locale} → navigation in ${expected}`);
    await context.close();
  }

  // No flash of English: every language but English is a chunk of its own, and the first render waits for it.
  // The chunk is held back for a moment so that a render before it arrives would be seen.
  for (const [locale, stored, expected] of [
    ["de-DE", null, "de"],
    ["en-US", "fr", "fr"],
  ]) {
    const { context, page, errors } = await open({ locale });
    if (stored) await page.addInitScript((value) => localStorage.setItem("nodestro-language", value), stored);
    await page.addInitScript(() => {
      window.__navTexts = [];
      new MutationObserver(() => {
        const text = document.querySelector('.sidebar a[href="/settings"]')?.textContent?.trim();
        if (text && window.__navTexts.at(-1) !== text) window.__navTexts.push(text);
      }).observe(document, { subtree: true, childList: true, characterData: true });
    });
    const chunks = [];
    await page.route(/\/assets\/(de|es|fr|it|pt-BR)-[\w-]+\.js$/, async (route) => {
      chunks.push(new URL(route.request().url()).pathname);
      await new Promise((resolve) => setTimeout(resolve, 600));
      await route.continue();
    });
    await page.goto(base + "/");
    await page.locator('.sidebar a[href="/settings"]', { hasText: nav[expected].settings }).waitFor({ timeout: 10000 });
    const seen = await page.evaluate(() => window.__navTexts);
    check(
      seen.length > 0 && seen.every((text) => text === nav[expected].settings),
      `${stored ? `stored ${stored}` : `browser ${locale}`}: the first render is already in ${expected} (seen: ${seen.join(", ")})`,
    );
    check(chunks.length === 1 && chunks[0].includes(`/${expected}-`), `only the ${expected} texts are fetched (${chunks.join(", ")})`);
    check(errors.length === 0, `no console errors while loading ${expected}${errors.length ? `: ${errors.join(" | ")}` : ""}`);
    await context.close();
  }

  // Switching: immediate, stored, and without any request besides saving the setting.
  {
    const { context, page, errors } = await open({ locale: "de-DE" });
    await page.goto(base + "/settings");
    await page.locator("#settings-language-select").waitFor();
    check((await settingsLabel(page)) === nav.de.settings, "German browser starts in German");

    const writes = [];
    page.on("request", (request) => {
      if (request.method() !== "GET") writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
    });
    const navigations = [];
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) navigations.push(frame.url());
    });
    await page.locator("#settings-language-select").selectOption("it");
    await page.locator('.sidebar a[href="/settings"]', { hasText: nav.it.settings }).waitFor({ timeout: 2000 });
    check(true, "switching to Italian updates the navigation immediately");
    check((await page.evaluate(() => document.documentElement.lang)) === "it", '<html lang="it"> after switching');
    await page.waitForTimeout(500);
    check(navigations.length === 0, "switching does not reload the page");
    const unexpected = writes.filter((write) => write !== "PUT /api/settings");
    check(unexpected.length === 0, `switching sends no other request${unexpected.length ? `: ${unexpected.join(", ")}` : ""}`);

    await page.reload();
    await page.locator(".sidebar").waitFor();
    check((await settingsLabel(page)) === nav.it.settings, "the choice survives a reload");
    check((await page.locator("#settings-language-select").inputValue()) === "it", "the picker shows the stored choice");

    // Back to the browser language.
    await page.locator("#settings-language-select").selectOption({ index: 0 });
    await page.locator('.sidebar a[href="/settings"]', { hasText: nav.de.settings }).waitFor({ timeout: 2000 });
    check(true, "automatic follows the browser language again");
    check(errors.length === 0, `no console errors while switching${errors.length ? `: ${errors.join(" | ")}` : ""}`);
    await context.close();
  }

  // The editor check needs a workflow: copy an example (this calls no model).
  const copy = await fetch(`${base}/api/library/financial-analysis/copy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language: "de" }),
  });
  check(copy.status === 201, "An example can be copied without an API key");
  const copied = copy.status === 201 ? await copy.json() : null;

  // A run detail page needs a run: import a small trace of the copied workflow (nothing runs, nothing is billed).
  let runPath = null;
  if (copied) {
    const trace = {
      id: "run_e2e_i18n",
      workflow_id: copied.id,
      workflow_name: copied.name,
      workflow: copied,
      nodes: {},
      status: "failed",
      error: "This run is already queued or executing",
      error_code: "run.already_queued",
      created_at: "2026-01-05T10:00:00Z",
      started_at: "2026-01-05T10:00:01Z",
      finished_at: "2026-01-05T10:00:03Z",
    };
    const imported = await fetch(`${base}/api/runs/import`, { method: "POST", body: JSON.stringify(trace) });
    check(imported.ok, "A trace can be imported for the run detail page");
    if (imported.ok) runPath = `/executions/${(await imported.json()).run.id}`;
  }

  // Long texts: every page in every language, at two window widths.
  for (const language of LANGUAGES) {
    const { context, page, errors } = await open({ locale: "en-US" });
    await page.addInitScript((value) => localStorage.setItem("nodestro-language", value), language);
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      for (const path of runPath ? [...PAGES, runPath] : PAGES) {
        await page.goto(base + path);
        await page.locator(".sidebar").waitFor();
        await page.locator("main h1, .page h1, h1").first().waitFor();
        await page.waitForTimeout(250);
        const problems = await overflow(page);
        check(problems.length === 0, `${language} ${viewport.width}px ${path}${problems.length ? `\n        ${problems.join("\n        ")}` : ""}`);
        if (viewport === VIEWPORTS[0] && TITLED[path]) {
          const title = await page.title();
          check(title === `${nav[language][TITLED[path]]} · Nodestro Studio`, `${language} ${path}: the browser tab says "${title}"`);
        }
        if (viewport === VIEWPORTS[0] && path === runPath) {
          // The coded error of the run reads in the language, not as the generic "step failed" sentence.
          const sentence = errors_[language].run.already_queued;
          check(await page.getByText(sentence, { exact: false }).first().isVisible(), `${language}: the run's error has its own sentence`);
        }
        if (shots && viewport === VIEWPORTS[0]) {
          await page.screenshot({ path: join(shots, `${language}-${path.replace(/[/?=]+/g, "_") || "_"}.png`) });
        }
      }
      // The editor of the first own workflow (not a card of the example gallery).
      await page.goto(base + "/");
      await page.locator(".page__body > .card-grid > .card").first().click();
      await page.locator(".react-flow__node").first().waitFor();
      // In narrow windows the palette may cover a node, so the click goes straight to the node.
      await page.locator(".react-flow__node-agent").first().dispatchEvent("click");
      await page.locator(".inspector").waitFor();
      await page.waitForTimeout(250);
      if (viewport === VIEWPORTS[0]) {
        // The panel controls speak the chosen language, also for screen readers.
        const labels = editor[language].panels;
        const named = async (selector, name) => (await page.locator(selector).first().getAttribute("aria-label")) === name;
        check(
          (await named('[data-testid="splitter-inspector"]', labels.resizeInspector)) &&
            (await named('[data-testid="splitter-palette"]', labels.resizePalette)) &&
            (await named(".inspector__toggle", labels.hideInspector)) &&
            (await named(".palette__toggle", labels.hidePalette)) &&
            (await named(".run-panel__toggle", labels.hideRunPanel)),
          `${language}: panel buttons and dividers are labelled in the language`,
        );
      }
      const problems = await overflow(page);
      check(problems.length === 0, `${language} ${viewport.width}px editor${problems.length ? `\n        ${problems.join("\n        ")}` : ""}`);
      if (shots && viewport === VIEWPORTS[0]) await page.screenshot({ path: join(shots, `${language}-editor.png`) });
    }
    check(errors.length === 0, `${language}: no console errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
    await context.close();
  }
} finally {
  await browser.close();
}

if (failures) {
  console.log(`\n${failures} check(s) failed`);
  process.exit(1);
}
