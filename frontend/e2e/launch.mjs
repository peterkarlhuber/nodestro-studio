// The desktop launch with the NS-002 switches of nodestro-api on (all off by default): NODESTRO_LAUNCH_FRAGMENT,
// NODESTRO_LAUNCH_CSRF, NODESTRO_DESKTOP_LOGOUT and NODESTRO_LAUNCH_TTL, against `nodestro` with a launch secret.
// Usage: NODESTRO_E2E_SECRET=<launch secret> node e2e/launch.mjs [baseUrl] [screenshotDir]   (scripts/e2e.sh launch)
//
// Covers, in the real studio against the real API:
//   1. the secret in the query is refused and not used up; the fragment link opens the studio, and the secret leaves
//      the address bar;
//   2. the studio sends the session's CSRF value with every change (copying an example works), reads need none;
//   3. a request with the window's cookie but without the CSRF value changes nothing (another local program on
//      another port gets the cookie from the browser, never the value);
//   4. the sign-out ends the window's session: the signed-out page replaces the studio and the API refuses the cookie;
//      the launch link stays used.
// Every other browser suite runs with the switches off: the studio works there as before.

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const browserType = require("playwright")[process.env.E2E_BROWSER ?? "chromium"];
const base = process.argv[2] ?? process.env.NODESTRO_URL ?? "http://127.0.0.1:8093";
const shots = process.argv[3] ?? process.env.NODESTRO_SCREENSHOTS;
const secret = process.env.NODESTRO_E2E_SECRET;
if (!secret) throw new Error("NODESTRO_E2E_SECRET is needed (scripts/e2e.sh launch)");
if (shots) mkdirSync(shots, { recursive: true });

let failures = 0;
function check(condition, message) {
  if (condition) console.log(`ok   ${message}`);
  else {
    failures += 1;
    console.log(`FAIL ${message}`);
  }
}

async function shot(page, name) {
  if (shots) await page.screenshot({ path: join(shots, `launch-${name}.png`) });
}

const browser = await browserType.launch();
const errors = [];
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "de-DE" });
await ctx.addInitScript(() => {
  try {
    localStorage.setItem("nodestro-language", "de");
  } catch {
    // no storage
  }
});
const page = await ctx.newPage();
page.on("pageerror", (error) => errors.push(error.message));
const changes = [];
page.on("request", (request) => {
  const url = new URL(request.url());
  // The launch exchange itself (POST /api/launch) opens the session and carries no CSRF value yet.
  if (url.pathname.startsWith("/api/") && url.pathname !== "/api/launch" && !["GET", "HEAD", "OPTIONS"].includes(request.method()))
    changes.push({ method: request.method(), path: url.pathname, csrf: request.headers()["x-nodestro-csrf"] ?? null });
});
const refused = [];
page.on("response", (response) => {
  if ([403, 415].includes(response.status()) && new URL(response.url()).pathname.startsWith("/api/") && !response.url().includes("/api/launch"))
    refused.push(`${response.status()} ${response.url()}`);
});

try {
  // 1. The query form is refused and leaves the secret unused.
  const query = await page.goto(`${base}/api/launch?token=${encodeURIComponent(secret)}`);
  check(query.status() === 403 && (await query.json()).code === "access.launch_invalid", "the secret in the query is refused");
  await page.goto(`${base}/api/launch#token=${encodeURIComponent(secret)}`);
  await page.waitForURL(`${base}/`);
  check(!page.url().includes(secret), "the secret left the address bar");
  const stored = JSON.parse((await page.evaluate(() => sessionStorage.getItem("nodestro.session"))) ?? "null");
  check(typeof stored?.csrf === "string" && stored.logout === true, "the launch page left the CSRF value and the sign-out for the studio");
  await page.getByRole("heading", { name: "Workflows", exact: true }).waitFor();
  check(true, "the fragment link opened the studio");

  // 2. A change through the interface: copy an example.
  await page.goto(`${base}/workflows/examples?template=blog-article`);
  await page.getByRole("button", { name: "Als Kopie übernehmen" }).click();
  await page.waitForURL(/\/workflows\/wf_/);
  check(changes.some((item) => item.path.startsWith("/api/examples") || item.path.startsWith("/api/library")), "copying an example sent a change");
  check(changes.length > 0 && changes.every((item) => item.csrf === stored.csrf), `every change carried the CSRF value (${changes.length})`);
  check(refused.length === 0, `no change of the studio was refused ${refused.join(" | ")}`);
  await shot(page, "1-copied");

  // 3. The window's cookie alone (the browser context's request API shares the cookies, not sessionStorage).
  const bare = await page.request.post(`${base}/api/workflows`, { data: { name: "Without CSRF" }, headers: { Origin: base } });
  check(bare.status() === 403 && (await bare.json()).code === "access.csrf_invalid", "the cookie without the CSRF value changes nothing");
  const form = await page.request.post(`${base}/api/workflows`, {
    form: { name: "Form" },
    headers: { Origin: base, "X-Nodestro-CSRF": stored.csrf },
  });
  check(form.status() === 415, "a form body is refused (JSON only)");
  const read = await page.request.get(`${base}/api/workflows`);
  check(read.ok(), "reading needs no CSRF value");

  // 4. Sign out.
  await page.goto(base);
  await page.getByTestId("desktop-sign-out").click();
  await page.getByTestId("signed-out").waitFor();
  check(await page.getByRole("heading", { name: "Du bist abgemeldet" }).isVisible(), "the signed-out page replaces the studio");
  await shot(page, "2-signed-out");
  check((await page.request.get(`${base}/api/workflows`)).status() === 401, "the API refuses the window's cookie after the sign-out");
  check((await page.evaluate(() => sessionStorage.getItem("nodestro.session"))) === null, "the CSRF value is forgotten");
  await page.goto(`${base}/api/launch#token=${encodeURIComponent(secret)}`);
  await page.getByText("already used", { exact: false }).waitFor();
  check(true, "the launch link stays used after the sign-out");
} catch (error) {
  failures += 1;
  console.log(`FAIL ${error instanceof Error ? error.stack : error}`);
  await shot(page, "failure");
}

check(errors.length === 0, `no page errors ${errors.join(" | ")}`);
await browser.close();
if (failures) {
  console.log(`${failures} check(s) failed`);
  process.exit(1);
}
