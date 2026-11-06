import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "../i18n";
import { LiveAnnouncer, ProgressBar, StepList, TechnicalDetails, formatSeconds, shareOf } from "./Progress";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

afterEach(cleanup);

describe("progress bar", () => {
  it("has a value only when the progress is measurable", () => {
    render(<ProgressBar share={0.42} label="Download" valueText="42 %, 1 GB of 2 GB" />);
    const bar = screen.getByRole("progressbar", { name: "Download" });
    expect(bar.getAttribute("aria-valuenow")).toBe("42");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(bar.getAttribute("aria-valuetext")).toBe("42 %, 1 GB of 2 GB");
    cleanup();
    render(<ProgressBar share={null} label="Start" />);
    const busy = screen.getByRole("progressbar", { name: "Start" });
    expect(busy.hasAttribute("aria-valuenow")).toBe(false);
    expect(busy.hasAttribute("aria-valuemax")).toBe(false);
    expect(busy.className).toContain("nd-progress--indeterminate");
    expect(busy.getAttribute("aria-valuetext")).toBe("In progress, no measurable progress");
  });

  it("measures nothing without a total", () => {
    expect(shareOf(5, null)).toBeNull();
    expect(shareOf(5, 0)).toBeNull();
    expect(shareOf(5, 10)).toBe(0.5);
    expect(shareOf(15, 10)).toBe(1);
  });

  it("says durations in words", () => {
    expect(formatSeconds(42)).toBe("42 seconds");
    expect(formatSeconds(150)).toBe("3 minutes");
    expect(formatSeconds(3900)).toBe("1 hour 5 minutes");
  });
});

describe("steps", () => {
  it("marks the running step as the current one and says each state", () => {
    render(
      <StepList
        label="Steps"
        steps={[
          { id: "a", label: "Check", state: "done" },
          { id: "b", label: "Download", state: "skipped", note: "Already installed." },
          { id: "c", label: "Start", state: "running" },
          { id: "d", label: "Ready", state: "pending" },
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.getAttribute("aria-current"))).toEqual([null, null, "step", null]);
    expect(items[0].textContent).toContain("Check: done");
    expect(items[1].textContent).toContain("Already installed.");
    expect(items[2].textContent).toContain("running now");
  });

  it("announces a new step once, politely", () => {
    const { rerender } = render(<LiveAnnouncer message="Step 1 of 3: Check" />);
    const region = screen.getByRole("status");
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(region.textContent).toBe("Step 1 of 3: Check");
    act(() => rerender(<LiveAnnouncer message="Step 2 of 3: Start" />));
    expect(region.textContent).toBe("Step 2 of 3: Start");
  });

  it("keeps technical details closed until asked for", () => {
    render(
      <TechnicalDetails>
        <pre>log line</pre>
      </TechnicalDetails>,
    );
    const details = screen.getByText("Technical details").closest("details");
    expect(details?.open).toBe(false);
  });
});
