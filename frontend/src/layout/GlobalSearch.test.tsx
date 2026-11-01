import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GlobalSearch } from "./GlobalSearch";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("global search (F4, F5)", () => {
  it("names its button and groups the results as a listbox of groups of options", async () => {
    const results = [
      { kind: "workflow", id: "wf_1", title: "Blog article", subtitle: "", snippet: "", favorite: false },
      { kind: "tool", id: "days_between", title: "Days between", subtitle: "", snippet: "", favorite: false },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(results), { status: 200, headers: { "Content-Type": "application/json" } })),
    );
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <GlobalSearch />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const trigger = screen.getByTestId("search-open");
    expect(trigger).toHaveAccessibleName();
    fireEvent.click(trigger);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "b" } });
    const options = await screen.findAllByRole("option", {}, { timeout: 3000 });
    expect(options).toHaveLength(2);
    const listbox = screen.getByRole("listbox");
    const groups = within(listbox).getAllByRole("group");
    expect(groups).toHaveLength(2);
    for (const group of groups) expect(group).toHaveAccessibleName();
    // Only groups sit directly in the listbox, and only options (after the presentational name) in a group.
    expect([...listbox.children].every((child) => child.getAttribute("role") === "group")).toBe(true);
    expect(listbox.querySelector("section, h3")).toBeNull();
    // The dialog's head is no banner landmark.
    expect(screen.getByRole("dialog").querySelector("header")).toBeNull();
  });
});
