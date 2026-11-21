// The UI packages of nodestro-ui as the frontend consumes them: tarballs vendored in frontend/vendor/, pinned in
// platform/internal-ui.txt (one line per package: name, version, nodestro-ui@<commit>, file, sha256=<hex>), installed
// by npm from file:vendor/<file> with the integrity npm records in package-lock.json. No registry, no release.
//
// Why a check of our own before `npm ci`: with a warm npm cache, `npm ci` may install the cached content of a
// tarball without noticing that the file in vendor/ changed (P0-6, npm 10.9.9). The SHA-256 of the pin is checked
// against the file before npm runs; after the install, the installed files can be compared with the tarball.
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

export const PIN_FILE = "platform/internal-ui.txt";
const LINE = /^(@nodestro\/ui-[a-z]+) (\d+\.\d+\.\d+) nodestro-ui@([0-9a-f]{40}) (frontend\/vendor\/[a-z0-9.-]+\.tgz) sha256=([0-9a-f]{64})$/;

export const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");
export const integrity = (buffer) => `sha512-${createHash("sha512").update(buffer).digest("base64")}`;

/** The pins of platform/internal-ui.txt under the repository root `repo`: [{ name, version, commit, file, sha256 }]. */
export function readPins(repo) {
  const pins = [];
  const problems = [];
  const text = readFileSync(join(repo, PIN_FILE), "utf-8");
  for (const [i, raw] of text.split("\n").entries()) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = LINE.exec(line);
    if (!m) {
      problems.push(`${PIN_FILE}:${i + 1}: not a pin line: ${line}`);
      continue;
    }
    pins.push({ name: m[1], version: m[2], commit: m[3], file: m[4], sha256: m[5] });
  }
  return { pins, problems };
}

/** npm's tarball name: @scope/name 1.2.3 -> scope-name-1.2.3.tgz */
export const tarballName = (name, version) => `${name.replace(/^@/, "").replace("/", "-")}-${version}.tgz`;

/** Everything that must hold before `npm ci`: pins, files, hashes, package.json and the lockfile agree. */
export function checkVendor(repo) {
  const frontend = join(repo, "frontend");
  const { pins, problems } = readPins(repo);
  if (!pins.length) problems.push(`${PIN_FILE}: no pins`);
  if (new Set(pins.map((p) => p.commit)).size > 1) problems.push(`${PIN_FILE}: all packages must come from one nodestro-ui commit`);
  if (new Set(pins.map((p) => p.name)).size !== pins.length) problems.push(`${PIN_FILE}: a package is pinned twice`);
  const pkg = JSON.parse(readFileSync(join(frontend, "package.json"), "utf-8"));
  const lock = JSON.parse(readFileSync(join(frontend, "package-lock.json"), "utf-8"));
  const vendored = existsSync(join(frontend, "vendor")) ? readdirSync(join(frontend, "vendor")).filter((f) => f.endsWith(".tgz")) : [];
  for (const pin of pins) {
    const name = pin.file.slice("frontend/vendor/".length);
    if (name !== tarballName(pin.name, pin.version)) problems.push(`${pin.name}: file ${name} does not match its version ${pin.version}`);
    const path = join(repo, pin.file);
    if (!existsSync(path)) {
      problems.push(`${pin.name}: ${pin.file} is missing`);
      continue;
    }
    const data = readFileSync(path);
    if (sha256(data) !== pin.sha256) problems.push(`${pin.name}: ${pin.file} has SHA-256 ${sha256(data)}, the pin says ${pin.sha256}`);
    const spec = `file:vendor/${name}`;
    if (pkg.dependencies?.[pin.name] !== spec) problems.push(`${pin.name}: package.json must depend on ${spec}, has ${pkg.dependencies?.[pin.name]}`);
    const entry = lock.packages?.[`node_modules/${pin.name}`];
    if (!entry) problems.push(`${pin.name}: not in package-lock.json`);
    else {
      if (entry.resolved !== spec) problems.push(`${pin.name}: package-lock.json resolves ${entry.resolved}, expected ${spec}`);
      if (entry.integrity !== integrity(data)) problems.push(`${pin.name}: package-lock.json integrity differs from ${pin.file}`);
      if (entry.version !== pin.version) problems.push(`${pin.name}: package-lock.json has version ${entry.version}, the pin ${pin.version}`);
    }
  }
  for (const file of vendored) {
    if (!pins.some((p) => p.file === `frontend/vendor/${file}`)) problems.push(`frontend/vendor/${file} is not pinned`);
  }
  for (const [name, spec] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) {
    if (name.startsWith("@nodestro/ui-") && !pins.some((p) => p.name === name)) problems.push(`package.json: ${name}@${spec} is not pinned`);
  }
  return { pins, problems };
}

