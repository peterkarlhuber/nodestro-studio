import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SettingsNav } from "./SettingsNav";

function Page({ sections, onReset }: { sections: [string, string][]; onReset?: () => void }) {
  const body = useRef<HTMLDivElement>(null);
  return (
    <div>
      <div ref={body}>
        {sections.map(([id, title]) => (
          <section key={id}>
            <h2 className="panel__title" id={id}>
              {title} <button aria-label="Hilfe">?</button>
            </h2>
            <div className="field">
              <span className="field__label">
                <label htmlFor={`${id}-input`}>{`${title} Einstellung`}</label>
              </span>
              <input id={`${id}-input`} />
            </div>
          </section>
        ))}
      </div>
      <SettingsNav container={body} widthChanged={Boolean(onReset)} onResetWidth={onReset} />
    </div>
  );
}

function show(path: string, sections: [string, string][], onReset?: () => void) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Page sections={sections} onReset={onReset} />
    </MemoryRouter>,
  );
}

const SECTIONS: [string, string][] = [
  ["settings-providers", "KI-Anbieter"],
  ["settings-prices", "Modellpreise"],
  ["settings-backup", "Backup und Wiederherstellung"],
];

describe("SettingsNav", () => {
  afterEach(cleanup);

  it("lists the sections on the page by group, without the help buttons' labels", async () => {
    show("/settings", SECTIONS);
    const nav = await screen.findByRole("navigation", { name: "Auf dieser Seite" });
    expect(nav).toHaveTextContent("Einrichtung");
    expect(nav).toHaveTextContent("Kosten");
    expect(nav).toHaveTextContent("Wartung");
    expect(screen.getByRole("link", { name: "KI-Anbieter" })).toHaveAttribute("href", "#settings-providers");
    expect(screen.getByRole("link", { name: "Backup und Wiederherstellung" })).toBeInTheDocument();
  });

  it("offers the way back to the workflow the person came from", async () => {
    show("/settings?from=%2Fworkflows%2Fwf_1#provider-openai", SECTIONS);
    await waitFor(() => expect(screen.getByTestId("settings-return")).toHaveAttribute("href", "/workflows/wf_1"));
    expect(screen.getByTestId("settings-return")).toHaveTextContent("Zurück zum Workflow");
  });

  it("never offers a way back to another site", async () => {
    show("/settings?from=https%3A%2F%2Fexample.com", SECTIONS);
    await screen.findByRole("navigation", { name: "Auf dieser Seite" });
    expect(screen.queryByTestId("settings-return")).toBeNull();
  });

  it("offers the sections as a select too (shown instead of the list where there is no room beside the content)", async () => {
    show("/settings", SECTIONS);
    const select = await screen.findByTestId("settings-nav-select");
    expect([...select.querySelectorAll("option")].map((option) => option.value)).toEqual(SECTIONS.map(([id]) => id));
    expect(select.querySelectorAll("optgroup")).toHaveLength(3);
  });

  it("searches single settings and jumps to one", async () => {
    Element.prototype.scrollIntoView = vi.fn();
    show("/settings", SECTIONS);
    const input = await screen.findByRole("combobox", { name: "Einstellungen durchsuchen" });
    await userEvent.type(input, "modellpreise einst");
    const hits = await screen.findAllByTestId("settings-search-hit");
    expect(hits[0]).toHaveTextContent("Modellpreise Einstellung");
    expect(input).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(document.activeElement).toBe(document.getElementById("settings-prices-input"));
    await userEvent.clear(input);
    await userEvent.type(input, "gibtsnicht");
    expect(await screen.findByText(/Keine Einstellung passt zu „gibtsnicht“/)).toBeInTheDocument();
  });

  it("starts with the search the global search sent (ST-058)", async () => {
    show("/settings?search=modellpreise", SECTIONS);
    const input = await screen.findByRole("combobox", { name: "Einstellungen durchsuchen" });
    expect(input).toHaveValue("modellpreise");
    await waitFor(() => expect(document.activeElement).toBe(input));
    const hits = await screen.findAllByTestId("settings-search-hit");
    expect(hits[0]).toHaveTextContent("Modellpreise");
  });

  it("offers the standard width only when the width was changed", async () => {
    const reset = vi.fn();
    show("/settings", SECTIONS, reset);
    await userEvent.click(await screen.findByTestId("settings-width-reset"));
    expect(reset).toHaveBeenCalled();
    cleanup();
    show("/settings", SECTIONS);
    await screen.findByTestId("settings-nav");
    expect(screen.queryByTestId("settings-width-reset")).toBeNull();
  });
});
