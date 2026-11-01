import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { PageHeader } from "../components/ui";
import { APP_TITLE, pageTitle, useDocumentTitle } from "./documentTitle";

function Titled({ title }: { title: string | null }) {
  useDocumentTitle(title);
  return null;
}

describe("document title", () => {
  it("names the page before the app", () => {
    expect(pageTitle("Freigaben")).toBe(`Freigaben · ${APP_TITLE}`);
    expect(pageTitle("  ")).toBe(APP_TITLE);
    expect(pageTitle(null)).toBe(APP_TITLE);
  });

  it("is set while a page is shown and restored afterwards", () => {
    document.title = APP_TITLE;
    const view = render(<Titled title="Zeitpläne" />);
    expect(document.title).toBe("Zeitpläne · Nodestro Studio");
    view.rerender(<Titled title="Testreihen" />);
    expect(document.title).toBe("Testreihen · Nodestro Studio");
    view.unmount();
    expect(document.title).toBe(APP_TITLE);
  });

  it("follows the page header, or the title it names for the tab", () => {
    document.title = APP_TITLE;
    const view = render(
      <MemoryRouter>
        <PageHeader title="Blogartikel" documentTitle="Blogartikel · Ausführungen" />
      </MemoryRouter>,
    );
    expect(document.title).toBe("Blogartikel · Ausführungen · Nodestro Studio");
    view.unmount();
    render(
      <MemoryRouter>
        <PageHeader title="Einstellungen" />
      </MemoryRouter>,
    );
    expect(document.title).toBe("Einstellungen · Nodestro Studio");
  });
});
