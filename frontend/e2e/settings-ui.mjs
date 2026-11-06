// Browser test of the settings page layout and of tooltips, against a plain Nodestro (no model, nothing paid):
//   nodestro --data-dir "$(mktemp -d)" --no-browser --port 8097
//   node e2e/settings-ui.mjs http://127.0.0.1:8097 [screenshotDir]
//
// Covers:
// - Tooltips inside modal dialogs (the "New workflow" dialog in both modes): every help icon's tooltip is painted on
//   top of the dialog (elementFromPoint), lies inside the window (also at phone width, i.e. high zoom), Escape closes
//   only the tooltip, Enter then Tab leads into its documentation link and out again (no focus trap), readable in light and dark.
// - The settings width: default clearly wider than before, drag the edge, keyboard (arrows, Shift, Home, End),
//   double-click and the reset link, kept after a reload, never wider than the window allows, navigation never
//   overlapping the content, no horizontal scrolling at 1280 px, 800 px and phone width (navigation on top).
// - The settings search: finds single settings by label and help, in German too, opens closed parts, focuses and
//   highlights the hit; says when nothing matches.
// - The settings entry in the top bar: one entry, tooltip, return to the previous page, Ctrl+, there and back,
//   unsaved "Models and budget" edits ask before they are left.

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8097";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const browser = await browserType.launch();
const errors = [];

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`ok  ${message}`);
}

async function open(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: "en-US", ...options });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return { context, page };
}

async function shot(page, name) {
  if (shots) await page.screenshot({ path: join(shots, `${name}.png`) });
}

/** Where the open tooltip is and whether it is the topmost element at several of its points. */
async function tooltipState(page) {
  return page.evaluate(() => {
    const tip = document.querySelector("[role=tooltip]");
    if (!tip) return null;
    const box = tip.getBoundingClientRect();
    const points = [
      [box.left + box.width / 2, box.top + box.height / 2],
      [box.left + 4, box.top + 4],
      [box.right - 4, box.bottom - 4],
    ];
    const onTop = points.every(([x, y]) => tip.contains(document.elementFromPoint(x, y)));
    const style = getComputedStyle(tip);
    return {
      onTop,
      host: tip.parentElement?.tagName,
      inside: box.left >= 0 && box.top >= 0 && box.right <= window.innerWidth && box.bottom <= window.innerHeight,
      width: box.width,
      color: style.color,
      background: style.backgroundColor,
      text: tip.textContent ?? "",
    };
  });
}

