// Browser test of the live reasoning display against tests/e2e_assistant_server.py, whose model streams
// Claude-shaped summarized thinking for "Denk nach…" (no API key, nothing paid).
// Usage: node e2e/reasoning.mjs [baseUrl] [screenshotDir]
// Covers: the status while the model thinks, the summary arriving live apart from the answer, the stored reasoning
// after a reload, the per-conversation display (status only never shows the text), the global display and the
// workspace setting in the settings, light and dark, another language and a phone width.

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8030";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const THOUGHT = "Die Frage betrifft Läufe";
const browser = await browserType.launch();
const context = await browser.newContext({ viewport: { width: 1400, height: 900 }, locale: "de-DE" });
const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

async function shot(name) {
  // The Markdown parser loads lazily; until then an answer shows as plain text.
  await page.locator(".markdown-pending").first().waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
  if (shots) await page.screenshot({ path: join(shots, `${name}.png`) });
}

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`ok  ${message}`);
}

async function until(probe, message, timeout = 20000) {
  const end = Date.now() + timeout;
  for (;;) {
    const value = await probe();
    if (value) return value;
    if (Date.now() > end) throw new Error(`Timed out: ${message}`);
    await page.waitForTimeout(100);
  }
}

const api = async (path, init) => {
  const response = await page.request.fetch(base + path, init);
  return response.status() === 204 ? null : response.json();
};
const json = (method, data) => ({ method, data, headers: { "content-type": "application/json" } });

const panel = page.getByTestId("assistant-panel");
const input = page.getByTestId("assistant-input");
const answers = panel.getByTestId("chat-assistant");

async function ask(question) {
  const before = await answers.count();
  await input.fill(question);
  await page.getByTestId("assistant-send").click();
  await answers.nth(before).waitFor();
  return answers.nth(before);
}

