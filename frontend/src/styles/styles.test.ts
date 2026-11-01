import { describe, expect, it } from "vitest";

// A missing "}" does not break the build: the minifier only warns, and with CSS nesting every rule after it silently
// becomes a descendant rule of the unclosed one, so its styles stop applying. This test fails instead.
function unclosed(css: string): number[] {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
  const open: number[] = [];
  source.split("\n").forEach((line, index) => {
    for (const char of line) {
      if (char === "{") open.push(index + 1);
      else if (char === "}") open.pop();
    }
  });
  return open;
}

const sheets = import.meta.glob<string>(["./*.css", "../welcome/*.css"], { query: "?raw", import: "default", eager: true });

describe("style sheets", () => {
  it("finds the style sheets", () => {
    expect(Object.keys(sheets).length).toBeGreaterThanOrEqual(3);
  });

  for (const [name, css] of Object.entries(sheets)) {
    it(`${name} closes every block`, () => {
      expect(unclosed(css)).toEqual([]);
    });
  }

  // The studio uses only the type scale tokens (DESIGN_SYSTEM.md, "Type scale"); the welcome page has its own sizes.
  for (const [name, css] of Object.entries(sheets).filter(([name]) => name.startsWith("./"))) {
    it(`${name} takes font sizes from the type scale`, () => {
      expect(css.match(/font-size:\s*[0-9.]+(px|rem)/g) ?? []).toEqual([]);
    });
  }

  it("detects an unclosed block", () => {
    expect(unclosed(".a {\n  color: red;\n\n.b { color: blue; }\n")).toEqual([1]);
  });
});
