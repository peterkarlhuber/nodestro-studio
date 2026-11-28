// The help buttons of the studio: the shared HelpTip of @nodestro/ui-core with the studio's help registry
// (lib/platformHelp.tsx). Moved here from the studio's own HelpTip (ST-068) with the same expectations: the text and
// the documentation link of every help id, one open panel at a time, the close timer that keyboard focus cancels,
// and inside a dialog: the panel stays part of the dialog, Escape closes only the panel, Tab leads into the link and
// on (no focus trap).

import { HelpTip, useHelpRegistry } from "@nodestro/ui-core";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "../i18n";
import { HELP_DOCS, HELP_IDS, docPath } from "../lib/help";
import { PlatformHelp } from "../lib/platformHelp";

function Where() {
  const location = useLocation();
  return <output data-testid="where">{location.pathname + location.hash}</output>;
}

function show(ui: React.ReactNode) {
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

function panelOf(button: HTMLElement): HTMLElement {
  return document.getElementById(button.getAttribute("aria-controls") ?? "") as HTMLElement;
}

afterEach(cleanup);

describe("HelpTip with the studio's help", () => {
  it("opens on click or tap with the help text and a link into the documentation", async () => {
    show(<HelpTip id="agent.effort" topic="Aufwand" />);
    const button = screen.getByRole("button", { name: "Hilfe: Aufwand" });
    expect(button).toHaveAttribute("data-help", "agent.effort");
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    const panel = screen.getByRole("group", { name: i18n.t("helpTitles.agent.effort") });
    expect(panel).toHaveTextContent(i18n.t("help.agent.effort"));
    const more = within(panel).getByRole("link", { name: "Mehr erfahren" });
    expect(more).toHaveAttribute("href", "/docs/agenten#denken");
    await userEvent.click(more);
    // The documentation is a page of the studio: the link stays in the app and closes the panel.
    expect(screen.getByTestId("where")).toHaveTextContent("/docs/agenten#denken");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("is described by its help text and shows the placeholders a text names literally", async () => {
    show(<HelpTip id="agent.task" topic="Aufgabe" />);
    const button = screen.getByRole("button", { name: "Hilfe: Aufgabe" });
    await userEvent.click(button);
    const summary = document.getElementById(button.getAttribute("aria-describedby") ?? "");
    expect(summary?.textContent).toContain("{{input}}");
  });

  it("keeps only one explanation open at a time", async () => {
    show(
      <>
        <HelpTip id="agent.effort" topic="Aufwand" />
        <HelpTip id="agent.model" topic="Modell" />
      </>,
    );
    const first = screen.getByRole("button", { name: "Hilfe: Aufwand" });
    await userEvent.click(first);
    await userEvent.click(screen.getByRole("button", { name: "Hilfe: Modell" }));
    expect(screen.getAllByRole("group")).toHaveLength(1);
    expect(screen.getByRole("group")).toHaveTextContent(i18n.t("help.agent.model"));
    expect(first).toHaveAttribute("aria-expanded", "false");
  });

  it("stays open on keyboard focus that follows the mouse leaving it within the close delay", async () => {
    // The mouse leaves the icon (a click elsewhere) and Tab reaches it before the leave's close timer ran: that
    // timer must not close the explanation the focus just opened (settings-ui e2e, PR #249 head cf514c4).
    show(<HelpTip id="agent.effort" topic="Aufwand" />);
    const button = screen.getByRole("button", { name: "Hilfe: Aufwand" });
    fireEvent.pointerEnter(button, { pointerType: "mouse" });
    fireEvent.pointerLeave(button, { pointerType: "mouse" });
    await userEvent.tab();
    expect(button).toHaveFocus();
    expect(screen.getByRole("group")).toHaveTextContent(i18n.t("help.agent.effort"));
    await act(() => new Promise((resolve) => window.setTimeout(resolve, 400)));
    expect(screen.getByRole("group")).toHaveTextContent(i18n.t("help.agent.effort"));
  });
});

describe("HelpTip in dialogs", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("keeps its panel inside the dialog (a modal dialog makes the rest of the page inert)", async () => {
    show(
      <dialog open>
        <HelpTip id="agent.effort" topic="Aufwand" />
      </dialog>,
    );
    const button = screen.getByRole("button", { name: "Hilfe: Aufwand" });
    await userEvent.click(button);
    expect(panelOf(button).closest("dialog")).not.toBeNull();
  });

  it("close with Escape without letting the dialog see the key", async () => {
    const onDialogKey = vi.fn();
    show(
      <dialog open onKeyDown={(event) => onDialogKey(event.key)}>
        <HelpTip id="agent.effort" topic="Aufwand" />
      </dialog>,
    );
    const button = screen.getByRole("button", { name: "Hilfe: Aufwand" });
    await userEvent.click(button);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("group")).toBeNull();
    expect(onDialogKey).not.toHaveBeenCalled();
  });

  it("lead Tab into the documentation link and on to the next control, never trapping the focus", async () => {
    show(
      <dialog open>
        <HelpTip id="agent.effort" topic="Aufwand" />
        <button type="button">Weiter</button>
      </dialog>,
    );
    const help = screen.getByRole("button", { name: "Hilfe: Aufwand" });
    await userEvent.click(help);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Mehr erfahren" }));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Weiter" }));
    await act(() => new Promise((resolve) => window.setTimeout(resolve, 300)));
    expect(screen.queryByRole("group")).toBeNull();
  });
});

describe("the studio's help registry", () => {
  function Entries({ onEntries }: { onEntries: (entries: ReturnType<typeof useHelpRegistry>["entries"]) => void }) {
    onEntries(useHelpRegistry().entries);
    return null;
  }

  it.each(["de", "en", "es", "fr", "it", "pt-BR"])("has every help id with title, text and documentation link (%s)", async (language) => {
    const { loadLanguage } = await import("../i18n");
    await loadLanguage(language as "de");
    await act(() => i18n.changeLanguage(language));
    let entries: ReturnType<typeof useHelpRegistry>["entries"] = {};
    show(<Entries onEntries={(value) => (entries = value)} />);
    for (const id of HELP_IDS) {
      const entry = entries[id];
      expect(entry, id).toBeDefined();
      expect(entry.title, id).toBe(i18n.t(`helpTitles.${id}`));
      expect(entry.title.trim(), id).not.toBe("");
      expect(entry.title, id).not.toContain("helpTitles.");
      expect(String(entry.summary).length, id).toBeGreaterThan(entry.title.length);
      const doc = HELP_DOCS[id];
      expect(entry.href, id).toBe(doc ? docPath(doc) : undefined);
    }
  });
});
