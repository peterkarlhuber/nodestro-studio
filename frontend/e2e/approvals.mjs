// Browser test of per-call tool approvals against tests/e2e_approvals_server.py (an isolated instance with
// NODESTRO_TOOL_APPROVALS=1, a short approval wait and a scripted model). Usage:
//   node e2e/approvals.mjs [baseUrl] [screenshotDir] [waitSeconds]
// Covers: the exact display of the arguments, approve (the call runs), reject with a comment (the call does not
// run), a decision about a changed call (stale hash, refused), a repeated decision (refused), the timeout (the call
// counts as rejected, a late decision is refused), the run details' approval notes, the rules section (state,
// audit trail), the activation step (existing assignments become exceptions once; a workflow made afterwards is
// asked about; repeating the step adds nothing), dark mode and a phone width.

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8080";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
const waitSeconds = Number(process.argv[4] ?? process.env.NODESTRO_APPROVAL_WAIT ?? 20);
if (shots) mkdirSync(shots, { recursive: true });

const ARGUMENTS = { to: "kunde@example.org", body: 'Grüße <b>"Angebot"</b> & Rabatt\nZeile 2' };

const browser = await browserType.launch();
const context = await browser.newContext({ viewport: { width: 1500, height: 940 }, locale: "de-DE" });
const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  // Refused decisions answer 409 on purpose; the browser logs those as failed requests.
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

async function raw(path, method = "GET", data) {
  return page.request.fetch(base + "/api" + path, { method, data });
}

