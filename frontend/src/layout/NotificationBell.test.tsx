import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { keys } from "../api/hooks";
import { type AppNotification, type NotificationPage, notificationKeys } from "../api/notifications";
import i18n from "../i18n";
import { NotificationBell, notificationView } from "./NotificationBell";

const t = i18n.t.bind(i18n);
const now = new Date().toISOString();

function note(id: string, patch: Partial<AppNotification>): AppNotification {
  return {
    id,
    kind: "run_failed",
    subject: null,
    text: null,
    created_at: now,
    read_at: null,
    level: null,
    params: {},
    run_id: `run_${id}`,
    workflow_id: "wf_1",
    workflow_name: "Offer check",
    ...patch,
  };
}

const ITEMS: AppNotification[] = [
  note("n1", { kind: "run_failed", level: "error", params: { error_code: "run.budget_exceeded" } }),
  note("n2", { kind: "approval_pending", level: "warning", params: { node: "Legal review" } }),
  note("n3", { kind: "budget_pending", level: "warning" }),
  note("n4", { kind: "quality_failed", level: "warning", read_at: now }),
  note("n5", { kind: "run_finished", level: "success", params: { status: "succeeded" }, read_at: now }),
  note("n6", {
    kind: "message",
    subject: "Contract <i>found</i>",
    text: "<b>Notice period</b> is 14 days.\nSee https://evil.example/x",
    level: "info",
    run_id: null,
  }),
];

interface Call {
  method: string;
  url: string;
  body?: unknown;
}

function serve({ unread = 2, items = ITEMS, older = [] as AppNotification[], status = 200 } = {}) {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      calls.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (status !== 200) return Response.json({ detail: "Not Found" }, { status });
      if (method === "POST" && url === "/api/notifications/read") return Response.json({ marked: 1 });
      if (url.startsWith("/api/notifications?")) {
        const query = new URLSearchParams(url.split("?")[1]);
        if (query.get("unread_only") === "true") return Response.json({ items: [], unread, next_cursor: null } satisfies NotificationPage);
        if (query.get("cursor") === "c2") return Response.json({ items: older, unread, next_cursor: null } satisfies NotificationPage);
        return Response.json({ items, unread, next_cursor: older.length ? "c2" : null } satisfies NotificationPage);
      }
      return Response.json({});
    }),
  );
  return calls;
}

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(keys.meta, { profile: "desktop", capabilities: [], providers: [], models: [] });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return client;
}

async function openPanel() {
  fireEvent.click(await screen.findByTestId("notification-bell"));
  await waitFor(() => expect(screen.getAllByTestId("notification-item").length).toBeGreaterThan(0));
  return screen.getByTestId("notification-panel");
}

