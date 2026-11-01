// Journey baseline (UX-J, docs/evolution/README.md): the six user tasks of the product evolution plan, walked
// through in the browser against tests/e2e_journey_server.py, whose model answers every request (no key, nothing
// paid). Each journey counts what the interface asks of a person until the goal: actions (clicks, typing into a
// field, choosing a file or an option, key presses), dialogs that open, page changes and the controls visible on
// the screen where the goal is reached.
//
// This measures interface cost, not comprehension: the script knows every label in advance, never hesitates and
// never takes a wrong turn. It says nothing about whether a person would find the way; only moderated task tests
// can (decision D7). A journey fails when its goal cannot be reached; the counts themselves are reported, not
// asserted, so a change that makes a path longer shows up in the report and in review, not as a red build.
//
// Usage: node e2e/journeys.mjs [baseUrl] [reportDir]
// The report (journeys.json, journeys.md) is written to reportDir or $JOURNEY_REPORT when given.

import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8060";
const reportDir = process.argv[3] ?? process.env.JOURNEY_REPORT;

const browser = await browserType.launch();
const context = await browser.newContext({ viewport: { width: 1500, height: 940 }, locale: "de-DE" });
// Count every dialog that opens: native <dialog open> and role="dialog", across client-side navigation.
await context.addInitScript(() => {
  const seen = new WeakSet();
  window.__journeyDialogs = 0;
  const scan = () => {
    for (const element of document.querySelectorAll("dialog[open], [role=dialog]")) {
      if (!seen.has(element)) {
        seen.add(element);
        window.__journeyDialogs += 1;
      }
    }
  };
  new MutationObserver(scan).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["open"] });
});
const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  // A start refused by the preflight answers 4xx on purpose; the page shows the reason.
  if (message.type() === "error" && !/status of 4\d\d/.test(message.text())) errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

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

async function until(probe, message, timeout = 30000) {
  const deadline = Date.now() + timeout;
  for (;;) {
    const value = await probe();
    if (value) return value;
    if (Date.now() > deadline) throw new Error(`Timed out: ${message}`);
    await page.waitForTimeout(250);
  }
}

