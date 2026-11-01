// The screenshots in docs/screenshots (README), in English, against tests/e2e_flow_server.py (scripted model,
// no API key, nothing paid). Not part of the test suites. Usage: node e2e/readme.mjs [baseUrl] [outDir]

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const base = process.argv[2] ?? "http://127.0.0.1:8040";
const out = process.argv[3] ?? "../docs/screenshots";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 940 }, locale: "en-US" });
await page.addInitScript(() => localStorage.setItem("nodestro-language", "en"));

// The test servers close idle keep-alive connections after 5 s; a request sent on a pooled connection at that moment
// fails with ECONNRESET. A fresh connection per API call avoids the race.
const FRESH_CONNECTION = { connection: "close" };

async function api(path, method = "GET", data) {
  const response = await page.request.fetch(base + "/api" + path, { method, data, headers: FRESH_CONNECTION });
  if (!response.ok()) throw new Error(`${method} ${path}: ${response.status()} ${await response.text()}`);
  return response.status() === 204 ? null : response.json();
}

async function shot(name) {
  // Toasts ("Workflow started") fade on their own; a screenshot should not show them.
  await page.locator(".toaster .toast__text").first().waitFor({ state: "detached", timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(out, `${name}.png`) });
  console.log(`shot ${name}`);
}

async function theme(value) {
  await page.evaluate((next) => localStorage.setItem("nodestro-theme", next), value);
  await page.reload();
}

const agent = (id, name, prompt, x, y) => ({
  id,
  type: "agent",
  label: name,
  position: { x, y },
  agent: { name, system_prompt: prompt, task: "{{input}}" },
});
const edge = (source, target) => ({ id: `${source}-${target}`, source, target, source_handle: null });

try {
  // The scripted model ignores the key; the editor only needs one to enable starting.
  await api("/settings", "PUT", { providers: { anthropic: { api_key: "e2e-placeholder-not-a-key" } } });
  const workflow = await api("/workflows", "POST", {
    name: "Answer a customer inquiry",
    description: "Research the case, categorize it and write a reply.",
    nodes: [
      { id: "start", type: "start", position: { x: 0, y: 120 }, start: { default_input: "My device stopped working after a week.", file_ids: [], fields: [] } },
      agent("research", "Research", "SUMMARY of the case and the customer's history.", 280, 0),
      agent("classify", "Categorize", "CLASSIFY the inquiry.", 280, 240),
      agent("reply", "Write reply", "SUMMARY as a friendly reply.", 580, 120),
      { id: "result", type: "output", position: { x: 880, y: 120 } },
    ],
    edges: [edge("start", "research"), edge("start", "classify"), edge("research", "reply"), edge("classify", "reply"), edge("reply", "result")],
  });

  await page.goto(`${base}/workflows/${workflow.id}`);
  await theme("dark");
  await page.locator(".react-flow__node-agent").first().waitFor();
  await page.getByRole("button", { name: "Start workflow", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Start", exact: true }).click();
  const deadline = Date.now() + 30000;
  let run;
  for (;;) {
    run = (await api(`/runs?workflow_id=${workflow.id}`))[0];
    if (run?.status === "succeeded") break;
    if (Date.now() > deadline) throw new Error(`run did not finish: ${run?.status}`);
    await page.waitForTimeout(250);
  }
  await page.locator(".react-flow__node-agent", { hasText: "Write reply" }).click();
  await shot("editor-dark");
  await theme("light");
  await page.locator(".react-flow__node-agent").first().waitFor();
  await shot("editor-light");
  await theme("dark");

  await page.goto(`${base}/executions/${run.id}`);
  await page.getByText("Write reply").first().waitFor();
  await shot("execution");

  await page.goto(`${base}/tools`);
  await page.locator("main").getByRole("heading").first().waitFor();
  await shot("tools");
} finally {
  await browser.close();
}
