import { act, cleanup, createEvent, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "../i18n";
import { HelpTip, Tooltip } from "./Tooltip";

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
