// Browser test of the Nodestro Assistant against tests/e2e_assistant_server.py, whose
// model answers from the conversation it receives (no API key, nothing paid).
// Usage: node e2e/assistant.mjs [baseUrl] [screenshotDir]
// Covers: panel and shortcut, documentation answers with sources, chat across navigation,
// suggestions that are never sent by themselves, attachments with versions, refresh and drafts,
// secret masking, handover to the architect without changes, cancel, errors and retry, history,
// usage, phone layout and the interface language.

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
// Chromium by default; E2E_BROWSER=firefox or webkit runs the same checks in another engine.
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];

const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8030";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const SECRET = "sk-ant-api03-e2eSECRETvalue0000000000000000000000000000";

const browser = await browserType.launch();
const context = await browser.newContext({ viewport: { width: 1500, height: 940 }, locale: "de-DE" });
const page = await context.newPage();
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
  return response.status() === 204 ? null : response.json();
};
const json = (method, data) => ({ method, data, headers: { "content-type": "application/json" } });

const panel = page.getByTestId("assistant-panel");
const input = page.getByTestId("assistant-input");
const answers = panel.getByTestId("chat-assistant");

async function ask(question) {
  const before = await answers.count();
  await input.fill(question);
  await page.getByTestId("assistant-send").click();
  await answers.nth(before).waitFor();
  return answers.nth(before);
}

async function finished(answer, status = "complete") {
  await answer.and(page.locator(`[data-status=${status}]`)).waitFor({ timeout: 30000 });
}

async function conversation() {
  const [current] = await api("/api/assistant/conversations");
  return api(`/api/assistant/conversations/${current.id}`);
}

