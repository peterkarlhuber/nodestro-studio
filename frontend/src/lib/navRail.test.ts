import { describe, expect, it } from "vitest";

import { railFor } from "./navRail";

describe("railFor", () => {
  it("shows the rail only in the editor while nothing is chosen", () => {
    expect(railFor("auto", "/workflows/wf_1")).toBe(true);
    expect(railFor("auto", "/workflows/examples")).toBe(false);
    expect(railFor("auto", "/")).toBe(false);
    expect(railFor("auto", "/settings")).toBe(false);
  });

  it("applies the person's choice everywhere", () => {
    expect(railFor("expanded", "/workflows/wf_1")).toBe(false);
    expect(railFor("collapsed", "/settings")).toBe(true);
  });
});
