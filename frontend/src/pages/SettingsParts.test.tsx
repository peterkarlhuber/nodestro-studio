import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SettingsAdvanced, SettingsGroup } from "./SettingsParts";

describe("settings parts", () => {
  afterEach(cleanup);

  it("names a group with a heading", () => {
    render(
      <SettingsGroup title="Budget pro Lauf" columns>
        <input aria-label="Budget" />
      </SettingsGroup>,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Budget pro Lauf" })).toBeInTheDocument();
    expect(screen.getByLabelText("Budget").parentElement).toHaveClass("settings-columns");
  });

  it("keeps advanced settings closed but rendered, and counts the changed ones", () => {
    render(
      <SettingsAdvanced title="Fähigkeiten" changed={2}>
        <input aria-label="Streaming" />
      </SettingsAdvanced>,
    );
    const details = screen.getByText("Fähigkeiten").closest("details")!;
    expect(details.open).toBe(false);
    expect(details).toHaveTextContent("Erweitert");
    expect(details).toHaveTextContent("2 geändert");
    // Closed, but in the page: the settings search finds what is inside.
    expect(details.querySelector("input")).not.toBeNull();
  });

  it("shows no count when nothing differs from the standard", () => {
    render(
      <SettingsAdvanced title="Fähigkeiten">
        <span />
      </SettingsAdvanced>,
    );
    expect(screen.getByText("Fähigkeiten").closest("details")).not.toHaveTextContent("geändert");
  });
});