async function api(path, method = "GET", data) {
  const response = await raw(path, method, data);
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

function workflow(name) {
  return api("/workflows", "POST", {
    name,
    nodes: [
      { id: "start", type: "start", position: { x: 0, y: 0 } },
      {
        id: "a",
        type: "agent",
        label: "Versand",
        position: { x: 280, y: 0 },
        agent: { name: "Versand", system_prompt: "APPROVALAGENT sends the offer.", tools: ["send_message"] },
      },
      { id: "out", type: "output", position: { x: 560, y: 0 } },
    ],
    edges: [
      { id: "e1", source: "start", target: "a" },
      { id: "e2", source: "a", target: "out" },
    ],
  });
}

async function start(flow) {
  const run = await api(`/workflows/${flow.id}/runs`, "POST", { input: "Angebot senden" });
  const request = await until(async () => {
    const open = await api(`/runs/${run.id}/tool-approvals`);
    return open.find((item) => item.status === "pending");
  }, "the run asks before the tool call");
  return { run, request };
}

async function finished(runId, timeout = 20000) {
  return until(async () => {
    const current = await api(`/runs/${runId}`);
    return ["queued", "running"].includes(current.status) ? null : current;
  }, `run ${runId} finishes`, timeout);
}

const callOf = (run) => run.nodes.a?.tool_calls?.[0];

try {
  await api("/settings", "PUT", { providers: { anthropic: { api_key: "e2e-placeholder-not-a-key" } } });
  const state = await api("/tool-approvals/legacy");
  check(state.enabled === true && state.legacy === null, "The isolated instance has approvals on and no activation step yet");
  const flow = await workflow("Angebot versenden");

  // ---- approve ---------------------------------------------------------------------------------------
  const first = await start(flow);
  check(JSON.stringify(first.request.input) === JSON.stringify(ARGUMENTS), "The question carries the exact arguments");
  await page.goto(`${base}/approvals`);
  const card = page.getByTestId("tool-approval").first();
  await card.waitFor();
  check((await card.textContent()).includes("Tool-Aufruf: send_message"), "The inbox shows the tool call");
  const shown = JSON.parse(await card.getByTestId("tool-approval-arguments").textContent());
  check(JSON.stringify(shown) === JSON.stringify(ARGUMENTS), "The arguments are shown exactly, markup as text");
  check((await card.locator("b").count()) === 0, "Markup in the arguments is not rendered");
  check((await card.textContent()).includes("Nicht eingestuft"), "A tool without a statement is marked as not classified");
  check(/Zeit für die Entscheidung: \d+:\d\d/.test(await card.getByTestId("tool-approval-deadline").textContent()), "The time left is shown");
  const badge = page.locator(".nav-item__badge").first();
  check((await badge.textContent()).trim() === "1", "The navigation badge counts the waiting call");
  await shot("approvals-01-inbox");
  await card.getByRole("button", { name: "Diesen Aufruf erlauben" }).click();
  const approved = await finished(first.run.id);
  check(approved.status === "succeeded", `The approved run succeeds (${approved.status})`);
  check(callOf(approved)?.approval?.status === "approved" && callOf(approved)?.output?.startsWith("sent to kunde@example.org"), "The approved call ran with the shown arguments");
  check(callOf(approved).approval.decided_by === "local", "The decision records who decided");

  // ---- reject with a comment, from the run page --------------------------------------------------------
  const second = await start(flow);
  await page.goto(`${base}/executions/${second.run.id}`);
  const runCard = page.getByTestId("tool-approval").first();
  await runCard.waitFor();
  await runCard.getByRole("textbox").fill("Falscher Empfänger");
  await runCard.getByRole("button", { name: "Ablehnen" }).click();
  const rejected = await finished(second.run.id);
  const rejectedCall = callOf(rejected);
  check(rejectedCall?.approval?.status === "rejected" && rejectedCall.approval.comment === "Falscher Empfänger", "The rejection is recorded with its comment");
  check(!String(rejectedCall.output).startsWith("sent to"), "The rejected call did not run");
  await page.reload();
  await page.locator(".trace").getByRole("button", { name: /Versand/ }).click();
  await page.getByRole("tab", { name: /Tools/ }).click();
  await page.locator(".tool-calls summary").first().click();
  const note = await page.getByTestId("tool-call-approval").textContent();
  check(note.includes("Abgelehnt") && note.includes("Kommentar: Falscher Empfänger"), "The run details show the rejection");
  await shot("approvals-02-rejected");

  // ---- a changed call (stale hash) and a repeated decision --------------------------------------------
  const third = await start(flow);
  await page.goto(`${base}/approvals`);
  const staleCard = page.getByTestId("tool-approval").first();
  await staleCard.waitFor();
  // The decision names another hash than the stored one, as if the call or the tool definition had changed.
  await page.route("**/api/runs/*/tool-approvals/*", async (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}");
    await route.continue({ postData: JSON.stringify({ ...body, arguments_hash: "0".repeat(64) }) });
  });
  await staleCard.getByRole("button", { name: "Diesen Aufruf erlauben" }).click();
  await staleCard.getByText("Der Aufruf hat sich seit der Anzeige geändert").waitFor();
  await page.unroute("**/api/runs/*/tool-approvals/*");
  const stillOpen = (await api(`/runs/${third.run.id}/tool-approvals`))[0];
  check(stillOpen.status === "pending", "A decision about a changed call is refused and the call still waits");
  // Someone else decides first; this page still shows the card (the list is frozen here).
  const snapshot = await api("/tool-approvals");
  await page.route("**/api/tool-approvals", (route) => route.fulfill({ json: snapshot }));
  await page.reload();
  await page.getByTestId("tool-approval").first().waitFor();
  await api(`/runs/${third.run.id}/tool-approvals/${third.request.id}`, "POST", {
    decision: "approved",
    arguments_hash: third.request.arguments_hash,
    comment: "",
  });
  await page.getByTestId("tool-approval").first().getByRole("button", { name: "Ablehnen" }).click();
  await page.getByTestId("tool-approval").first().getByText("Über diesen Aufruf wurde bereits entschieden").waitFor();
  await page.unroute("**/api/tool-approvals");
  const third_done = await finished(third.run.id);
  check(callOf(third_done)?.approval?.status === "approved", "A repeated decision is refused; the first one stands");

  // ---- timeout ------------------------------------------------------------------------------------------
  const fourth = await start(flow);
  await page.goto(`${base}/executions/${fourth.run.id}`);
  await page.getByTestId("tool-approval").first().waitFor();
  const timedOut = await finished(fourth.run.id, (waitSeconds + 20) * 1000);
  check(callOf(timedOut)?.approval?.status === "expired", "Without a decision the call counts as rejected at the deadline");
  check(!String(callOf(timedOut).output).startsWith("sent to"), "The expired call did not run");
  const late = await raw(`/runs/${fourth.run.id}/tool-approvals/${fourth.request.id}`, "POST", {
    decision: "approved",
    arguments_hash: fourth.request.arguments_hash,
    comment: "",
  });
  check(late.status() === 409 && (await late.json()).code === "tool.approval_expired", "A late decision is refused (409 tool.approval_expired)");
  await page.reload();
  await page.locator(".trace").getByRole("button", { name: /Versand/ }).click();
  await page.getByRole("tab", { name: /Tools/ }).click();
  await page.locator(".tool-calls summary").first().click();
  check((await page.getByTestId("tool-call-approval").textContent()).includes("Keine Entscheidung rechtzeitig"), "The run details show the timeout");

  // ---- rules section and the activation step -------------------------------------------------------------
  await page.goto(`${base}/approvals`);
  await page.getByText("Regeln für Tool-Aufrufe").click();
  await page.getByTestId("tool-approval-state").getByText("Ein", { exact: true }).waitFor();
  const audit = page.getByTestId("tool-approval-audit");
  await audit.waitFor();
  const auditText = await audit.textContent();
  check(auditText.includes("Entscheidung abgelehnt") && auditText.includes("hat sich seit der Anzeige geändert"), "The audit trail lists the refused stale decision");
  check(!auditText.includes("kunde@example.org"), "The audit trail never shows the arguments");
  await page.getByTestId("legacy-not-run").waitFor();
  await page.getByRole("button", { name: "Bestehende Zuweisungen markieren" }).click();
  await page.getByRole("button", { name: /Jetzt markieren/ }).click();
  const legacy = page.getByTestId("legacy-bindings");
  await legacy.waitFor();
  check((await legacy.textContent()).includes(`Workflow ${flow.id}`), "The existing assignment is listed as an exception");
  check((await page.getByRole("button", { name: "Bestehende Zuweisungen markieren" }).count()) === 0, "The activation step cannot be started a second time from the page");
  await shot("approvals-03-rules");

  const exempt = await api(`/workflows/${flow.id}/runs`, "POST", { input: "Angebot senden" });
  const exemptDone = await finished(exempt.id);
  check(callOf(exemptDone)?.approval?.status === "allowed", "The marked assignment runs without a question");
  const newer = await workflow("Neuer Versand");
  const fifth = await start(newer);
  check(fifth.request.status === "pending", "A workflow created after the activation step is asked about");
  const repeated = await api("/tool-approvals/legacy", "POST");
  check(repeated.legacy.bindings.every((item) => item.workflow_id !== newer.id), "Repeating the activation step does not exempt the new workflow");
  await api(`/runs/${fifth.run.id}/tool-approvals/${fifth.request.id}`, "POST", {
    decision: "rejected",
    arguments_hash: fifth.request.arguments_hash,
    comment: "",
  });
  await finished(fifth.run.id);

  // ---- dark mode and a phone ------------------------------------------------------------------------------
  const sixth = await start(newer);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(`${base}/approvals`);
  await page.getByTestId("tool-approval").first().waitFor();
  await shot("approvals-04-dark");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.getByTestId("tool-approval").first().waitFor();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 1, `No horizontal scrolling at phone width (${overflow}px)`);
  await shot("approvals-05-phone");
  await page.getByTestId("tool-approval").first().getByRole("button", { name: "Ablehnen" }).click();
  await finished(sixth.run.id);

  check(errors.length === 0, `No console errors (${errors.join(" | ")})`);
} finally {
  await browser.close();
}
