import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Segmented, StatusBadge, Toggle } from "./ui";

describe("ui", () => {
  it("shows status as text, not colour alone", () => {
    render(<StatusBadge status="failed" />);
    expect(screen.getByText("Fehler")).toBeInTheDocument();
  });

  it("toggles via an accessible switch", async () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Websuche" />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("selects a segment", async () => {
    const onChange = vi.fn();
    render(
      <Segmented
        label="Theme"
        value="dark"
        onChange={onChange}
        options={[
          { value: "dark", label: "Dunkel" },
          { value: "light", label: "Hell" },
        ]}
      />,
    );
    expect(screen.getByRole("radio", { name: "Dunkel" })).toHaveAttribute("aria-checked", "true");
    await userEvent.click(screen.getByRole("radio", { name: "Hell" }));
    expect(onChange).toHaveBeenCalledWith("light");
  });
});
