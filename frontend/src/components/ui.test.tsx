import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Trash2 } from "lucide-react";

import { useRef, useState } from "react";
import { MemoryRouter } from "react-router-dom";

import { Button, ConfirmIconButton, Field, Modal, Section, Segmented, Select, StatusBadge, TextArea, TextInput, Toggle } from "./ui";

function DialogHarness({ autoFocus = false, cancelFirst = false }: { autoFocus?: boolean; cancelFirst?: boolean }) {
  const [open, setOpen] = useState(false);
  const cancel = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Öffnen</Button>
      <Modal
        title="Dialog"
        open={open}
        onClose={() => setOpen(false)}
        initialFocus={cancelFirst ? cancel : undefined}
        footer={
          <Button ref={cancel} onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
        }
      >
        <Field label="Suche">
          <TextInput autoFocus={autoFocus} />
        </Field>
      </Modal>
    </>
  );
}

describe("ui", () => {
  afterEach(cleanup);

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

  describe("Modal focus", () => {
    it("returns the focus to the opener when it closes", async () => {
      render(<DialogHarness />);
      const opener = screen.getByRole("button", { name: "Öffnen" });
      await userEvent.click(opener);
      expect(screen.getByRole("dialog", { name: "Dialog" })).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Abbrechen" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
    });

    it("focuses an autoFocus field instead of the close button", async () => {
      render(<DialogHarness autoFocus />);
      await userEvent.click(screen.getByRole("button", { name: "Öffnen" }));
      expect(screen.getByRole("textbox", { name: "Suche" })).toHaveFocus();
      await userEvent.keyboard("job");
      expect(screen.getByRole("textbox", { name: "Suche" })).toHaveValue("job");
    });

    it("focuses an explicit initialFocus target", async () => {
      render(<DialogHarness cancelFirst />);
      await userEvent.click(screen.getByRole("button", { name: "Öffnen" }));
      expect(screen.getByRole("button", { name: "Abbrechen" })).toHaveFocus();
    });
  });

  describe("Field", () => {
    it("links its label and hint to the control without htmlFor", () => {
      render(
        <>
          <Field label="Name" hint="Wie der Workflow heißt">
            <TextInput />
          </Field>
          <Field label="Beschreibung">
            <TextArea />
          </Field>
          <Field label="Modell">
            <Select value="a" onChange={() => undefined} options={[{ value: "a", label: "A" }]} />
          </Field>
        </>,
      );
      const name = screen.getByRole("textbox", { name: "Name" });
      expect(name).toHaveAccessibleDescription("Wie der Workflow heißt");
      expect(screen.getByRole("textbox", { name: "Beschreibung" })).toBeInTheDocument();
      expect(screen.getByRole("combobox", { name: "Modell" })).toBeInTheDocument();
    });

    it("keeps an own id and links only the first control", () => {
      render(
        <Field label="Grenze">
          <TextInput id="limit" />
          <TextInput aria-label="Zweites Feld" />
        </Field>,
      );
      const first = screen.getByRole("textbox", { name: "Grenze" });
      expect(first).toHaveAttribute("id", "limit");
      const second = screen.getByRole("textbox", { name: "Zweites Feld" });
      expect(second).not.toHaveAttribute("id");
    });

    it("respects an explicit htmlFor", () => {
      render(
        <Field label="Code" htmlFor="code-input">
          <input id="code-input" />
          <TextInput aria-label="Anderes" />
        </Field>,
      );
      expect(screen.getByRole("textbox", { name: "Code" })).toHaveAttribute("id", "code-input");
      expect(screen.getByRole("textbox", { name: "Anderes" })).not.toHaveAttribute("id");
    });
  });

  it("gives the focus back to the delete button after Escape", async () => {
    render(<ConfirmIconButton icon={Trash2} label="Lauf löschen" onConfirm={() => undefined} />);
    await userEvent.click(screen.getByRole("button", { name: "Lauf löschen" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Lauf löschen" })).toHaveFocus();
  });

  describe("Section", () => {
    const details = (container: HTMLElement) => container.querySelector("details")!;
    /** What a click on the summary does in a browser: flip `open`, then fire "toggle". */
    const toggle = (element: HTMLDetailsElement) => {
      element.open = !element.open;
      fireEvent(element, new Event("toggle"));
    };

    it("keeps its help button next to the summary, not inside it (AX-09)", async () => {
      const { container } = render(
        <MemoryRouter>
          <Section title="Memory" tip="agent.memory" summary="Off">
            <input aria-label="Space" />
          </Section>
        </MemoryRouter>,
      );
      const help = screen.getByRole("button", { name: "Hilfe: Memory" });
      expect(container.querySelector("summary")!.contains(help)).toBe(false);
      expect(container.querySelector("summary button")).toBeNull();
      // Right before the section in the keyboard order, and still there while the section is closed.
      expect(details(container).open).toBe(false);
      expect(help.compareDocumentPosition(container.querySelector("summary")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      await userEvent.click(help);
      expect(details(container).open).toBe(false);
      expect(help).toHaveAttribute("aria-expanded", "true");
    });

    it("renders no frame without a help button", () => {
      const { container } = render(<Section title="Plain">x</Section>);
      expect(container.firstElementChild?.tagName).toBe("DETAILS");
    });

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

    it("adds a page's own classes next to its own", () => {
      const { container } = render(
        <Section title="Fall 1" className="panel case-editor">
          x
        </Section>,
      );
      expect(details(container)).toHaveClass("section", "panel", "case-editor");
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