/** The regular files of a .tgz: Map(path inside "package/" -> Buffer). */
export function untar(tgz) {
  const tar = gunzipSync(tgz);
  const files = new Map();
  for (let offset = 0; offset + 512 <= tar.length; ) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break;
    const str = (start, length) => header.subarray(start, start + length).toString("utf-8").replace(/\0.*$/s, "");
    const size = parseInt(str(124, 12).trim() || "0", 8);
    const prefix = str(345, 155);
    const path = (prefix ? `${prefix}/` : "") + str(0, 100);
    const type = str(156, 1);
    if (type === "0" || type === "") files.set(path.replace(/^package\//, ""), tar.subarray(offset + 512, offset + 512 + size));
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return files;
}

/** Every entry below `dir` as a relative path ("/"-separated); directories are walked, anything else is listed. */
function listFiles(dir, prefix = "") {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    const stat = lstatSync(path);
    return stat.isDirectory() ? listFiles(path, rel) : [rel];
  });
}

/**
 * After the install: node_modules holds exactly the content of each pinned tarball, no file less, no file different
 * and no file more (catches a stale or poisoned npm cache).
 */
export function checkInstalled(repo) {
  const { pins, problems } = readPins(repo);
  for (const pin of pins) {
    const dir = join(repo, "frontend", "node_modules", pin.name);
    if (!existsSync(dir)) {
      problems.push(`${pin.name}: not installed`);
      continue;
    }
    const shipped = untar(readFileSync(join(repo, pin.file)));
    for (const [path, data] of shipped) {
      const installed = join(dir, path);
      if (!existsSync(installed)) problems.push(`${pin.name}: ${path} is missing in node_modules`);
      else if (!lstatSync(installed).isFile() || !readFileSync(installed).equals(data))
        problems.push(`${pin.name}: ${path} in node_modules differs from ${pin.file}`);
    }
    for (const path of listFiles(dir)) {
      if (!shipped.has(path)) problems.push(`${pin.name}: ${path} in node_modules is not in ${pin.file}`);
    }
  }
  return problems;
}

/** Where nodestro-ui publishes the manifest of a commit's tarballs: read-only, no token, public repository. */
export const manifestUrl = (commit) => {
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error(`not a commit: ${commit}`);
  return `https://raw.githubusercontent.com/peterkarlhuber/nodestro-ui/${commit}/artifacts/manifest.json`;
};

/**
 * The pins against nodestro-ui's artifacts/manifest.json at the pinned commit: each pinned package must be listed
 * there with the same version, file name and SHA-256, so the vendored tarballs are the ones nodestro-ui built.
 */
export function compareManifest(pins, manifest) {
  const problems = [];
  if (manifest?.format !== 1 || !Array.isArray(manifest.packages)) return ["manifest.json: unknown format"];
  for (const pin of pins) {
    const entry = manifest.packages.find((p) => p.name === pin.name);
    if (!entry) {
      problems.push(`${pin.name}: not in nodestro-ui's manifest at ${pin.commit}`);
      continue;
    }
    if (entry.version !== pin.version) problems.push(`${pin.name}: manifest version ${entry.version}, the pin ${pin.version}`);
    if (`frontend/vendor/${entry.file}` !== pin.file) problems.push(`${pin.name}: manifest file ${entry.file}, the pin ${pin.file}`);
    if (entry.sha256 !== pin.sha256) problems.push(`${pin.name}: manifest SHA-256 ${entry.sha256}, the pin ${pin.sha256}`);
  }
  return problems;
}
