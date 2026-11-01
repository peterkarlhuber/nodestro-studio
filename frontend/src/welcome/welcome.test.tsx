import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { bundles } from "../i18n/resources";
import { LANGUAGES, setLanguage } from "../i18n";
import { WELCOME_STORAGE_KEY, markWelcomeSeen, shouldWelcome, studioLoader, welcomeSeen } from "./firstVisit";
import { LAST_PHASE, stageOf } from "./RunIllustration";
import { SLOGAN, WelcomePage } from "./WelcomePage";

const url = (path: string) => new URL(path, "http://127.0.0.1:8000");

describe("first visit", () => {
  it("sends only the very first visit of the bare start page to the welcome page", () => {
    expect(welcomeSeen()).toBe(false);
    expect(shouldWelcome(url("/"))).toBe(true);
    expect(welcomeSeen()).toBe(true);
    expect(shouldWelcome(url("/"))).toBe(false);
  });

  it("never redirects deep links, and a deep link counts as the first visit", () => {
    expect(shouldWelcome(url("/workflows/abc"))).toBe(false);
    expect(shouldWelcome(url("/"))).toBe(false);
  });

  it("keeps query strings on the start page untouched", () => {
    expect(shouldWelcome(url("/?q=report"))).toBe(false);
  });

  it("does not redirect automated browsers", () => {
    Object.defineProperty(navigator, "webdriver", { configurable: true, get: () => true });
    try {
      expect(shouldWelcome(url("/"))).toBe(false);
    } finally {
      delete (navigator as { webdriver?: boolean }).webdriver;
    }
  });

  it("answers the loader with a redirect response once", () => {
    const first = studioLoader({ request: new Request("http://127.0.0.1:8000/") });
    expect(first).toBeInstanceOf(Response);
    expect((first as Response).headers.get("Location")).toBe("/welcome");
    expect(studioLoader({ request: new Request("http://127.0.0.1:8000/") })).toBeNull();
  });

  it("remembers the visit in the browser", () => {
    markWelcomeSeen();
    expect(localStorage.getItem(WELCOME_STORAGE_KEY)).toBe("1");
  });
});

describe("illustration stages", () => {
  it("maps the phases to design, run and trace", () => {
    expect(stageOf(0)).toBe(0);
    expect(stageOf(1)).toBe(1);
    expect(stageOf(LAST_PHASE)).toBe(2);
  });
});

function renderWelcome() {
  const router = createMemoryRouter([{ path: "/welcome", element: <WelcomePage /> }], { initialEntries: ["/welcome"] });
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("welcome page", () => {
  afterEach(cleanup);

  it("shows the slogan as the page heading and marks the visit", () => {
    renderWelcome();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(SLOGAN.join(" "));
    expect(welcomeSeen()).toBe(true);
    expect(document.title).toBe("Nodestro · Connecting Intelligence");
  });

  it("offers the Studio as the primary action", () => {
    renderWelcome();
    const links = screen.getAllByRole("link", { name: /Studio öffnen/ });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link).toHaveAttribute("href", "/");
  });

  it.each(LANGUAGES)("keeps the English slogan in %s", async (language) => {
    await act(() => setLanguage(language, false));
    renderWelcome();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Connecting Intelligence");
    expect(screen.getByText((bundles[language].welcome as { hero: { lede: string } }).hero.lede)).toBeInTheDocument();
  });

  it("names the untranslated slogan in the window title of every language", () => {
    for (const language of LANGUAGES) {
      expect((bundles[language].welcome as { documentTitle: string }).documentTitle).toBe("Nodestro · Connecting Intelligence");
    }
  });
});
