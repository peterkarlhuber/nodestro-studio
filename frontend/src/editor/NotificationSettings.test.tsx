import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../api/client";
import { DEFAULT_WORKFLOW_NOTIFICATIONS, notificationsOf } from "../api/notifications";
import type { Workflow } from "../api/types";
import i18n from "../i18n";
import { changedOnServer } from "./SaveConflictDialog";
import { NotificationSettings } from "./NotificationSettings";
import { useEditor } from "./store";

function workflow(patch: Partial<Workflow> = {}): Workflow {
  return {
    id: "wf_1",
    name: "Offer check",
    description: "",
    budget_usd: null,
    nodes: [],
    edges: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...patch,
  };
}

const box = (event: string) => screen.getByTestId(`notify-event-${event}`) as HTMLInputElement;
const radio = (recipients: string) => screen.getByTestId(`notify-recipients-${recipients}`) as HTMLInputElement;

describe("NotificationSettings", () => {
  beforeEach(() => useEditor.getState().load(workflow({ notifications: { events: ["run_failed", "approval_pending"], recipients: "members" } })));
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows one explained checkbox per event, the recipients and the note that nothing is e-mailed", () => {
    render(<NotificationSettings />);
    const section = screen.getByTestId("workflow-notifications");
    expect(within(section).getByRole("heading", { name: /Benachrichtigungen/ })).toBeInTheDocument();
    expect(within(section).getAllByRole("checkbox")).toHaveLength(5);
    expect(within(section).getAllByRole("radio")).toHaveLength(2);
    expect(box("run_failed").checked).toBe(true);
    expect(box("approval_pending").checked).toBe(true);
    expect(box("run_finished").checked).toBe(false);
    expect(radio("members").checked).toBe(true);
    expect(section).toHaveTextContent(i18n.t("notifications.settings.event.budget_pending.hint"));
    expect(section).toHaveTextContent(i18n.t("notifications.settings.insideOnly"));
  });

  it("toggles events and recipients and saves them with the workflow", async () => {
    render(<NotificationSettings />);
    fireEvent.click(box("run_finished"));
    fireEvent.click(box("approval_pending"));
    fireEvent.click(radio("starter"));
    expect(box("approval_pending").checked).toBe(false);
    expect(radio("starter").checked).toBe(true);
    expect(useEditor.getState().dirty).toBe(true);
    const sent = useEditor.getState().toWorkflow();
    expect(sent.notifications).toEqual({ events: ["run_failed", "run_finished"], recipients: "starter" });

    const calls: { url: string; body: unknown }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, body: JSON.parse(String(init?.body)) });
        return Response.json({ ...workflow(), ...(calls[0].body as object) });
      }),
    );
    await api.saveWorkflow("wf_1", sent);
    expect((calls[0].body as Workflow).notifications).toEqual({ events: ["run_failed", "run_finished"], recipients: "starter" });
  });

  it("undoes a change of the rules", () => {
    render(<NotificationSettings />);
    fireEvent.click(box("budget_pending"));
    expect(useEditor.getState().toWorkflow().notifications?.events).toEqual(["run_failed", "approval_pending", "budget_pending"]);
    useEditor.getState().undo();
    expect(useEditor.getState().toWorkflow().notifications?.events).toEqual(["run_failed", "approval_pending"]);
  });

  it("shows the default for a workflow from an older API and sends nothing until it is changed", () => {
    useEditor.getState().load(workflow());
    render(<NotificationSettings />);
    expect(box("run_failed").checked).toBe(true);
    expect(box("approval_pending").checked).toBe(true);
    expect(radio("members").checked).toBe(true);
    expect("notifications" in useEditor.getState().toWorkflow()).toBe(false);
    fireEvent.click(box("approval_pending"));
    expect(useEditor.getState().toWorkflow().notifications).toEqual({ events: ["run_failed"], recipients: "members" });
  });
});

describe("notification rules", () => {
  it("fall back to the API's default and keep only known events in their order", () => {
    expect(notificationsOf(undefined)).toEqual(DEFAULT_WORKFLOW_NOTIFICATIONS);
    expect(notificationsOf({ events: ["run_finished", "unknown" as never, "run_failed"], recipients: "starter" })).toEqual({
      events: ["run_failed", "run_finished"],
      recipients: "starter",
    });
    expect(notificationsOf({ events: [] })).toEqual({ events: [], recipients: "members" });
  });

  it("count as a change on the server", () => {
    const base = workflow({ notifications: { events: ["run_failed"], recipients: "members" } });
    const current = { ...base, updated_at: "2026-01-02T00:00:00Z", notifications: { events: [], recipients: "members" as const } };
    expect(changedOnServer(base, current)).toBe(true);
  });
});
