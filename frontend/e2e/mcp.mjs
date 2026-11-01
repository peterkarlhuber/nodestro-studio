// Browser test of connected MCP services against tests/e2e_mcp_server.py: a local MCP test server on the
// loopback interface, an MCP server behind a loopback OAuth authorization server and a scripted model.
// Usage: node e2e/mcp.mjs [baseUrl] [mcpUrl] [screenshotDir] [oauthMcpUrl]
// Covers: connecting a local development server, the connection test, reviewing a tool whose description
// carries an injected instruction (foreign text, default classification "changes data", hint only),
// approving it as read only, the writing tool staying blocked, the tool in the library and its test call,
// an agent calling the tool in a run with provenance and unknown external cost, local servers being offered only
// with the container sandbox, an OAuth sign-in through the browser and signing out, the operation view, a
// published API offered as an MCP tool and called over MCP, dark mode and a phone width.

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8070";
const mcpUrl = process.argv[3] ?? process.env.NODESTRO_MCP_URL ?? "http://127.0.0.1:8071/mcp";
const shots = process.argv[4] ?? process.env.NODESTRO_SCREENSHOTS;
const oauthMcpUrl = process.argv[5] ?? process.env.NODESTRO_OAUTH_MCP_URL ?? "http://127.0.0.1:8073/mcp";
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

// The test servers close idle keep-alive connections after 5 s; a request sent on a pooled connection at that moment
// fails with ECONNRESET. A fresh connection per API call avoids the race.
const FRESH_CONNECTION = { connection: "close" };

