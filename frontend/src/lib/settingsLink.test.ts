import { describe, expect, it } from "vitest";

import { safeReturnPath, settingsHref } from "./settingsLink";

describe("settingsHref", () => {
  it("names the section and the way back", () => {
    expect(settingsHref("provider-openai", "/workflows/wf_1")).toBe("/settings?from=%2Fworkflows%2Fwf_1#provider-openai");
    expect(settingsHref("settings-sandbox")).toBe("/settings#settings-sandbox");
    expect(settingsHref()).toBe("/settings");
  });

  it("never leads back outside the Studio or to the settings themselves", () => {
    expect(safeReturnPath("https://example.com")).toBeNull();
    expect(safeReturnPath("//example.com/x")).toBeNull();
    expect(safeReturnPath("/settings#x")).toBeNull();
    expect(safeReturnPath("/executions/run_1")).toBe("/executions/run_1");
  });
});
