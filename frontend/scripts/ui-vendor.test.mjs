// The vendored nodestro-ui packages (N-16): the committed pins, tarballs, package.json and lockfile agree, the
// installed files are exactly the tarballs' content (a stale npm cache cannot slip through), and a changed tarball
// or pin is refused before npm runs.
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { PIN_FILE, checkInstalled, checkVendor, compareManifest, manifestUrl, readPins, untar } from "./ui-vendor-lib.mjs";

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

  it("refuse an installed package that differs from its tarball: a changed, a missing or an extra file", () => {
    const dir = copy("installed");
    const pin = readPins(dir).pins.find((p) => p.name === "@nodestro/ui-ai");
    const installed = join(dir, "frontend", "node_modules", pin.name);
    for (const [path, data] of untar(readFileSync(join(dir, pin.file)))) {
      mkdirSync(dirname(join(installed, path)), { recursive: true });
      writeFileSync(join(installed, path), data);
    }
    const own = (problems) => problems.filter((p) => p.startsWith(pin.name));
    expect(own(checkInstalled(dir))).toEqual([]);
    writeFileSync(join(installed, "dist", "extra.js"), "globalThis.pwned = true;\n");
    mkdirSync(join(installed, "dist", "deep"), { recursive: true });
    writeFileSync(join(installed, "dist", "deep", "more.js"), "x");
    writeFileSync(join(installed, "dist", "index.js"), "export {};\n");
    rmSync(join(installed, "README.md"));
    expect(own(checkInstalled(dir)).sort()).toEqual(
      [
        `${pin.name}: README.md is missing in node_modules`,
        `${pin.name}: dist/index.js in node_modules differs from ${pin.file}`,
        `${pin.name}: dist/extra.js in node_modules is not in ${pin.file}`,
        `${pin.name}: dist/deep/more.js in node_modules is not in ${pin.file}`,
      ].sort(),
    );
  });

  describe("against nodestro-ui's manifest at the pinned commit", () => {
    const { pins } = readPins(repo);
    /** The manifest nodestro-ui writes, made from the pins (the CI step fetches the real one). */
    const manifest = () => ({
      format: 1,
      packages: pins.map((p) => ({ name: p.name, version: p.version, file: p.file.slice("frontend/vendor/".length), sha256: p.sha256 })),
    });

    it("accept the pins when the manifest lists the same versions, files and SHA-256", () => {
      expect(compareManifest(pins, manifest())).toEqual([]);
    });

    it("refuse a different SHA-256, version or file, and a package the manifest does not list", () => {
      const m = manifest();
      const [a, b, c, d] = m.packages;
      a.sha256 = "0".repeat(64);
      b.version = "9.9.9";
      c.file = "other.tgz";
      m.packages = m.packages.filter((p) => p !== d);
      const problems = compareManifest(pins, m);
      expect(problems).toHaveLength(4);
      expect(problems[0]).toContain(`${a.name}: manifest SHA-256 ${"0".repeat(64)}`);
      expect(problems.join("\n")).toContain(`${b.name}: manifest version 9.9.9`);
      expect(problems.join("\n")).toContain(`${c.name}: manifest file other.tgz`);
      expect(problems.join("\n")).toContain(`${d.name}: not in nodestro-ui's manifest`);
      expect(compareManifest(pins, { format: 2, packages: [] })).toEqual(["manifest.json: unknown format"]);
    });

    it("read the manifest only from nodestro-ui's raw file at a full commit", () => {
      expect(manifestUrl(pins[0].commit)).toBe(`https://raw.githubusercontent.com/peterkarlhuber/nodestro-ui/${pins[0].commit}/artifacts/manifest.json`);
      expect(() => manifestUrl("master")).toThrow();
      expect(() => manifestUrl("../evil")).toThrow();
    });
  });
});
