import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Trash2 } from "lucide-react";

import { ConfirmIconButton, Section, Segmented, StatusBadge, Toggle } from "./ui";

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

  it("deletes only after a second, confirming click", async () => {
    const onConfirm = vi.fn();
    render(<ConfirmIconButton icon={Trash2} label="Lauf löschen" onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole("button", { name: "Lauf löschen" }));
    expect(onConfirm).not.toHaveBeenCalled();
    const confirm = screen.getByRole("button", { name: "Lauf löschen: Wirklich löschen?" });
    expect(confirm).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Lauf löschen" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Lauf löschen" }));
    await userEvent.click(screen.getByRole("button", { name: "Lauf löschen: Wirklich löschen?" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  describe("Section", () => {
    const details = (container: HTMLElement) => container.querySelector("details")!;
    /** What a click on the summary does in a browser: flip `open`, then fire "toggle". */
    const toggle = (element: HTMLDetailsElement) => {
      element.open = !element.open;
      fireEvent(element, new Event("toggle"));
    };

    it("does not close itself when its default changes", () => {
      // e.g. the Memory section: choosing "off" turns the computed default from open to closed
      const { container, rerender } = render(
        <Section title="Memory" defaultOpen>
          <input aria-label="Space" />
        </Section>,
      );
      expect(details(container).open).toBe(true);
      rerender(
        <Section title="Memory" defaultOpen={false}>
          <input aria-label="Space" />
        </Section>,
      );
      expect(details(container).open).toBe(true);
    });

    it("keeps the state the user chose across re-renders", () => {
      const { container, rerender } = render(<Section title="Advanced">x</Section>);
      toggle(details(container));
      rerender(
        <Section title="Advanced" summary="changed">
          x
        </Section>,
      );
      expect(details(container).open).toBe(true);
    });

    it("keeps values typed in its body when closed and opened again", async () => {
      const { container } = render(
        <Section title="Tools" defaultOpen>
          <input aria-label="Name" />
        </Section>,
      );
      await userEvent.type(screen.getByLabelText("Name"), "web");
      toggle(details(container));
      toggle(details(container));
      expect(screen.getByLabelText("Name")).toHaveValue("web");
    });

    it("can be controlled from outside", () => {
      const onToggle = vi.fn();
      const { container, rerender } = render(
        <Section title="Quality" open={false} onToggle={onToggle}>
          x
        </Section>,
      );
      toggle(details(container));
      expect(onToggle).toHaveBeenCalledWith(true);
      rerender(
        <Section title="Quality" open onToggle={onToggle}>
          x
        </Section>,
      );
      expect(details(container).open).toBe(true);
      rerender(
        <Section title="Quality" open={false} onToggle={onToggle}>
          x
        </Section>,
      );
      expect(details(container).open).toBe(false);
      expect(onToggle).toHaveBeenCalledTimes(1); // changes made by the parent are not reported back
    });

    it("shows problems as text and icon while closed", () => {
      const { container } = render(
        <Section title="Quality" summary="0 Kriterien" status={{ errors: 1, warnings: 2 }}>
          x
        </Section>,
      );
      expect(details(container).open).toBe(false);
      const summary = container.querySelector("summary")!;
      expect(summary).toHaveTextContent("1 Fehler");
      expect(summary).toHaveTextContent("2 Warnungen");
      expect(summary.querySelectorAll("svg[aria-hidden]").length).toBeGreaterThanOrEqual(3);
    });

    it("shows no status when there is nothing to report", () => {
      const { container } = render(
        <Section title="Tools" status={{ errors: 0, warnings: 0 }}>
          x
        </Section>,
      );
      expect(container.querySelector(".section__status")).toBeNull();
    });
  });
});
