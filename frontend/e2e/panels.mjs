// Browser test of the workflow editor's three panels (building blocks, properties, execution overview)
// against tests/e2e_flow_server.py, whose agents answer from a script (no API key, nothing paid).
// Covers hiding and showing, resizing by pointer and keyboard, bounds, persistence across reloads and
// workflows, small windows, the assistant, and that layout changes never touch the workflow: no unsaved
// changes, no undo step, no interrupted run, no lost selection. Also checks drop position and drag undo.
// Usage: node e2e/panels.mjs [baseUrl] [screenshotDir]

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8040";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1500, height: 940 }, locale: "en-US" });
const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

async function shot(name) {
  if (shots) await page.screenshot({ path: join(shots, `${name}.png`) });
}

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`ok  ${message}`);
}

async function api(path, method = "GET", data) {
  const response = await page.request.fetch(base + "/api" + path, { method, data });
  if (!response.ok()) throw new Error(`${method} ${path}: ${response.status()} ${await response.text()}`);
  return response.status() === 204 ? null : response.json();
}

async function until(probe, message, timeout = 20000) {
  const deadline = Date.now() + timeout;
  for (;;) {
    const value = await probe();
    if (value) return value;
    if (Date.now() > deadline) throw new Error(`Timed out: ${message}`);
    await page.waitForTimeout(100);
  }
}

const box = async (locator) => (await locator.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
const palette = page.getByTestId("palette");
const inspector = page.getByTestId("inspector");
const runPanel = page.getByTestId("run-panel");
const canvas = page.locator(".editor__canvas");
const status = page.locator(".canvas-status");
const unsaved = async () => (await status.getAttribute("data-dirty")) !== null;
const storedLayout = () => page.evaluate(() => JSON.parse(localStorage.getItem("nodestro-editor-layout") ?? "null"));

/** Drags a divider by (dx, dy) with real pointer events, in small steps like a person would. */
async function drag(testId, dx, dy) {
  const handle = await box(page.getByTestId(testId));
  const x = handle.x + handle.width / 2;
  const y = handle.y + Math.min(handle.height / 2, 200);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 12 });
  await page.mouse.up();
}

const agent = (id, name) => ({ id, type: "agent", label: name, position: { x: 0, y: 0 }, agent: { name, system_prompt: "SUMMARY please." } });
const chain = (count) => {
  const nodes = [{ id: "start", type: "start", position: { x: 0, y: 0 } }];
  const edges = [];
  for (let index = 1; index <= count; index += 1) {
    nodes.push({ ...agent(`a${index}`, `Step ${index}`), position: { x: index * 280, y: (index % 2) * 140 } });
    edges.push({ id: `e${index}`, source: index === 1 ? "start" : `a${index - 1}`, target: `a${index}` });
  }
  return { nodes, edges };
};

