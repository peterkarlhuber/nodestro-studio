// Browser test of conversations with own agents (N-04) against tests/e2e_conversations_server.py, the only server
// with NODESTRO_CONVERSATIONS=1 (every other suite keeps the switch off). Usage:
//   node e2e/conversations.mjs [baseUrl] [screenshotDir]
// Covers: the Conversations entry in the navigation (from /api/meta's features), starting a conversation with an
// agent and an explicitly chosen model, sending by keyboard, an answer that streams in over the answer's event
// stream (Stop shows while it is written), attaching a file that goes with the next message and downloads again,
// rename, delete, a phone width without horizontal scrolling and no console errors.

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8083";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const browser = await browserType.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 940 }, locale: "en-US", acceptDownloads: true });
const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error" && !/status of 4\d\d/.test(message.text())) errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));
const streams = [];
page.on("request", (request) => {
  if (/\/api\/conversations\/[^/]+\/messages\/[^/]+\/events$/.test(new URL(request.url()).pathname)) streams.push(request.url());
});

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

try {
  await api("/settings", "PUT", { providers: { anthropic: { api_key: "e2e-placeholder-not-a-key" } } });
  const meta = await api("/meta");
  check(meta.features.includes("conversations"), "The server names the conversations feature");

  // ---- the area and a new conversation --------------------------------------------------------------------------
  await page.goto(`${base}/executions`);
  await page.getByRole("link", { name: "Conversations" }).click();
  await page.waitForURL(/\/conversations$/);
  await page.getByRole("heading", { name: "Choose a conversation" }).waitFor();
  check(true, "The empty area asks to choose a conversation");
  await page.getByTestId("conversation-new").click();
  await page.getByTestId("conversation-new-agent").selectOption({ label: "Reiseberater" });
  await page.getByRole("switch", { name: /Choose a model/ }).click();
  await page.getByTestId("conversation-create").click();
  await page.waitForURL(/\/conversations\/conv_/);
  const conversationId = page.url().split("/conversations/")[1].split("?")[0];
  check(Boolean(conversationId), "Starting opens the new conversation");
  await shot("conversation-new");

  // ---- send by keyboard; the answer streams in ------------------------------------------------------------------
  await page.getByTestId("conversation-input").fill("What is the capital of Austria?");
  await page.getByTestId("conversation-input").press("Enter");
  await page.getByTestId("conversation-stop").waitFor();
  check(true, "While the answer is written, Stop replaces Send");
  check(
    (await page.getByTestId("conversation-message-answer").first().getAttribute("data-status")) !== "succeeded",
    "The answer is not finished before the model answered",
  );
  await until(() => streams.length > 0, "the answer's event stream is opened");
  check(true, "The page follows the answer's event stream");
  await shot("conversation-answering");
  await api("/e2e/release", "POST");
  const answer = page.getByTestId("conversation-message-answer").first();
  await answer.getByText("Vienna is the capital of Austria.").waitFor({ timeout: 30000 });
  await until(async () => (await answer.getAttribute("data-status")) === "succeeded", "the answer is succeeded");
  check(true, "The answer arrives and is final");
  check(/Cost:/.test(await answer.getByTestId("conversation-answer-meta").innerText()), "The answer shows its cost");
  await page.getByTestId("conversation-send").waitFor();
  check((await page.getByTestId("conversation-stop").count()) === 0, "Send is back after the answer");
  const listed = await page.getByTestId("conversation-item").first().innerText();
  check(listed.includes("What is the capital of Austria?"), "The first message titled the conversation in the list");

  // ---- attach a file, send it, download it again ------------------------------------------------------------------
  await page.getByTestId("conversation-file-input").setInputFiles({ name: "plan.txt", mimeType: "text/plain", buffer: Buffer.from("Day 1: Vienna") });
  await page.getByTestId("conversation-pending-file").waitFor();
  check((await page.getByTestId("conversation-pending-file").innerText()).includes("plan.txt"), "The uploaded file waits for the next message");
  await page.getByTestId("conversation-input").fill("Please read my plan.");
  await page.getByTestId("conversation-send").click();
  await page.getByText("I read your file: yes.").waitFor({ timeout: 30000 });
  check(true, "The answer got the file");
  check((await page.getByTestId("conversation-pending-file").count()) === 0, "A sent file no longer waits");
  const link = page.getByTestId("conversation-file-link").first();
  const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
  check(download.suggestedFilename() === "plan.txt", "The sent file downloads under its name");
  await shot("conversation-file");

  // ---- rename ----------------------------------------------------------------------------------------------------
  await page.getByTestId("conversation-rename").click();
  await page.getByTestId("conversation-title-input").fill("Austria trip");
  await page.getByTestId("conversation-title-input").press("Enter");
  await until(async () => (await page.getByTestId("conversation-title").innerText()) === "Austria trip", "the new title");
  check((await api(`/conversations/${conversationId}`)).title === "Austria trip", "Renaming is stored");

  // ---- a phone width -----------------------------------------------------------------------------------------------
  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 1, "No horizontal scrolling at a phone width");
  await shot("conversation-phone");
  await page.setViewportSize({ width: 1440, height: 940 });

  // ---- delete -------------------------------------------------------------------------------------------------------
  await page.getByRole("button", { name: "Delete conversation" }).click();
  await page.getByRole("button", { name: /Delete conversation:/ }).click();
  await page.waitForURL(/\/conversations$/);
  await until(async () => (await api("/conversations")).length === 0, "the conversation is gone");
  check(true, "Deleting removes the conversation");
  const gone = await page.request.fetch(`${base}/api/conversations/${conversationId}`, { headers: FRESH_CONNECTION });
  check(gone.status() === 404, "The deleted conversation answers 404");

  check(errors.length === 0, `No console errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
  console.log("conversations: all checks passed");
} catch (error) {
  await shot("conversation-failure").catch(() => undefined);
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
