// Combines the journey reports of several languages (journeys.mjs, one report directory per language) into one
// Markdown report: a comparison of the counts per journey, then per language the journeys, the checks and every
// failure with its screenshot.
//
// Usage: node e2e/journeys-combine.mjs <out.md> <shotsBase|-> <reportDir>...
// shotsBase is the directory that holds one screenshot folder per language (E2E_SHOTS=<shotsBase>/<lang>/ in the
// runs); the report links screenshots relative to out.md. "-" leaves the links out.
//
// Typical run, one fresh journey server (and data directory) per language:
//   E2E_LANG=fr E2E_SHOTS=out/fr/ node e2e/journeys.mjs http://127.0.0.1:8060 reports/fr
//   node e2e/journeys-combine.mjs out/REPORT.md out reports/de reports/en reports/fr ...

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const [out, shotsBase, ...dirs] = process.argv.slice(2);
if (!out || !dirs.length) throw new Error("Usage: node e2e/journeys-combine.mjs <out.md> <shotsBase|-> <reportDir>...");

const reports = dirs.map((dir) => JSON.parse(readFileSync(join(dir, "journeys.json"), "utf8")));
const link = (language, file) => {
  if (!file || shotsBase === "-") return file ?? "";
  const path = relative(dirname(out), join(shotsBase, language, file));
  return `[${file}](${path.split("/").map(encodeURIComponent).join("/")})`;
};
const shots = (language) => {
  if (shotsBase === "-") return [];
  try {
    return readdirSync(join(shotsBase, language)).filter((file) => file.endsWith(".png")).sort();
  } catch {
    return [];
  }
};

const ids = [...new Set(reports.flatMap((report) => report.results.map((r) => r.id)))];
const languages = reports.map((report) => report.language ?? "de");
const lines = [
  "# Journeys in six languages",
  "",
  `Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC by \`frontend/e2e/journeys-combine.mjs\` from \`frontend/e2e/journeys.mjs\` runs, one fresh journey server (\`tests/e2e_journey_server.py\`) and data directory per language.`,
  "",
  "## Summary",
  "",
  "| Language | Journeys reached | Checks passed | Checks failed |",
  "| --- | ---: | ---: | ---: |",
  ...reports.map((report, index) => {
    const reached = report.results.filter((r) => !r.failed).length;
    const failed = report.checks.filter((item) => !item.ok).length;
    return `| ${languages[index]} | ${reached} / ${report.results.length} | ${report.checks.length - failed} | ${failed} |`;
  }),
  "",
  "## Actions per journey and language",
  "",
  "Actions (clicks, typing, choices, uploads, key presses) until the goal; ✗ = goal not reached.",
  "",
  `| Journey | ${languages.join(" | ")} |`,
  `| --- | ${languages.map(() => "---:").join(" | ")} |`,
  ...ids.map((id) => {
    const cells = reports.map((report) => {
      const r = report.results.find((item) => item.id === id);
      return !r ? "–" : r.failed ? "✗" : String(r.actions);
    });
    return `| ${id} | ${cells.join(" | ")} |`;
  }),
];

reports.forEach((report, index) => {
  const language = languages[index];
  const failed = report.checks.filter((item) => !item.ok);
  lines.push(
    "",
    `## ${language}`,
    "",
    "| Journey | Task | Actions | Dialogs | Page changes | Controls at goal | Seconds |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
    ...report.results.map((r) =>
      r.failed
        ? `| ${r.id} | ${r.task} (**not reached**) | ${r.actions ?? "–"} | – | – | – | ${r.seconds ?? "–"} |`
        : `| ${r.id} | ${r.task} | ${r.actions} | ${r.dialogs} | ${r.pages} | ${r.controls} | ${r.seconds} |`,
    ),
    "",
    `Checks: ${report.checks.length - failed.length} passed, ${failed.length} failed.`,
  );
  const notReached = report.results.filter((r) => r.failed);
  if (notReached.length || failed.length) {
    lines.push("", "Failures:", "");
    for (const r of notReached) lines.push(`- **${r.id} not reached:** ${r.error}${r.screenshot ? ` (${link(language, r.screenshot)})` : ""}`);
    for (const item of failed) {
      if (notReached.some((r) => r.id === item.journey && r.error === item.message)) continue;
      lines.push(`- ${item.journey}: ${item.message}${item.detail ? `: ${item.detail}` : ""}`);
    }
  }
  const files = shots(language);
  if (files.length) lines.push("", `Screenshots: ${files.map((file) => link(language, file)).join(", ")}`);
});

const limits = reports[0].limits.filter((line) => !line.startsWith("Chromium,"));
lines.push("", "## What this cannot show", "", ...limits.map((line) => `- ${line}`), "- Chromium, 1500x940 window; narrow windows can differ.", "");
writeFileSync(out, lines.join("\n"));
console.log(`Wrote ${out}`);
