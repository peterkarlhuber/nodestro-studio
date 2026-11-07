// A real portable package, built from the publish dialog, against tests/e2e_portable_server.py.
// Usage: node e2e/portable.mjs [baseUrl] [screenshotDir]
//
// The backend really builds the package for this computer's platform (Python, libraries, launcher; no local models):
// the first build downloads Python and wheels into the export cache (E2E_EXPORT_CACHE keeps it between runs). Covers:
//   1. the dialog's portable options and summary (platform, no local models, no installation needed);
//   2. a build that is started and canceled in the dialog;
//   3. a build that finishes, its progress, the download link and the ZIP itself: PORTABLE.json, the start scripts,
//      the bundled Python, and every file listed in SHA256SUMS with its checksum;
//   4. the dialog in all six languages, light and dark, at desktop and phone width: translated, no raw keys, axe
//      (WCAG A/AA, serious and critical), no horizontal scrolling.

import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];
const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8087";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });
const BUILD_TIMEOUT = Number(process.env.E2E_PORTABLE_TIMEOUT ?? 1_200_000);

const here = dirname(fileURLToPath(import.meta.url));
const LANGUAGES = ["en", "de", "fr", "es", "it", "pt-BR"];
const T = Object.fromEntries(
  LANGUAGES.map((language) => [
    language,
    JSON.parse(readFileSync(join(here, "..", "src", "i18n", "locales", language, "publish.json"), "utf8")).export,
  ]),
);
const RAW_KEY = /\b(publish|common|errors)\.[a-z][A-Za-z0-9_]*\.[A-Za-z0-9_.]+\b/;

function axeSource() {
  const candidates = [];
  const fromEnv = process.env.AXE_CORE_PATH;
  if (fromEnv) candidates.push(existsSync(fromEnv) && statSync(fromEnv).isDirectory() ? join(fromEnv, "axe.min.js") : fromEnv);
  try {
    candidates.push(require.resolve("axe-core/axe.min.js"));
  } catch {
    // not installed
  }
  const found = candidates.find((path) => existsSync(path));
  return found ? readFileSync(found, "utf8") : null;
}
const axe = axeSource();

let failures = 0;
function check(condition, message) {
  if (condition) console.log(`ok   ${message}`);
  else {
    failures += 1;
    console.log(`FAIL ${message}`);
  }
}

