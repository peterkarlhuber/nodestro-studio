import { afterEach, describe, expect, it, vi } from "vitest";

import { parseSections, useAgentSections } from "./sectionState";

describe("parseSections", () => {
  it("keeps known sections with boolean values", () => {
    expect(parseSections(JSON.stringify({ advanced: true, tools: false }))).toEqual({ advanced: true, tools: false });
  });

  it("drops unknown sections and wrong types", () => {
    expect(parseSections(JSON.stringify({ advanced: "yes", other: true, quality: 1, memory: true }))).toEqual({ memory: true });
  });

  it("falls back to no remembered sections on missing or broken entries", () => {
    expect(parseSections(null)).toEqual({});
    expect(parseSections("{not json")).toEqual({});
    expect(parseSections("[true]")).toEqual({});
    expect(parseSections("null")).toEqual({});
  });
});

describe("useAgentSections", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    useAgentSections.setState({ open: {} });
  });

  it("stores a toggled section", () => {
    useAgentSections.getState().setOpen("thinking", true);
    expect(useAgentSections.getState().open).toEqual({ thinking: true });
    expect(localStorage.getItem("nodestro-agent-sections")).toBe('{"thinking":true}');
  });

  it("still remembers the section for this session when storage fails", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    useAgentSections.getState().setOpen("output", false);
    expect(useAgentSections.getState().open).toEqual({ output: false });
  });
});