try {
  await api("/settings", "PUT", { providers: { anthropic: { api_key: "e2e-placeholder-not-a-key" } } });
  const first = await api("/workflows", "POST", { name: "Panels", ...chain(3) });
  const long = await api("/workflows", "POST", { name: "Long run", ...chain(12) });

  // ---- 1. defaults --------------------------------------------------------------------------
  await page.goto(`${base}/workflows/${first.id}`);
  await page.locator(".react-flow__node").first().waitFor();
  await page.evaluate(() => localStorage.removeItem("nodestro-editor-layout"));
  await page.reload();
  await page.locator(".react-flow__node").first().waitFor();
  check((await box(palette)).width > 200 && (await box(inspector)).width > 280, "Wide windows start with all panels open");
  check(!(await unsaved()), "A freshly opened workflow is saved");
  await shot("panels-01-default");

  // ---- 2. resizing by pointer ------------------------------------------------------------------
  const inspectorBefore = (await box(inspector)).width;
  await drag("splitter-inspector", -120, 0);
  const inspectorAfter = (await box(inspector)).width;
  check(Math.abs(inspectorAfter - inspectorBefore - 120) <= 2, `Dragging the inspector divider widens it (${inspectorBefore} → ${inspectorAfter})`);
  check(
    (await page.getByTestId("splitter-inspector").getAttribute("aria-valuenow")) === String(Math.round(inspectorAfter)),
    "The divider reports its size to assistive technology",
  );
  const paletteBefore = (await box(palette)).width;
  await drag("splitter-palette", 40, 0);
  check(Math.abs((await box(palette)).width - paletteBefore - 40) <= 2, "Dragging the palette divider widens the building blocks");
  await drag("splitter-palette", -2000, 0);
  check(Math.round((await box(palette)).width) === 180, "The building blocks stop at their minimum width");
  await drag("splitter-inspector", -3000, 0);
  check((await box(canvas)).width >= 279, "The inspector never pushes the canvas below its minimum width");
  check(!(await unsaved()), "Resizing does not mark the workflow as changed");
  check(
    await page.evaluate(() => getSelection()?.toString() === ""),
    "Dragging a divider selects no text",
  );

  // ---- 3. keyboard, reset, hide and show --------------------------------------------------------
  await page.getByTestId("splitter-inspector").dblclick();
  await page.getByTestId("splitter-palette").dblclick();
  check(Math.round((await box(palette)).width) === 232, "A double-click restores the default width");
  await page.getByTestId("splitter-palette").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Shift+ArrowRight");
  check(Math.round((await box(palette)).width) === 232 + 16 + 64, "Arrow keys resize the focused divider");
  await page.keyboard.press("Home");
  check(Math.round((await box(palette)).width) === 180, "Home moves to the minimum");

  await page.locator(".react-flow__node-agent").first().click();
  await page.getByLabel("Agent name").waitFor();
  await page.getByRole("button", { name: "Hide properties" }).click();
  check((await box(inspector)).width <= 46, "Hiding the properties leaves a narrow rail");
  check(await inspector.getByText("Selected: Step 1").isVisible(), "The rail names the selected node");
  await page.locator(".react-flow__node-agent").nth(1).click();
  check(await inspector.getByText("Selected: Step 2").isVisible(), "Selecting another node keeps the panel hidden and updates the rail");
  await page.locator(".react-flow__node-agent").nth(1).dblclick();
  await page.getByLabel("Agent name").waitFor();
  check((await page.getByLabel("Agent name").inputValue()) === "Step 2", "A double-click on a node shows its properties");
  await page.getByRole("button", { name: "Hide building blocks" }).click();
  check((await box(palette)).width <= 46, "Hiding the building blocks leaves an icon rail");
  check((await palette.locator(".palette__item").count()) >= 7, "The rail still offers the building blocks");
  const nodes = await page.locator(".react-flow__node").count();
  await palette.getByRole("button", { name: "Decision" }).click();
  await until(async () => (await page.locator(".react-flow__node").count()) === nodes + 1, "click on a rail icon adds a node");
  check(true, "Clicking a block in the rail adds it");
  await page.keyboard.press("Control+z");
  await until(async () => (await page.locator(".react-flow__node").count()) === nodes, "undo of the added node");
  await page.getByRole("button", { name: "Show building blocks" }).click();
  await page.getByRole("button", { name: "Hide execution overview" }).click();
  check((await box(runPanel)).height < 60, "The execution overview collapses to its header");
  await page.getByRole("button", { name: "Show execution overview" }).click();
  await shot("panels-02-hidden");

  // ---- 4. drop position and drag undo -----------------------------------------------------------
  await page.getByRole("button", { name: "Zoom out" }).click();
  await page.getByRole("button", { name: "Zoom out" }).click();
  const area = await box(canvas);
  const target = { x: area.x + area.width * 0.55, y: area.y + area.height * 0.75 };
  const before = await page.locator(".react-flow__node").count();
  await palette.locator(".palette__item", { hasText: "Approval" }).dragTo(canvas, {
    targetPosition: { x: target.x - area.x, y: target.y - area.y },
  });
  await until(async () => (await page.locator(".react-flow__node").count()) === before + 1, "dropped node");
  const dropped = await box(page.locator(".react-flow__node-approval").last());
  const centre = { x: dropped.x + dropped.width / 2, y: dropped.y + dropped.height / 2 };
  check(
    Math.abs(centre.x - target.x) < 40 && Math.abs(centre.y - target.y) < 40,
    `A dropped block lands under the pointer when zoomed out (${Math.round(centre.x - target.x)}, ${Math.round(centre.y - target.y)} px)`,
  );
  await page.keyboard.press("Control+z");
  const node = page.locator(".react-flow__node-agent").first();
  const start = await box(node);
  await page.mouse.move(start.x + 30, start.y + 15);
  await page.mouse.down();
  for (let step = 1; step <= 10; step += 1) await page.mouse.move(start.x + 30 + step * 15, start.y + 15 + step * 8);
  await page.mouse.up();
  const moved = await box(node);
  check(moved.x - start.x > 100, "A node follows the pointer while dragged");
  await page.locator(".react-flow__pane").click({ position: { x: 10, y: 60 } });
  await page.keyboard.press("Control+z");
  await page.waitForTimeout(100);
  const back = await box(node);
  check(Math.abs(back.x - start.x) < 1 && Math.abs(back.y - start.y) < 1, "Undo puts a dragged node back where the drag started");
  await page.keyboard.press("Control+Shift+z");
  await page.waitForTimeout(100);
  const redone = await box(node);
  check(Math.abs(redone.x - moved.x) < 1 && Math.abs(redone.y - moved.y) < 1, "Redo moves it to where the drag ended");

  // ---- 5. persistence -----------------------------------------------------------------------------
  await page.getByRole("button", { name: "Discard" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Discard" }).click();
  await until(async () => !(await unsaved()), "discarded");
  await page.getByTestId("splitter-inspector").focus();
  await page.keyboard.press("Shift+ArrowLeft");
  const remembered = Math.round((await box(inspector)).width);
  check((await storedLayout())?.size?.inspector === remembered, "The layout is stored in the browser");
  await page.reload();
  await page.locator(".react-flow__node").first().waitFor();
  check(Math.round((await box(inspector)).width) === remembered, "The layout survives a reload");
  await page.goto(`${base}/workflows/${long.id}`);
  await page.locator(".react-flow__node").first().waitFor();
  check(Math.round((await box(inspector)).width) === remembered, "The layout applies to other workflows");
  await page.evaluate(() => localStorage.setItem("nodestro-editor-layout", '{"open":{"inspector":"x"},"size":{"palette":-50,"runPanel":"tall"}}'));
  await page.reload();
  await page.locator(".react-flow__node").first().waitFor();
  check(
    Math.round((await box(palette)).width) === 180 && (await box(inspector)).width > 280,
    "Broken stored values fall back to valid sizes",
  );

  // ---- 6. a running workflow is not disturbed --------------------------------------------------------
  const run = await api(`/workflows/${long.id}/runs`, "POST", { input: "go", file_ids: [], values: {} });
  await page.reload();
  await page.locator(".react-flow__node").first().waitFor();
  await until(async () => (await runPanel.locator(".run-step").count()) > 0, "the live run in the overview");
  check(await page.getByTestId("splitter-runPanel").isVisible(), "With a run, the overview height can be changed");
  const heightBefore = (await box(runPanel)).height;
  await drag("splitter-runPanel", 0, -150);
  check((await box(runPanel)).height > heightBefore + 100, "The overview grows while the run is live");
  await page.getByRole("button", { name: "Hide execution overview" }).click();
  await page.getByRole("button", { name: "Show execution overview" }).click();
  await drag("splitter-runPanel", 0, -3000);
  check((await box(canvas)).height >= 179, "The overview never pushes the canvas below its minimum height");
  const finished = await until(async () => {
    const current = await api(`/runs/${run.id}`);
    return current.status === "succeeded" || current.status === "failed" ? current : null;
  }, "run finished", 40000);
  check(finished.status === "succeeded", "The run finishes normally while the panels change");
  const steps = await runPanel.locator(".run-step").count();
  check(steps === 13, `The overview keeps every live step (${steps})`);
  check(!(await unsaved()), "A run and panel changes leave the workflow saved");
  await shot("panels-03-run");

  // ---- 7. small windows and the assistant -------------------------------------------------------------
  for (const width of [1280, 1100, 900, 760, 390]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 860 });
    await page.waitForTimeout(250);
    const canvasBox = await box(canvas);
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(canvasBox.width >= 200 && canvasBox.height >= 170 && scroll <= 0, `${width}px: the canvas stays usable (${Math.round(canvasBox.width)}×${Math.round(canvasBox.height)})`);
    const save = await box(page.getByRole("button", { name: "Save" }));
    const editorRight = (await box(page.locator(".editor__main"))).x + (await box(page.locator(".editor__main"))).width;
    check(save.width > 0 && save.x + save.width <= editorRight + 1, `${width}px: no title action hides behind a panel`);
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByTestId("assistant-toggle").click();
  await page.locator(".assistant-panel").waitFor();
  await page.waitForTimeout(250);
  const withAssistant = await box(canvas);
  check(withAssistant.width >= 280, `With the assistant open the canvas keeps its room (${Math.round(withAssistant.width)} px)`);
  const save = await box(page.getByRole("button", { name: "Save" }));
  const assistantLeft = (await box(page.locator(".assistant-panel"))).x;
  const inspectorLeft = (await box(inspector)).x;
  check(save.x + save.width <= Math.min(assistantLeft, inspectorLeft) + 1, "With the assistant open, Save stays visible");
  await shot("panels-04-assistant");
  await page.getByTestId("assistant-toggle").click();

  check(errors.length === 0, `No console errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
} finally {
  await browser.close();
}
