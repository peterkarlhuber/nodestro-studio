// Browser test of the live run chat (LRC-1) against tests/e2e_run_chat_server.py (an orchestrator with two teams
// in parallel, one of them with its own orchestrator; the teams wait until the test releases them). Usage:
//   node e2e/runChat.mjs [baseUrl] [screenshotDir]
// Covers: the Team leader tab next to Overview, the list of team leaders with the nested one, a question while the
// teams work and its answer, an instruction given by keyboard that waits for the next decision and is then
// included in it (the run's result shows the orchestrator had it), the history after a reload, the read-only
// composer of a finished run, dark mode and a phone width without horizontal scrolling, no console errors.

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8110";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const browser = await browserType.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 940 }, locale: "de-DE" });
const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error" && !/status of 4\d\d/.test(message.text())) errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

async function shot(name) {
  if (shots) await page.screenshot({ path: join(shots, `${name}.png`), fullPage: true });
}

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`ok  ${message}`);
}

// A fresh connection per API call (the test servers close idle keep-alive connections after 5 s).
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

async function openChat(runId) {
  await page.goto(`${base}/executions/${runId}`);
  await page.getByTestId("lrc-tab").click();
  await page.getByTestId("lrc").waitFor();
}

/** The app's own theme switch (stored in the browser), plus the matching system setting. */
async function useTheme(scheme) {
  await page.emulateMedia({ colorScheme: scheme });
  await page.evaluate((value) => localStorage.setItem("nodestro-theme", value), scheme);
}

const statusOf = (index) => page.getByTestId("lrc-message").nth(index).getByTestId("lrc-status");

