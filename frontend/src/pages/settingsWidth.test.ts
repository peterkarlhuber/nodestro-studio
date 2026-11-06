import { afterEach, describe, expect, it, vi } from "vitest";

import { SETTINGS_WIDTH, SETTINGS_WIDTH_KEY, clampWidth, loadWidth, parseWidth, saveWidth } from "./settingsWidth";

describe("settings width", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("is clearly wider than the old fixed column by default", () => {
    expect(SETTINGS_WIDTH.default).toBeGreaterThanOrEqual(1100);
    expect(SETTINGS_WIDTH.min).toBeLessThan(SETTINGS_WIDTH.default);
    expect(SETTINGS_WIDTH.max).toBeGreaterThan(SETTINGS_WIDTH.default);
  });

  it("keeps a width within the bounds", () => {
    expect(clampWidth(100)).toBe(SETTINGS_WIDTH.min);
    expect(clampWidth(99999)).toBe(SETTINGS_WIDTH.max);
    expect(clampWidth(900.4)).toBe(900);
  });

  it("reads a stored width and falls back to the default for anything else", () => {
    expect(parseWidth(null)).toBe(SETTINGS_WIDTH.default);
    expect(parseWidth("")).toBe(SETTINGS_WIDTH.default);
    expect(parseWidth("wide")).toBe(SETTINGS_WIDTH.default);
    expect(parseWidth("1300")).toBe(1300);
    expect(parseWidth("10")).toBe(SETTINGS_WIDTH.min);
  });

  it("stores a changed width and forgets the default one", () => {
    saveWidth(1400);
    expect(localStorage.getItem(SETTINGS_WIDTH_KEY)).toBe("1400");
    expect(loadWidth()).toBe(1400);
    saveWidth(SETTINGS_WIDTH.default);
    expect(localStorage.getItem(SETTINGS_WIDTH_KEY)).toBeNull();
  });

  it("works without storage (private mode)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadWidth()).toBe(SETTINGS_WIDTH.default);
    expect(() => saveWidth(1300)).not.toThrow();
  });
});
