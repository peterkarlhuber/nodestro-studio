import { describe, expect, it } from "vitest";

import { childLink, crumbLink, parseTrail } from "./trail";

describe("trail", () => {
  it("reads the ids above the current workflow", () => {
    expect(parseTrail(null, "wf_c")).toEqual([]);
    expect(parseTrail("wf_a,wf_b", "wf_c")).toEqual(["wf_a", "wf_b"]);
    expect(parseTrail("wf_a,wf_c,wf_b", "wf_c")).toEqual(["wf_a"]);
    expect(parseTrail("wf_a,bad id,wf_a", "wf_c")).toEqual(["wf_a"]);
  });

  it("links into a team and back up", () => {
    expect(childLink(["wf_a"], "wf_b", "wf_c")).toBe("/workflows/wf_c?trail=wf_a,wf_b");
    expect(crumbLink(["wf_a", "wf_b"], 0)).toBe("/workflows/wf_a");
    expect(crumbLink(["wf_a", "wf_b"], 1)).toBe("/workflows/wf_b?trail=wf_a");
  });
});
