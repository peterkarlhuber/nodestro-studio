// Browser test of the Workflow Architect against tests/e2e_architect_server.py, which
// answers every model request from a script (no API key, nothing paid).
// Usage: node e2e/architect.mjs [baseUrl] [screenshotDir]
// Covers: create with AI (live progress, review, tool approval, accept), revise in the editor
// (diff, apply as one undo step, version note on save) and cancelling without side effects.

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
// Chromium by default; E2E_BROWSER=firefox or webkit runs the same checks in another engine.
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8010";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const browser = await browserType.launch();
const page = await browser.newPage({
  viewport: { width: 1500, height: 940 },
  locale: "de-DE",
});
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

async function shot(name) {
  if (shots) await page.screenshot({ path: join(shots, `${name}.png`) });
}

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`ok  ${message}`);
}

const api = async (path, init) => {
  const response = await page.request.fetch(base + path, init);
  return response.json();
};

try {
  await page.goto(base);
  await page.getByRole("heading", { name: "Workflows", exact: true }).waitFor();
  const before = (await api("/api/workflows")).length;

  // 1. Create with AI from the new-workflow dialog.
  await page.getByRole("button", { name: "Neuer Workflow" }).first().click();
  await page.getByRole("radio", { name: "Mit KI erstellen" }).click();
  await page.getByLabel("Beschreibe dein Vorhaben").fill("Aus einem Thema einen Blogartikel mit SEO-Hinweisen schreiben.");
  await page.getByRole("button", { name: "Mit KI entwerfen" }).click();

  const dialog = page.getByTestId("architect-dialog");
  await dialog.and(page.locator("[data-stage=progress]")).waitFor();
  await dialog.locator(".architect-step--active").waitFor();
  check(true, "The architect shows its steps while it works");
  await dialog.locator(".architect-log__item").first().waitFor();
  check(true, "The activity log fills from real events");
  await dialog.getByText("Annahme für ein offenes Detail getroffen", { exact: false }).waitFor();
  check(true, "Counted log messages appear in the interface language");
  await dialog.locator(".arch-node").first().waitFor({ timeout: 15000 });
  check((await dialog.locator(".arch-node").count()) >= 3, "The live preview draws the planned agents");
  await shot("architect-01-progress");

  await page.locator("[data-testid=architect-dialog][data-stage=review]").waitFor({ timeout: 30000 });
  check(true, "The draft is presented for review");
  check(await dialog.getByText("keine Garantie", { exact: false }).isVisible(), "Review says a passed check is no guarantee");
  check(await dialog.getByText("Neue Tools warten auf deine Freigabe", { exact: false }).isVisible(), "Review marks the unapproved tool");
  check((await api("/api/workflows")).length === before, "Nothing is saved before accepting");
  await shot("architect-02-review");

  await dialog.getByRole("tab", { name: /Agenten/ }).click();
  await dialog.getByText("System-Prompt", { exact: true }).first().click();
  check(
    await dialog.getByText("Du bist ein sorgfältiger Spezialist.", { exact: false }).first().isVisible(),
    "Review shows the system prompts",
  );
  await dialog.getByRole("tab", { name: /Tool/ }).click();
  const tool = dialog.getByTestId("tool-draft-keyword_density");
  await tool.waitFor();
  check(await tool.getByText("noch nicht gelaufen", { exact: false }).isVisible(), "The tool draft has not run");
  check(!(await api("/api/tools")).some((item) => item.name === "keyword_density"), "The tool draft is not registered");
  await shot("architect-03-tool");
  await tool.getByRole("button", { name: "Freigeben und registrieren" }).click();
  await tool.getByText("freigegeben", { exact: true }).waitFor({ timeout: 30000 });
  check(
    (await api("/api/tools")).some((item) => item.name === "keyword_density"),
    "Approving tests and registers the tool",
  );

  await dialog.getByRole("tab", { name: "Überblick" }).click();
  await dialog.getByLabel("Name des neuen Workflows").fill("Blog mit KI");
  await page.getByRole("button", { name: "Workflow anlegen", exact: true }).click();
  await page.waitForURL(/\/workflows\/wf_/);
  await page.locator(".react-flow__node").first().waitFor();
  check((await page.locator(".react-flow__node").count()) === 5, "Accepting opens the new workflow in the editor");
  const workflowId = page.url().split("/").pop();
  const versions = await api(`/api/workflows/${workflowId}/versions`);
  check(versions.length === 1 && versions[0].description.startsWith("KI-Entwurf:"), "The new workflow starts with a noted version 1");
  const usage = await api("/api/usage");
  const design = usage.by_source.find((item) => item.key === "workflow_design");
  check(design?.requests === 6, "Each of the architect's calls is in the usage ledger once");
  await shot("architect-04-editor");

  // 2. Revise the open workflow: a separate draft, applied as one undoable step.
  await page.getByTestId("open-architect").click();
  await page.getByRole("radio", { name: "Aktuellen Workflow überarbeiten" }).click();
  await page
    .getByLabel("Was soll sich ändern?")
    .fill("Füge vor dem Ergebnis einen Agenten hinzu, der die bisherigen Analysen kritisch überprüft.");
  await page.getByRole("button", { name: "Änderungen vorschlagen" }).click();
  await page.locator("[data-testid=architect-dialog][data-stage=review]").waitFor({ timeout: 30000 });
  await dialog.getByRole("tab", { name: "Änderungen" }).click();
  check(await dialog.getByText("Kritiker", { exact: false }).first().isVisible(), "The diff shows the added critic");
  check((await page.locator(".react-flow__node").count()) === 5, "The editor is unchanged while reviewing");
  await shot("architect-05-diff");
  await page.getByRole("button", { name: "Änderungen übernehmen" }).click();
  await dialog.waitFor({ state: "detached" });
  check((await page.locator(".react-flow__node").count()) === 6, "Applying adds the critic in the editor");
  await page.getByRole("button", { name: /Rückgängig/ }).click();
  check((await page.locator(".react-flow__node").count()) === 5, "Undo takes the whole revision back");
  await page.getByRole("button", { name: /Wiederholen/ }).click();
  check((await page.locator(".react-flow__node").count()) === 6, "Redo applies it again");
  const stored = await api(`/api/workflows/${workflowId}`);
  check(stored.nodes.length === 5, "The revision is not saved before the user saves");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page.waitForFunction(
    async ([url]) => (await (await fetch(url)).json()).nodes.length === 6,
    [`${base}/api/workflows/${workflowId}`],
  );
  check(true, "Saving keeps the revision");
  const latest = (await api(`/api/workflows/${workflowId}/versions`))[0];
  check(latest.description?.startsWith("KI-Überarbeitung:"), "The saved version notes the AI revision");

  // 3. Cancel: nothing is saved, no workflow changes.
  const count = (await api("/api/workflows")).length;
  await page.getByTestId("open-architect").click();
  await page.getByRole("radio", { name: "Neuen Workflow entwerfen" }).click();
  await page.getByLabel("Dein Vorhaben").fill("Ein Workflow, der wieder abgebrochen wird.");
  await page.getByRole("button", { name: "Workflow entwerfen", exact: true }).click();
  await page.locator("[data-testid=architect-dialog][data-stage=progress]").waitFor();
  await page.getByRole("button", { name: "Generierung abbrechen" }).click();
  await page.locator("[data-testid=architect-dialog][data-stage=ended]").waitFor();
  check(await dialog.getByText("abgebrochen", { exact: false }).first().isVisible(), "Cancelling ends the job at once");
  check((await api("/api/workflows")).length === count, "A cancelled job saves nothing");
  await shot("architect-06-cancelled");

  const relevant = errors.filter((text) => !text.includes("favicon"));
  check(relevant.length === 0, `No console errors${relevant.length ? `: ${relevant.join(" | ")}` : ""}`);
} catch (error) {
  await shot("architect-failure");
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
