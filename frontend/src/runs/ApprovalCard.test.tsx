import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import type { PendingApproval, ReviewItem } from "../api/types";
import { ApprovalForm } from "./ApprovalCard";

function approval(items: ReviewItem[]): PendingApproval {
  return {
    run_id: "run_1",
    root_run_id: "run_1",
    workflow_id: "wf_1",
    workflow_name: "Rechnungen",
    path: [],
    node_id: "approve",
    label: "Freigabe",
    instructions: "",
    allow_comment: false,
    require_comment_on_reject: false,
    on_reject: "stop",
    has_rejected_branch: false,
    has_approved_branch: true,
    waiting_since: null,
    trigger: "manual",
    items,
  };
}

const DRAFT = { node_id: "draft", label: "Entwurf", value: "Text des Entwurfs" };
const SUMMARY = { node_id: "summary", label: "Zusammenfassung", value: "Kurz" };

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

const sections = (container: HTMLElement) => [...container.querySelectorAll<HTMLDetailsElement>("details.section")];

afterEach(cleanup);

describe("ApprovalForm", () => {
  it("shows each item to review as a section, opened when it is the only one", () => {
    const one = render(wrap(<ApprovalForm approval={approval([DRAFT])} />));
    expect(sections(one.container).map((item) => item.open)).toEqual([true]);
    expect(one.container.querySelector(".section__title")).toHaveTextContent("Entwurf");
    one.unmount();

    const two = render(wrap(<ApprovalForm approval={approval([DRAFT, SUMMARY])} />));
    expect(sections(two.container).map((item) => item.open)).toEqual([false, false]);
  });

  it("keeps an item open when the pending approval is refreshed with more items", () => {
    // Before UX-5a the item's `open` followed the item count, so a refresh that added an item closed the one
    // the person was reading.
    const { container, rerender } = render(wrap(<ApprovalForm approval={approval([DRAFT])} />));
    expect(sections(container)[0].open).toBe(true);
    rerender(wrap(<ApprovalForm approval={approval([DRAFT, SUMMARY])} />));
    expect(sections(container).map((item) => item.open)).toEqual([true, false]);
  });
});
