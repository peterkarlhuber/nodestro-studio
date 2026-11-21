// Vendors the nodestro-ui packages of one commit into frontend/vendor/ and writes platform/internal-ui.txt.
//
//   node scripts/vendor-ui.mjs --from <nodestro-ui checkout> [--packages @nodestro/ui-core,...]
//
// The checkout must be clean and have its development dependencies installed (npm ci --ignore-scripts there). The
// script packs it (its reproducible packer), checks every tarball against the checkout's artifacts/manifest.json,
// copies the tarballs, rewrites the pins and package.json, and removes tarballs nobody pins any more. Then run
// `npm install --ignore-scripts` here to refresh package-lock.json, and `node scripts/check-vendor.mjs`.
// The commit comes from the checkout; scripts/bump_pins.py moves the commit in the pin file, this script makes the
// files and hashes follow (a bump is: check out nodestro-ui at the new commit, run this).
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PIN_FILE, readPins, sha256 } from "./ui-vendor-lib.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const frontend = join(repo, "frontend");
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const from = arg("--from");
if (!from) throw new Error("--from <nodestro-ui checkout> is required");
const checkout = resolve(from);
const git = (...args) => execFileSync("git", ["-C", checkout, ...args], { encoding: "utf-8" }).trim();
if (git("status", "--porcelain")) throw new Error(`${checkout} has uncommitted changes`);
const commit = git("rev-parse", "HEAD");

const current = existsSync(join(repo, PIN_FILE)) ? readPins(repo).pins.map((p) => p.name) : [];
const wanted = arg("--packages")?.split(",") ?? current;
if (!wanted.length) throw new Error("no packages: pass --packages");

const out = mkdtempSync(join(tmpdir(), "ui-vendor-"));
execFileSync(process.execPath, ["scripts/pack.mjs", "--out", out], { cwd: checkout, stdio: "inherit" });
const manifest = JSON.parse(readFileSync(join(checkout, "artifacts", "manifest.json"), "utf-8")).packages;
const built = JSON.parse(readFileSync(join(out, "manifest.json"), "utf-8")).packages;

mkdirSync(join(frontend, "vendor"), { recursive: true });
const pkg = JSON.parse(readFileSync(join(frontend, "package.json"), "utf-8"));
const lines = [];
for (const name of [...wanted].sort()) {
  const entry = built.find((p) => p.name === name);
  if (!entry) throw new Error(`${name} is not a package of nodestro-ui@${commit}`);
  const recorded = manifest.find((p) => p.name === name);
  if (!recorded || recorded.sha256 !== entry.sha256) throw new Error(`${name}: the build differs from artifacts/manifest.json of ${commit}`);
  const data = readFileSync(join(out, entry.file));
  if (sha256(data) !== entry.sha256) throw new Error(`${name}: unexpected SHA-256`);
  copyFileSync(join(out, entry.file), join(frontend, "vendor", entry.file));
  pkg.dependencies[name] = `file:vendor/${entry.file}`;
  lines.push(`${name} ${entry.version} nodestro-ui@${commit} frontend/vendor/${entry.file} sha256=${entry.sha256}`);
}
rmSync(out, { recursive: true, force: true });
for (const file of readdirSync(join(frontend, "vendor"))) {
  if (file.endsWith(".tgz") && !lines.some((l) => l.includes(`frontend/vendor/${file} `))) rmSync(join(frontend, "vendor", file));
}
pkg.dependencies = Object.fromEntries(Object.entries(pkg.dependencies).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(join(frontend, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
writeFileSync(
  join(repo, PIN_FILE),
  [
    "# The nodestro-ui packages the frontend vendors (N-16): one line per package, all from one commit.",
    "# <package> <version> nodestro-ui@<commit> <tarball> sha256=<hex>",
    "# Written by frontend/scripts/vendor-ui.mjs; checked by frontend/scripts/check-vendor.mjs before every npm ci.",
    "# scripts/bump_pins.py moves the commit (pin kind npm-tarball); vendor-ui.mjs then makes files and hashes follow.",
    ...lines,
    "",
  ].join("\n"),
);
console.log(`vendored ${lines.length} package(s) from nodestro-ui@${commit}; now run: npm install --ignore-scripts`);
