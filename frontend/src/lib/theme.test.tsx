import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { THEME_STORAGE_KEY, resolveTheme, storedThemeChoice, useAppTheme, useTheme } from "./theme";

function Probe() {
  return <span data-testid="theme">{useAppTheme()}</span>;
}

describe("useAppTheme", () => {
  afterEach(() => {
    cleanup();
    delete document.documentElement.dataset.theme;
  });

  it("follows the app theme switch, not the OS setting", async () => {
    document.documentElement.dataset.theme = "light";
    render(<Probe />);
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    await act(async () => {
      document.documentElement.dataset.theme = "dark";
      // MutationObserver callbacks run as a microtask.
      await Promise.resolve();
    });
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
  });
});

function Switch() {
  const [choice, setChoice, applied] = useTheme();
  return (
    <div>
      <span data-testid="choice">{choice}</span>
      <span data-testid="applied">{applied}</span>
      <button onClick={() => setChoice("light")}>light</button>
      <button onClick={() => setChoice("system")}>system</button>
    </div>
  );
}

function mockSystem(light: boolean) {
  const listeners = new Set<() => void>();
  const list = {
    get matches() {
      return light;
    },
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  };
  window.matchMedia = vi.fn(() => list) as unknown as typeof window.matchMedia;
  return {
    change(next: boolean) {
      light = next;
      listeners.forEach((listener) => listener());
    },
  };
}

describe("useTheme", () => {
  const original = window.matchMedia;
  afterEach(() => {
    cleanup();
    localStorage.clear();
    window.matchMedia = original;
    delete document.documentElement.dataset.theme;
  });

  it("follows the system setting when nothing is stored, also when it changes", async () => {
    const system = mockSystem(true);
    expect(storedThemeChoice()).toBe("system");
    render(<Switch />);
    expect(screen.getByTestId("choice")).toHaveTextContent("system");
    expect(document.documentElement.dataset.theme).toBe("light");
    act(() => system.change(false));
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("keeps an explicit choice and forgets it again for 'system'", () => {
    mockSystem(false);
    render(<Switch />);
    act(() => screen.getByText("light").click());
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(screen.getByTestId("applied")).toHaveTextContent("light");
    act(() => screen.getByText("system").click());
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("keeps the dark theme of earlier versions, which stored 'dark' on every visit", () => {
    mockSystem(true);
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(resolveTheme(storedThemeChoice())).toBe("dark");
  });
});
