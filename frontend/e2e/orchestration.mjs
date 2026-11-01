// Browser test of orchestrated runs with dynamic teams against tests/e2e_orchestration_server.py (a scripted
// orchestrator and three teams, one with an approval step). Usage:
//   node e2e/orchestration.mjs [baseUrl] [screenshotDir]
// Covers: the run pauses while a team in a parallel step waits for approval (the orchestrator view says which
// team waits, the finished team is shown as succeeded), the approval of the team's step from the parent's run
// page, the team over time (who joined and left, and why), team parameters, limits and costs, saving the team
// as a template (only on a click, pinned to the versions of the run), a rejection that stops the orchestrator,
// dark mode and a phone width.

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8100";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
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

async function settled(runId, wanted) {
  return until(async () => {
    const current = await api(`/runs/${runId}`);
    return wanted.includes(current.status) ? current : null;
  }, `run ${runId} reaches ${wanted.join("/")}`);
}

async function openLead(runId) {
  await page.goto(`${base}/executions/${runId}`);
  await page.locator(".trace").getByRole("button", { name: /Leitung/ }).click();
  const view = page.getByTestId("orchestration");
  await view.waitFor();
  return view;
}

const statuses = async (scope) => scope.getByTestId("orchestration-outcome").evaluateAll((items) => items.map((item) => item.dataset.status));

