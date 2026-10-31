import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Run } from "../api/types";
import { RunSummaryLine } from "./RunSummaryLine";

const RUN = {
  workflow: {
    nodes: [
      { id: "start", type: "start", label: "Start" },
      { id: "classify", type: "agent", label: "Klassifizierer" },
      { id: "answer", type: "agent", label: "Antwort" },
    ],
    edges: [],
  },
  nodes: {
    classify: { status: "succeeded", started_at: "2026-10-31T10:00:00Z", tool_calls: [{ name: "web_search", is_error: true }] },
    answer: { status: "failed", started_at: "2026-10-31T10:00:01Z", tool_calls: [] },
  },
} as unknown as Run;

describe("RunSummaryLine", () => {
  it("names the failed step and jumps to it", async () => {
    const onOpenStep = vi.fn();
    render(<RunSummaryLine run={RUN} onOpenStep={onOpenStep} />);
    const summary = screen.getByRole("region", { name: "Kurzfassung des Laufs" });
    expect(summary).toHaveTextContent("1 von 2 erfolgreich");
    expect(summary).toHaveTextContent("web_search (1, 1 Fehler)");
    expect(summary).toHaveTextContent("Fehlgeschlagen bei Antwort");
    await userEvent.click(screen.getByRole("button", { name: "Zum Schritt" }));
    expect(onOpenStep).toHaveBeenCalledWith("answer");
  });
});
