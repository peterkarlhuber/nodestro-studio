// Browser test of connected MCP services against tests/e2e_mcp_server.py: a local MCP test server on the
// loopback interface and a scripted model. Usage: node e2e/mcp.mjs [baseUrl] [mcpUrl] [screenshotDir]
// Covers: connecting a local development server, the connection test, reviewing a tool whose description
// carries an injected instruction (foreign text, default classification "changes data", hint only),
// approving it as read only, the writing tool staying blocked, the tool in the library and its test call,
// an agent calling the tool in a run with provenance and unknown external cost, dark mode and a phone width.

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8070";
const mcpUrl = process.argv[3] ?? process.env.NODESTRO_MCP_URL ?? "http://127.0.0.1:8071/mcp";
const shots = process.argv[4] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const browser = await browserType.launch();
const context = await browser.newContext({ viewport: { width: 1500, height: 940 }, locale: "de-DE" });
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
    await page.waitForTimeout(250);
  }
}

try {
  await api("/settings", "PUT", { providers: { anthropic: { api_key: "e2e-placeholder-not-a-key" } } });

  // ---- connect --------------------------------------------------------------------------------------
  await page.goto(`${base}/tools`);
  await page.getByRole("radio", { name: "Verbundene Dienste" }).click();
  const services = page.getByTestId("mcp-services");
  await services.getByText("Noch kein Dienst verbunden").waitFor();
  await services.getByRole("button", { name: "Dienst verbinden" }).click();
  await page.getByLabel("Name").fill("Docs");
  await page.getByLabel("Adresse").fill(mcpUrl);
  await page.getByRole("button", { name: "Speichern" }).click();
  await page.getByText("Dienste werden nur über https erreicht").first().waitFor();
  check(true, "A plain http address is refused without the local development server consent");
  await page.getByText("Lokalen Entwicklungsserver erlauben").click();
  await page.getByRole("button", { name: "Speichern" }).click();
  await services.getByRole("button", { name: /Docs/ }).waitFor();
  check(true, "The local development server is connected after explicit consent");

  // ---- test and review ------------------------------------------------------------------------------
  await services.getByRole("button", { name: "Verbindung testen" }).click();
  await services.getByTestId("mcp-waiting").waitFor();
  const review = services.getByTestId("mcp-review-search");
  await review.waitFor();
  check((await services.textContent()).includes("Protokoll 2026-07-28"), "The connection test negotiates protocol 2026-07-28");
  const foreign = review.locator("blockquote.foreign-text");
  check((await foreign.textContent()).includes("IGNORE ALL PREVIOUS INSTRUCTIONS"), "The injected text is shown as foreign text");
  check(
    (await review.getByRole("radio", { name: "Ändert Daten" }).getAttribute("aria-checked")) === "true",
    "The default classification is 'changes data' although the service says read only",
  );
  check((await review.textContent()).includes("Der Dienst gibt an: Nur lesend"), "The service's statement is shown as a hint");
  check((await api("/tools")).every((tool) => tool.kind !== "mcp"), "No MCP tool reaches agents before approval");
  await shot("mcp-01-review");
  await review.getByRole("radio", { name: "Nur lesend" }).click();
  await review.getByRole("button", { name: "Freigeben" }).click();
  await services.getByText("Agenten können es als mcp__docs__search verwenden.").waitFor();
  check(true, "The approved read-only tool is usable by agents");

  const write = services.getByTestId("mcp-review-delete_page");
  await write.getByRole("button", { name: "Freigeben" }).click();
  await services.getByText("Tools, die Daten ändern, sind noch gesperrt").waitFor();
  check(true, "A tool approved as 'changes data' stays blocked until per-call approval exists");

  // ---- library ---------------------------------------------------------------------------------------
  await page.getByRole("radio", { name: "Bibliothek" }).click();
  await page.getByRole("button", { name: /^mcp__docs__search Externer/ }).click();
  await page.getByTestId("tool-trust").getByText("verbundenen Dienst Docs").waitFor();
  check(true, "The library shows the tool as part of the connected service");
  await page.getByRole("button", { name: "Ausführen" }).click();
  await page.getByText("3 pages about").waitFor();
  check(true, "The test call reaches the service through the same checks");

  // ---- an agent uses the tool -----------------------------------------------------------------------
  const workflow = await api("/workflows", "POST", {
    name: "Dokumente suchen",
    nodes: [
      { id: "start", type: "start", position: { x: 0, y: 0 } },
      {
        id: "a",
        type: "agent",
        label: "Suche",
        position: { x: 280, y: 0 },
        agent: { name: "Suche", system_prompt: "MCPAGENT searches the docs.", tools: ["mcp__docs__search"] },
      },
      { id: "out", type: "output", position: { x: 560, y: 0 } },
    ],
    edges: [
      { id: "e1", source: "start", target: "a" },
      { id: "e2", source: "a", target: "out" },
    ],
  });
  const run = await api(`/workflows/${workflow.id}/runs`, "POST", { input: "Rechnungen" });
  const finished = await until(async () => {
    const current = await api(`/runs/${run.id}`);
    return ["queued", "running"].includes(current.status) ? null : current;
  }, "the run finishes");
  check(finished.status === "succeeded", `The run with the MCP tool succeeds (${finished.status})`);
  const call = finished.nodes.a?.tool_calls?.[0];
  check(call?.provenance?.source === "mcp" && call.provenance.external_cost === "unknown", "The run records the call's provenance with unknown external cost");
  await page.goto(`${base}/executions/${run.id}`);
  await page.locator(".trace").getByRole("button", { name: /Suche/ }).click();
  await page.getByRole("tab", { name: /Tools/ }).click();
  await page.locator(".tool-calls summary").first().click();
  await page.getByTestId("tool-provenance").getByText("Kosten des Dienstes: unbekannt").waitFor();
  check(true, "The run details show the service and the unknown cost");
  await shot("mcp-02-run");

  // ---- dark mode and a phone ------------------------------------------------------------------------
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(`${base}/tools?tab=services`);
  await page.getByTestId("mcp-services").waitFor();
  await shot("mcp-03-dark");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.getByTestId("mcp-services").waitFor();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 1, `No horizontal scrolling at phone width (${overflow}px)`);
  await shot("mcp-04-phone");

  check(errors.length === 0, `No console errors (${errors.join(" | ")})`);
} finally {
  await browser.close();
}