try {
  await api("/settings", "PUT", { providers: { anthropic: { api_key: "e2e-placeholder-not-a-key" } } });
  const workflows = await api("/workflows");
  const byName = new Map(workflows.map((item) => [item.name, item]));
  const lead = byName.get("Teamleitung");
  check(lead && byName.has("Recherche") && byName.has("Entwurf") && byName.has("Lektorat"), "The orchestrator and its three teams exist");

  // ---- the inspector shows the dynamic settings ---------------------------------------------------------
  await page.goto(`${base}/workflows/${lead.id}`);
  await page.locator(".react-flow__node").filter({ hasText: "Leitung" }).first().click();
  // The orchestrator form is grouped like the agent form; the limits are in their own section.
  await page.locator('[data-section="orchestrator-limits"] > summary').click();
  await page.getByTestId("orchestrator-parallel").waitFor();
  check(true, "The inspector shows the dynamic team settings");
  check(await page.getByTestId("orchestrator-staffing").isChecked(), "Staffing is switched on for this orchestrator");
  await shot("orchestration-01-inspector");

  // ---- run 1: a parallel step where one team waits for approval -----------------------------------------
  const first = await api(`/workflows/${lead.id}/runs`, "POST", { input: "Schreibe über Otter" });
  const paused = await settled(first.id, ["paused", "failed", "succeeded", "cancelled"]);
  check(paused.status === "paused", `The run pauses while a team waits (${paused.status}: ${paused.error ?? ""})`);
  check(paused.nodes.lead.status === "awaiting_approval", "The orchestrator waits instead of failing");
  let view = await openLead(first.id);
  const pending = view.getByTestId("orchestration-pending");
  await pending.waitFor();
  check((await pending.textContent()).includes("Wartet auf Freigabe: 1 Team"), "The view says one team waits for approval");
  check(JSON.stringify(await statuses(pending)) === JSON.stringify(["succeeded", "waiting"]), "The finished team is succeeded, the other waits");
  check((await pending.textContent()).includes("Fakten zu Ottern") && (await pending.textContent()).includes("Entwurf"), "Both assignments are shown with their tasks");
  check((await view.getByTestId("orchestration-template").count()) === 0, "No template can be saved while the run waits");
  // ED-26: the waiting decision names its round and links each team run, with its own status, time and cost.
  check((await pending.textContent()).includes("Entscheidung 2"), "The waiting decision names its round");
  const waitingRows = pending.getByTestId("orchestration-team-run");
  check((await waitingRows.count()) === 2, "The waiting decision lists both team runs");
  const waitingRefs = await waitingRows.evaluateAll((items) => items.map((item) => item.dataset.ref));
  check(JSON.stringify(waitingRefs) === JSON.stringify(paused.nodes.lead.orchestration.pending.outcomes.map((item) => item.ref)), "Each team run row is the run the API names");
  await until(async () => (await pending.getByTestId("orchestration-team-run-meta").count()) === 2, "time and cost of both team runs");
  check(/aktiv .+ · .*\$/.test(await pending.getByTestId("orchestration-team-run-meta").first().textContent()), "A team run shows its active time and cost");
  const waitingLimits = await view.getByTestId("orchestration-limits").textContent();
  check(waitingLimits.includes("2 von 8") && waitingLimits.includes("Wartet auf Freigabe: 1") && waitingLimits.includes("Erfolgreich: 1"), "The overview counts the decisions and the team runs by status while the run waits");
  await shot("orchestration-02-waiting");

  const approval = page.locator(".approval-card").first();
  await approval.waitFor();
  check((await approval.textContent()).includes("Entwurf prüfen"), "The team's approval step is shown on the parent's run page");
  await approval.getByRole("button", { name: "Freigeben" }).click();
  const done = await settled(first.id, ["succeeded", "failed", "cancelled"]);
  check(done.status === "succeeded", `The run continues after the approval and succeeds (${done.status}: ${done.error ?? ""})`);
  const record = done.nodes.lead.orchestration;
  check(record.steps.map((step) => step.decision.action).join() === "staff,parallel,staff,delegate,finish", "The decisions are recorded in order");
  check(done.nodes.lead.child_run_ids.length === 3, "Each team ran once; the finished parallel team did not run again");

  view = await openLead(first.id);
  const steps = view.getByTestId("orchestration-step");
  check((await steps.count()) === 5, "The view lists all five decisions");
  check(JSON.stringify(await statuses(steps.nth(1))) === JSON.stringify(["succeeded", "succeeded"]), "The parallel step ends with both teams succeeded");
  // Team names come with the workflow list; under load it can arrive after the run.
  await until(async () => (await view.getByTestId("orchestration-staff").allTextContents()).some((item) => item.includes("Lektorat")), "team names in the view");
  const staffText = await view.getByTestId("orchestration-staff").allTextContents();
  check(staffText.some((item) => item.includes("aufgenommen: Lektorat") && item.includes("entlassen: Recherche")), "The view says who joined and who left");
  check((await steps.nth(2).textContent()).includes("Jetzt nur noch glätten"), "The reason of the team change is shown");
  check((await view.getByTestId("orchestration-values").first().textContent()).includes("formal"), "The team parameters are shown");
  const team = await view.getByTestId("orchestration-team").textContent();
  check(team.includes("Aktive Besetzung im Verlauf") && team.includes("Nach Entscheidung 1") && team.includes("Nach Entscheidung 3"), "The team over time is shown");
  const limits = await view.getByTestId("orchestration-limits").textContent();
  check(limits.includes("Entscheidungen") && limits.includes("5 von 8") && limits.includes("bis zu 2 Teams gleichzeitig") && limits.includes("Besetzung höchstens 2"), "Decisions used and limits are shown");
  check(limits.includes("Kosten der Entscheidungen") && limits.includes("Kosten mit Teams"), "The cost of the decisions and the total are shown");
  check((await view.getByTestId("orchestration-team-run-count").textContent()) === "3" && limits.includes("Erfolgreich: 3"), "The overview counts three team runs (not two delegations)");
  check(limits.includes("Teamläufe"), "The team runs are counted");
  check((await view.getByText("Pool: 3 Teams").count()) === 1, "The pool has a heading");
  const rows = view.getByTestId("orchestration-team-run");
  const refs = await rows.evaluateAll((items) => items.map((item) => item.dataset.ref));
  check(JSON.stringify(refs) === JSON.stringify(done.nodes.lead.child_run_ids), "Every team run is listed once, linked to its run, in order");
  const summary = await page.getByTestId("run-summary-teams").textContent();
  check(summary.includes("Leitung: 5 Entscheidungen, 3 Teamläufe (Erfolgreich: 3)"), `The run summary counts the team runs (${summary})`);
  check(!/chain|thinking|Gedanken/i.test(await view.textContent()), "Only structured decisions are shown");
  await shot("orchestration-03-done");

  // ---- a team run links back to the orchestrator and the decision that started it -------------------------
  await rows.nth(2).getByRole("link", { name: "Lauf des Teams öffnen" }).click();
  await page.waitForURL(new RegExp(`/executions/${done.nodes.lead.child_run_ids[2]}$`));
  const origin = page.getByTestId("run-origin-parent");
  await until(async () => (await origin.textContent()).includes("Teamlauf von Leitung (Entscheidung 4)"), "the team run names its orchestrator");
  await origin.getByRole("link").click();
  await page.waitForURL(new RegExp(`/executions/${first.id}$`));
  check(true, "A team run names its orchestrator and decision and links back to the parent run");
  view = await openLead(first.id);

  // ---- save the team as a template (only on a click) -----------------------------------------------------
  const countBefore = (await api("/workflows")).length;
  const template = view.getByTestId("orchestration-template");
  check((await template.textContent()).includes("Nichts wird ohne diesen Klick gespeichert"), "The template is offered, nothing saved yet");
  check((await api("/workflows")).length === countBefore, "Nothing was saved before the click");
  await template.getByRole("button", { name: "Teamzusammenstellung als Vorlage speichern", exact: true }).click();
  await page.waitForURL(/\/workflows\/[^/]+$/);
  const savedId = page.url().split("/").pop();
  const saved = await api(`/workflows/${savedId}`);
  const config = saved.nodes.find((node) => node.type === "orchestrator").orchestrator;
  const ids = ["Recherche", "Entwurf", "Lektorat"].map((name) => byName.get(name).id);
  check(JSON.stringify(config.members.map((member) => member.workflow_id).sort()) === JSON.stringify([...ids].sort()), "The template holds the teams that worked");
  check(config.members.every((member) => typeof member.version === "number"), "The template pins the versions of the run");
  check(config.staffing === false, "The template starts with the fixed team");
  check((await api("/workflows")).length === countBefore + 1, "Exactly one workflow was added");

  // ---- run 2: a rejection stops the orchestrator ----------------------------------------------------------
  const second = await api(`/workflows/${lead.id}/runs`, "POST", { input: "Noch ein Text" });
  await settled(second.id, ["paused"]);
  await page.goto(`${base}/executions/${second.id}`);
  const card = page.locator(".approval-card").first();
  await card.waitFor();
  await card.getByRole("button", { name: "Ablehnen" }).click();
  const stopped = await settled(second.id, ["cancelled", "failed", "succeeded"]);
  check(stopped.status !== "succeeded", `A rejection that stops the team stops the orchestrator (${stopped.status})`);
  const lastStep = stopped.nodes.lead.orchestration.steps.at(-1);
  check(lastStep.outcomes?.[0]?.status === "rejected", "The team's outcome is recorded as rejected");
  view = await openLead(second.id);
  check((await statuses(view)).includes("rejected"), "The view shows the rejected team");
  check((await view.textContent()).includes("Abgelehnt"), "The rejection is labeled");
  await shot("orchestration-04-rejected");

  // ---- dark mode and a phone ------------------------------------------------------------------------------
  await page.emulateMedia({ colorScheme: "dark" });
  await openLead(first.id);
  await shot("orchestration-05-dark");
  await page.setViewportSize({ width: 390, height: 844 });
  await openLead(first.id);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 1, `No horizontal scrolling at phone width (${overflow}px)`);
  await shot("orchestration-06-phone");

  check(errors.length === 0, `No console errors (${errors.join(" | ")})`);
} finally {
  await browser.close();
}
