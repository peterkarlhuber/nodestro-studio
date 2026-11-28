// The tooltips of the studio's buttons, badges and values: the shared Tooltip of @nodestro/ui-core, with the studio's
// help registry for the ones that explain a control by its help id (formerly the studio's Hint). Moved here from the
// studio's own Tooltip (ST-068 step 6) with the same expectations; the placement inside the window is tested with the
// shared placement in nodestro-ui (test/components/tooltip.test.tsx, the same cases as here before).

import { Tooltip } from "@nodestro/ui-core";
import { act, cleanup, createEvent, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "../i18n";
import { HELP_DOCS, docPath } from "../lib/help";
import { PlatformHelp } from "../lib/platformHelp";

function Where() {
  const location = useLocation();
  return <output data-testid="where">{location.pathname + location.hash}</output>;
}

function renderInRouter(ui: React.ReactNode) {
  return render(
    <MemoryRouter>
      <Routes>
        <Route
          path="*"
          element={
            <PlatformHelp>
              {ui}
              <Where />
            </PlatformHelp>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

/** The element that describes `element` (aria-describedby): the tooltip's text. */
function description(element: HTMLElement): HTMLElement | null {
  return document.getElementById(element.getAttribute("aria-describedby") ?? "");
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
    // Described by the tooltip's text.
    expect(screen.getByRole("tooltip")).toContainElement(description(button));
    expect(description(button)).toHaveTextContent("Speichert alles");
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

describe("tooltips with a help id (formerly Hint)", () => {
  afterEach(cleanup);

  it("explain a control with its help text and lead into the documentation within the app", async () => {
    renderInRouter(
      <Tooltip help="workflow.discard">
        <button type="button">Verwerfen</button>
      </Tooltip>,
    );
    const button = screen.getByRole("button", { name: "Verwerfen" });
    await userEvent.tab();
    const tip = screen.getByRole("tooltip");
    expect(description(button)).toHaveTextContent(i18n.t("help.workflow.discard"));
    const doc = HELP_DOCS["workflow.discard"];
    expect(doc).toBeDefined();
    const link = within(tip).getByRole("link", { name: "Mehr erfahren" });
    expect(link).toHaveAttribute("href", docPath(doc!));
    await userEvent.hover(tip);
    await userEvent.click(link);
    expect(screen.getByTestId("where")).toHaveTextContent(docPath(doc!));
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("may say it in their own words and keep the help's documentation link", async () => {
    renderInRouter(
      <Tooltip help="knowledge.chunks" content="Eigene Worte">
        <button type="button">Abschnitte</button>
      </Tooltip>,
    );
    await userEvent.tab();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Eigene Worte");
    expect(within(screen.getByRole("tooltip")).getByRole("link")).toHaveAttribute("href", docPath(HELP_DOCS["knowledge.chunks"]!));
  });
});

describe("tooltips in dialogs", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("render inside the anchor's open dialog (modal dialogs lie in the top layer, above <body>)", async () => {
    renderInRouter(
      <>
        <dialog open>
          <Tooltip content="Im Dialog">
            <button type="button">Aufwand</button>
          </Tooltip>
        </dialog>
        <Tooltip content="Auf der Seite">
          <button type="button">Modell</button>
        </Tooltip>
      </>,
    );
    await userEvent.tab();
    expect(screen.getByRole("tooltip").parentElement?.tagName).toBe("DIALOG");
    await userEvent.tab();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Auf der Seite");
    expect(screen.getByRole("tooltip").closest("dialog")).toBeNull();
  });

  it("that only name a control let Escape through, so the dialog still closes with one key", async () => {
    const onDialogKey = vi.fn();
    renderInRouter(
      <dialog open onKeyDown={(event) => onDialogKey(event.key)}>
        <Tooltip content="Schließen">
          <button type="button">x</button>
        </Tooltip>
      </dialog>,
    );
    await userEvent.tab();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(onDialogKey).toHaveBeenCalledWith("Escape");
  });
});
