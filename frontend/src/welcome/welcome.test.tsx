import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { bundles } from "../test/locales";
import { LANGUAGES, setLanguage } from "../i18n";
import { WELCOME_PATH, resetPageLoad, shouldWelcome, studioLoader } from "./startPage";
import { LAST_PHASE, stageOf } from "./RunIllustration";
import { SLOGAN, WelcomePage } from "./WelcomePage";

const url = (path: string) => new URL(path, "http://127.0.0.1:8000");

/** Pretends the document was loaded by a navigation of ``type`` (Navigation Timing). */
function loadedBy(type: string) {
  vi.spyOn(performance, "getEntriesByType").mockReturnValue([{ type } as unknown as PerformanceEntry]);
}

describe("app start", () => {
  beforeEach(() => resetPageLoad());
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("sends the first start of the bare start page to the welcome page", () => {
    loadedBy("navigate");
    expect(shouldWelcome(url("/"))).toBe(true);
  });

  it("sends every later start there too, whatever was visited before", () => {
    for (let start = 0; start < 3; start += 1) {
      resetPageLoad();
      loadedBy("navigate");
      localStorage.setItem("nodestro-welcome-seen", "1"); // the old first-visit flag no longer matters
      expect(shouldWelcome(url("/"))).toBe(true);
    }
  });

  it("never redirects in-app navigation after the start (Open Studio, sidebar, Back/Forward)", () => {
    loadedBy("navigate");
    expect(shouldWelcome(url("/"))).toBe(true);
    expect(shouldWelcome(url("/"))).toBe(false);
    expect(shouldWelcome(url("/workflows/abc"))).toBe(false);
    expect(shouldWelcome(url("/"))).toBe(false);
  });

  it("never redirects deep links, and they make later in-app visits of / open the Studio", () => {
    loadedBy("navigate");
    expect(shouldWelcome(url("/workflows/abc"))).toBe(false);
    expect(shouldWelcome(url("/"))).toBe(false);
  });

  it.each(["/?q=report", "/#how", "/executions?status=failed#top", "/settings"])("keeps %s untouched", (path) => {
    loadedBy("navigate");
    expect(shouldWelcome(url(path))).toBe(false);
  });

  it("keeps a hash of the address bar, which the router leaves out of the request", () => {
    loadedBy("navigate");
    window.history.replaceState(null, "", "/#how");
    try {
      expect(shouldWelcome(url("/"))).toBe(false);
    } finally {
      window.history.replaceState(null, "", "/");
    }
  });

  it.each(["reload", "back_forward"])("returns to the Studio on %s", (type) => {
    loadedBy(type);
    expect(shouldWelcome(url("/"))).toBe(false);
  });

  it("treats a browser without Navigation Timing as a start", () => {
    vi.spyOn(performance, "getEntriesByType").mockReturnValue([]);
    expect(shouldWelcome(url("/"))).toBe(true);
  });

  it("does not redirect automated browsers", () => {
    loadedBy("navigate");
    Object.defineProperty(navigator, "webdriver", { configurable: true, get: () => true });
    try {
      expect(shouldWelcome(url("/"))).toBe(false);
    } finally {
      delete (navigator as { webdriver?: boolean }).webdriver;
    }
  });

  it("answers the loader with a redirect on the start only", () => {
    loadedBy("navigate");
    const first = studioLoader({ request: new Request("http://127.0.0.1:8000/") });
    expect(first).toBeInstanceOf(Response);
    expect((first as Response).headers.get("Location")).toBe(WELCOME_PATH);
    expect(studioLoader({ request: new Request("http://127.0.0.1:8000/") })).toBeNull();
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

  it("shows the slogan as the page heading and stores nothing", () => {
    renderWelcome();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(SLOGAN.join(" "));
    expect(localStorage.getItem("nodestro-welcome-seen")).toBeNull();
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
