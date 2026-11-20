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

describe("ToolApprovalForm context (AD-11)", () => {
  it("names the workflow and the step's label instead of the node id once the run is loaded", async () => {
    serve((url) =>
      url === "/api/runs/run_1"
        ? json({ id: "run_1", workflow_name: "Angebot versenden", workflow: { nodes: [{ id: "writer", type: "agent", label: "Texter" }], edges: [] } })
        : json([]),
    );
    render(wrap(<ToolApprovalForm request={request()} showContext />));
    expect(await screen.findByTestId("tool-approval-context")).toHaveTextContent("Angebot versenden · Schritt Texter");
  });
});

describe("ToolApprovalForm scope and duration (access model v2, N-06)", () => {
  const RUN = { id: "run_1", workflow_id: "wf_1", workflow_name: "Angebot", workflow: { nodes: [], edges: [] } };

  function serveAccess(enabled: boolean) {
    return serve((url, body) => {
      if (url === "/api/access/state") return json({ enabled, safety_limits: { strict_offline: "x" } });
      if (url === "/api/runs/run_1") return json(RUN);
      if (url === "/api/access/grants" || url === "/api/access/denies") return json({ id: "agr_1", ...(body as object) }, 201);
      return json(request({ status: "approved" }));
    });
  }

  const posted = (fetch: ReturnType<typeof serve>, url: string) =>
    fetch.mock.calls.filter(([called, init]) => called === url && init?.method === "POST").map(([, init]) => JSON.parse(String(init?.body)));

  it("stays hidden while the access model is off", async () => {
    const fetch = serveAccess(false);
    render(wrap(<ToolApprovalForm request={request()} />));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/access/state", expect.anything()));
    expect(screen.queryByTestId("tool-approval-remember")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Diesen Aufruf erlauben" }));
    await waitFor(() => expect(posted(fetch, "/api/runs/run_1/tool-approvals/tap_1")).toHaveLength(1));
    expect(posted(fetch, "/api/access/grants")).toEqual([]);
  });

  it("decides only this call by default", async () => {
    const fetch = serveAccess(true);
    render(wrap(<ToolApprovalForm request={request()} />));
    expect(await screen.findByTestId("tool-approval-remember")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Diesen Aufruf erlauben" }));
    await waitFor(() => expect(posted(fetch, "/api/runs/run_1/tool-approvals/tap_1")).toHaveLength(1));
    expect(posted(fetch, "/api/access/grants")).toEqual([]);
  });

  it("saves a grant for the asking agent until revoked when approving", async () => {
    const fetch = serveAccess(true);
    render(wrap(<ToolApprovalForm request={request()} />));
    await screen.findByTestId("tool-approval-remember");
    await userEvent.selectOptions(screen.getByLabelText("Wie lange"), "until_revoked");
    expect(await screen.findByRole("option", { name: "Dieser Agent (wf_1/writer)" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Diesen Aufruf erlauben" }));
    await waitFor(() =>
      expect(posted(fetch, "/api/access/grants")).toEqual([
        {
          resource_type: "tool",
          resource_id: "mailer",
          actions: ["execute"],
          duration: "until_revoked",
          scope: "agent",
          agents: ["wf_1/writer"],
          mode: "supervised",
          expires_at: null,
          // L-1: the tool as it was shown; the API refuses the grant when the library holds another one now.
          expected: { version: 2, definition_hash: null },
        },
      ]),
    );
    expect(posted(fetch, "/api/runs/run_1/tool-approvals/tap_1")[0]).toMatchObject({ decision: "approved" });
  });

  it("saves a deny for every agent until a date when rejecting, and needs the date first", async () => {
    const fetch = serveAccess(true);
    render(wrap(<ToolApprovalForm request={request()} />));
    await screen.findByTestId("tool-approval-remember");
    await userEvent.selectOptions(screen.getByLabelText("Wie lange"), "until");
    await userEvent.selectOptions(screen.getByLabelText("Für wen"), "all");
    expect(screen.getByRole("button", { name: "Ablehnen" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Endet am"), "2030-01-31T12:00");
    await userEvent.click(screen.getByRole("button", { name: "Ablehnen" }));
    await waitFor(() => expect(posted(fetch, "/api/access/denies")).toHaveLength(1));
    const deny = posted(fetch, "/api/access/denies")[0];
    expect(deny).toMatchObject({ resource_type: "tool", resource_id: "mailer", actions: ["execute"], scope: "all", agents: [], duration: "until" });
    expect(deny).not.toHaveProperty("mode");
    expect(new Date(deny.expires_at).getFullYear()).toBe(2030);
    expect(posted(fetch, "/api/access/grants")).toEqual([]);
  });

  it.each([
    ["an MCP tool", { definition_hash: "sha-mcp" }, "MCP-Tools behalten ihre eigenen Regeln"],
    ["a tool that deletes for good", { capability: { access: "destructive", reach: "internal", source: "declared" } }, "Endgültiges Löschen"],
  ] as const)("never remembers approving %s, but remembers rejecting it (L-2)", async (_kind, overrides, note) => {
    const fetch = serveAccess(true);
    const shown = request(overrides as Partial<ToolApprovalRequest>);
    const { unmount } = render(wrap(<ToolApprovalForm request={shown} />));
    await screen.findByTestId("tool-approval-remember");
    await userEvent.selectOptions(screen.getByLabelText("Wie lange"), "until_revoked");
    expect(screen.getByTestId("tool-approval-remember-reject-only")).toHaveTextContent(note);
    await screen.findByRole("option", { name: "Dieser Agent (wf_1/writer)" });
    await userEvent.click(screen.getByRole("button", { name: "Diesen Aufruf erlauben" }));
    await waitFor(() => expect(posted(fetch, "/api/runs/run_1/tool-approvals/tap_1")).toHaveLength(1));
    expect(posted(fetch, "/api/access/grants")).toEqual([]);
    unmount();
    render(wrap(<ToolApprovalForm request={shown} />));
    await screen.findByTestId("tool-approval-remember");
    await userEvent.selectOptions(screen.getByLabelText("Wie lange"), "until_revoked");
    await screen.findByRole("option", { name: "Dieser Agent (wf_1/writer)" });
    await userEvent.click(screen.getByRole("button", { name: "Ablehnen" }));
    await waitFor(() => expect(posted(fetch, "/api/access/denies")).toHaveLength(1));
  });

  it("explains a grant refused because the tool changed since it was shown (L-1)", async () => {
    serve((url) => {
      if (url === "/api/access/state") return json({ enabled: true, safety_limits: {} });
      if (url === "/api/runs/run_1") return json(RUN);
      if (url === "/api/access/grants") return json({ detail: "x", code: "access.tool_changed", params: { tool: "mailer" } }, 409);
      return json(request({ status: "approved" }));
    });
    render(wrap(<ToolApprovalForm request={request()} />));
    await screen.findByTestId("tool-approval-remember");
    await userEvent.selectOptions(screen.getByLabelText("Wie lange"), "until_revoked");
    await screen.findByRole("option", { name: "Dieser Agent (wf_1/writer)" });
    await userEvent.click(screen.getByRole("button", { name: "Diesen Aufruf erlauben" }));
    expect(await screen.findByText(/seit der Anzeige geändert, deshalb wurde keine Erlaubnis gespeichert/)).toBeInTheDocument();
  });

  it("reports a grant that could not be stored while the decision stands", async () => {
    serve((url) => {
      if (url === "/api/access/state") return json({ enabled: true, safety_limits: {} });
      if (url === "/api/runs/run_1") return json(RUN);
      if (url === "/api/access/grants") return json({ detail: "x", code: "access.person_required", params: {} }, 403);
      return json(request({ status: "approved" }));
    });
    render(wrap(<ToolApprovalForm request={request()} />));
    await screen.findByTestId("tool-approval-remember");
    await userEvent.selectOptions(screen.getByLabelText("Wie lange"), "until_revoked");
    await screen.findByRole("option", { name: "Dieser Agent (wf_1/writer)" });
    await userEvent.click(screen.getByRole("button", { name: "Diesen Aufruf erlauben" }));
    expect(await screen.findByText(/die Erlaubnis oder Sperre aber nicht/)).toBeInTheDocument();
  });
});
