import { describe, expect, it } from "vitest";

import { isSettingsShortcut } from "./AppShell";

const key = (init: Partial<KeyboardEvent>) => ({ key: "", ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...init });

describe("settings shortcut", () => {
  it("is Ctrl+, or ⌘, and nothing else", () => {
    expect(isSettingsShortcut(key({ key: ",", ctrlKey: true }))).toBe(true);
    expect(isSettingsShortcut(key({ key: ",", metaKey: true }))).toBe(true);
    expect(isSettingsShortcut(key({ key: "," }))).toBe(false);
    expect(isSettingsShortcut(key({ key: ",", ctrlKey: true, shiftKey: true }))).toBe(false);
    expect(isSettingsShortcut(key({ key: ",", ctrlKey: true, altKey: true }))).toBe(false);
    // The shortcuts already taken: global search and the assistant.
    expect(isSettingsShortcut(key({ key: "k", ctrlKey: true }))).toBe(false);
    expect(isSettingsShortcut(key({ key: "j", ctrlKey: true }))).toBe(false);
  });
});
