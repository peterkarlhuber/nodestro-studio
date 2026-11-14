// The web sources of a run (NAL-A2): ids, plain titles, domain, time and read/hit status; safe links.

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { Run, SourceEntry } from "../api/types";
import { WebSources, sourceHref } from "./WebSources";

afterEach(cleanup);

const source = (entry: Partial<SourceEntry> & Pick<SourceEntry, "id" | "url">): SourceEntry => ({
  title: "",
  origin: "search",
  provider: "test",
  retrieved_at: "2026-11-14T10:00:00Z",
  ...entry,
});

const show = (sources: SourceEntry[] | undefined) => render(<WebSources run={{ sources } as Run} />);

describe("web sources of a run", () => {
  it("is hidden without sources", () => {
    show(undefined);
    expect(screen.queryByTestId("web-sources")).not.toBeInTheDocument();
    show([]);
    expect(screen.queryByTestId("web-sources")).not.toBeInTheDocument();
  });

  it("lists each source with id, plain title, domain and status; links open in a new tab without a referrer", () => {
    const { container } = show([
      source({ id: "S1", url: "https://www.example.org/a", title: "<b>Bold</b> <script>alert(1)</script>", origin: "search" }),
      source({
        id: "S2",
        url: "https://short.example/x",
        final_url: "https://docs.example.com/page",
        title: "Read page",
        origin: "fetched",
        sha256: "abc",
      }),
    ]);
    const first = within(screen.getByTestId("web-source-S1"));
    const link = first.getByRole("link");
    // The title from the page is text, never markup.
    expect(link).toHaveTextContent("<b>Bold</b> <script>alert(1)</script>");
    expect(container.querySelector("b, script")).toBeNull();
    expect(link).toHaveAttribute("href", "https://www.example.org/a");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(first.getByText("S1")).toBeInTheDocument();
    expect(first.getByText(/example\.org/)).toBeInTheDocument();
    expect(first.getByText("Nur Treffer")).toBeInTheDocument();
    const second = within(screen.getByTestId("web-source-S2"));
    expect(second.getByRole("link", { name: "Read page" })).toHaveAttribute("href", "https://docs.example.com/page");
    expect(second.getByText(/docs\.example\.com/)).toBeInTheDocument();
    expect(second.getByText("Gelesen")).toBeInTheDocument();
  });

  it("links only http and https addresses", () => {
    expect(sourceHref(source({ id: "S1", url: "javascript:alert(1)" }))).toBeNull();
    expect(sourceHref(source({ id: "S1", url: "not an address" }))).toBeNull();
    show([source({ id: "S3", url: "javascript:alert(1)", title: "Trap" })]);
    const item = within(screen.getByTestId("web-source-S3"));
    expect(item.queryByRole("link")).not.toBeInTheDocument();
    expect(item.getByText("Trap")).toBeInTheDocument();
  });
});
