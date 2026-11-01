// Accessibility check against a running Nodestro (default http://127.0.0.1:8000), e.g. a plain `nodestro --data-dir …`.
// Usage: node e2e/a11y.mjs [baseUrl] [screenshotDir]
//
// Runs axe-core (WCAG 2.0–2.2 A/AA rules) over the main routes in the dark and the light theme and fails on any
// serious or critical violation; moderate and minor ones are listed. It then checks what axe cannot see: dialog
// focus (initial focus, focus return, Ctrl+K typing), connecting steps with the keyboard, the canvas colour mode,
// the phone navigation and that the executions table never scrolls the whole page.
//
// axe-core comes from AXE_CORE_PATH (axe.min.js or the package folder) or from the frontend devDependency.
// Without it the script reports a skip and exits 0, so it never blocks a machine that has not installed it.

import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);

function axeSource() {
  const fromEnv = process.env.AXE_CORE_PATH;
  const candidates = [];
  if (fromEnv) candidates.push(statSafe(fromEnv)?.isDirectory() ? join(fromEnv, "axe.min.js") : fromEnv);
  try {
    candidates.push(require.resolve("axe-core/axe.min.js"));
  } catch {
    // not installed
  }
  const found = candidates.find((path) => path && existsSync(path));
  return found ? readFileSync(found, "utf8") : null;
}

function statSafe(path) {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

const axe = axeSource();
if (!axe) {
  console.log("skip  axe-core not found (set AXE_CORE_PATH or run npm install in frontend/)");
  process.exit(0);
}

const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];
const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8000";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const FAILING = new Set(["serious", "critical"]);
// Known and tracked, reported but not failing: a help button inside a collapsible section's <summary> (Section's
// `tip`) is a nested control (audit AX-09); moving it out of the summary needs a design decision.
const KNOWN = [{ rules: ["nested-interactive", "target-size"], target: /summary|\.help-tip/ }];
const known = (v) => KNOWN.some((item) => item.rules.includes(v.id) && v.targets.every((target) => item.target.test(target)));
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
let failures = 0;

