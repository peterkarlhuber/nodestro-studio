// Browser test of the Python libraries against tests/e2e_python_server.py, which installs
// from a fake package index (real virtual environments, no PyPI) and answers agents from a script.
// Usage: node e2e/python.mjs [baseUrl] [screenshotDir]
// Covers: a tool with a library (detected, approved with its indirect package, installed with
// progress, then tested), the workflow's own approval and run, a changed requirement asking
// again, export with the definition, and cleaning up an orphaned environment.

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
// Chromium by default; E2E_BROWSER=firefox or webkit runs the same checks in another engine.
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8020";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const CODE = `# /// script
# dependencies = ["tinystats>=1.0"]
# ///
import tinystats


def spread(values: list[float]) -> float:
    """Return the difference between the largest and the smallest value.

    Args:
        values: The numbers.

    Returns:
        The spread.
    """
    return tinystats.spread(values)
`;

const TESTS = `from tool import spread


def test_spread():
    assert spread([1.0, 4.0]) == 3.0
`;

const browser = await browserType.launch();
const page = await browser.newPage({
  viewport: { width: 1500, height: 940 },
  locale: "de-DE",
});
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error" && !message.text().includes("status of 400")) errors.push(message.text());
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
  return response.status() === 204 ? null : response.json();
};

async function replace(editor, value) {
  await editor.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Delete");
  await page.keyboard.insertText(value);
}

try {
  // 1. A tool with a library: detected, nothing installed until approved.
  await page.goto(`${base}/tools`);
  await page.getByRole("radio", { name: "Selbst schreiben" }).click();
  await page.getByRole("textbox", { name: "Name der Funktion" }).fill("spread");
  await replace(page.getByRole("textbox", { name: "Code", exact: true }), CODE);
  await replace(page.getByRole("textbox", { name: "Tests", exact: true }), TESTS);
  await page.getByRole("button", { name: "Prüfen und testen" }).click();
  const toolDeps = page.getByTestId("tool-dependencies");
  await toolDeps.getByText("Freigabe nötig", { exact: true }).waitFor();
  check(true, "Checking the tool detects the library and asks for approval");
  check((await api("/api/python")).environments.length === 0, "Nothing is installed before approval");
  await shot("python-01-tool");

  await toolDeps.getByTestId("review-dependencies").click();
  const dialog = page.getByTestId("dependency-dialog");
  const plan = dialog.getByTestId("dependency-plan");
  await plan.waitFor();
  const direct = plan.locator("tr[data-package=tinystats]");
  check((await direct.getAttribute("data-status")) === "new", "The overview marks the package as new");
  check((await direct.locator("td").nth(1).innerText()).trim() === "2.0.0", "The overview shows the resolved version");
  check(await plan.locator("tr[data-package=tinycore]").getByText("indirekt").isVisible(), "Indirect packages are listed");
  check(await dialog.getByText("unabhängig geprüft", { exact: false }).isVisible(), "Approving libraries does not approve the code");
  await shot("python-02-plan");
  await page.getByTestId("approve-dependencies").click();
  await dialog.locator("[data-testid=install-progress][data-status=installing]").waitFor();
  check(true, "The installation shows its progress");
  await dialog.locator("[data-testid=install-progress][data-status=installed]").waitFor({ timeout: 30000 });
  check(true, "The installation finishes");
  await shot("python-03-installed");
  await page.getByRole("button", { name: "Schließen" }).last().click();
  await page.getByText("Alle Prüfungen bestanden", { exact: false }).first().waitFor({ timeout: 30000 });
  check(true, "After approval the tests run in the tool's environment");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page.getByText("Tool spread gespeichert").waitFor();
  check(true, "The tool is saved");

  // 2. A workflow using the tool needs its own approval, then runs in its environment.
  const created = await api("/api/workflows", {
    method: "POST",
    data: {
      name: "Spannweite",
      nodes: [{ id: "calc", type: "agent", label: "Rechner", agent: { name: "Rechner", system_prompt: "SPREAD", tools: ["spread"] } }],
      edges: [],
    },
  });
  const workflowId = created.id;
  await page.goto(`${base}/workflows/${workflowId}`);
  const panel = page.getByTestId("workflow-dependencies");
  await panel.getByText("Freigabe nötig", { exact: true }).waitFor();
  check(await panel.getByText("tinystats").first().isVisible(), "The workflow inspector lists the library");
  const blocked = await page.request.post(`${base}/api/workflows/${workflowId}/runs`, { data: { input: "x" } });
  check(blocked.status() === 400, "The workflow does not start without approval");
  await shot("python-04-workflow");
  await panel.getByTestId("review-dependencies").click();
  await plan.waitFor();
  check(await dialog.getByText("Bereits freigegeben in: spread").first().isVisible(), "The overview names the tool's approval");
  await page.getByTestId("approve-dependencies").click();
  await dialog.locator("[data-testid=install-progress][data-status=installed]").waitFor({ timeout: 30000 });
  await page.getByRole("button", { name: "Schließen" }).last().click();
  await panel.getByText("Freigegeben und installiert", { exact: true }).waitFor();
  check(true, "The workflow's environment is approved and installed");
  await shot("python-05-ready");

  const started = await api(`/api/workflows/${workflowId}/runs`, { method: "POST", data: { input: "x" } });
  let run = started;
  for (let i = 0; i < 60 && !["succeeded", "failed", "cancelled"].includes(run.status); i++) {
    await page.waitForTimeout(250);
    run = await api(`/api/runs/${started.id}`);
  }
  check(run.status === "succeeded", `The workflow runs (${run.status})`);
  check(String(run.nodes.calc.tool_calls[0].output) === "3.0", "The tool used the library in the workflow's environment");

  // 3. A changed requirement is checked again; nothing is upgraded silently.
  const saved = await api("/api/tools", {
    method: "POST",
    data: { function_name: "spread", code: CODE.replace("tinystats>=1.0", "tinystats>=1.0,<2"), tests: TESTS },
  });
  check(saved.check.dependencies_pending, "Saving a changed requirement waits for a new approval");
  const status = await api(`/api/python/tools/spread/status`, {
    method: "POST",
    data: { code: CODE.replace("tinystats>=1.0", "tinystats>=1.0,<2"), tests: TESTS },
  });
  check(status.state === "approval_needed" && status.reasons.includes("changed"), "A changed requirement needs approval again");
  await page.goto(`${base}/tools`);
  await page.getByRole("radio", { name: "Selbst schreiben" }).click();
  await page.getByRole("textbox", { name: "Name der Funktion" }).fill("spread");
  await replace(page.getByRole("textbox", { name: "Code", exact: true }), CODE.replace("tinystats>=1.0", "tinystats>=1.0,<2"));
  await replace(page.getByRole("textbox", { name: "Tests", exact: true }), TESTS);
  await page.getByRole("button", { name: "Prüfen und testen" }).click();
  await toolDeps.getByText("Geänderte Anforderung", { exact: false }).waitFor();
  await toolDeps.getByTestId("review-dependencies").click();
  await plan.waitFor();
  check(
    await plan.locator("tr[data-package=tinystats]").getByText("Änderung 2.0.0 → 1.0.0").isVisible(),
    "The overview shows the version change",
  );
  await shot("python-06-change");
  await page.getByRole("button", { name: "Abbrechen" }).click();

  // ADR-0006: the tool shows where its code may run; generating tools needs Docker.
  check((await api("/api/tools/spread")).trust === "user-authored", "A tool written in the editor is user-authored");
  await page.getByRole("radio", { name: "Bibliothek" }).click();
  await page.getByRole("button", { name: /spread/ }).first().click();
  await page.getByTestId("tool-trust").getByText("Von dir geschrieben", { exact: false }).waitFor();
  check(true, "The tool detail shows its origin");
  await page.getByRole("radio", { name: "Von KI erstellen" }).click();
  await page.getByTestId("generate-needs-docker").waitFor();
  check(
    await page.getByRole("button", { name: "Tool erstellen lassen" }).isDisabled(),
    "Without Docker, generating a tool cannot start",
  );

  // 4. Export carries the definition, not the files.
  const exported = await api(`/api/python/workflows/${workflowId}/export`);
  check(exported.packages.some((item) => item.key === "tinystats" && item.version === "2.0.0"), "The export carries the versions");

  // 5. Maintenance: environments with owners, cleanup of orphaned ones. A test environment of a
  // tool that was never saved is orphaned; deleting a workflow removes its environment at once.
  const scratch = await api("/api/python/tools/scratch/plan", { method: "POST", data: { code: CODE, tests: TESTS } });
  await api(`/api/python/plans/${scratch.id}/approve`, { method: "POST" });
  for (let i = 0; i < 60; i++) {
    const env = await api("/api/python/environments/tool/scratch");
    if (env.install.status !== "installing") break;
    await page.waitForTimeout(250);
  }
  await api(`/api/workflows/${workflowId}`, { method: "DELETE" });
  check(
    !(await api("/api/python")).environments.some((env) => env.scope === `workflow:${workflowId}`),
    "Deleting a workflow removes its environment",
  );
  await page.goto(`${base}/settings`);
  const maintenance = page.getByTestId("python-maintenance");
  await maintenance.scrollIntoViewIfNeeded();
  await maintenance.getByText("Tool-Test „spread“").waitFor();
  check(await maintenance.locator("tr[data-scope='tool:scratch']").getByText("verwaist").isVisible(), "Orphaned environments are marked");
  await shot("python-07-maintenance");
  await page.getByTestId("python-cleanup").click();
  await page.getByText("verwaiste Umgebungen entfernt", { exact: false }).waitFor();
  const after = await api("/api/python");
  check(
    !after.environments.some((env) => env.orphaned) && after.environments.some((env) => env.scope === "tool:spread"),
    "Cleanup removes only orphaned environments",
  );

  check(errors.length === 0, `No console errors (${errors.join(" | ")})`);
} catch (error) {
  await shot("python-failure");
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