async function api(path, method = "GET", data) {
  const response = await page.request.fetch(base + "/api" + path, { method, data, headers: FRESH_CONNECTION });
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
  await services.getByText("Tools, die Daten ändern, laufen nur in Workflow-Läufen").waitFor();
  check(true, "A tool approved as 'changes data' is blocked outside runs that ask before each call");

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

  // ---- local servers need the container sandbox ----------------------------------------------------
  await page.goto(`${base}/tools?tab=services`);
  const servicesAgain = page.getByTestId("mcp-services");
  await servicesAgain.getByText("Lokale Server brauchen die Docker-Sandbox").waitFor();
  await servicesAgain.getByRole("button", { name: "Dienst verbinden" }).click();
  check((await page.getByRole("radio", { name: "Lokaler Server" }).count()) === 0, "Without the Docker sandbox no local server is offered");
  check((await api("/mcp/status")).stdio_possible === false, "The status reports that local servers are not possible here");

  // ---- an OAuth sign-in -----------------------------------------------------------------------------
  await page.getByLabel("Name").fill("Wiki");
  await page.getByLabel("Adresse").fill(oauthMcpUrl);
  await page.getByLabel("Anmeldung").selectOption("oauth");
  await page.getByText("Lokalen Entwicklungsserver erlauben").click();
  await page.getByRole("button", { name: "Speichern" }).click();
  await servicesAgain.getByRole("button", { name: /Wiki/ }).click();
  await servicesAgain.getByTestId("mcp-oauth").getByText("Nicht angemeldet").waitFor();
  check(true, "An OAuth service starts without a sign-in");
  await servicesAgain.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL(/\/tools\?tab=services$/, { timeout: 20000 });
  await page.getByText("Angemeldet. Teste die Verbindung").waitFor();
  check(true, "The browser signs in at the authorization server and returns to the services");
  const oauth = page.getByTestId("mcp-oauth");
  check(/^Angemeldet/.test((await oauth.textContent()).trim()), "The service shows the sign-in");
  check(!(await page.content()).includes("access_token"), "No credentials reach the page");
  const wiki = (await api("/mcp/servers")).find((item) => item.name === "Wiki");
  check(wiki.token_set && wiki.token_storage !== "none" && !JSON.stringify(wiki).includes("Bearer"), "The access is stored without being returned");
  await page.getByRole("button", { name: "Verbindung testen" }).click();
  await page.getByTestId("mcp-review-lookup").waitFor();
  check(true, "With the sign-in the connection test lists the protected service's tools");
  await shot("mcp-05-oauth");
  await page.getByRole("button", { name: "Abmelden" }).click();
  await oauth.getByText("Nicht angemeldet").waitFor();
  check(!(await api("/mcp/servers")).find((item) => item.name === "Wiki").token_set, "Signing out removes the stored access");

  // ---- operation ------------------------------------------------------------------------------------
  await page.getByText("Betrieb", { exact: true }).click();
  const stats = page.getByTestId("mcp-stats");
  await stats.waitFor();
  check((await stats.textContent()).includes("Docs"), "The operation view lists the services with their calls");
  await shot("mcp-06-operation");

  // ---- a published API as an MCP tool ---------------------------------------------------------------
  const offer = await api("/workflows", "POST", {
    name: "Angebot als Tool",
    budget_usd: 1,
    nodes: [
      { id: "start", type: "start", position: { x: 0, y: 0 }, start: { fields: [{ name: "kunde", label: "Kunde", type: "text", required: true }] } },
      { id: "a", type: "agent", label: "Schreiber", position: { x: 280, y: 0 }, agent: { name: "Schreiber", system_prompt: "APITOOL writes an offer." } },
      { id: "out", type: "output", position: { x: 560, y: 0 } },
    ],
    edges: [
      { id: "e1", source: "start", target: "a" },
      { id: "e2", source: "a", target: "out" },
    ],
  });
  await page.goto(`${base}/workflows/${offer.id}`);
  await page.getByTestId("open-api").click();
  const dialog = page.getByTestId("api-dialog");
  await dialog.getByTestId("api-publish").click();
  await dialog.getByTestId("api-status").waitFor();
  await dialog.getByTestId("api-tab-access").click();
  await dialog.getByTestId("api-key-name").fill("Assistent");
  await dialog.getByTestId("api-key-create").click();
  const token = (await page.getByTestId("api-new-key").textContent()).trim();
  await page.getByRole("button", { name: "Ich habe den Schlüssel gesichert" }).click();
  const mcpCall = (method, params = {}) =>
    page.request.fetch(`${base}/api/published/_mcp`, {
      method: "POST",
      data: { jsonrpc: "2.0", id: 1, method, params },
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-11-25" },
    });
  check((await (await mcpCall("tools/list")).json()).result.tools.length === 0, "Before the offer the key sees no MCP tools");
  const section = dialog.getByTestId("api-mcp-tool");
  await section.getByText("Als MCP-Tool anbieten").click();
  await section.getByText("/api/published/_mcp").waitFor();
  check(true, "The offer is switched on and names the endpoint");
  await shot("mcp-07-offer");
  const listed = (await (await mcpCall("tools/list")).json()).result.tools;
  check(listed.length === 1 && listed[0].name === "angebot-als-tool", `The offered API is an MCP tool (${listed.map((tool) => tool.name)})`);
  check(listed[0].inputSchema.properties.values !== undefined, "The tool's input schema is the API's request schema");
  const called = (await (await mcpCall("tools/call", { name: "angebot-als-tool", arguments: { values: { kunde: "ACME" } } })).json()).result;
  check(!called.isError && called.structuredContent.run_id, "A tool call starts an ordinary run of the published API");
  const apiRun = await until(async () => {
    const current = await api(`/runs/${called.structuredContent.run_id}`);
    return ["queued", "running"].includes(current.status) ? null : current;
  }, "the API run finishes");
  check(apiRun.status === "succeeded" && apiRun.trigger === "api", `The run is an API run with the key (${apiRun.status}, ${apiRun.trigger})`);
  const outside = await page.request.fetch(`${base}/api/published/_mcp`, {
    method: "POST",
    data: { jsonrpc: "2.0", id: 1, method: "tools/list" },
    headers: { Accept: "application/json, text/event-stream" },
  });
  check(outside.status() === 401, "Without a key Nodestro's MCP server answers 401");
  await page.keyboard.press("Escape");

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
