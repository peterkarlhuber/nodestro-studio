// The vendored nodestro-ui packages (N-16): the committed pins, tarballs, package.json and lockfile agree, the
// installed files are exactly the tarballs' content (a stale npm cache cannot slip through), and a changed tarball
// or pin is refused before npm runs.
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { PIN_FILE, checkInstalled, checkVendor, readPins, untar } from "./ui-vendor-lib.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const scratch = mkdtempSync(join(tmpdir(), "ui-vendor-test-"));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

/** A copy of what the check reads: the pin file, package.json, the lockfile and the tarballs. */
function copy(name) {
  const dir = join(scratch, name);
  mkdirSync(join(dir, "platform"), { recursive: true });
  cpSync(join(repo, PIN_FILE), join(dir, PIN_FILE));
  mkdirSync(join(dir, "frontend"), { recursive: true });
  for (const file of ["package.json", "package-lock.json"]) cpSync(join(repo, "frontend", file), join(dir, "frontend", file));
  cpSync(join(repo, "frontend", "vendor"), join(dir, "frontend", "vendor"), { recursive: true });
  return dir;
}

describe("vendored UI packages", () => {
  it("pin core, ai, tokens and the themes from one nodestro-ui commit, and everything agrees", () => {
    const { pins, problems } = checkVendor(repo);
    expect(problems).toEqual([]);
    expect(pins.map((p) => p.name).sort()).toEqual(["@nodestro/ui-ai", "@nodestro/ui-core", "@nodestro/ui-themes", "@nodestro/ui-tokens"]);
  });

  it("are installed exactly as vendored", () => {
    expect(checkInstalled(repo)).toEqual([]);
  });

  it("ship nothing but package.json, README, LICENSE and dist/, and no install scripts", () => {
    for (const pin of readPins(repo).pins) {
      const files = untar(readFileSync(join(repo, pin.file)));
      for (const path of files.keys()) expect(path, `${pin.name}: ${path}`).toMatch(/^(package\.json|README\.md|LICENSE|dist\/.+)$/);
      const pkg = JSON.parse(files.get("package.json").toString("utf-8"));
      expect(pkg.name).toBe(pin.name);
      expect(pkg.version).toBe(pin.version);
      expect(pkg.scripts).toBeUndefined();
      expect(pkg.dependencies).toBeUndefined();
    }
  });

  it("refuse a tarball whose bytes changed", () => {
    const dir = copy("tampered");
    const pin = readPins(dir).pins[0];
    const data = readFileSync(join(dir, pin.file));
    data[data.length - 20] ^= 1;
    writeFileSync(join(dir, pin.file), data);
    const { problems } = checkVendor(dir);
    expect(problems.join("\n")).toMatch(new RegExp(`${pin.name}: .* has SHA-256 .*the pin says`));
    expect(problems.join("\n")).toMatch(/integrity differs/);
  });

  it("refuse a pin that does not match the lockfile, a stray tarball and an unpinned package", () => {
    const dir = copy("drift");
    const text = readFileSync(join(dir, PIN_FILE), "utf-8").replace(/sha256=[0-9a-f]{64}/, `sha256=${"0".repeat(64)}`);
    writeFileSync(join(dir, PIN_FILE), text);
    writeFileSync(join(dir, "frontend", "vendor", "nodestro-ui-extra-0.1.0.tgz"), "x");
    const pkg = JSON.parse(readFileSync(join(dir, "frontend", "package.json"), "utf-8"));
    pkg.dependencies["@nodestro/ui-admin"] = "file:vendor/nodestro-ui-admin-0.1.0.tgz";
    writeFileSync(join(dir, "frontend", "package.json"), JSON.stringify(pkg));
    const problems = checkVendor(dir).problems.join("\n");
    expect(problems).toMatch(/the pin says 0{64}/);
    expect(problems).toMatch(/nodestro-ui-extra-0\.1\.0\.tgz is not pinned/);
    expect(problems).toMatch(/@nodestro\/ui-admin.* is not pinned/);
  });
});