try {
  await api("/api/settings", json("PUT", { providers: { anthropic: { api_key: "sk-ant-api03-e2e0000000000000000000000000000000000000000" } } }));
  await page.goto(base);
  await page.getByRole("heading", { name: "Workflows", exact: true }).waitFor();
  await page.keyboard.press("Control+j");
  await panel.waitFor();

  // 1. While the model thinks: a status, then the summary, apart from the answer; the text is one click away.
  const answer = await ask("Denk nach: was ist ein Lauf?");
  const reasoning = answer.getByTestId("chat-reasoning");
  await reasoning.waitFor({ timeout: 15000 });
  const firstState = await reasoning.getAttribute("data-state");
  check(["thinking", "summary"].includes(firstState), `The answer shows that the model reasons (${firstState})`);
  await until(async () => (await reasoning.getAttribute("data-state")) === "summary", "the summary arrives");
  check(await reasoning.getByText("Zusammenfassung des Denkens").isVisible(), "A summary is labelled as a summary");
  check((await reasoning.getAttribute("open")) === null, "Collapsed by default: the text is one click away");
  check(await reasoning.getByRole("status").isVisible(), "The activity is announced as a status");
  await shot("reasoning-01-live-collapsed");
  await reasoning.locator("summary").click();
  await until(async () => (await reasoning.locator(".reasoning__body").textContent()).includes(THOUGHT), "the text shows");
  check(true, "Opened, the summary shows the text the model sent");
  await answer.and(page.locator("[data-status=complete]")).waitFor({ timeout: 30000 });
  check((await answer.locator(".chat-answer").textContent()).includes("Ein Lauf ist eine Ausführung"), "The answer follows");
  const markdown = await answer.locator(".chat-answer > :not(.reasoning)").allTextContents();
  check(!markdown.join(" ").includes(THOUGHT), "The reasoning is not part of the answer text");
  check(await reasoning.getByText("Nachgedacht").isVisible(), "After the answer the status says the model reasoned");
  await shot("reasoning-02-opened");

  // 2. It is kept with the answer.
  const [current] = await api("/api/assistant/conversations");
  const detail = await api(`/api/assistant/conversations/${current.id}`);
  const stored = detail.history[1].reasoning;
  check(stored && stored.kind === "summary" && stored.text.startsWith(THOUGHT) && stored.active === false, "The reasoning is stored with the answer");
  await page.reload();
  await panel.waitFor();
  await answers.first().getByTestId("chat-reasoning").waitFor();
  check((await answers.first().getByTestId("chat-reasoning").getAttribute("data-state")) === "summary", "The reasoning is shown again after a reload");

  // 3. Per conversation: status only never shows the text; the global choice is untouched.
  const picker = page.getByTestId("assistant-thinking-display");
  check((await picker.inputValue()) === "default", "A conversation follows the global display by default");
  await picker.selectOption("status");
  const hidden = answers.first().getByTestId("chat-reasoning");
  await until(async () => (await hidden.getAttribute("data-state")) === "summary" && (await hidden.locator(".reasoning__body").count()) === 0, "status only");
  check(!(await hidden.textContent()).includes(THOUGHT), "Status only never shows the reasoning text");
  check((await hidden.textContent()).includes("nur Status"), "Status only says that the text is hidden");
  await shot("reasoning-03-status-only");
  const scopes = await page.evaluate(() => localStorage.getItem("nodestro-thinking-display-scopes"));
  check(scopes.includes(`conversation:${current.id}`) && scopes.includes("status"), "The choice is kept for this conversation only");
  check((await page.evaluate(() => localStorage.getItem("nodestro-thinking-display"))) === null, "The global choice is unchanged");
  await picker.selectOption("live");
  await until(async () => (await answers.first().getByTestId("chat-reasoning").getAttribute("open")) !== null, "live opens the text");
  check(true, "Show live opens the reasoning");

  // 4. Settings: the global display and the workspace's request for summaries (sent to the server).
  await page.keyboard.press("Escape");
  await page.evaluate(() => localStorage.setItem("nodestro-theme", "dark"));
  await page.goto(`${base}/settings#settings-reasoning`);
  const section = page.getByTestId("settings-reasoning");
  await section.waitFor();
  check(await section.getByRole("heading", { name: "Anzeige des Denkens" }).isVisible(), "The settings have a reasoning display section");
  await page.getByTestId("settings-thinking-display").selectOption("live");
  check((await page.evaluate(() => localStorage.getItem("nodestro-thinking-display"))) === "live", "The global display is kept in this browser");
  const toggle = section.getByRole("switch");
  check((await toggle.getAttribute("aria-checked")) === "false", "Reasoning summaries are not requested by default");
  await toggle.click();
  await until(async () => (await api("/api/settings")).reasoning_summaries === true, "the workspace setting is saved");
  check(true, "Request reasoning summaries is a workspace setting");
  const capabilities = await api("/api/models/capabilities?model=openai:gpt-5.5");
  check(capabilities.reasoning.requested === true && capabilities.reasoning.text === "summary", "The model declaration follows the setting");
  await section.scrollIntoViewIfNeeded();
  await shot("reasoning-04-settings-dark");
  await page.goto(base);
  await page.keyboard.press("Control+j");
  await panel.waitFor();
  await answers.first().getByTestId("chat-reasoning").waitFor();
  await shot("reasoning-04b-dark");

  // 5. Light theme, another language and a phone width.
  await page.evaluate(() => localStorage.setItem("nodestro-theme", "light"));
  await page.goto(base);
  await page.keyboard.press("Control+j");
  await panel.waitFor();
  await answers.first().getByTestId("chat-reasoning").waitFor();
  await shot("reasoning-05-light");
  await page.evaluate(() => localStorage.setItem("nodestro-language", "fr"));
  await page.reload();
  await page.keyboard.press("Control+j");
  await panel.waitFor();
  const french = answers.first().getByTestId("chat-reasoning");
  await french.waitFor();
  check((await french.textContent()).includes("Résumé de la réflexion"), "The display speaks the interface language (French)");
  await shot("reasoning-06-french");
  await page.evaluate(() => localStorage.setItem("nodestro-language", "en"));
  await page.setViewportSize({ width: 390, height: 820 });
  await page.reload();
  await page.keyboard.press("Control+j");
  await panel.waitFor();
  const narrow = answers.first().getByTestId("chat-reasoning");
  await narrow.waitFor();
  check((await page.evaluate(() => document.documentElement.scrollWidth)) <= 390, "At phone width nothing overflows");
  const box = await narrow.boundingBox();
  check(box && box.x >= 0 && box.x + box.width <= 390, "The reasoning fits the phone width");
  await shot("reasoning-07-phone");

  check(errors.length === 0, `No browser errors (${errors.join(" | ")})`);
} catch (error) {
  await shot("reasoning-failure");
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
