// Compares platform/internal-ui.txt with nodestro-ui's artifacts/manifest.json at the pinned commit (N-16 review):
// the SHA-256 of every vendored tarball must be the one nodestro-ui recorded when it built that commit. Reads the
// public raw file over HTTPS, without a token; CI runs it in the frontend job. Needs the network, so it is not part
// of check-vendor.mjs (which `make` and offline builds run).
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compareManifest, manifestUrl, readPins } from "./ui-vendor-lib.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { pins, problems } = readPins(repo);
const commits = [...new Set(pins.map((p) => p.commit))];
if (!pins.length) problems.push("no pins");
for (const commit of commits) {
  const url = manifestUrl(commit);
  const response = await fetch(url, { redirect: "error" });
  if (!response.ok) {
    problems.push(`${url}: HTTP ${response.status}`);
    continue;
  }
  problems.push(...compareManifest(pins.filter((p) => p.commit === commit), await response.json()));
}
if (problems.length) {
  console.error(`nodestro-ui manifest: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
for (const pin of pins) console.log(`ok ${pin.name} ${pin.version} matches nodestro-ui@${pin.commit.slice(0, 12)}`);
