// The README screenshot docs/screenshots/assistant.png (German UI: the scripted assistant answers in German), against
// tests/e2e_assistant_server.py (scripted model, no API key, nothing paid). Not part of the test suites.
// Usage: node e2e/readme-assistant.mjs [baseUrl] [outFile]
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const base = process.argv[2] ?? "http://127.0.0.1:8030";
const out = process.argv[3] ?? "../docs/screenshots/assistant.png";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 940 }, locale: "de-DE" });
await page.addInitScript(() => { localStorage.setItem("nodestro-language", "de"); localStorage.setItem("nodestro-theme", "dark"); });
const api = async (path, method = "GET", data) => (await page.request.fetch(base + path, { method, data, headers: { "content-type": "application/json", connection: "close" } })).json();
await api("/api/settings", "PUT", { language: "de", providers: { anthropic: { api_key: "sk-ant-api03-readmeSHOT00000000000000000000000000000000" } } });
const wf = await api("/api/workflows", "POST", { name: "Blogartikel", nodes: [
  { id: "start", type: "start", position: { x: 0, y: 0 } },
  { id: "writer", type: "agent", label: "Autor", position: { x: 320, y: 0 }, agent: { name: "Autor", system_prompt: "Write a clear, friendly blog article." } },
  { id: "editor", type: "agent", label: "Lektorat", position: { x: 640, y: 0 }, agent: { name: "Lektorat", system_prompt: "Edit the article." } }],
  edges: [{ id: "e1", source: "start", target: "writer" }, { id: "e2", source: "writer", target: "editor" }] });
await page.goto(base + "/workflows/" + wf.id);
await page.waitForTimeout(1500);
await page.keyboard.press("Control+j");
const panel = page.getByTestId("assistant-panel");
await panel.waitFor();
const examples = panel.locator("button").filter({ hasText: /judge/i });
await examples.first().click();
const answers = panel.getByTestId("chat-assistant");
await page.getByTestId("assistant-send").click();
await answers.first().waitFor();
await answers.first().and(page.locator("[data-status=complete]")).waitFor({ timeout: 30000 });
await page.waitForTimeout(800);
await page.screenshot({ path: out });
await browser.close();
