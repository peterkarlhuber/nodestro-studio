import { describe, expect, it } from "vitest";

import { addCapabilities } from "./capabilities";

describe("addCapabilities", () => {
  it("trims, splits at commas and skips repeats ignoring case", () => {
    expect(addCapabilities(["Research"], " research ,  translate   texts,, ")).toEqual(["Research", "translate texts"]);
  });

  it("keeps tags short and stops at the maximum", () => {
    expect(addCapabilities([], "x".repeat(50))).toEqual(["x".repeat(40)]);
    const full = Array.from({ length: 20 }, (_, index) => `tag${index}`);
    expect(addCapabilities(full, "one more")).toEqual(full);
  });
});
