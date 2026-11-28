// @vitest-environment node
// ST-068 step 7: the studio draws with the shared tokens of @nodestro/ui-tokens and the nodestro brand theme of
// @nodestro/ui-themes. Its own token file (Midnight Citron, --nd-*) is gone; the theme carries the same values, so the
// look did not change. These checks keep it that way: no --nd-* property (except the two type steps the shared scale
// has no step for), no token defined by the studio itself, and the theme still has every former value.

import { describe, expect, it } from "vitest";

type Fs = {
  readdirSync(path: string, options: { recursive: true }): string[];
  readFileSync(path: string, encoding: "utf-8"): string;
  existsSync(path: string): boolean;
};
const fs = (globalThis as unknown as { process: { getBuiltinModule(id: string): Fs } }).process.getBuiltinModule("node:fs");

const FRONTEND = decodeURIComponent(new URL("../..", import.meta.url).pathname).replace(/\/$/, "");
const SOURCES = fs
  .readdirSync(`${FRONTEND}/src`, { recursive: true })
  .filter((name) => /\.(css|tsx?)$/.test(name) && !name.endsWith("tokens.test.ts"))
  .map((name) => [name, fs.readFileSync(`${FRONTEND}/src/${name}`, "utf-8")] as const);

/** The two steps of the studio's type scale that stay in the studio (styles/app.css). */
const KEPT = new Set(["--nd-font-size-xs", "--nd-font-size-xl"]);

/** The former Midnight Citron colours (light, dark) and the token that carries each now. */
const FORMER_COLOURS: [string, string, string][] = [
  ["--ui-color-bg", "#F6F7F2", "#151819"],
  ["--ui-color-chrome", "#FFFFFF", "#1B2120"],
  ["--ui-color-canvas", "#EDF0E9", "#1A2020"],
  ["--ui-color-surface-2", "#FAFBF7", "#202625"],
  ["--ui-color-surface", "#FFFFFF", "#252B2A"],
  ["--ui-color-surface-hover", "#F0F3EA", "#2D3531"],
  ["--ui-color-surface-raised", "#F7F9F3", "#303936"],
  ["--ui-color-border", "#D4DDD2", "#3B4640"],
  ["--ui-color-border-strong", "#AEBFAD", "#516057"],
  ["--ui-color-text", "#1A251F", "#F1F3ED"],
  ["--ui-color-text-muted", "#56685E", "#ADBAB1"],
  ["--ui-color-text-subtle", "#5F6E64", "#94A39A"],
  ["--ui-color-primary", "#546B25", "#BED372"],
  ["--ui-color-primary-hover", "#41551B", "#D2E78D"],
  ["--ui-color-primary-active", "#314111", "#A8BD5D"],
  ["--ui-color-on-primary", "#FFFFFF", "#151819"],
  ["--ui-color-primary-subtle", "#EBF1D6", "#303923"],
  ["--ui-color-focus", "#546B25", "#BED372"],
  ["--ui-color-success", "#126A50", "#73D7AE"],
  ["--ui-color-success-bg", "#E0F1E9", "#203F36"],
  ["--ui-color-running", "#246B97", "#8CBDDE"],
  ["--ui-color-running-bg", "#E1EFF9", "#263E4F"],
  ["--ui-color-warning", "#905614", "#ECC179"],
  ["--ui-color-warning-bg", "#FFF0D5", "#403521"],
  ["--ui-color-danger", "#B43E3A", "#F1958B"],
  ["--ui-color-danger-bg", "#FAE7E3", "#442C2B"],
  ["--ui-color-idle", "#5C6B61", "#AFBBB4"],
  ["--ui-color-idle-bg", "#E9EFEB", "#343E3B"],
  ["--ui-color-grid", "rgba(79, 102, 83, .12)", "rgba(177, 201, 180, .085)"],
  ["--ui-shadow-md", "0 10px 30px rgba(25,42,31,.075)", "0 10px 32px rgba(0,0,0,.27)"],
  ["--ui-shadow-lg", "0 20px 70px rgba(25,42,31,.16)", "0 20px 70px rgba(0,0,0,.40)"],
];