function check(condition, message) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${message}`);
  } else console.log(`ok  ${message}`);
}

async function api(method, path, body) {
  const response = await fetch(base + "/api" + path, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// A workflow with branches, so the editor shows every kind of port; reuse one from an earlier run.
async function workflowId() {
  const own = await api("GET", "/workflows");
  if (own.length) return own[0].id;
  const examples = await api("GET", "/library?language=en");
  const example = examples.find((item) => /approval|review/i.test(item.id)) ?? examples[0];
  const copy = await api("POST", `/library/${example.id}/copy`, { language: "en" });
  return copy.id;
}

async function scan(page, label) {
  await page.addScriptTag({ content: axe });
  const violations = await page.evaluate(async (tags) => {
    const result = await window.axe.run(document, { runOnly: { type: "tag", values: tags }, resultTypes: ["violations"] });
    return result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.length,
      sample: v.nodes[0]?.target.join(" ") ?? "",
      targets: v.nodes.map((node) => node.target.join(" ")),
    }));
  }, TAGS);
  const bad = violations.filter((v) => FAILING.has(v.impact) && !known(v));
  const other = violations.filter((v) => !FAILING.has(v.impact) || known(v));
  for (const v of bad) console.log(`     ${v.impact} ${v.id} ×${v.nodes} e.g. ${v.sample}`);
  if (other.length) console.log(`info ${label}: ${other.map((v) => `${v.id}(${v.impact}×${v.nodes})`).join(" ")}`);
  check(bad.length === 0, `axe: no serious or critical violations on ${label}`);
}

async function context(browser, { theme = "dark", language = "en", width = 1440, height = 900, ...rest } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, locale: "en-US", ...rest });
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

async function open(page, route) {
  await page.goto(base + route, { waitUntil: "networkidle" });
  await page.locator("main h1, main [role=application], .welcome").first().waitFor({ timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(300);
}

const browser = await browserType.launch();
try {
  const wf = await workflowId();
  // At least one run, so the executions table exists (without a provider key it simply fails).
  if (!(await api("GET", "/runs?limit=1")).length) {
    await api("POST", `/workflows/${wf}/runs`, { input: "Accessibility check", file_ids: [], values: {} }).catch(() => null);
  }
  const routes = [
    "/", "/workflows/examples", `/workflows/${wf}`, "/agents", "/tools", "/knowledge", "/memory", "/executions",
    "/approvals", "/batches", "/tests", "/schedules", "/usage", "/docs/start", "/settings", "/welcome",
  ];

  for (const theme of ["dark", "light"]) {
    const ctx = await context(browser, { theme });
    const page = await ctx.newPage();
    for (const route of routes) {
      await open(page, route);
      await scan(page, `${route} (${theme})`);
    }
    // The canvas follows the app theme, not the OS setting.
    const os = theme === "dark" ? "light" : "dark";
    await page.emulateMedia({ colorScheme: os });
    await open(page, `/workflows/${wf}`);
    const flowClass = (await page.locator(".react-flow").first().getAttribute("class")) ?? "";
    check(flowClass.split(/\s+/).includes(theme), `Canvas uses the ${theme} app theme while the OS is ${os}`);
    if (shots) await page.screenshot({ path: join(shots, `a11y-editor-${theme}.png`) });
    await ctx.close();
  }

  // Dialogs: initial focus and focus return.
  {
    const ctx = await context(browser);
    const page = await ctx.newPage();
    await open(page, `/workflows/${wf}`);
    // API & Export is always available; the run dialog only with a provider key (then its input gets the focus).
    const versions = page.getByTestId("open-api");
    await versions.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    check(await versions.evaluate((element) => element === document.activeElement), "Closing a dialog returns the focus to its button");
    const start = page.getByRole("button", { name: /^(Run|Start)/ }).first();
    if (await start.isEnabled()) {
      await start.focus();
      await page.keyboard.press("Enter");
      await dialog.waitFor();
      await scan(page, "editor + run dialog");
      // The input field, or with a start form its first field or "Choose files"; never the Close button.
      const inBody = await page.evaluate(() => Boolean(document.activeElement?.closest(".modal__body")));
      check(inBody, "The run dialog opens with the focus on its input, not on Close");
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "detached" });
      check(await start.evaluate((element) => element === document.activeElement), "Closing the run dialog returns the focus to Start");
    } else console.log("info Start is disabled (no provider key); run dialog focus not exercised");

    await page.keyboard.press("Control+k");
    await page.getByRole("dialog").waitFor();
    await page.keyboard.type("job");
    check((await page.getByRole("dialog").getByRole("combobox").first().inputValue()) === "job", "Ctrl+K: typing goes into the search field");
    // The first Escape clears the search term, the second closes the dialog.
    await page.keyboard.press("Escape");
    if (await page.getByRole("dialog").count()) await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "detached" });

    // Keyboard connect: Tab reaches the steps before any connection, Enter selects, the inspector connects.
    check((await page.locator('.react-flow__edge[tabindex="0"]').count()) === 0, "Connections are not Tab stops before the steps");
    const names = await page.locator(".react-flow__node").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label") ?? ""));
    check(names.length > 0 && names.every(Boolean), "Every step on the canvas has an accessible name");
    const edgesBefore = await page.locator(".react-flow__edge").count();
    const node = page.locator(".react-flow__node").first();
    await node.focus();
    await page.keyboard.press("Enter");
    const panel = page.getByTestId("node-connections");
    await panel.waitFor();
    const target = panel.getByTestId("connect-target");
    const options = await target.locator("option").evaluateAll((items) => items.map((item) => item.value).filter(Boolean));
    if (options.length) {
      await target.selectOption(options[0]);
      await panel.getByTestId("connect-create").focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction((n) => document.querySelectorAll(".react-flow__edge").length > n, edgesBefore);
      check(true, "A step is connected with the keyboard through Connections in the inspector");
      await page.keyboard.press("Control+z");
    } else console.log("info the first step has no free target; keyboard connect not exercised");
    const description = await page.evaluate(() => document.querySelector('[id^="react-flow__node-desc"]')?.textContent ?? "");
    check(!/Press enter or space to select a node/.test(description), "React Flow's screen-reader help is the app's own text");
    await ctx.close();
  }

  // Phones: the navigation opens from a menu button, and the executions table stays inside the page.
  {
    const ctx = await context(browser, { theme: "light", width: 390, height: 844, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await open(page, "/executions");
    const toggle = page.getByTestId("nav-toggle");
    check(await toggle.isVisible(), "Phones show a menu button for the navigation");
    await toggle.click();
    const links = page.locator("#main-navigation a");
    let reachable = 0;
    for (const link of await links.all()) {
      await link.scrollIntoViewIfNeeded();
      const box = await link.boundingBox();
      if (box && box.width > 0 && box.x >= 0 && box.x + box.width <= 390 && box.y >= 0 && box.y + box.height <= 844) reachable += 1;
    }
    check(reachable === (await links.count()), `Every navigation item is reachable on screen in the phone menu (${reachable})`);
    const header = await page.evaluate(() => {
      const bar = document.querySelector(".topbar");
      return [...bar.querySelectorAll("a, button")].filter((item) => item.getBoundingClientRect().right > window.innerWidth + 1).length;
    });
    check(header === 0, "Every header control fits on a 390px screen");
    await links.first().scrollIntoViewIfNeeded();
    if (shots) await page.screenshot({ path: join(shots, "a11y-phone-nav.png") });
    await page.keyboard.press("Escape");
    check(!(await page.locator("#main-navigation").isVisible()), "Escape closes the phone menu");
    const width = await page.evaluate(() => document.scrollingElement.scrollWidth);
    check(width <= 391, `Executions at 390px: no page-level horizontal scroll (${width})`);
    if (shots) await page.screenshot({ path: join(shots, "a11y-executions-390.png") });
    await ctx.close();
  }
  for (const [language, width, zoom] of [["pt-BR", 1280, 1], ["de", 768, 1], ["en", 640, 2]]) {
    const ctx = await context(browser, { language, width: width, height: 800, deviceScaleFactor: zoom });
    const page = await ctx.newPage();
    await open(page, "/executions");
    const scroll = await page.evaluate(() => document.scrollingElement.scrollWidth);
    check(scroll <= width + 1, `Executions in ${language} at ${width}px: no page-level horizontal scroll (${scroll})`);
    await ctx.close();
  }
} finally {
  await browser.close();
}

if (failures) {
  console.log(`\n${failures} accessibility check(s) failed`);
  process.exit(1);
}
console.log("\nall accessibility checks passed");