/** A one-page PDF with a line of text, so the upload goes through the real document reader. */
function pdf(line) {
  const content = `BT /F1 12 Tf 72 720 Td (${line}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let body = "%PDF-1.4\n";
  const offsets = objects.map((object, index) => {
    const offset = body.length;
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(body, "latin1");
}

/** Interactive controls a person sees on the current screen: the open dialog, or else the page content. */
async function visibleControls() {
  return page.evaluate(() => {
    const dialogs = [...document.querySelectorAll("dialog[open], [role=dialog]")].filter((element) => element.checkVisibility());
    const scope = dialogs.at(-1) ?? document.querySelector("main") ?? document.body;
    const controls = scope.querySelectorAll("button, a[href], input:not([type=hidden]), select, textarea, [role=switch], [role=tab], [role=radio]");
    return [...controls].filter((element) => element.checkVisibility() && element.getAttribute("aria-hidden") !== "true").length;
  });
}

const results = [];

/** Runs one journey: `walk` gets the counting helpers and returns a short description of the goal reached. */
async function journey(id, task, walk) {
  // Every journey starts from the start page, with a fresh page load and no remembered sections.
  await page.goto(base);
  await page.evaluate(() => localStorage.removeItem("nodestro-agent-sections"));
  await page.goto(base);
  await page.getByRole("heading", { name: "Workflows", exact: true }).waitFor();
  const dialogsBefore = await page.evaluate(() => window.__journeyDialogs);
  let actions = 0;
  let pages = 0;
  let path = new URL(page.url()).pathname;
  const onNavigate = (frame) => {
    if (frame !== page.mainFrame()) return;
    const next = new URL(frame.url()).pathname;
    if (next !== path) pages += 1;
    path = next;
  };
  page.on("framenavigated", onNavigate);
  const act = async (promise) => {
    await promise;
    actions += 1;
  };
  const steps = {
    click: (locator) => act(locator.click()),
    fill: (locator, value) => act(locator.fill(value)),
    select: (locator, value) => act(locator.selectOption(value)),
    upload: (locator, files) => act(locator.setInputFiles(files)),
    press: (key) => act(page.keyboard.press(key)),
  };
  const started = Date.now();
  try {
    const goal = await walk(steps);
    const result = {
      id,
      task,
      goal,
      actions,
      dialogs: (await page.evaluate(() => window.__journeyDialogs)) - dialogsBefore,
      pages,
      controls: await visibleControls(),
      seconds: Math.round((Date.now() - started) / 100) / 10,
    };
    results.push(result);
    check(true, `${id} reached: ${goal} (${actions} actions, ${result.dialogs} dialogs, ${pages} page changes)`);
  } finally {
    page.off("framenavigated", onNavigate);
  }
}

const field = (name) => (scope) => scope.locator(".field", { hasText: name }).first();

try {
  // The scripted model ignores the key; the editor only needs one to enable starting.
  await api("/settings", "PUT", { providers: { anthropic: { api_key: "e2e-placeholder-not-a-key" } } });

  // ---- J1 "I want a structured evaluation of a PDF" -----------------------------------------------
  // Stand-in: the contract review example (structured output from an uploaded PDF). There is no invoice example.
  await journey("J1", "Structured evaluation of a PDF", async ({ click, fill, upload }) => {
    await click(page.getByTestId("example-gallery").getByRole("link", { name: /Alle 24 Beispiele/ }));
    await fill(page.getByRole("searchbox", { name: "Beispiele durchsuchen" }), "Vertrag");
    await click(page.getByTestId("example-contract-review").getByRole("button").first());
    await click(page.getByRole("button", { name: "Als Kopie übernehmen" }));
    await page.waitForURL(/\/workflows\/wf_/);
    await page.locator(".react-flow__node-agent").first().waitFor();
    await click(page.getByRole("button", { name: "Workflow starten" }));
    const dialog = page.getByRole("dialog");
    await upload(dialog.locator("input[type=file]").first(), { name: "vertrag.pdf", mimeType: "application/pdf", buffer: pdf("Mietvertrag Muster GmbH") });
    await dialog.getByText("vertrag.pdf").first().waitFor();
    await click(dialog.getByRole("button", { name: "Starten" }));
    const workflowId = page.url().match(/\/workflows\/(wf_[^/?#]+)/)[1];
    await until(async () => (await api(`/runs?workflow_id=${workflowId}`))[0]?.status === "succeeded", "J1 run succeeded", 60000);
    await page.getByTestId("run-panel").getByText("Fertig", { exact: true }).first().waitFor({ timeout: 30000 });
    return "run succeeded with the PDF; result in the execution overview";
  });

  // ---- J2 "I want to take an example, understand it, change it and start it" -------------------
  await journey("J2", "Copy, understand, change and start an example", async ({ click, fill }) => {
    await click(page.getByTestId("example-gallery").locator(".card", { hasText: "Blogartikel" }).getByRole("button").first());
    await page.getByTestId("example-preview").locator(".react-flow__node").first().waitFor();
    await click(page.getByRole("button", { name: "Als Kopie übernehmen" }));
    await page.waitForURL(/\/workflows\/wf_/);
    await click(page.locator(".react-flow__node-agent").first());
    const prompt = page.getByTestId("inspector").locator("textarea").first();
    await fill(prompt, `${await prompt.inputValue()}\nSchreibe in kurzen Sätzen.`);
    await click(page.getByRole("button", { name: "Speichern", exact: true }));
    await page.getByText("Ungespeicherte Änderungen").first().waitFor({ state: "hidden" });
    await click(page.getByRole("button", { name: "Workflow starten" }));
    await click(page.getByRole("dialog").getByRole("button", { name: "Starten" }));
    const workflowId = page.url().match(/\/workflows\/(wf_[^/?#]+)/)[1];
    await until(async () => (await api(`/runs?workflow_id=${workflowId}`))[0]?.status === "succeeded", "J2 run succeeded", 60000);
    await page.getByTestId("run-panel").getByText("Fertig", { exact: true }).first().waitFor({ timeout: 30000 });
    return "changed prompt saved, run succeeded";
  });

  // ---- J3 "I want to give an agent knowledge" -------------------------------------------------
  const plain = await api("/workflows", "POST", {
    name: "Kundenfragen beantworten",
    nodes: [
      { id: "start", type: "start", position: { x: 0, y: 0 } },
      { id: "answer", type: "agent", label: "Beantworter", position: { x: 300, y: 0 }, agent: { name: "Beantworter", system_prompt: "Beantworte Kundenfragen." } },
      { id: "out", type: "output", position: { x: 600, y: 0 } },
    ],
    edges: [
      { id: "a", source: "start", target: "answer" },
      { id: "b", source: "answer", target: "out" },
    ],
  });
  await journey("J3", "Give an agent knowledge", async ({ click, upload }) => {
    await click(page.locator("a.card__main", { hasText: "Kundenfragen beantworten" }).first());
    await click(page.locator(".react-flow__node-agent").first());
    await click(page.locator('[data-section="knowledge"] .section__title'));
    // With an empty knowledge base the section says to upload under Knowledge first and links there. J1 copied an
    // example that brings its own knowledge file, so the section lists files instead: go there via the navigation.
    // Wait until the section has loaded the knowledge list: either the hint link or the file search is shown.
    const section = page.locator('[data-section="knowledge"]');
    const hint = section.getByRole("link", { name: "Wissen" });
    await hint.or(section.getByRole("textbox")).first().waitFor();
    await click((await hint.count()) ? hint : page.getByRole("navigation").getByRole("link", { name: "Wissen", exact: true }).first());
    await page.getByRole("heading", { name: "Wissen", exact: true }).waitFor();
    await upload(page.locator("main input[type=file]").first(), { name: "preise.md", mimeType: "text/markdown", buffer: Buffer.from("# Preise\n\nDas Abo kostet 9 Euro im Monat.\n") });
    await page.getByText("preise.md").first().waitFor();
    await click(page.getByRole("link", { name: "Workflows", exact: true }).first());
    await click(page.locator("a.card__main", { hasText: "Kundenfragen beantworten" }).first());
    await click(page.locator(".react-flow__node-agent").first());
    const knowledge = page.locator('[data-section="knowledge"]');
    if (!(await knowledge.evaluate((element) => element.open))) await click(knowledge.locator(".section__title"));
    await click(knowledge.getByText("preise.md").first());
    await click(page.getByRole("button", { name: "Speichern", exact: true }));
    const saved = await until(async () => {
      const workflow = await api(`/workflows/${plain.id}`);
      const node = workflow.nodes.find((item) => item.id === "answer");
      return node.agent.knowledge.file_ids.length === 1 ? workflow : null;
    }, "knowledge file assigned and saved");
    check(Boolean(saved), "J3 the file is assigned to the agent");
    return "file uploaded and assigned to the agent, saved";
  });

  // ---- J3b the same task, uploading from the agent's Knowledge section (UX-K) ----------------
  const second = await api("/workflows", "POST", {
    name: "Supportfragen beantworten",
    nodes: [
      { id: "start", type: "start", position: { x: 0, y: 0 } },
      { id: "answer", type: "agent", label: "Support", position: { x: 300, y: 0 }, agent: { name: "Support", system_prompt: "Beantworte Supportfragen." } },
      { id: "out", type: "output", position: { x: 600, y: 0 } },
    ],
    edges: [
      { id: "a", source: "start", target: "answer" },
      { id: "b", source: "answer", target: "out" },
    ],
  });
  await journey("J3b", "Give an agent knowledge, uploading in the inspector", async ({ click, upload }) => {
    await click(page.locator("a.card__main", { hasText: "Supportfragen beantworten" }).first());
    await click(page.locator(".react-flow__node-agent").first());
    await click(page.locator('[data-section="knowledge"] .section__title'));
    await upload(page.getByTestId("agent-knowledge-file"), { name: "faq.md", mimeType: "text/markdown", buffer: Buffer.from("# FAQ\n\nVersand dauert zwei Tage.\n") });
    await page.locator('[data-section="knowledge"] .chip', { hasText: "faq.md" }).waitFor();
    await click(page.getByRole("button", { name: "Speichern", exact: true }));
    await until(async () => {
      const workflow = await api(`/workflows/${second.id}`);
      return workflow.nodes.find((item) => item.id === "answer").agent.knowledge.file_ids.length === 1;
    }, "uploaded file assigned and saved");
    check((await api("/knowledge")).some((file) => file.name === "faq.md"), "J3b the file is stored in Knowledge");
    return "file uploaded in the inspector, stored in Knowledge, assigned and saved";
  });

  // ---- "Used in" (UX-7), outside the journeys so their counts stay comparable ------------------
  await page.goto(base + "/knowledge");
  const faqRow = page.locator(".file-row", { hasText: "faq.md" });
  await faqRow.locator(".used-by a", { hasText: "Supportfragen beantworten / Support" }).waitFor();
  check(true, "Knowledge names the agent that uses a file");
  await faqRow.getByRole("button", { name: "faq.md löschen" }).click();
  const deleteDialog = page.getByRole("dialog");
  await deleteDialog.getByText("Wird an 1 Stelle verwendet:").waitFor();
  check((await deleteDialog.textContent()).includes("Supportfragen beantworten / Support"), "The delete dialog names the users");
  await deleteDialog.getByRole("button", { name: "Abbrechen" }).click();
  check((await api("/knowledge")).some((file) => file.name === "faq.md"), "Cancelling keeps the file");
  await faqRow.locator(".used-by a").first().click();
  await page.waitForURL(/\/workflows\/.+\?node=answer/);
  check(true, "A user link opens the workflow at the agent");

  // ---- J4 "My workflow does not start: where is the problem and how do I fix it?" -------------
  // A design-time problem (quality check without criteria) blocks the start; the run itself cannot fail with a
  // model that answers everything.
  await api("/workflows", "POST", {
    name: "Antwort mit Prüfung",
    nodes: [
      { id: "start", type: "start", position: { x: 0, y: 0 } },
      {
        id: "writer",
        type: "agent",
        label: "Schreiber",
        position: { x: 300, y: 0 },
        agent: { name: "Schreiber", system_prompt: "Schreibe eine Antwort.", quality: { enabled: true, criteria: [], max_revisions: 1, judge_model: "claude-sonnet-5-5" } },
      },
      { id: "out", type: "output", position: { x: 600, y: 0 } },
    ],
    edges: [
      { id: "a", source: "start", target: "writer" },
      { id: "b", source: "writer", target: "out" },
    ],
  });
  await journey("J4", "Find and fix why a workflow does not start", async ({ click, fill }) => {
    await click(page.locator("a.card__main", { hasText: "Antwort mit Prüfung" }).first());
    const start = page.getByRole("button", { name: "Workflow starten" });
    await until(async () => await start.isDisabled(), "start is blocked");
    // The editor lists the problem; it selects the agent, and the inspector names the section that holds it.
    await click(page.getByRole("button", { name: /Schreiber: Die Qualitätsprüfung braucht/ }).first());
    await click(page.getByRole("button", { name: /Qualitätsprüfung: 1 Fehler/ }));
    const quality = page.locator('[data-section="quality"]');
    await click(quality.getByRole("button", { name: /Kriterium hinzufügen/ }));
    await fill(quality.locator("input").last(), "korrekt");
    await until(async () => !(await start.isDisabled()), "start enabled after the fix");
    return "problem located, criterion added, start enabled";
  });

  // ---- J5 "I want to set an advanced property precisely" --------------------------------------
  await journey("J5", "Set an advanced property precisely", async ({ click, fill }) => {
    await click(page.locator("a.card__main", { hasText: "Kundenfragen beantworten" }).first());
    await click(page.locator(".react-flow__node-agent").first());
    const advanced = page.locator('[data-section="advanced"]');
    await click(advanced.locator(".section__title"));
    await fill(field("Max. Tokens")(advanced).locator("input"), "2000");
    await advanced.locator("summary").getByText("eigene Grenzen", { exact: false }).waitFor();
    await click(page.getByRole("button", { name: "Speichern", exact: true }));
    await until(async () => {
      const workflow = await api(`/workflows/${plain.id}`);
      return workflow.nodes.find((item) => item.id === "answer").agent.max_tokens === 2000;
    }, "max tokens saved");
    return "max tokens set and named in the closed summary";
  });

  // ---- J6 "Can I trust this workflow version on quality, cost and allowed actions?" -----------
  await journey("J6", "Check quality, cost and allowed actions of a version", async ({ click }) => {
    await click(page.locator("a.card__main", { hasText: "Vertrag strukturieren" }).first());
    await page.locator(".react-flow__node-agent").first().waitFor();
    await click(page.getByRole("link", { name: "Testreihen", exact: true }));
    await click(page.getByRole("link", { name: "Vertrag strukturieren und Prüfpunkte finden" }).first());
    await click(page.getByRole("button", { name: "Testreihe ausführen" }));
    await click(page.getByRole("dialog").getByRole("button", { name: /Testfälle ausführen/ }));
    await page.getByText("bestanden", { exact: false }).first().waitFor({ timeout: 60000 });
    await click(page.getByRole("link", { name: "Workflows", exact: true }).first());
    await click(page.locator("a.card__main", { hasText: "Vertrag strukturieren" }).first());
    await page.locator(".react-flow__node-agent").first().waitFor();
    await click(page.getByRole("button", { name: "API & Export" }));
    await page.getByText("Bereit zum Veröffentlichen", { exact: false }).waitFor();
    return "test series results seen, release pre-check seen";
  });

  // ---- J6b: J6's check once a result exists, read in the publish dialog (Q-1) --------------------
  // Running the series still happens on the test page (J6); this measures checking the version before publishing.
  await journey("J6b", "Check quality and allowed actions of a tested version in the publish dialog", async ({ click }) => {
    await click(page.locator("a.card__main", { hasText: "Vertrag strukturieren" }).first());
    await page.locator(".react-flow__node-agent").first().waitFor();
    await click(page.getByRole("button", { name: "API & Export" }));
    await page.getByText("Bereit zum Veröffentlichen", { exact: false }).waitFor();
    const row = page.getByRole("dialog").getByTestId("test-status-row").first();
    await row.getByText("bestanden", { exact: false }).waitFor();
    return "test result of this version seen in the publish dialog, release pre-check seen";
  });

  check(errors.length === 0, `No browser errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
} finally {
  await browser.close();
}

