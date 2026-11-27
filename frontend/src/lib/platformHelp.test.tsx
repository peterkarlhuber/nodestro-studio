// The shared help of the platform (@nodestro/ui-help) in the studio: next to an error message, linked to the built-in
// documentation, and found by the help search of the documentation overview.

import { HelpSearch } from "@nodestro/ui-core";
import { HELP_ERRORS, platformHelp } from "@nodestro/ui-help";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { docExists } from "../docs";
import { ProblemText } from "./errors";
import { PLATFORM_HELP_DOCS, PlatformHelp } from "./platformHelp";

function Where() {
  const location = useLocation();
  return <output data-testid="where">{location.pathname + location.hash}</output>;
}

function show(element: React.ReactNode, help = true) {
  return render(
    <MemoryRouter initialEntries={["/folders"]}>
      <Routes>
        <Route path="*" element={help ? <PlatformHelp>{element}<Where /></PlatformHelp> : element} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe("PlatformHelp", () => {
  it("links every entry of the shared help to a section of the documentation", async () => {
    const ids = Object.keys(platformHelp("de").entries);
    expect(Object.keys(PLATFORM_HELP_DOCS).sort()).toEqual(ids.sort());
    for (const id of new Set(Object.values(HELP_ERRORS))) expect(ids).toContain(id);
    for (const [id, doc] of Object.entries(PLATFORM_HELP_DOCS)) expect(await docExists(doc), `${id} → ${doc}`).toBe(true);
  });

  it("explains an error by its code's family and opens the documentation in the app", async () => {
    show(<ProblemText item={{ code: "folder.not_browsable", params: { reason: "missing" } }} />);
    const button = screen.getByRole("button", { name: "Hilfe: Dateien und Ordner" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(button);
    const panel = screen.getByRole("group", { name: "Dateien und Ordner" });
    expect(panel).toHaveTextContent("Prüfe Pfad, Größe und die Freigabe des Ordners");
    const more = within(panel).getByRole("link", { name: "Mehr erfahren" });
    expect(more).toHaveAttribute("href", "/docs/datei-eingaben#ueberblick");
    await userEvent.click(more);
    expect(screen.getByTestId("where")).toHaveTextContent("/docs/datei-eingaben#ueberblick");
  });

  it("adds no help to a short message, a message without a code, or outside the studio frame", () => {
    show(
      <>
        <ProblemText item={{ code: "folder.not_browsable", params: {} }} compact />
        <ProblemText item={{ code: null, message: "boom" }} />
      </>,
    );
    expect(screen.queryByRole("button", { name: /^Hilfe:/ })).not.toBeInTheDocument();
    cleanup();
    show(<ProblemText item={{ code: "folder.not_browsable", params: {} }} />, false);
    expect(screen.queryByRole("button", { name: /^Hilfe:/ })).not.toBeInTheDocument();
  });

  it("finds the help for a pasted error code, offline", async () => {
    show(<HelpSearch label="Hilfe zu einer Fehlermeldung suchen" />);
    await userEvent.type(screen.getByRole("searchbox", { name: "Hilfe zu einer Fehlermeldung suchen" }), "approval.expired");
    expect(screen.getByRole("link", { name: "Freigaben" })).toHaveAttribute("href", "/docs/verzweigungen#freigaben-seite");
  });
});
