import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useAppTheme } from "./theme";

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
