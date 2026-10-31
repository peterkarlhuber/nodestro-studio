import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ToolApprovalRequest } from "../api/types";
import { ToolApprovalForm, ToolCallApprovalNote, formatCountdown } from "./ToolApprovalCard";

const inMinutes = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();

function request(overrides: Partial<ToolApprovalRequest> = {}): ToolApprovalRequest {
  return {
    id: "tap_1",
    run_id: "run_1",
    node_id: "writer",
    iteration: [],
    call_id: "toolu_1",
    tool: "mailer",
    input: { to: "kunde@example.org", subject: "Angebot" },
    capability: { access: "write", reach: "external", source: "declared" },
    version: 2,
    definition_hash: null,
    arguments_hash: "hash-shown",
    status: "pending",
    requested_at: new Date().toISOString(),
    deadline: inMinutes(15),
    decided_by: null,
    decided_at: null,
    comment: null,
    closed_because: null,
    ...overrides,
  };
}

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function serve(answer: (url: string, body: unknown) => Response) {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => answer(url, init?.body ? JSON.parse(String(init.body)) : undefined));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ToolApprovalForm", () => {
  it("shows the tool, what it may do, the exact arguments and the time left", () => {
    render(wrap(<ToolApprovalForm request={request()} />));
    expect(screen.getByText("Tool-Aufruf: mailer")).toBeInTheDocument();
    expect(screen.getByText("Ändert Daten")).toBeInTheDocument();
    expect(screen.getByText("Wirkt nach außen")).toBeInTheDocument();
    expect(screen.getByTestId("tool-approval-arguments")).toHaveTextContent('"to": "kunde@example.org"');
    expect(screen.getByTestId("tool-approval-deadline")).toHaveTextContent(/Zeit für die Entscheidung: 1[45]:\d\d/);
  });

  it("marks a tool without a classification as changing and external", () => {
    render(wrap(<ToolApprovalForm request={request({ capability: { access: "write", reach: "external", source: "default" } })} />));
    expect(screen.getByText(/Nicht eingestuft/)).toBeInTheDocument();
  });

  it("sends the hash of the arguments that were shown, with the comment", async () => {
    const fetch = serve(() => json(request({ status: "approved" })));
    render(wrap(<ToolApprovalForm request={request()} />));
    await userEvent.type(screen.getByRole("textbox"), "passt");
    await userEvent.click(screen.getByRole("button", { name: "Diesen Aufruf erlauben" }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/runs/run_1/tool-approvals/tap_1",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ decision: "approved", arguments_hash: "hash-shown", comment: "passt" }),
        }),
      ),
    );
  });

  it("explains a refused decision about a changed call", async () => {
    serve(() => json({ detail: "The call changed", code: "tool.approval_stale", params: { request_id: "tap_1" } }, 409));
    render(wrap(<ToolApprovalForm request={request()} />));
    await userEvent.click(screen.getByRole("button", { name: "Ablehnen" }));
    expect(await screen.findByText(/hat sich seit der Anzeige geändert/)).toBeInTheDocument();
  });

  it("cannot be decided once the time is up", () => {
    render(wrap(<ToolApprovalForm request={request({ deadline: inMinutes(-1) })} />));
    expect(screen.getByTestId("tool-approval-deadline")).toHaveTextContent("Die Zeit ist abgelaufen");
    expect(screen.getByRole("button", { name: "Diesen Aufruf erlauben" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Ablehnen" })).toBeDisabled();
  });
});

describe("ToolCallApprovalNote", () => {
  it("says nothing about a call the rules simply allowed", () => {
    const { container } = render(<ToolCallApprovalNote approval={{ status: "allowed" }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("names who decided and the comment", () => {
    render(
      <ToolCallApprovalNote
        approval={{ status: "rejected", decided_by: "usr_1", decided_at: "2026-10-31T10:00:00Z", comment: "falsche Adresse" }}
      />,
    );
    expect(screen.getByTestId("tool-call-approval")).toHaveTextContent(/Abgelehnt · von usr_1.*Kommentar: falsche Adresse/);
  });

  it("gives the reason of a refusal without a question", () => {
    render(<ToolCallApprovalNote approval={{ status: "denied", code: "tool.approval_unattended" }} />);
    expect(screen.getByTestId("tool-call-approval")).toHaveTextContent(/Ohne Rückfrage verweigert · .*vorab frei/);
  });

  it("marks a call a pre-grant allowed", () => {
    render(<ToolCallApprovalNote approval={{ status: "allowed", pre_grant_id: "tpg_1" }} />);
    expect(screen.getByTestId("tool-call-approval")).toHaveTextContent("Von den Regeln erlaubt · vorab freigegeben");
  });
});

describe("formatCountdown", () => {
  it("shows minutes and seconds and never goes below zero", () => {
    expect(formatCountdown(905)).toBe("15:05");
    expect(formatCountdown(-3)).toBe("0:00");
  });
});