try {
  await api("/settings", "PUT", { providers: { anthropic: { api_key: "e2e-placeholder-not-a-key" } } });
  const workflows = await api("/workflows");
  const lead = workflows.find((item) => item.name === "Teamleitung");
  check(Boolean(lead), "The workflow with the team leader exists");

  // ---- a run whose teams are working -----------------------------------------------------------------------
  const run = await api(`/workflows/${lead.id}/runs`, "POST", { input: "Schreibe über Otter" });
  await until(async () => {
    const view = await api(`/runs/${run.id}/chat`);
    return view.targets.length === 2 && view.targets[0].teams.filter((team) => team.status === "running").length === 2;
  }, "both team leaders listed and both teams working");

  await page.goto(`${base}/executions/${run.id}`);
  const tab = page.getByTestId("lrc-tab");
  await tab.waitFor();
  check((await page.getByTestId("lrc-tab-overview").getAttribute("aria-selected")) === "true", "The run page opens on Overview, with a Team leader tab next to it");
  await tab.click();
  await page.getByTestId("lrc").waitFor();
  check((await tab.getAttribute("aria-selected")) === "true", "The Team leader tab is selected");

  const targets = page.getByTestId("lrc-target");
  await until(async () => (await targets.count()) === 2, "two team leaders in the picker");
  const names = await targets.allTextContents();
  check(names[0].includes("Leitung") && names[1].includes("Unterleitung"), `The picker lists the team leader and the nested one (${names.join(" | ")})`);
  check(names[1].includes("Verschachteltes Team, Ebene 1") && names[1].includes("Teamleitung › UnterteamVerschachteltes") && !names[0].includes("Teamleitung › Teamleitung"), "The nested team leader shows its level and path");
  await targets.nth(1).click();
  check((await targets.nth(1).getAttribute("aria-checked")) === "true", "The nested team leader can be chosen");
  check((await page.locator(".lrc-activity").textContent()).includes("Recherche"), "The nested team leader's team is shown");
  await targets.nth(0).click();
  check((await targets.nth(0).getAttribute("aria-checked")) === "true", "Back to the top team leader");
  const activity = await page.locator(".lrc-activity").textContent();
  check(activity.includes("2 Teams arbeiten gerade") && activity.includes("Langsam") && activity.includes("Unterteam"), `The activity shows the working teams (${activity})`);
  await shot("runchat-01-working");

  // ---- a question while the teams work ----------------------------------------------------------------------
  check((await page.getByTestId("lrc-mode-question").getAttribute("aria-checked")) === "true", "Ask a question is the default mode");
  check((await page.getByTestId("lrc-hint").textContent()).includes("Eine Frage ändert den Lauf nie"), "The hint says a question never changes the run");
  await page.getByTestId("lrc-input").fill("Was machen die Teams gerade?");
  check((await page.getByTestId("lrc-send").textContent()).includes("Frage stellen"), "The send button names the mode");
  await page.getByTestId("lrc-send").click();
  const answer = page.getByTestId("lrc-answer");
  await answer.waitFor({ timeout: 20000 });
  const answerText = await answer.textContent();
  check(answerText.includes("Chat-Antwort, keine Entscheidung") && answerText.includes("Zwei Teams arbeiten noch"), "The answer arrives live, marked as a chat answer");
  check(answerText.includes("Stand gelesen: ja"), "The answer was written from the run snapshot");
  check((await statusOf(0).textContent()).includes("Beantwortet"), "The question is answered");

  // ---- an instruction, by keyboard -----------------------------------------------------------------------------
  await page.getByTestId("lrc-mode-question").focus();
  await page.keyboard.press("Tab");
  check(await page.getByTestId("lrc-mode-instruction").evaluate((element) => element === document.activeElement), "Tab reaches the instruction mode");
  await page.keyboard.press("Enter");
  check((await page.getByTestId("lrc-mode-instruction").getAttribute("aria-checked")) === "true", "Enter switches to Give an instruction");
  check((await page.getByTestId("lrc-hint").textContent()).includes("nicht unterbrochen"), "The hint says working teams are not interrupted");
  await page.keyboard.press("Tab");
  check(await page.getByTestId("lrc-input").evaluate((element) => element === document.activeElement), "Tab reaches the input");
  await page.keyboard.type("Bitte nur eine kurze Antwort");
  await page.keyboard.press("Enter");
  await until(async () => (await page.getByTestId("lrc-message").count()) === 2, "the instruction is listed");
  await until(async () => (await statusOf(1).textContent()).includes("Wartet auf die nächste Entscheidung"), "the instruction waits");
  check((await page.getByTestId("lrc-message").nth(1).textContent()).includes("2 Teams arbeiten; die Anweisung wird bei der nächsten Entscheidung berücksichtigt"), "The instruction says the teams keep working until the next decision");
  check((await page.getByTestId("lrc-input").inputValue()) === "", "The input is empty after sending");
  await shot("runchat-02-queued");

  // ---- the teams finish; the next decision includes the instruction ------------------------------------------
  await api("/e2e/release", "POST");
  await until(async () => (await statusOf(1).textContent()).includes("In Entscheidung 2 einbezogen"), "the instruction is included in decision 2", 45000);
  const included = await page.getByTestId("lrc-message").nth(1).textContent();
  check(included.startsWith("Anweisung · Du · "), `The sender is named (${included.slice(0, 30)})`);
  check(included.includes("Entscheidung: mit einer Antwort abgeschlossen"), `The decision that included it is shown (${included})`);
  check(included.includes("Einbezogen heißt"), "The hint explains what included means");
  check(!/erledigt|ausgeführt/i.test(included.replace("nicht ausgeführt", "")), "Nothing claims the instruction was carried out");
  const done = await until(async () => {
    const current = await api(`/runs/${run.id}`);
    return ["succeeded", "failed", "cancelled"].includes(current.status) ? current : null;
  }, "the run ends");
  check(done.status === "succeeded", `The run succeeds (${done.status}: ${done.error ?? ""})`);
  check(JSON.stringify(done.output).includes("Beruecksichtigt: ja"), `The orchestrator had the instruction in its decision prompt (${JSON.stringify(done.output)})`);
  await until(async () => (await page.getByTestId("lrc-closed").count()) === 1, "the composer closes when the run ended");

  // ---- reload: the history stays, read-only --------------------------------------------------------------------
  await page.reload();
  await page.getByTestId("lrc-tab").click();
  await page.getByTestId("lrc").waitFor();
  await until(async () => (await page.getByTestId("lrc-message").count()) === 2, "the history after a reload");
  check((await page.getByTestId("lrc-answer").textContent()).includes("Zwei Teams arbeiten noch"), "The answer is still shown after a reload");
  check((await statusOf(1).textContent()).includes("In Entscheidung 2 einbezogen"), "The instruction keeps its status after a reload");
  check((await page.getByTestId("lrc-closed").textContent()).includes("Der Lauf ist beendet; das Gespräch kannst du weiterhin lesen."), "A finished run says the conversation can still be read");
  check(await page.getByTestId("lrc-input").isDisabled(), "The input of a finished run is disabled");
  check(await page.getByTestId("lrc-send").isDisabled(), "The send button of a finished run is disabled");
  check(await page.getByTestId("lrc-mode-question").isDisabled(), "The mode switch of a finished run is disabled");
  await page.getByTestId("lrc-tab-overview").click();
  await page.locator(".two-column").waitFor();
  check((await page.locator(".two-column").textContent()).includes("Beruecksichtigt: ja"), "The Overview tab shows the run's result");
  await useTheme("light");
  await openChat(run.id);
  await until(async () => (await page.getByTestId("lrc-message").count()) === 2, "messages in light mode");
  check((await page.evaluate(() => document.documentElement.dataset.theme)) === "light", "The light theme is on");
  await shot("runchat-light-wide");

  // ---- dark mode and a phone ------------------------------------------------------------------------------------
  await useTheme("dark");
  await openChat(run.id);
  await until(async () => (await page.getByTestId("lrc-message").count()) === 2, "messages in dark mode");
  await shot("runchat-dark-wide");
  for (const scheme of ["dark", "light"]) {
    await useTheme(scheme);
    await page.setViewportSize({ width: 390, height: 844 });
    await openChat(run.id);
    await until(async () => (await page.getByTestId("lrc-message").count()) === 2, `messages at phone width (${scheme})`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 1, `No horizontal scrolling at 390 px (${scheme}, ${overflow}px)`);
    // The page scrolls inside the app frame: show the conversation, not only the header.
    await page.getByTestId("lrc-message").first().scrollIntoViewIfNeeded();
    await shot(`runchat-${scheme}-phone`);
  }

  check(errors.length === 0, `No console errors (${errors.join(" | ")})`);
} finally {
  await browser.close();
}