function luminance(rgb) {
  const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

async function newWorkflowDialog(page, mode) {
  await page.goto(base);
  await page.getByRole("button", { name: "New workflow" }).first().click();
  const dialog = page.locator("dialog[open]");
  await dialog.waitFor();
  if (mode) await dialog.getByRole("radio", { name: mode }).click();
  return dialog;
}

/** Every help icon of the open dialog shows a complete tooltip above the dialog. */
async function checkDialogTips(page, label) {
  const tips = page.locator("dialog[open] button.help-tip");
  const count = await tips.count();
  check(count > 0, `${label}: the dialog has help icons (${count})`);
  for (let index = 0; index < count; index += 1) {
    const tip = tips.nth(index);
    const name = await tip.getAttribute("aria-label");
    await tip.scrollIntoViewIfNeeded();
    await tip.click();
    await page.locator("[role=tooltip]").waitFor();
    const state = await tooltipState(page);
    check(state.host === "DIALOG", `${label}: "${name}" renders inside the open dialog`);
    check(state.onTop, `${label}: "${name}" is painted on top of the dialog`);
    check(state.inside, `${label}: "${name}" lies completely inside the window`);
    check(state.text.trim().length > 40, `${label}: "${name}" explains more than its label`);
    await page.keyboard.press("Escape");
    await page.locator("[role=tooltip]").waitFor({ state: "detached" });
    check(await page.locator("dialog[open]").isVisible(), `${label}: Escape closes only the tooltip of "${name}", the dialog stays`);
  }
}

try {
  // ---- 1. tooltips in modal dialogs -------------------------------------------------------------------------
  {
    const { context, page } = await open({ viewport: { width: 1500, height: 940 } });
    await newWorkflowDialog(page, "Create with AI");
    // The reported case: "Write missing tools as drafts" in New workflow → Create with AI.
    await page.getByRole("button", { name: "Help: Write missing tools as drafts" }).click();
    const state = await tooltipState(page);
    check(state && state.onTop && state.inside, "Create with AI: the tooltip of 'Write missing tools as drafts' is fully visible above the dialog");
    await shot(page, "tooltip-architect-dialog");
    await page.keyboard.press("Escape");
    await checkDialogTips(page, "Create with AI");

    // Keyboard: focus shows the tooltip, Enter + Tab goes into its link and on to the next control (no trap).
    const help = page.getByRole("button", { name: "Help: Write missing tools as drafts" });
    await page.getByLabel("Describe your goal").click();
    for (let step = 0; step < 6 && !(await help.evaluate((element) => element === document.activeElement)); step += 1) {
      await page.keyboard.press("Tab");
    }
    check(await help.evaluate((element) => element === document.activeElement), "keyboard: the help icon is reached with Tab");
    await page.locator("[role=tooltip]").waitFor();
    check(true, "keyboard: focus shows the tooltip");
    const link = page.locator("[role=tooltip] a");
    if (await link.count()) {
      // A tooltip shown by passing focus keeps the normal Tab order; Enter opens it on purpose and Tab enters its link.
      await page.keyboard.press("Enter");
      await page.locator("[role=tooltip]").waitFor();
      await page.keyboard.press("Tab");
      check(await link.evaluate((element) => element === document.activeElement), "keyboard: Tab leads into the tooltip's documentation link");
      await page.keyboard.press("Tab");
      const after = await page.evaluate(() => ({
        inTip: Boolean(document.activeElement?.closest("[role=tooltip]")),
        inDialog: Boolean(document.activeElement?.closest("dialog[open]")),
      }));
      check(!after.inTip && after.inDialog, "keyboard: the next Tab leaves the tooltip for the next control of the dialog");
    }
    await page.keyboard.press("Escape");
    await newWorkflowDialog(page, "Manually");
    if (await page.locator("dialog[open] button.help-tip").count()) await checkDialogTips(page, "Manually");
    await context.close();
  }
  for (const [label, options] of [
    ["phone width (like 200 % zoom)", { viewport: { width: 360, height: 640 } }],
    ["dark mode", { viewport: { width: 1280, height: 800 }, colorScheme: "dark" }],
  ]) {
    const { context, page } = await open(options);
    await newWorkflowDialog(page, "Create with AI");
    const help = page.getByRole("button", { name: "Help: Write missing tools as drafts" });
    await help.scrollIntoViewIfNeeded();
    await help.click();
    const state = await tooltipState(page);
    check(state.onTop && state.inside, `${label}: the tooltip is on top and inside the window`);
    check(contrast(state.color, state.background) >= 4.5, `${label}: the tooltip text has a contrast of at least 4.5:1`);
    await shot(page, `tooltip-architect-dialog-${label.startsWith("dark") ? "dark" : "phone"}`);
    await context.close();
  }

  // ---- 2. the settings width ----------------------------------------------------------------------------------
  {
    const { context, page } = await open();
    await page.goto(`${base}/settings`);
    await page.locator("#settings-about").waitFor();
    const layout = () =>
      page.evaluate(() => {
        const content = document.querySelector(".settings").getBoundingClientRect();
        const nav = document.querySelector(".settings-nav").getBoundingClientRect();
        const separator = document.querySelector("[role=separator][data-testid=settings-resizer]");
        const main = document.querySelector(".content");
        return {
          content: Math.round(content.width),
          contentRight: content.right,
          navLeft: nav.left,
          navRight: nav.right,
          valueNow: Number(separator?.getAttribute("aria-valuenow")),
          valueMax: Number(separator?.getAttribute("aria-valuemax")),
          stored: localStorage.getItem("nodestro-settings-width"),
          overflow: main.scrollWidth > main.clientWidth + 1,
        };
      });
    let now = await layout();
    check(now.content === 1120, `1920 px: the content is 1120 px wide by default (was 760), got ${now.content}`);
    check(now.navLeft >= now.contentRight && now.navRight <= 1920, "1920 px: the navigation stands right of the content, inside the window");
    check(now.valueNow === now.content, "the separator reports the shown width (aria-valuenow)");
    await shot(page, "settings-1920-default");

    const handle = page.getByTestId("settings-resizer");
    const box = await handle.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + 200, { steps: 6 });
    await page.mouse.move(box.x + box.width / 2 + 200, box.y + 200, { steps: 6 });
    await page.mouse.up();
    now = await layout();
    check(Math.abs(now.content - 1320) <= 2, `dragging the edge 200 px to the right widens the content to ~1320 px (${now.content})`);
    check(now.stored === String(now.content), "the dragged width is stored");
    await page.reload();
    await page.locator("#settings-about").waitFor();
    now = await layout();
    check(Math.abs(now.content - 1320) <= 2, "the width is kept after a reload");
    await shot(page, "settings-1920-resized-wide");

    // Far beyond the room: the content stops where the navigation still fits.
    const wide = await handle.boundingBox();
    await page.mouse.move(wide.x + 8, wide.y + 200);
    await page.mouse.down();
    await page.mouse.move(wide.x + 1200, wide.y + 200, { steps: 8 });
    await page.mouse.up();
    now = await layout();
    check(now.navRight <= 1920 + 0.5 && now.navLeft >= now.contentRight, `the widest drag keeps the navigation inside the window (content ${now.content} px)`);
    check(!now.overflow, "no horizontal scrolling at the widest width");
    check(now.valueMax === now.content, "aria-valuemax is the largest width the window allows");

    // Keyboard.
    await handle.focus();
    await page.keyboard.press("Home");
    now = await layout();
    check(now.content === 560, "Home: the smallest width (560 px)");
    await page.keyboard.press("ArrowRight");
    check((await layout()).content === 576, "ArrowRight: 16 px wider");
    await page.keyboard.press("Shift+ArrowRight");
    check((await layout()).content === 656, "Shift+ArrowRight: 80 px wider");
    await page.keyboard.press("ArrowLeft");
    check((await layout()).content === 640, "ArrowLeft: 16 px narrower");
    await page.keyboard.press("End");
    now = await layout();
    check(now.content === now.valueMax, "End: the largest width that fits");

    // Back to the standard width: the reset link and a double-click.
    await page.getByTestId("settings-width-reset").click();
    now = await layout();
    check(now.content === 1120 && now.stored === null, "the reset link restores the standard width and forgets the stored one");
    check((await page.getByTestId("settings-width-reset").count()) === 0, "the reset link is only offered for a changed width");
    await handle.focus();
    await page.keyboard.press("Home");
    await handle.dblclick();
    check((await layout()).content === 1120, "a double-click on the edge restores the standard width");

    // Other window sizes.
    for (const [width, height] of [[2560, 1440], [1280, 800]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(150);
      now = await layout();
      check(now.navLeft >= now.contentRight && now.navRight <= width + 0.5 && !now.overflow, `${width} px: navigation beside the content, nothing overlaps or scrolls sideways`);
      await shot(page, `settings-${width}`);
    }
    for (const [width, height] of [[800, 900], [375, 740]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(150);
      const narrow = await page.evaluate(() => {
        // The bar is sticky: compare at the top of the page.
        document.querySelector(".content").scrollTo(0, 0);
        const nav = document.querySelector(".settings-nav").getBoundingClientRect();
        const content = document.querySelector(".settings").getBoundingClientRect();
        const main = document.querySelector(".content");
        return {
          navOnTop: nav.bottom <= content.top + 1,
          separator: getComputedStyle(document.querySelector(".settings-resizer")).display,
          overflow: main.scrollWidth > main.clientWidth + 1,
          clipped: [...document.querySelectorAll(".settings button, .settings input, .settings select")]
            .filter((element) => element.getClientRects().length)
            .filter((element) => element.getBoundingClientRect().right > main.getBoundingClientRect().right + 1)
            // A wide table scrolls inside its own frame (WCAG 1.4.10): its controls are reached by scrolling it.
            .filter((element) => {
              for (let parent = element.parentElement; parent && parent !== main; parent = parent.parentElement) {
                if (["auto", "scroll"].includes(getComputedStyle(parent).overflowX)) return false;
              }
              return true;
            })
            .map((element) => element.outerHTML.slice(0, 80)),
        };
      });
      check(narrow.navOnTop && narrow.separator === "none", `${width} px: the navigation stands above the content, the edge is hidden`);
      check(!narrow.overflow, `${width} px: the page does not scroll sideways`);
      check(narrow.clipped.length === 0, `${width} px: no control reaches past the window (${narrow.clipped.join(", ")})`);
      const select = page.getByTestId("settings-nav-select");
      check(await select.isVisible(), `${width} px: "Go to section" is offered instead of the list`);
      await shot(page, `settings-${width}`);
    }
    await page.getByTestId("settings-nav-select").selectOption("settings-language");
    await page.waitForURL(/#settings-language$/);
    check(true, "Go to section: choosing a section jumps there");
    await shot(page, "settings-375-jumped");
    await context.close();
  }

  // ---- 3. the settings search ---------------------------------------------------------------------------------
  {
    const { context, page } = await open();
    await page.goto(`${base}/settings`);
    await page.locator("#settings-about").waitFor();
    const input = page.getByTestId("settings-search-input");
    await input.fill("deadline");
    const first = page.getByTestId("settings-search-hit").first();
    await first.waitFor();
    check((await first.innerText()).includes("Budget decision deadline"), "search: 'deadline' finds the budget decision deadline");
    await shot(page, "settings-search-results");
    await input.press("Enter");
    const focused = await page.evaluate(() => ({
      field: document.activeElement?.closest(".field")?.querySelector("label")?.textContent ?? "",
      highlighted: Boolean(document.activeElement?.closest(".settings-hit")),
    }));
    check(focused.field.includes("Budget decision deadline") && focused.highlighted, "search: Enter focuses and highlights the setting");
    await shot(page, "settings-search-hit");

    await input.fill("base url compatible");
    await page.getByTestId("settings-search-hit").first().waitFor();
    await input.press("Enter");
    const opened = await page.evaluate(() => Boolean(document.activeElement?.closest("details[open]")));
    check(opened, "search: a setting inside a closed provider section is found and its section opened");

    await input.fill("qwertzuiop");
    await page.getByText("No setting matches “qwertzuiop”").waitFor();
    check(true, "search: says when nothing matches");
    await context.close();
  }
  {
    const { context, page } = await open({ locale: "de-DE" });
    await page.goto(`${base}/settings`);
    await page.locator("#settings-about").waitFor();
    await page.getByTestId("settings-search-input").fill("frist budget");
    const first = page.getByTestId("settings-search-hit").first();
    await first.waitFor();
    check((await first.innerText()).includes("Frist für Budget-Entscheidungen"), "search (de): finds the German label");
    await shot(page, "settings-search-de");
    await context.close();
  }

  // ---- 4. the settings entry ----------------------------------------------------------------------------------
  {
    const { context, page } = await open({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${base}/agents`);
    const entry = page.getByTestId("settings-entry");
    await entry.waitFor();
    check((await page.locator(".sidebar a[href^='/settings']").count()) === 0, "entry: one settings entry (the top bar), none left in the navigation");
    await entry.hover();
    await page.locator("[role=tooltip]").waitFor();
    check((await page.locator("[role=tooltip]").innerText()).includes("Ctrl+,"), "entry: the tooltip names the shortcut");
    await shot(page, "settings-entry-tooltip");
    await entry.click();
    await page.waitForURL(/\/settings\?from=%2Fagents/);
    await page.locator("[data-testid=settings-entry][aria-current=page]").waitFor();
    check(true, "entry: marked as the current page on the settings");
    await page.getByTestId("settings-return").click();
    await page.waitForURL(/\/agents$/);
    check(true, "entry: 'Back' returns to the page the settings were opened from");

    await page.goto(`${base}/executions`);
    await page.getByTestId("settings-entry").waitFor();
    await page.keyboard.press("Control+Comma");
    await page.waitForURL(/\/settings\?from=%2Fexecutions/);
    await page.locator("#settings-about").waitFor();
    await page.keyboard.press("Control+Comma");
    await page.waitForURL(/\/executions$/);
    check(true, "entry: Ctrl+, opens the settings and, pressed again, returns");

    // Unsaved edits of "Models and budget" ask before the page is left.
    await page.goto(`${base}/settings`);
    const budget = page.getByRole("spinbutton", { name: "Default budget per run (USD)" });
    await budget.fill("3.5");
    await page.locator(".sidebar").getByRole("link", { name: "Workflows" }).click();
    await page.getByTestId("unsaved-stay").waitFor();
    await shot(page, "settings-unsaved");
    await page.getByTestId("unsaved-stay").click();
    check((await budget.inputValue()) === "3.5", "unsaved: Keep editing keeps the typed value on the settings page");
    await page.locator(".sidebar").getByRole("link", { name: "Workflows" }).click();
    await page.getByTestId("unsaved-discard").click();
    await page.waitForURL(`${base}/`);
    check(true, "unsaved: Discard leaves the page");

    await page.setViewportSize({ width: 375, height: 740 });
    check(await page.getByTestId("settings-entry").isVisible(), "entry: visible in the top bar at phone width");
    await shot(page, "settings-entry-phone");
    await context.close();
  }

  check(errors.length === 0, `no browser errors (${errors.join(" | ")})`);
} finally {
  await browser.close();
}
