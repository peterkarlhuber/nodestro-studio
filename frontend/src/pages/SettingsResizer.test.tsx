import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { SettingsResizer, measureRoom } from "./SettingsResizer";
import { SETTINGS_WIDTH } from "./settingsWidth";

/** A box for getBoundingClientRect (jsdom lays nothing out). */
function box(element: HTMLElement, left: number, width: number) {
  element.getBoundingClientRect = () => ({ left, right: left + width, width, top: 0, bottom: 100, height: 100, x: left, y: 0, toJSON: () => ({}) });
  element.getClientRects = () => [element.getBoundingClientRect()] as unknown as DOMRectList;
}

/** Layout 1600 px wide: content from 0 with the given width, a 16 px edge, the 240 px navigation right after it. */
function Harness({ initial = 1120 }: { initial?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const nav = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(initial);
  const layout = (element: HTMLElement | null, part: "host" | "content" | "nav") => {
    if (!element) return;
    if (part === "host") box(element, 0, 1600);
    if (part === "content") box(element, 0, width);
    if (part === "nav") box(element, width + 40, 240);
  };
  return (
    <div
      ref={(element) => {
        host.current = element;
        layout(element, "host");
      }}
    >
      <div
        ref={(element) => {
          content.current = element;
          layout(element, "content");
        }}
        data-testid="content"
        data-width={width}
      />
      <SettingsResizer host={host} content={content} nav={nav} width={width} onWidth={setWidth} onReset={() => setWidth(SETTINGS_WIDTH.default)} />
      <nav
        ref={(element) => {
          nav.current = element;
          layout(element, "nav");
        }}
      />
    </div>
  );
}

const width = () => Number(screen.getByTestId("content").dataset.width);

describe("SettingsResizer", () => {
  afterEach(cleanup);

  it("is a focusable window splitter that reports its width and bounds", () => {
    render(<Harness />);
    const separator = screen.getByRole("separator", { name: "Breite des Einstellungsinhalts" });
    expect(separator).toHaveAttribute("tabindex", "0");
    expect(separator).toHaveAttribute("aria-orientation", "vertical");
    expect(separator).toHaveAttribute("aria-valuemin", String(SETTINGS_WIDTH.min));
    expect(separator).toHaveAttribute("aria-valuenow", "1120");
    // 1600 − (1120 + 40 + 240) = 200 px of room left after the navigation.
    expect(separator).toHaveAttribute("aria-valuemax", "1320");
  });

  it("moves the edge with the arrow keys, Shift, Home and End, never beyond the room", () => {
    render(<Harness />);
    const separator = screen.getByRole("separator");
    fireEvent.keyDown(separator, { key: "ArrowRight" });
    expect(width()).toBe(1136);
    fireEvent.keyDown(separator, { key: "ArrowLeft", shiftKey: true });
    expect(width()).toBe(1056);
    fireEvent.keyDown(separator, { key: "Home" });
    expect(width()).toBe(SETTINGS_WIDTH.min);
    fireEvent.keyDown(separator, { key: "End" });
    // End: the content takes the room that is left (560 + 40 + 240 leaves 760 px, so 560 + 760).
    expect(width()).toBe(1320);
    fireEvent.keyDown(separator, { key: "ArrowRight", shiftKey: true });
    expect(width()).toBe(1320);
  });

  it("goes back to the standard width on a double-click", () => {
    render(<Harness initial={700} />);
    act(() => void fireEvent.doubleClick(screen.getByRole("separator")));
    expect(width()).toBe(SETTINGS_WIDTH.default);
  });

  it("measures the room left after the navigation", () => {
    const host = document.createElement("div");
    const content = document.createElement("div");
    const nav = document.createElement("nav");
    box(host, 0, 1000);
    box(content, 0, 600);
    box(nav, 640, 240);
    expect(measureRoom(host, content, nav, 1120)).toEqual({ shown: 600, max: 720 });
    expect(measureRoom(null, null, null, 900)).toEqual({ shown: 900, max: SETTINGS_WIDTH.max });
  });
});
