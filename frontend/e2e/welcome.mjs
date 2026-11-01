// Browser test of the welcome page (/welcome) and its hand-over to the Studio.
// Usage: node e2e/welcome.mjs [baseUrl] [screenshotDir]
// With a screenshot directory it also writes desktop/mobile screenshots in both themes and a short
// video of the intro animation.
// It changes the saved interface language, so it runs against its own Nodestro (scripts/e2e.sh).

import { createRequire } from "node:module";
import { mkdirSync, readFileSync, readdirSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8090";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const here = dirname(fileURLToPath(import.meta.url));
const LANGUAGES = ["de", "en", "fr", "es", "it", "pt-BR"];
const texts = Object.fromEntries(
  LANGUAGES.map((language) => [
    language,
    {
      welcome: JSON.parse(readFileSync(join(here, `../src/i18n/locales/${language}/welcome.json`), "utf8")),
      nav: JSON.parse(readFileSync(join(here, `../src/i18n/locales/${language}/nav.json`), "utf8")),
    },
  ]),
);
const SLOGAN = "Connecting Intelligence";

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`ok  ${message}`);
}

const browser = await browserType.launch();

/**
 * A fresh browser profile. ``person`` hides navigator.webdriver, so the page treats the visit
 * like one by a person (automated browsers skip the first-visit redirect by design).
 */
async function open({ person = false, viewport = { width: 1440, height: 900 }, ...options } = {}) {
  const context = await browser.newContext({ viewport, locale: "de-DE", ...options });
  if (person) await context.addInitScript(() => Object.defineProperty(Navigator.prototype, "webdriver", { get: () => false }));
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page, errors };
}

/** Elements wider than the window (text that does not fit a language or a phone). */
const overflow = (page) =>
  page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const wide = document.documentElement.scrollWidth > width ? [`page ${document.documentElement.scrollWidth}px`] : [];
    for (const element of document.querySelectorAll(".wl *")) {
      const box = element.getBoundingClientRect();
      if (box.width > 0 && (box.right > width + 1 || box.left < -1)) wide.push(`${element.className || element.tagName} ${Math.round(box.left)}–${Math.round(box.right)}`);
      if (element.matches(".wl-chip__title, .wl-run__name, .wl-cta, .nd-button") && element.scrollWidth > element.clientWidth + 1)
        wide.push(`cut: ${element.textContent}`);
    }
    return wide.slice(0, 6);
  });

/** Running animations other than the one-time intro (looping ones). */
const loops = (page) => page.evaluate(() => document.getAnimations().filter((animation) => animation.effect?.getTiming().iterations === Infinity && animation.playState === "running").length);

