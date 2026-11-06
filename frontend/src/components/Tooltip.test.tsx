import { act, cleanup, createEvent, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "../i18n";
import { HelpTip, Tooltip, focusableAfter, placeTip, tipHost } from "./Tooltip";

function renderInRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("Tooltip", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("appears on hover after a short delay and hides on leave", () => {
    vi.useFakeTimers();
    renderInRouter(
      <Tooltip content="Speichert alles">
        <button type="button">Speichern</button>
      </Tooltip>,
    );
    const button = screen.getByRole("button", { name: "Speichern" });
    fireEvent.pointerEnter(button, { pointerType: "mouse" });
    expect(screen.queryByRole("tooltip")).toBeNull();
    act(() => void vi.advanceTimersByTime(400));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Speichert alles");
    expect(button).toHaveAttribute("aria-describedby", screen.getByRole("tooltip").id);
    fireEvent.pointerLeave(button, { pointerType: "mouse" });
    act(() => void vi.advanceTimersByTime(200));
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("ignores touch hover, so tapping a button just triggers it", () => {
    vi.useFakeTimers();
    renderInRouter(
      <Tooltip content="Erklärung">
        <button type="button">Aktion</button>
      </Tooltip>,
    );
    // jsdom does not carry pointerType through PointerEvent's init, so set it on the event itself.
    const touch = createEvent.pointerEnter(screen.getByRole("button"));
    Object.defineProperty(touch, "pointerType", { value: "touch" });
    fireEvent(screen.getByRole("button"), touch);
    act(() => void vi.advanceTimersByTime(500));
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("shows on keyboard focus and closes with Escape", async () => {
    renderInRouter(
      <Tooltip content="Erklärung">
        <button type="button">Aktion</button>
      </Tooltip>,
    );
    await userEvent.tab();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Erklärung");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});

describe("HelpTip", () => {
  afterEach(cleanup);

  it("opens on click or tap with a link to the documentation", async () => {
    renderInRouter(<HelpTip id="agent.effort" label="Aufwand" />);
    const button = screen.getByRole("button", { name: "Hilfe: Aufwand" });
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("tooltip")).toHaveTextContent(i18n.t("help.agent.effort"));
    expect(screen.getByRole("link", { name: /Mehr in der Dokumentation/ })).toHaveAttribute("href", "/docs/agenten#denken");
    await userEvent.click(button);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("keeps only one explanation open at a time", async () => {
    renderInRouter(
      <>
        <HelpTip id="agent.effort" label="Aufwand" />
        <HelpTip id="agent.model" label="Modell" />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Hilfe: Aufwand" }));
    await userEvent.click(screen.getByRole("button", { name: "Hilfe: Modell" }));
    expect(screen.getAllByRole("tooltip")).toHaveLength(1);
    expect(screen.getByRole("tooltip")).toHaveTextContent(i18n.t("help.agent.model"));
  });
});

describe("tooltip placement", () => {
  const view = { width: 1000, height: 800 };
  const size = { width: 300, height: 100 };

  it("stands above the anchor when there is room, centred on it", () => {
    const place = placeTip({ top: 400, bottom: 420, left: 490, width: 20 }, size, view);
    expect(place).toEqual({ top: 292, left: 350, below: false });
  });

  it("flips below the anchor at the top edge and shifts away from the side edges", () => {
    const place = placeTip({ top: 20, bottom: 40, left: 990, width: 10 }, size, view);
    expect(place.below).toBe(true);
    expect(place.top).toBe(48);
    expect(place.left).toBe(1000 - 300 - 8);
    expect(placeTip({ top: 400, bottom: 420, left: 0, width: 10 }, size, view).left).toBe(8);
  });

  it("stays inside the window when it is taller than the room on both sides", () => {
    const place = placeTip({ top: 300, bottom: 320, left: 400, width: 20 }, { width: 300, height: 900 }, view);
    expect(place.top).toBeGreaterThanOrEqual(8);
  });
});

describe("tooltips in dialogs", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("render into the anchor's open dialog (modal dialogs lie in the top layer, above <body>)", async () => {
    render(
      <MemoryRouter>
        <dialog open>
          <HelpTip id="agent.effort" label="Aufwand" />
        </dialog>
        <HelpTip id="agent.model" label="Modell" />
      </MemoryRouter>,
    );
    const inDialog = screen.getByRole("button", { name: "Hilfe: Aufwand" });
    expect(tipHost(inDialog).tagName).toBe("DIALOG");
    expect(tipHost(screen.getByRole("button", { name: "Hilfe: Modell" }))).toBe(document.body);
    await userEvent.click(inDialog);
    expect(screen.getByRole("tooltip").parentElement?.tagName).toBe("DIALOG");
  });

  it("close with Escape without letting the dialog see the key", async () => {
    const onDialogKey = vi.fn();
    render(
      <MemoryRouter>
        <dialog open onKeyDown={(event) => onDialogKey(event.key)}>
          <HelpTip id="agent.effort" label="Aufwand" />
        </dialog>
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Hilfe: Aufwand" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(onDialogKey).not.toHaveBeenCalled();
  });

  it("that only name a control let Escape through, so the dialog still closes with one key", async () => {
    const onDialogKey = vi.fn();
    render(
      <MemoryRouter>
        <dialog open onKeyDown={(event) => onDialogKey(event.key)}>
          <Tooltip content="Schließen">
            <button type="button">x</button>
          </Tooltip>
        </dialog>
      </MemoryRouter>,
    );
    await userEvent.tab();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(onDialogKey).toHaveBeenCalledWith("Escape");
  });

  it("lead Tab into the documentation link and on to the next control, never trapping the focus", async () => {
    render(
      <MemoryRouter>
        <dialog open>
          <HelpTip id="agent.effort" label="Aufwand" />
          <button type="button">Weiter</button>
        </dialog>
      </MemoryRouter>,
    );
    const help = screen.getByRole("button", { name: "Hilfe: Aufwand" });
    await userEvent.click(help);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole("link", { name: /Mehr in der Dokumentation/ }));
    await userEvent.tab();
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(focusableAfter(help)).toBeDefined();
  });
});