async function json(path, method = "GET", body) {
  const response = await fetch(base + path, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

const browser = await browserType.launch();
const errors = [];

async function newPage({ theme = "light", language = "en", width = 1280, height = 900 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, locale: "en-US", acceptDownloads: true });
  await ctx.addInitScript(
    ([t, l]) => {
      try {
        localStorage.setItem("nodestro-theme", t);
        localStorage.setItem("nodestro-language", l);
      } catch {
        // no storage
      }
    },
    [theme, language],
  );
  const page = await ctx.newPage();
  page.on("pageerror", (error) => errors.push(String(error)));
  return page;
}

async function shot(page, name) {
  if (!shots) return;
  await page.screenshot({ path: join(shots, `${name}.png`), animations: "disabled" });
  console.log(`shot ${name}.png`);
}

// A model-free workflow: "Smoke" takes the default branch, so the package never needs a provider key.
const workflow = await json("/api/workflows", "POST", {
  name: "Portable smoke",
  budget_usd: 1,
  nodes: [
    { id: "start", type: "start", position: { x: 0, y: 0 }, start: { fields: [{ name: "topic", label: "Topic", type: "text", required: true }] } },
    { id: "route", type: "condition", position: { x: 220, y: 0 }, condition: { rules: [{ id: "ask", field: "topic", operator: "equals", value: "ask" }] } },
    { id: "agent", type: "agent", position: { x: 440, y: -120 }, label: "Agent", agent: { name: "Agent", system_prompt: "Answer" } },
    { id: "out", type: "output", position: { x: 660, y: 0 } },
  ],
  edges: [
    { id: "e1", source: "start", target: "route" },
    { id: "e2", source: "route", target: "agent", source_handle: "ask" },
    { id: "e3", source: "route", target: "out", source_handle: "default" },
    { id: "e4", source: "agent", target: "out" },
  ],
});
const published = await json(`/api/workflows/${workflow.id}/api/publish`, "POST", {});
const publication = published.publication;

async function openPortable(page, t) {
  await page.goto(`${base}/workflows/${workflow.id}`);
  await page.getByTestId("open-api").click();
  const dialog = page.getByRole("dialog");
  await dialog.getByTestId("api-tab-export").click();
  await dialog.getByTestId("api-export-kind-portable").click();
  await dialog.getByTestId("api-export-summary").waitFor({ timeout: 20000 });
  await dialog.getByTestId("api-export-summary").getByText(t.portable.noInstall, { exact: false }).waitFor();
  return dialog;
}

const jobs = async () => json(`/api/publications/${publication.id}/export-jobs`);

try {
  // ---- 1. options and summary ----------------------------------------------------------------------------------
  const page = await newPage();
  const en = T.en;
  const dialog = await openPortable(page, en);
  const summary = (await dialog.getByTestId("api-export-summary").textContent()) ?? "";
  check(summary.includes(en.portable.noLocalModels), "The summary says the workflow uses no local model");
  check(summary.includes(en.portable.noInstall), "The summary says nothing has to be installed on the target computer");
  const check1 = await json(`/api/publications/${publication.id}/export/check`, "POST", {
    options: { kind: "portable", web_ui: true, confirm_distribution: true },
  });
  check(check1.ok && check1.portable.local_models.length === 0, "The API's check agrees: buildable, no local models");
  const cached = check1.portable.downloads?.every?.((item) => item.cached) ?? false;
  console.log(`info the export cache ${cached ? "holds everything (no downloads)" : "is cold: the first build downloads"}`);
  const create = dialog.getByTestId("api-export-create");
  await dialog.getByTestId("api-export-confirm").check();
  await shot(page, "portable-01-options-en-light");

  // ---- 2. start a build and cancel it --------------------------------------------------------------------------
  await create.click();
  const running = dialog.getByTestId("api-export-job-running");
  await running.waitFor({ timeout: 20000 });
  check((await running.getByRole("progressbar").count()) === 1, "A running build shows its progress bar");
  await running.getByRole("button", { name: "Cancel" }).click();
  await dialog.getByText(en.portable.cancelled, { exact: true }).waitFor({ timeout: 60000 });
  const [canceled] = await jobs();
  check(canceled?.state === "cancelled", `The canceled build is canceled in the API (${canceled?.state})`);

  // ---- 3. a build that finishes, and its ZIP -----------------------------------------------------------------
  await create.click();
  await running.waitFor({ timeout: 20000 });
  const steps = new Set();
  const deadline = Date.now() + BUILD_TIMEOUT;
  const link = dialog.getByTestId("api-export-job-download");
  while (!(await link.count())) {
    if (Date.now() > deadline) throw new Error("the build did not finish in time");
    const [current] = await jobs();
    if (current?.step) steps.add(current.step);
    if (current?.state === "failed") throw new Error(`the build failed: ${current.error_code}: ${current.error}`);
    await page.waitForTimeout(1000);
  }
  console.log(`info steps seen: ${[...steps].join(", ")}`);
  check(steps.size >= 2, "The build reports its steps while it runs");
  await shot(page, "portable-02-done-en-light");
  const href = await link.getAttribute("href");
  const [done] = await jobs();
  check(done.state === "done" && href === `/api/exports/${done.export_id}/download`, "The finished build links its ZIP");
  const downloadPromise = page.waitForEvent("download");
  await link.click();
  const download = await downloadPromise;
  const folder = mkdtempSync(join(tmpdir(), "nodestro-portable-"));
  const zip = join(folder, download.suggestedFilename() || "package.zip");
  await download.saveAs(zip);
  check(readFileSync(zip).subarray(0, 2).toString() === "PK", `The browser downloads the ZIP (${download.suggestedFilename()})`);
  const inspector = join(folder, "inspect.py");
  writeFileSync(
    inspector,
    [
      "import hashlib, json, sys, zipfile",
      "z = zipfile.ZipFile(sys.argv[1])",
      "names = z.namelist()",
      "root = names[0].split('/')[0]",
      "meta = json.loads(z.read(f'{root}/PORTABLE.json'))",
      "sums = [line.split(None, 1) for line in z.read(f'{root}/SHA256SUMS').decode().splitlines() if line.strip()]",
      "bad = [n for h, n in sums if hashlib.sha256(z.read(f'{root}/' + n.lstrip('*'))).hexdigest() != h]",
      "print(json.dumps({'root': root, 'meta': meta, 'files': len(names), 'sums': len(sums), 'bad': bad[:5],",
      "  'start': [n for n in names if n.rsplit('/', 1)[-1] in ('start.sh', 'start.cmd', 'Start.command')],",
      "  'python': any(n.startswith(f'{root}/python/') for n in names),",
      "  'release': any(n.endswith('workflow/release.json') for n in names)}))",
    ].join("\n"),
  );
  const python = process.env.PYTHON ?? "python";
  const inspected = spawnSync(python, ["-I", inspector, zip], { encoding: "utf8" });
  if (inspected.status !== 0) throw new Error(`inspect.py: ${inspected.stderr}`);
  const report = JSON.parse(inspected.stdout);
  rmSync(folder, { recursive: true, force: true });
  console.log(`info package ${report.root}: ${report.files} entries, platform ${report.meta.platform ?? JSON.stringify(report.meta).slice(0, 80)}`);
  check(report.python, "The package contains its own Python");
  check(report.start.length >= 1, `The package has its start scripts (${report.start.join(", ")})`);
  check(report.release, "The package contains the published release");
  check(report.sums > 10 && report.bad.length === 0, `Every file listed in SHA256SUMS matches its checksum (${report.sums} files${report.bad.length ? `; wrong: ${report.bad.join(", ")}` : ""})`);
  await page.context().close();

  // ---- 4. six languages, both themes, desktop and phone width -------------------------------------------------
  for (const [index, language] of LANGUAGES.entries()) {
    const theme = index % 2 ? "dark" : "light";
    const width = index % 3 === 2 ? 390 : 1280;
    const label = `${language}, ${theme}, width ${width}`;
    const t = T[language];
    const lpage = await newPage({ language, theme, width, height: width > 600 ? 900 : 844 });
    const ldialog = await openPortable(lpage, t);
    const text = (await ldialog.textContent()) ?? "";
    const raw = text.match(RAW_KEY);
    check(!raw, `${label}: no raw translation keys${raw ? ` (${raw[0]})` : ""}`);
    check(text.includes(t.portable.summary) && text.includes(t.portable.confirmDistribution), `${label}: the portable options are translated`);
    await ldialog.getByTestId("api-export-job-download").waitFor();
    check(((await ldialog.getByTestId("api-export-jobs").textContent()) ?? "").includes(t.portable.downloadZip), `${label}: the finished build offers the download`);
    const overflow = await lpage.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(overflow <= 0, `${label}: no horizontal scrolling (${overflow}px)`);
    if (axe) {
      await lpage.evaluate(axe);
      const violations = await lpage.evaluate(async () => {
        const result = await window.axe.run(
          { include: [["dialog[open]"], ["[role=dialog]"]] },
          { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] },
        );
        return result.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}×${v.nodes.length}`);
      });
      check(violations.length === 0, `${label}: axe finds no serious or critical violation${violations.length ? `: ${violations.join(", ")}` : ""}`);
    } else {
      console.log(`skip axe on ${label}: axe-core not found`);
    }
    await shot(lpage, `portable-03-dialog-${language}-${theme}-${width}`);
    await lpage.context().close();
  }
} catch (error) {
  failures += 1;
  console.log(`FAIL ${error.stack ?? error}`);
} finally {
  await browser.close();
}

const unexpected = errors.filter((text) => !/ResizeObserver/.test(text));
check(unexpected.length === 0, `No page errors${unexpected.length ? `: ${unexpected.join(" | ")}` : ""}`);
console.log(failures ? `${failures} failure(s)` : "all portable package checks passed");
process.exit(failures ? 1 : 0);
