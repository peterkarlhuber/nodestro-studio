// Checks the vendored nodestro-ui tarballs. Run it before `npm ci` and with --installed after it (CI does, in every job
// that installs the frontend; tests/test_ui_vendor_ci.py holds the workflows and the Makefile to that):
//   node scripts/check-vendor.mjs              pins, SHA-256, package.json and package-lock.json agree
//   node scripts/check-vendor.mjs --installed  also: node_modules holds exactly the tarballs' content (after npm ci)
// See scripts/ui-vendor-lib.mjs for why npm's own integrity check is not enough.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkInstalled, checkVendor } from "./ui-vendor-lib.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { pins, problems } = checkVendor(repo);
if (process.argv.includes("--installed")) problems.push(...checkInstalled(repo));
if (problems.length) {
  console.error(`Vendored UI packages: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
for (const pin of pins) console.log(`ok ${pin.name} ${pin.version} ${pin.sha256}`);
