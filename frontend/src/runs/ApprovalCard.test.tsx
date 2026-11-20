import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../api/client";
import type { PendingApproval, ReviewItem, Run } from "../api/types";
import { AGENT_NOTE_MAX_CHARS, ApprovalForm } from "./ApprovalCard";

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
    allow_agent_note: false,
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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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

  it("says next to the reject button that a reason is needed first (TX-10)", () => {
    render(wrap(<ApprovalForm approval={{ ...approval([DRAFT]), allow_comment: true, require_comment_on_reject: true }} />));
    const reject = screen.getByRole("button", { name: "Ablehnen" });
    expect(reject).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByTestId("disabled-reason")).toHaveTextContent("Gib zuerst einen Grund für die Ablehnung an.");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Zahlen fehlen" } });
    expect(screen.queryByTestId("disabled-reason")).toBeNull();
    expect(screen.getByRole("button", { name: "Ablehnen" })).not.toHaveAttribute("aria-disabled");
  });

  it("offers the note to the agent only when the approval allows it, apart from the comment for people", () => {
    const off = render(wrap(<ApprovalForm approval={{ ...approval([DRAFT]), allow_comment: true }} />));
    expect(screen.queryByLabelText("Notiz an den Agenten (optional)")).toBeNull();
    expect(screen.getByText("Nur für Menschen: der Lauf, die nächste Prüfung und das Protokoll. Kein Agent liest ihn.")).toBeInTheDocument();
    off.unmount();

    render(wrap(<ApprovalForm approval={{ ...approval([DRAFT]), allow_comment: true, allow_agent_note: true }} />));
    const note = screen.getByLabelText("Notiz an den Agenten (optional)");
    expect(note).toHaveAttribute("maxLength", String(AGENT_NOTE_MAX_CHARS));
    expect(screen.getByText(/Der einzige Text deiner Entscheidung, den nachfolgende Agenten lesen/)).toBeInTheDocument();
    expect(screen.getByText("Zeichen: 0 von 2.000")).toBeInTheDocument();
    fireEvent.change(note, { target: { value: "x".repeat(AGENT_NOTE_MAX_CHARS) } });
    expect(screen.getByText("Zeichen: 2.000 von 2.000")).toHaveClass("text-warning");
  });

  it("sends the note to the agent with the decision, apart from the comment", async () => {
    const decide = vi.spyOn(api, "decideApproval").mockResolvedValue({ id: "run_1" } as Run);
    render(wrap(<ApprovalForm approval={{ ...approval([DRAFT]), allow_comment: true, allow_agent_note: true }} />));
    fireEvent.change(screen.getByLabelText("Kommentar (optional)"), { target: { value: "Für das Team" } });
    fireEvent.change(screen.getByLabelText("Notiz an den Agenten (optional)"), { target: { value: "Kürzer fassen." } });
    fireEvent.click(screen.getByRole("button", { name: "Ablehnen" }));
    await waitFor(() => expect(decide).toHaveBeenCalledWith("run_1", "approve", "rejected", "Für das Team", "Kürzer fassen."));
  });

  it("sends no note when the approval does not allow one", async () => {
    const decide = vi.spyOn(api, "decideApproval").mockResolvedValue({ id: "run_1" } as Run);
    render(wrap(<ApprovalForm approval={{ ...approval([DRAFT]), allow_comment: true }} />));
    fireEvent.click(screen.getByRole("button", { name: "Freigeben" }));
    await waitFor(() => expect(decide).toHaveBeenCalledWith("run_1", "approve", "approved", "", ""));
  });
});

describe("api.decideApproval", () => {
  function captureBody() {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ id: "run_1" }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetch);
    return () => JSON.parse(String((fetch.mock.calls[0] as unknown[])[1] && ((fetch.mock.calls[0] as unknown[])[1] as RequestInit).body));
  }

  afterEach(() => vi.unstubAllGlobals());

  it("sends agent_note only when it holds text", async () => {
    let body = captureBody();
    await api.decideApproval("run_1", "approve", "approved", "Für Menschen", "Bitte kürzer.");
    expect(body()).toEqual({ decision: "approved", comment: "Für Menschen", agent_note: "Bitte kürzer." });
    vi.unstubAllGlobals();

    body = captureBody();
    await api.decideApproval("run_1", "approve", "approved", "Für Menschen", "  ");
    expect(body()).toEqual({ decision: "approved", comment: "Für Menschen" });
  });
});
