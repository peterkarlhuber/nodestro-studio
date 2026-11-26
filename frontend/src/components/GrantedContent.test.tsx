// The mark of content from a granted source (N-08): a badge with words and a symbol, explained on focus, and a notice
// that says a cloud model or a tool that reaches outside needs a permission now.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GrantedContentBadge, GrantedContentNotice } from "./GrantedContent";

function show(element: React.ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>{element}</MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      url === "/api/meta"
        ? new Response(JSON.stringify({ profile: "desktop" }), { headers: { "Content-Type": "application/json" } })
        : new Response(JSON.stringify({ code: "not_found" }), { status: 404, headers: { "Content-Type": "application/json" } }),
    ),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("GrantedContentBadge", () => {
  it("names the mark in words and can be reached with the keyboard", () => {
    show(<GrantedContentBadge kind="run" />);
    const badge = screen.getByTestId("granted-content-badge-run");
    expect(badge).toHaveTextContent("Geschützter Inhalt");
    expect(badge).toHaveAttribute("tabindex", "0");
    expect(badge.querySelector("svg")).toHaveAttribute("aria-hidden");
  });
});

describe("GrantedContentNotice", () => {
  it("explains a marked run and that sending it outside needs a permission", async () => {
    show(<GrantedContentNotice kind="run" />);
    const notice = screen.getByTestId("granted-content-notice-run");
    expect(notice).toHaveTextContent("Diese Ausführung hat Inhalt aus einer freigegebenen Quelle gelesen");
    expect(notice).toHaveTextContent("Cloud-Modell");
    expect(await screen.findByRole("link", { name: "Erlaubnisse und Sperren" })).toHaveAttribute("href", "/approvals/access");
  });

  it("speaks of the conversation in a conversation", () => {
    show(<GrantedContentNotice kind="conversation" />);
    expect(screen.getByTestId("granted-content-notice-conversation")).toHaveTextContent("Dieses Gespräch enthält Inhalt");
  });
});
