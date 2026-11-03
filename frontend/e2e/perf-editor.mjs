// Editor mount performance (ST-004) against a running Nodestro (default http://127.0.0.1:8000).
// Usage: node e2e/perf-editor.mjs [baseUrl] [--workflow ID | --example quality-8d] [--runs 5] [--throttle 4]
//                                 [--profile out.cpuprofile] [--json out.json]
//
// Opens the Workflows page, slows the CPU down (Emulation.setCPUThrottlingRate) and then navigates inside the app to
// the editor of a workflow, as a click on a workflow card does. Measured from the navigation until every node of the
// workflow is on the canvas ("mount"), and the long tasks (PerformanceObserver "longtask") from the navigation until
// the page has been quiet for a second ("settled", at most 15 s): their count, the longest, and the total blocking
// time (the sum of each long task's time above 50 ms). Each run uses a fresh browser context; the median of the runs
// is reported. Without --workflow, the example given by --example (default quality-8d, nine nodes) is copied first and
// deleted at the end. --profile records a CPU profile of one extra run and lists the functions with the most self
// time, to find what the long tasks spend their time on.
//
// Not part of scripts/e2e.sh: the numbers depend on the machine, so the script reports and never fails on a value.

import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
const base = (args.find((arg, index) => !arg.startsWith("--") && !args[index - 1]?.startsWith("--")) ?? "http://127.0.0.1:8000").replace(/\/$/, "");
const runs = Number(option("runs", "5"));
const throttle = Number(option("throttle", "4"));
const profileFile = option("profile", null);
const jsonFile = option("json", null);
const QUIET_MS = 1000;
const SETTLE_MAX_MS = 15_000;

async function api(path, init = {}) {
  const response = await fetch(base + "/api" + path, { headers: { "content-type": "application/json" }, ...init });
  if (!response.ok) throw new Error(`${init.method ?? "GET"} ${path}: ${response.status} ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

let workflowId = option("workflow", null);
let copied = false;
if (!workflowId) {
  const workflow = await api(`/library/${option("example", "quality-8d")}/copy`, { method: "POST", body: JSON.stringify({ language: "en" }) });
  workflowId = workflow.id;
  copied = true;
}
const nodeCount = (await api(`/workflows/${workflowId}`)).nodes.length;

const browser = await chromium.launch();

/** One measured navigation to the editor; with ``profile`` a CPU profile is recorded as well. */
async function measure(profile = false) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "en-US", deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    localStorage.setItem("nodestro-language", "en");
    localStorage.setItem("nodestro-theme", "light");
    window.__longTasks = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__longTasks.push({ start: entry.startTime, duration: entry.duration });
    }).observe({ type: "longtask", buffered: true });
  });
  const page = await context.newPage();
  await page.goto(base + "/workflows", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  if (profile) {
    await cdp.send("Profiler.enable");
    await cdp.send("Profiler.setSamplingInterval", { interval: 200 });
    await cdp.send("Profiler.start");
  }
  const start = await page.evaluate((id) => {
    const now = performance.now();
    window.history.pushState({}, "", `/workflows/${id}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
    return now;
  }, workflowId);
  await page.waitForFunction((count) => document.querySelectorAll(".react-flow__node").length >= count, nodeCount, {
    polling: "raf",
    timeout: 60_000,
  });
  const mounted = await page.evaluate(() => performance.now());
  // Settled: no long task for QUIET_MS (or SETTLE_MAX_MS after the navigation).
  let settled = mounted;
  for (;;) {
    await page.waitForTimeout(250);
    const [now, last] = await page.evaluate(() => [performance.now(), window.__longTasks.reduce((end, task) => Math.max(end, task.start + task.duration), 0)]);
    settled = Math.max(mounted, last);
    if (now - settled >= QUIET_MS || now - start >= SETTLE_MAX_MS) break;
  }
  let cpuProfile = null;
  if (profile) cpuProfile = (await cdp.send("Profiler.stop")).profile;
  const tasks = (await page.evaluate(() => window.__longTasks)).filter((task) => task.start >= start - 1);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await context.close();
  return {
    mountMs: Math.round(mounted - start),
    settledMs: Math.round(settled - start),
    longTasks: tasks.length,
    longestMs: Math.round(Math.max(0, ...tasks.map((task) => task.duration))),
    tbtMs: Math.round(tasks.reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0)),
    tasks: tasks.map((task) => Math.round(task.duration)),
    cpuProfile,
  };
}

/** Self time per function of a CPU profile, the largest first. */
function selfTimes(profile, top = 25) {
  const byId = new Map(profile.nodes.map((node) => [node.id, node]));
  const self = new Map();
  const deltas = profile.timeDeltas;
  for (let index = 0; index < profile.samples.length; index += 1) {
    const node = byId.get(profile.samples[index]);
    const frame = node.callFrame;
    const file = frame.url ? frame.url.split("/").pop() : "";
    const key = `${frame.functionName || "(anonymous)"} ${file}:${frame.lineNumber + 1}:${frame.columnNumber + 1}`;
    self.set(key, (self.get(key) ?? 0) + (deltas[index] ?? 0) / 1000);
  }
  return [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, top).map(([name, ms]) => ({ name, ms: Math.round(ms) }));
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

try {
  const results = [];
  for (let run = 1; run <= runs; run += 1) {
    const result = await measure();
    delete result.cpuProfile;
    results.push(result);
    console.log(`run ${run}: mount ${result.mountMs} ms, settled ${result.settledMs} ms, ${result.longTasks} long tasks (longest ${result.longestMs} ms), TBT ${result.tbtMs} ms [${result.tasks.join(", ")}]`);
  }
  const summary = {
    base,
    workflow: workflowId,
    nodes: nodeCount,
    throttle,
    runs,
    median: {
      mountMs: median(results.map((result) => result.mountMs)),
      settledMs: median(results.map((result) => result.settledMs)),
      longTasks: median(results.map((result) => result.longTasks)),
      longestMs: median(results.map((result) => result.longestMs)),
      tbtMs: median(results.map((result) => result.tbtMs)),
    },
    results,
  };
  console.log(`median of ${runs} (CPU ${throttle}x slower, ${nodeCount} nodes): mount ${summary.median.mountMs} ms, TBT ${summary.median.tbtMs} ms, ${summary.median.longTasks} long tasks, longest ${summary.median.longestMs} ms`);
  if (profileFile) {
    const profiled = await measure(true);
    writeFileSync(profileFile, JSON.stringify(profiled.cpuProfile));
    summary.selfTime = selfTimes(profiled.cpuProfile);
    console.log(`CPU profile written to ${profileFile}; most self time:`);
    for (const item of summary.selfTime) console.log(`  ${String(item.ms).padStart(6)} ms  ${item.name}`);
  }
  if (jsonFile) writeFileSync(jsonFile, JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
  if (copied) await api(`/workflows/${workflowId}`, { method: "DELETE" }).catch(() => {});
}