try {
  // A stored key (masked in everything the model gets) and a workflow that mentions it.
  await api("/api/settings", json("PUT", { providers: { anthropic: { api_key: SECRET } } }));
  const workflow = await api(
    "/api/workflows",
    json("POST", {
      name: "Blogartikel",
      nodes: [
        { id: "start", type: "start", position: { x: 0, y: 0 } },
        {
          id: "writer",
          type: "agent",
          label: "Autor",
          position: { x: 320, y: 0 },
          agent: { name: "Autor", system_prompt: `Schreibe einen Artikel. Interner Schlüssel: ${SECRET}` },
        },
      ],
      edges: [{ id: "e1", source: "start", target: "writer" }],
    }),
  );

  // 1. The panel: closed at first, opened with the shortcut, the navigation stays as it is.
  await page.goto(base);
  await page.getByRole("heading", { name: "Workflows", exact: true }).waitFor();
  check(!(await panel.isVisible()), "The assistant is closed at first");
  const navigation = await page.locator(".sidebar .nav-item").count();
  await page.keyboard.press("Control+j");
  await panel.waitFor();
  check(await panel.getByText("Wie kann ich helfen?").isVisible(), "Ctrl+J opens the assistant with a welcome");
  check((await page.locator(".sidebar .nav-item").count()) === navigation, "The main navigation is unchanged");
  check((await api("/api/assistant/conversations")).length === 0, "Opening the panel creates nothing");
  await shot("assistant-01-welcome");

  // 2. A documentation question: real steps, a table, a linked source, usage.
  await panel.getByRole("button", { name: "Wie funktioniert die Qualitätsprüfung mit einem Judge?" }).click();
  check((await input.inputValue()).includes("Judge"), "An example fills in the question without sending it");
  const docsAnswer = await ask(await input.inputValue());
  await page.getByTestId("assistant-status").waitFor();
  await finished(docsAnswer);
  check(await docsAnswer.locator("table").isVisible(), "Markdown tables are rendered");
  const source = docsAnswer.getByTestId("chat-source");
  check((await source.count()) === 1 && (await source.getAttribute("href")) === "/docs/agenten#qualitaet", "The read section is linked as a source");
  check(await docsAnswer.getByText(/Tokens · /).isVisible(), "The answer shows its tokens and cost");
  check(await page.getByTestId("assistant-chat-cost").isVisible(), "The header shows the cost of the chat");
  let detail = await conversation();
  check(detail.title === "Wie funktioniert die Qualitätsprüfung mit einem Judge?", "The title comes from the first question");
  check(
    JSON.stringify(detail.history[1].steps.map((step) => step.kind)) === JSON.stringify(["generate", "docs_search", "generate", "docs_read", "generate"]),
    "The steps are the ones that really happened",
  );
  await docsAnswer.locator("summary").click();
  check(await docsAnswer.getByText("Dokumentation durchsucht: Judge Qualitätsprüfung").isVisible(), "Finished steps are listed in German");
  await shot("assistant-02-docs-answer");

  // 3. The chat survives navigation; a source opens in the app.
  await source.click();
  await page.waitForURL(/\/docs\/agenten/);
  check(await panel.isVisible(), "The panel stays open on another page");
  check((await answers.count()) === 1, "The chat survives navigation");

  // 4. Suggestions are never sent by themselves.
  await page.goto(`${base}/workflows/${workflow.id}`);
  const suggestion = panel.getByTestId("assistant-suggestion").filter({ hasText: "Aktueller Workflow" });
  await suggestion.waitFor();
  check(await suggestion.getByText("Blogartikel").isVisible(), "The open workflow is suggested");
  check((await conversation()).attachments.length === 0, "A suggestion is not attached");
  await shot("assistant-03-suggestion");
  await suggestion.getByTestId("suggestion-add").click();
  const chip = panel.getByTestId("assistant-attachment");
  await chip.waitFor();
  check((await suggestion.count()) === 0, "An added suggestion becomes an attachment");
  const analysis = await ask("Was kann an diesem Workflow besser werden?");
  await finished(analysis);
  check(await analysis.getByText("workflow „Blogartikel“ (v1)", { exact: false }).isVisible(), "The model got the attached workflow with its version");
  const sentWith = panel.getByTestId("chat-user").last().locator(".chat-context__item");
  check((await sentWith.count()) === 1, "The message shows what it was sent with");

  // 5. Secrets never reach the model.
  await sentWith.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  const sent = await dialog.locator(".snapshot-data").innerText();
  check(!sent.includes(SECRET), "The API key is not in what was sent");
  check(await dialog.getByText("vertraulicher Wert wurde vor dem Senden", { exact: false }).isVisible(), "Masking is shown");
  await shot("assistant-04-snapshot");
  await page.keyboard.press("Escape");

  // 6. A saved change marks the attachment; refreshing applies to later messages only.
  const saved = await api(`/api/workflows/${workflow.id}`);
  await api(`/api/workflows/${workflow.id}`, json("PUT", { ...saved, name: "Blogartikel Pro" }));
  await page.reload();
  await panel.getByTestId("assistant-attachment").and(page.locator("[data-state=changed]")).waitFor();
  check(await chip.getByText("geändert").isVisible(), "A changed object is marked");
  await chip.getByTestId("attachment-refresh").click();
  await chip.and(page.locator("[data-state=current]")).waitFor();
  detail = await conversation();
  check(detail.history[2].context[0].label === "Blogartikel", "The earlier message keeps the state it was sent with");
  check(detail.attachment_states[0].label === "Blogartikel Pro", "The refreshed state applies from now on");

  // 7. Unsaved changes: the user picks the draft; a later edit marks it changed.
  await chip.getByTestId("attachment-remove").click();
  await chip.waitFor({ state: "detached" });
  await page.getByRole("button", { name: "Agent hinzufügen" }).click();
  await suggestion.waitFor();
  check(await suggestion.getByTestId("suggestion-add").innerText() === "Gespeicherte Version", "With unsaved changes the saved version is one choice");
  await suggestion.getByTestId("suggestion-add-draft").click();
  await chip.getByText("Entwurf").waitFor();
  check((await conversation()).attachments[0].variant === "draft", "The unsaved draft was attached");
  await page.getByRole("button", { name: "Agent hinzufügen" }).click();
  await chip.getByText("geändert").waitFor();
  check(true, "Editing after attaching the draft marks it changed");
  await shot("assistant-05-draft");

  // 8. A handover fills in the architect; nothing starts or changes.
  const before = await api(`/api/workflows/${workflow.id}`);
  const handoverAnswer = await ask("Kannst du das bitte mit dem Architekten umsetzen?");
  await finished(handoverAnswer);
  const card = handoverAnswer.getByTestId("handover-card");
  check(await card.isVisible(), "The proposal appears as a card");
  check(JSON.stringify(await api(`/api/workflows/${workflow.id}`)) === JSON.stringify(before), "The workflow is unchanged");
  await shot("assistant-06-handover");
  await card.getByRole("button").click();
  const architect = page.getByTestId("architect-dialog");
  await architect.waitFor();
  check(
    (await architect.locator("textarea").first().inputValue()).includes("kritisch prüft"),
    "The architect opens filled in with the proposal",
  );
  check(await architect.and(page.locator("[data-stage=form]")).count() === 1 || !(await architect.locator(".architect-step--active").count()), "The architect does not start by itself");
  await page.keyboard.press("Escape");

  // 9. Cancel keeps what was written; an error keeps the chat; retry repeats the answer.
  const long = await ask("Erzähl mir ausführlich alles.");
  await long.getByText("Absatz3").waitFor();
  await page.getByTestId("assistant-stop").click();
  await finished(long, "cancelled");
  check(await long.getByText("Abgebrochen.").isVisible(), "A cancelled answer is marked and kept");
  check(await long.getByTestId("chat-retry").isVisible(), "A cancelled answer can be retried");
  const failed = await ask("Teste die Verbindung");
  await finished(failed, "failed");
  check(await failed.getByText("Verbindung zum KI-Anbieter ist fehlgeschlagen", { exact: false }).isVisible(), "An API failure is explained");
  await shot("assistant-07-error");
  await failed.getByTestId("chat-retry").click();
  await finished(answers.last());
  check((await answers.count()) === 5, "Retrying replaces the failed answer, the chat is complete");

  // 10. Usage: every request once, under the assistant.
  const usage = await api("/api/usage");
  const ledger = usage.recent.filter((entry) => entry.source === "assistant");
  // One entry per answer with all its requests; the failed attempt never reached the model.
  check(ledger.length === 5 && ledger.every((entry) => entry.request && entry.ref === detail.id), "Every answer is in the usage ledger once, with its chat");
  const chatCost = (await conversation()).usage.estimated_cost_usd;
  const ledgerCost = ledger.reduce((sum, entry) => sum + entry.usage.estimated_cost_usd, 0);
  check(Math.abs(chatCost - ledgerCost) < 1e-9, "The chat cost equals its ledger entries");
  check(ledger.some((entry) => entry.estimated), "The cancelled request is counted as estimated");
  await page.goto(`${base}/usage`);
  await page.getByText("Nodestro Assistant").first().waitFor();
  check(true, "The usage page names the assistant");

  // 11. History: a new chat, rename, delete.
  await page.getByTestId("assistant-new").click();
  await panel.getByText("Wie kann ich helfen?").waitFor();
  await ask("Hallo");
  await finished(answers.last());
  await page.getByTestId("assistant-history").click();
  const items = panel.getByTestId("chat-list-item");
  await items.nth(1).waitFor();
  check((await items.count()) === 2, "The history lists both chats");
  await items.first().getByRole("button", { name: "Umbenennen" }).click();
  await panel.getByRole("textbox", { name: "Umbenennen" }).fill("Begrüßung");
  await panel.getByRole("textbox", { name: "Umbenennen" }).press("Enter");
  await items.first().getByText("Begrüßung").waitFor();
  await items.first().getByTestId("chat-delete").click();
  await items.first().getByTestId("chat-delete-confirm").click();
  await page.waitForFunction(() => document.querySelectorAll("[data-testid=chat-list-item]").length === 1);
  check((await api("/api/assistant/conversations")).length === 1, "A chat can be renamed and deleted");
  await items.first().locator(".chat-list__open").click();
  await answers.first().waitFor();
  check((await answers.count()) === 5, "An earlier chat can be continued");

  // 12. Wide mode, phone layout and the interface language.
  await panel.getByRole("button", { name: "Breiter" }).click();
  const wide = await panel.boundingBox();
  check(wide.width > 500, "The wide mode gives the chat more room");
  await shot("assistant-08-wide");
  await page.setViewportSize({ width: 390, height: 820 });
  const phone = await panel.boundingBox();
  check(phone.width === 390 && (await page.evaluate(() => document.documentElement.scrollWidth)) <= 390, "On a phone the panel covers the page without overflow");
  await shot("assistant-09-phone");
  await page.setViewportSize({ width: 1500, height: 940 });
  await page.evaluate(() => localStorage.setItem("nodestro-language", "en"));
  await page.reload();
  await panel.getByRole("button", { name: "New chat" }).waitFor();
  await panel.getByText("Sent with").first().waitFor();
  check(true, "The panel follows the interface language");
  check(await answers.first().getByText("Qualitätsprüfung", { exact: false }).first().isVisible(), "Stored chats are not translated");
  await page.getByTestId("assistant-close").click();
  await panel.waitFor({ state: "detached" });
  check(true, "The panel closes");

  check(errors.length === 0, `No browser errors (${errors.join(" | ")})`);
} catch (error) {
  await shot("failure");
  throw error;
} finally {
  await browser.close();
}