const LIMITS = [
  "Interface cost only: a script that knows every label never searches, hesitates or takes a wrong turn.",
  "No statement about comprehension or satisfaction; that needs moderated task tests (decision D7).",
  "Chromium, German interface, 1500x940 window; other languages and narrow windows can differ.",
  "A model that answers every request instantly: no waiting for a real provider, no failing runs.",
  "Seconds depend on the machine and are informational only.",
];
const table = [
  "| Journey | Task | Actions | Dialogs | Page changes | Controls at goal | Seconds |",
  "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
  ...results.map((r) => `| ${r.id} | ${r.task} | ${r.actions} | ${r.dialogs} | ${r.pages} | ${r.controls} | ${r.seconds} |`),
].join("\n");
console.log(`\n${table}\n`);
if (reportDir) {
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(join(reportDir, "journeys.json"), JSON.stringify({ base, results, limits: LIMITS }, null, 2) + "\n");
  const goals = results.map((r) => `- **${r.id}:** ${r.goal}`).join("\n");
  const limits = LIMITS.map((line) => `- ${line}`).join("\n");
  writeFileSync(join(reportDir, "journeys.md"), `# Journey report\n\n${table}\n\n## Goals reached\n\n${goals}\n\n## What this cannot show\n\n${limits}\n`);
}