/** The former sizes, radii, spaces and durations, in px or ms, and their tokens (rem at a 16px root). */
const FORMER_SIZES: [string, number][] = [
  ["--ui-text-2xs", 10],
  ["--ui-text-xs", 12],
  ["--ui-text-sm", 13],
  ["--ui-text-md", 14],
  ["--ui-text-lg", 16],
  ["--ui-text-xl", 20],
  ["--ui-radius-sm", 7],
  ["--ui-radius-md", 11],
  ["--ui-radius-lg", 15],
  ["--ui-radius-xl", 20],
  ["--ui-space-1", 4],
  ["--ui-space-2", 8],
  ["--ui-space-3", 12],
  ["--ui-space-4", 16],
  ["--ui-space-6", 24],
  ["--ui-space-8", 32],
  ["--ui-duration-fast", 130],
  ["--ui-duration-normal", 220],
];

const THEME = fs.readFileSync(`${FRONTEND}/node_modules/@nodestro/ui-themes/dist/nodestro.css`, "utf-8");
const TOKENS = fs.readFileSync(`${FRONTEND}/node_modules/@nodestro/ui-tokens/dist/tokens.css`, "utf-8");

/** The declarations of the first rule with exactly this selector. */
function block(css: string, selector: string): Map<string, string> {
  const start = css.indexOf(`${selector} {`);
  expect(start, selector).toBeGreaterThanOrEqual(0);
  const body = css.slice(start, css.indexOf("}", start));
  return new Map([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));
}

const same = (a: string, b: string) => a.replace(/\s+/g, "").replace(/\b0\./g, ".").toLowerCase() === b.replace(/\s+/g, "").replace(/\b0\./g, ".").toLowerCase();

function amount(value: string): number {
  const number = Number.parseFloat(value);
  return value.endsWith("rem") ? number * 16 : number;
}

describe("the studio's tokens (ST-068 step 7)", () => {
  it("has no token file of its own any more", () => {
    expect(fs.existsSync(`${FRONTEND}/src/styles/midnight-citron.css`)).toBe(false);
    expect(SOURCES.some(([name]) => name.endsWith("midnight-citron.css"))).toBe(false);
  });

  it("uses no --nd-* property but the two kept type steps, and defines those only in app.css", () => {
    expect(SOURCES.length).toBeGreaterThan(20);
    for (const [name, text] of SOURCES) {
      const used = [...text.matchAll(/--nd-[a-z0-9-]+/g)].map((match) => match[0]).filter((property) => !KEPT.has(property));
      expect(used, name).toEqual([]);
      if (name !== "styles/app.css") expect(text, name).not.toMatch(/--nd-[a-z0-9-]+\s*:/);
    }
  });

  it("defines no shared token itself (the brand theme does)", () => {
    for (const [name, text] of SOURCES) expect(text, name).not.toMatch(/(^|[;{\s])--ui-[a-z0-9-]+\s*:/m);
  });

  it("keeps every former colour in the nodestro brand theme, in both themes", () => {
    const light = block(THEME, ":root,\n[data-theme='light']");
    const dark = block(THEME, "[data-theme='dark']");
    expect(FORMER_COLOURS).toHaveLength(31);
    for (const [token, lightValue, darkValue] of FORMER_COLOURS) {
      expect(same(light.get(token) ?? "", lightValue), `${token} light`).toBe(true);
      expect(same(dark.get(token) ?? "", darkValue), `${token} dark`).toBe(true);
    }
  });

  it("keeps every former size, radius, space and duration", () => {
    const values = new Map([...block(TOKENS, ":root"), ...block(THEME, ":root")]);
    for (const [token, former] of FORMER_SIZES) expect(amount(values.get(token) ?? "NaN"), token).toBe(former);
  });
});