describe("NotificationBell", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the unread count and names it", async () => {
    serve({ unread: 2 });
    show();
    const bell = await screen.findByRole("button", { name: "Benachrichtigungen, 2 ungelesen" });
    expect(within(bell).getByTestId("notification-count")).toHaveTextContent("2");
    expect(bell).toHaveAttribute("aria-expanded", "false");
  });

  it("names the bell without a count when everything is read and caps the badge at 9+", async () => {
    serve({ unread: 0 });
    show();
    expect(await screen.findByRole("button", { name: "Benachrichtigungen" })).toBeInTheDocument();
    expect(screen.queryByTestId("notification-count")).toBeNull();
    cleanup();
    serve({ unread: 12 });
    show();
    expect(await screen.findByRole("button", { name: "Benachrichtigungen, 12 ungelesen" })).toHaveTextContent("9+");
  });

  it("is not shown by an API without notifications", async () => {
    const calls = serve({ status: 404 });
    show();
    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    await waitFor(() => expect(screen.queryByTestId("notification-bell")).toBeNull());
  });

  it("lists every kind with its own text, the workflow and a link to the run", async () => {
    serve();
    show();
    const panel = await openPanel();
    expect(within(panel).getByRole("heading", { name: "Benachrichtigungen" })).toHaveFocus();
    const items = within(panel).getAllByTestId("notification-item");
    expect(items).toHaveLength(6);
    expect(items[0]).toHaveTextContent(t("notifications.event.run_failed.title"));
    expect(items[0]).toHaveTextContent(t("errors.run.budget_exceeded"));
    expect(items[0]).toHaveTextContent("Offer check");
    expect(within(items[0]).getByRole("link", { name: t("notifications.openRun") })).toHaveAttribute("href", "/executions/run_n1");
    expect(items[1]).toHaveTextContent(t("notifications.event.approval_pending.title"));
    expect(items[1]).toHaveTextContent("Der Schritt „Legal review“ wartet auf eine Entscheidung.");
    expect(items[2]).toHaveTextContent(t("notifications.event.budget_pending.title"));
    expect(items[2]).toHaveTextContent(t("notifications.event.budget_pending.text"));
    expect(items[3]).toHaveTextContent(t("notifications.event.quality_failed.title"));
    expect(items[4]).toHaveTextContent(t("notifications.event.run_finished.status.succeeded"));
    expect(items[0]).toHaveClass("notify-item--unread", "notify-item--error");
    expect(items[3]).not.toHaveClass("notify-item--unread");
    expect(items[4]).toHaveClass("notify-item--success");
    // Read entries offer no "mark as read".
    expect(within(items[3]).queryByTestId("notification-read")).toBeNull();
  });

  it("shows an agent's message as plain text with the agent mark", async () => {
    serve();
    show();
    const panel = await openPanel();
    const message = within(panel).getAllByTestId("notification-item")[5];
    expect(within(message).getByTestId("notification-agent")).toHaveTextContent("Von einem Agenten");
    expect(message).toHaveTextContent("Contract <i>found</i>");
    expect(within(message).getByTestId("notification-text").textContent).toBe("<b>Notice period</b> is 14 days.\nSee https://evil.example/x");
    // No markup becomes an element, and the address is not a link.
    expect(message.querySelector("b, i")).toBeNull();
    expect(within(message).queryByRole("link")).toBeNull();
  });

  it("marks one notification as read, and all of them", async () => {
    const calls = serve();
    show();
    const panel = await openPanel();
    fireEvent.click(within(within(panel).getAllByTestId("notification-item")[1]).getByTestId("notification-read"));
    await waitFor(() => expect(calls.filter((call) => call.method === "POST")).toHaveLength(1));
    expect(calls.find((call) => call.method === "POST")).toEqual({ method: "POST", url: "/api/notifications/read", body: { ids: ["n2"] } });
    await waitFor(() => expect(within(panel).getAllByTestId("notification-item")[1]).not.toHaveClass("notify-item--unread"));
    fireEvent.click(within(panel).getByTestId("notification-read-all"));
    await waitFor(() => expect(calls.filter((call) => call.method === "POST")).toHaveLength(2));
    expect(calls.filter((call) => call.method === "POST")[1].body).toEqual({ ids: [] });
  });

  it("marks a notification as read when its run is opened, and closes the panel", async () => {
    const calls = serve();
    show();
    const panel = await openPanel();
    fireEvent.click(within(within(panel).getAllByTestId("notification-item")[0]).getByTestId("notification-run"));
    await waitFor(() => expect(calls.some((call) => call.method === "POST")).toBe(true));
    expect(calls.find((call) => call.method === "POST")?.body).toEqual({ ids: ["n1"] });
    expect(screen.queryByTestId("notification-panel")).toBeNull();
  });

  it("loads more with the cursor of the previous page", async () => {
    const calls = serve({ older: [note("n7", { kind: "run_failed", workflow_name: "Older workflow", read_at: now })] });
    show();
    const panel = await openPanel();
    fireEvent.click(within(panel).getByTestId("notification-more"));
    await waitFor(() => expect(within(panel).getAllByTestId("notification-item")).toHaveLength(7));
    expect(calls.some((call) => call.url === "/api/notifications?limit=20&cursor=c2")).toBe(true);
    expect(within(panel).getByText("Older workflow")).toBeInTheDocument();
    expect(within(panel).queryByTestId("notification-more")).toBeNull();
  });

  it("shows an empty state", async () => {
    serve({ unread: 0, items: [] });
    show();
    fireEvent.click(await screen.findByTestId("notification-bell"));
    expect(await screen.findByTestId("notification-empty")).toHaveTextContent(t("notifications.empty"));
    expect(screen.getByTestId("notification-read-all")).toBeDisabled();
  });

  it("closes on Escape and returns the focus to the bell", async () => {
    serve();
    show();
    await openPanel();
    const bell = screen.getByTestId("notification-bell");
    expect(bell).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("notification-panel")).toBeNull();
    expect(bell).toHaveFocus();
  });

  it("announces new unread notifications politely, not the count found at the start", async () => {
    serve({ unread: 2 });
    const client = show();
    await screen.findByRole("button", { name: "Benachrichtigungen, 2 ungelesen" });
    const live = screen.getByTestId("notification-live");
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live).toHaveTextContent("");
    act(() => client.setQueryData(notificationKeys.unread, 3));
    await waitFor(() => expect(live).toHaveTextContent("1 neue Benachrichtigung"));
  });
});

describe("notificationView", () => {
  it("shows subject and text from the platform inbox as given", () => {
    const view = notificationView(t, note("x", { kind: "run_failed", subject: "Run failed: Offer check", text: "Budget exceeded", level: null, params: null }));
    expect(view).toMatchObject({ title: "Run failed: Offer check", text: "Budget exceeded", fromAgent: false, level: "error" });
  });

  it("reads an unknown kind without text as a plain notification", () => {
    expect(notificationView(t, note("x", { kind: "something_new" }))).toMatchObject({ title: t("notifications.untitled"), level: "info" });
  });

  it("leaves out an error sentence that needs values the notification does not carry", () => {
    const view = notificationView(t, note("x", { kind: "run_failed", params: { error_code: "skill.name_taken" } }));
    expect(view.text).toBeNull();
  });
});
