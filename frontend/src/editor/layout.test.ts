import { beforeEach, describe, expect, it } from "vitest";

import { parseDragPayload } from "./Canvas";
import { PANEL_BOUNDS, clampSize, parseLayout, useEditorLayout } from "./layout";
import { useEditor } from "./store";

describe("editor layout", () => {
  beforeEach(() => localStorage.clear());

  it("falls back to the defaults for missing, broken or foreign entries", () => {
    for (const raw of [null, "", "not json", "[]", "42", '{"open": "yes", "size": {"palette": "wide"}}']) {
      const layout = parseLayout(raw);
      expect(layout.size).toEqual({ palette: 232, inspector: 320, runPanel: 260 });
      expect(layout.open.inspector).toBe(true);
      expect(layout.open.runPanel).toBe(true);
    }
  });

  it("keeps stored sizes within the bounds of each panel", () => {
    const layout = parseLayout(JSON.stringify({ open: { inspector: false }, size: { palette: 5, inspector: 99999, runPanel: 300 } }));
    expect(layout.open.inspector).toBe(false);
    expect(layout.size.palette).toBe(PANEL_BOUNDS.palette.min);
    expect(layout.size.inspector).toBe(PANEL_BOUNDS.inspector.max);
    expect(layout.size.runPanel).toBe(300);
    expect(clampSize("runPanel", 10_000)).toBe(PANEL_BOUNDS.runPanel.max);
    expect(parseLayout(JSON.stringify({ size: { runPanel: null } })).size.runPanel).toBe(260);
  });

  it("stores the layout in the browser and never touches the workflow", () => {
    const before = useEditor.getState();
    const { setSize, toggle, resetSize } = useEditorLayout.getState();
    setSize("inspector", 420);
    toggle("runPanel");
    expect(JSON.parse(localStorage.getItem("nodestro-editor-layout")!)).toMatchObject({
      size: { inspector: 420 },
      open: { runPanel: false },
    });
    resetSize("inspector");
    expect(useEditorLayout.getState().size.inspector).toBe(PANEL_BOUNDS.inspector.default);
    toggle("runPanel");
    const after = useEditor.getState();
    expect(after.dirty).toBe(before.dirty);
    expect(after.past).toBe(before.past);
    expect(after.nodes).toBe(before.nodes);
  });
});

describe("palette drops", () => {
  it("accepts building blocks from the palette", () => {
    expect(parseDragPayload('{"type":"condition"}')).toEqual({ type: "condition", agent: undefined });
    expect(parseDragPayload('{"type":"agent","agent":{"name":"Writer"}}')).toEqual({ type: "agent", agent: { name: "Writer" } });
  });

  it("ignores anything else without throwing", () => {
    for (const raw of ["", "{", "null", "[]", '"agent"', '{"type":"script"}', '{"type":1}', '{"type":"agent","agent":"x"}', '{"type":"agent","agent":[1]}']) {
      expect(parseDragPayload(raw)).toBeNull();
    }
  });

  it("drops agent settings sent along with a node that is not an agent", () => {
    expect(parseDragPayload('{"type":"start","agent":{"name":"x"}}')).toEqual({ type: "start", agent: undefined });
  });
});
