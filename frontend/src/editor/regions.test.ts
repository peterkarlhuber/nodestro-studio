import { afterEach, describe, expect, it } from "vitest";

import { nextRegion, onRegionKey } from "./regions";

function setup() {
  document.body.innerHTML = `
    <div id="root">
      <header data-editor-region aria-label="Title"><button id="b1">Save</button></header>
      <aside data-editor-region aria-label="Blocks"></aside>
      <div data-editor-region aria-label="Canvas" hidden></div>
      <aside data-editor-region aria-label="Properties"><input id="i1" /></aside>
    </div>`;
  // jsdom has no layout: report a box for every element that is not hidden.
  for (const element of document.querySelectorAll<HTMLElement>("[data-editor-region]"))
    element.getClientRects = () => (element.hidden ? [] : [{}]) as unknown as DOMRectList;
  return document.getElementById("root")!;
}

describe("editor regions (F6)", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("goes to the next shown region and wraps around, skipping hidden ones", () => {
    const root = setup();
    const [title, blocks, , properties] = root.querySelectorAll("[data-editor-region]");
    expect(nextRegion(root, document.getElementById("b1"), false)).toBe(blocks);
    expect(nextRegion(root, blocks, false)).toBe(properties);
    expect(nextRegion(root, document.getElementById("i1"), false)).toBe(title);
    expect(nextRegion(root, title, true)).toBe(properties);
    expect(nextRegion(root, document.body, false)).toBe(title);
  });

  it("moves the focus on F6 and makes the region focusable", () => {
    const root = setup();
    document.getElementById("b1")!.focus();
    const event = new KeyboardEvent("keydown", { key: "F6", cancelable: true });
    onRegionKey(event, root);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Blocks");
    expect(document.activeElement?.getAttribute("tabindex")).toBe("-1");
  });
});
