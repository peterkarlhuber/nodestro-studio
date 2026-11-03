import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { SettingsNav } from "./SettingsNav";

function Page({ sections }: { sections: [string, string][] }) {
  const body = useRef<HTMLDivElement>(null);
  return (
    <div>
      <div ref={body}>
        {sections.map(([id, title]) => (
          <section key={id}>
            <h2 className="panel__title" id={id}>
              {title} <button aria-label="Hilfe">?</button>
            </h2>
          </section>
        ))}
      </div>
      <SettingsNav container={body} />
    </div>
  );
}

function show(path: string, sections: [string, string][]) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Page sections={sections} />
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
});
