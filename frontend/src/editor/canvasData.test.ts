import { describe, expect, it } from "vitest";

import type { WorkflowNode } from "../api/types";
import { reuseData } from "./Canvas";
import type { FlowNodeData } from "./nodes";

const node = { id: "a", type: "agent", label: "Writer" } as WorkflowNode;

describe("reuseData (ST-004)", () => {
  it("keeps the previous data object while every field is the same, so memoized nodes do not render again", () => {
    const cache = new Map<string, FlowNodeData>();
    const first = reuseData(cache, "a", { node, issues: 0, warnings: 0, blocked: false });
    const same = reuseData(cache, "a", { node, issues: 0, warnings: 0, blocked: false });
    expect(same).toBe(first);
    const changed = reuseData(cache, "a", { node, issues: 1, warnings: 0, blocked: false });
    expect(changed).not.toBe(first);
    expect(changed.issues).toBe(1);
    // The changed object is the one kept from now on.
    expect(reuseData(cache, "a", { node, issues: 1, warnings: 0, blocked: false })).toBe(changed);
    // A new node object (an edit) is a change too.
    expect(reuseData(cache, "a", { node: { ...node }, issues: 1, warnings: 0, blocked: false })).not.toBe(changed);
  });
});