try {
  // --- First visit and hand-over -------------------------------------------------------------
  {
    const { context, page, errors } = await open({ person: true });
    await page.goto(base + "/");
    await page.waitForURL(/\/welcome$/);
    await page.getByTestId("welcome").waitFor();
    check(true, "The first visit of the start page opens the welcome page");
    check((await page.locator("h1").innerText()).replace(/\s+/g, " ").trim() === SLOGAN, "The page heading is the slogan");
    check((await page.title()) === texts.de.welcome.documentTitle, "The window title names Nodestro and the slogan");
    const icons = await page.evaluate(() => [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]')].map((link) => link.href));
    let served = 0;
    for (const href of icons) if ((await context.request.get(href)).ok()) served += 1;
    check(icons.length >= 5 && served === icons.length, `All ${icons.length} icon and manifest links are served`);
    check(!(await context.request.get(base + "/favicon.svg")).headers()["content-type"]?.includes("svg"), "The old SVG favicon is gone");

    await page.getByTestId("welcome-open-studio").click();
    await page.waitForURL((url) => url.pathname === "/");
    await page.getByRole("heading", { name: "Workflows", exact: true }).waitFor();
    check(true, "Open Studio leads to the workflows");
    check((await page.locator(".topbar .brand__mark").getAttribute("src"))?.includes("nodestro-logo"), "The Studio top bar shows the original logo");
    await page.goBack();
    await page.waitForURL(/\/welcome$/);
    check(true, "Back returns to the welcome page");
    await page.goForward();
    await page.waitForURL((url) => url.pathname === "/");
    await page.getByRole("heading", { name: "Workflows", exact: true }).waitFor();
    check(true, "Forward returns to the Studio without another redirect");
    await page.goto(base + "/");
    await page.getByRole("heading", { name: "Workflows", exact: true }).waitFor();
    check(page.url() === base + "/", "A returning visit opens the Studio directly");
    await page.getByRole("link", { name: texts.de.nav.welcome }).click();
    await page.waitForURL(/\/welcome$/);
    check(true, "The Studio navigation leads back to the welcome page");
    check(errors.length === 0, `no console errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
    await context.close();
  }
  {
    const { context, page } = await open({ person: true });
    await page.goto(base + "/executions");
    await page.locator(".sidebar").waitFor();
    check(new URL(page.url()).pathname === "/executions", "A deep link is never redirected, even on the first visit");
    await page.goto(base + "/");
    await page.getByRole("heading", { name: "Workflows", exact: true }).waitFor();
    check(new URL(page.url()).pathname === "/", "After a deep link the start page is the Studio");
    await context.close();
  }
  {
    const { context, page } = await open();
    await page.goto(base + "/");
    await page.getByRole("heading", { name: "Workflows", exact: true }).waitFor();
    check(new URL(page.url()).pathname === "/", "Automated browsers are not sent to the welcome page");
    await context.close();
  }

  // --- Language and theme stay in step with the Studio -----------------------------------
  {
    const { context, page, errors } = await open();
    await page.goto(base + "/welcome");
    await page.getByTestId("welcome-language").selectOption("fr");
    await page.getByText(texts.fr.welcome.hero.lede).waitFor();
    check((await page.evaluate(() => document.documentElement.lang)) === "fr", "The language picker switches the page at once");
    await page.getByTestId("welcome-theme").click();
    check((await page.evaluate(() => document.documentElement.dataset.theme)) === "light", "The theme button switches to light");
    await page.getByTestId("welcome-nav-studio").click();
    await page.getByRole("link", { name: texts.fr.nav.agents, exact: true }).waitFor();
    check(
      (await page.evaluate(() => [document.documentElement.dataset.theme, localStorage.getItem("nodestro-language")])).join() === "light,fr",
      "The Studio keeps the language and theme chosen on the welcome page",
    );
    const saved = await (await context.request.get(base + "/api/settings")).json();
    check(saved.language === "fr", "The language is also saved in the settings, as in the Studio's own picker");
    await context.request.put(base + "/api/settings", { data: { language: null } });
    check(errors.length === 0, `no console errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
    await context.close();
  }

  // --- Every language at desktop and phone width ------------------------------------------
  for (const language of LANGUAGES) {
    const { context, page, errors } = await open({ reducedMotion: "reduce" });
    await context.addInitScript((value) => localStorage.setItem("nodestro-language", value), language);
    for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }, { width: 320, height: 640 }]) {
      await page.setViewportSize(viewport);
      await page.goto(base + "/welcome");
      await page.getByText(texts[language].welcome.hero.lede).waitFor();
      const heading = (await page.locator("h1").innerText()).replace(/\s+/g, " ").trim();
      const problems = await overflow(page);
      check(heading === SLOGAN && problems.length === 0, `${language} ${viewport.width}px: slogan unchanged, nothing overflows${problems.length ? `\n        ${problems.join("\n        ")}` : ""}`);
    }
    check(errors.length === 0, `${language}: no console errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
    await context.close();
  }

  // --- Motion: loop, pause, off screen, reduced motion, illustration -------------------------
  {
    const { context, page } = await open();
    await page.goto(base + "/welcome");
    await page.waitForTimeout(3000);
    check((await loops(page)) > 0, "The hero loop runs after the intro");
    await page.getByTestId("welcome-motion").click();
    check((await page.getByTestId("welcome").getAttribute("data-motion")) === "paused" && (await loops(page)) === 0, "The pause button stops every loop");
    check((await page.getByTestId("welcome-motion").getAttribute("aria-pressed")) === "true", "The pause button reports its state");
    await page.getByTestId("welcome-motion").click();
    await page.locator("#how").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, document.querySelector("#how").offsetTop));
    await page.waitForFunction(() => document.querySelector(".wl")?.dataset.motion === "offscreen");
    check(true, "The hero loop holds while the hero is off screen");
    await page.waitForFunction(() => document.querySelectorAll('.wl-run__node[data-status="done"]').length === 4, null, { timeout: 10000 });
    check(true, "The illustrated run plays through when it scrolls into view");
    await page.getByTestId("welcome-replay").click();
    await page.waitForFunction(() => document.querySelectorAll('.wl-run__node[data-status="done"]').length === 0);
    await page.waitForFunction(() => document.querySelectorAll('.wl-run__node[data-status="done"]').length === 4, null, { timeout: 10000 });
    check(true, "Play again replays the illustration");
    check((await page.getByText(texts.de.welcome.how.illustration).count()) === 1, "The run is labelled as an illustration");
    await context.close();
  }
  {
    const { context, page } = await open({ reducedMotion: "reduce" });
    await page.goto(base + "/welcome");
    await page.getByTestId("welcome").waitFor();
    await page.waitForTimeout(300);
    const animations = await page.evaluate(() => document.getAnimations().length);
    check(animations === 0, "With reduced motion nothing animates");
    check((await page.getByTestId("welcome-motion").count()) === 0, "With reduced motion there is no pause button to offer");
    check((await page.locator('.wl-run__node[data-status="done"]').count()) === 4, "With reduced motion the illustration shows its final state");
    const visible = await page.evaluate(() => getComputedStyle(document.querySelector(".wl-slogan__word > span")).transform);
    check(visible === "none", "With reduced motion the slogan is in place right away");
    await context.close();
  }

  // --- Keyboard ---------------------------------------------------------------------------
  {
    const { context, page } = await open();
    await page.goto(base + "/welcome");
    await page.getByTestId("welcome").waitFor();
    await page.keyboard.press("Tab");
    check((await page.evaluate(() => document.activeElement?.className)) === "skip-link", "Tab first reaches the skip link");
    const reached = [];
    for (let index = 0; index < 12; index += 1) {
      await page.keyboard.press("Tab");
      reached.push(await page.evaluate(() => document.activeElement?.dataset.testid ?? document.activeElement?.tagName));
    }
    check(reached.includes("welcome-language") && reached.includes("welcome-open-studio"), "Language, theme and Open Studio are reachable by keyboard");
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    check(outline !== "none", "The focused element shows a focus ring");
    await page.getByTestId("welcome-open-studio").focus();
    await page.keyboard.press("Enter");
    await page.waitForURL((url) => url.pathname === "/");
    check(true, "Enter on Open Studio opens the Studio");
    await context.close();
  }

  // --- Screenshots and a video of the real animation --------------------------------------
  if (shots) {
    for (const theme of ["dark", "light"]) {
      for (const [name, viewport, scale] of [
        ["desktop", { width: 1440, height: 900 }, 1],
        ["mobile", { width: 390, height: 844 }, 2],
      ]) {
        const { context, page } = await open({ viewport, deviceScaleFactor: scale });
        await context.addInitScript((value) => localStorage.setItem("nodestro-theme", value), theme);
        await page.goto(base + "/welcome");
        await page.waitForTimeout(4600);
        await page.screenshot({ path: join(shots, `welcome-${name}-${theme}.png`) });
        await page.evaluate(() => window.scrollTo(0, document.querySelector("#how").offsetTop - 40));
        await page.waitForTimeout(5000);
        await page.screenshot({ path: join(shots, `welcome-${name}-${theme}-how.png`) });
        await page.screenshot({ path: join(shots, `welcome-${name}-${theme}-full.png`), fullPage: true });
        await context.close();
      }
    }
    const video = join(shots, "video");
    const { context, page } = await open({ recordVideo: { dir: video, size: { width: 1280, height: 800 } }, viewport: { width: 1280, height: 800 } });
    await page.goto(base + "/welcome");
    await page.waitForTimeout(9500);
    await page.mouse.move(640, 260, { steps: 30 });
    await page.mouse.move(820, 330, { steps: 30 });
    await page.waitForTimeout(1500);
    for (let y = 0; y <= 900; y += 60) {
      await page.mouse.wheel(0, 60);
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(6000);
    await context.close();
    const [file] = readdirSync(video).filter((name) => name.endsWith(".webm"));
    if (file) renameSync(join(video, file), join(shots, "welcome-intro.webm"));
    console.log(`    screenshots and video in ${shots}`);
  }
} finally {
  await browser.close();
}
