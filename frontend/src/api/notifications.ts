// Internal notifications (NAL-A3): the bell in the top bar reads the person's inbox, and every workflow says which of
// its events notify whom. Nothing leaves Nodestro: no e-mail, no webhook. The API (nodestro-api) answers from the
// local inbox or, on a server with the platform inbox, from that one; then subject and text arrive filled in English
// and level and params may be missing.

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { request } from "./client";

/** The events a workflow can notify about (the workflow's ``notifications.events``). */
export const NOTIFICATION_EVENTS = ["run_failed", "approval_pending", "budget_pending", "quality_failed", "run_finished"] as const;
export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

/** A notification is an event of a run, or a message an agent wrote with the tool ``notify_user``. */
export type NotificationKind = NotificationEvent | "message";
export const NOTIFICATION_KINDS: readonly NotificationKind[] = [...NOTIFICATION_EVENTS, "message"];

export type NotificationLevel = "info" | "success" | "warning" | "error";
export const NOTIFICATION_LEVELS: readonly NotificationLevel[] = ["info", "success", "warning", "error"];

/** Who is notified: everyone with access to the workflow, or only the person who started the run. */
export const NOTIFICATION_RECIPIENTS = ["members", "starter"] as const;
export type NotificationRecipients = (typeof NOTIFICATION_RECIPIENTS)[number];

/** The notification rules of a workflow. */
export interface WorkflowNotifications {
  events: NotificationEvent[];
  recipients: NotificationRecipients;
}

/** What the API gives a workflow without its own rules: failed runs and steps waiting for approval, for everyone. */
export const DEFAULT_WORKFLOW_NOTIFICATIONS: WorkflowNotifications = {
  events: ["run_failed", "approval_pending"],
  recipients: "members",
};

/** One entry of the inbox (GET /api/notifications). */
export interface AppNotification {
  id: string;
  /** A string from a newer API may be a kind this interface does not know yet. */
  kind: NotificationKind | (string & {});
  /**
   * Null for events of the local inbox: the interface writes the text from kind, params and workflow name. For a
   * ``message`` it is the title the agent wrote: model output, shown as plain text only.
   */
  subject: string | null;
  text: string | null;
  created_at: string;
  read_at: string | null;
  level?: NotificationLevel | null;
  params?: Record<string, string> | null;
  run_id: string | null;
  workflow_id: string | null;
  workflow_name: string | null;
}

export interface NotificationPage {
  items: AppNotification[];
  /** Unread notifications of the person in total (not only on this page). */
  unread: number;
  next_cursor: string | null;
}

export const NOTIFICATIONS_PAGE = 20;
/** How often the unread count is read again while the page is visible. */
export const NOTIFICATIONS_POLL_MS = 60_000;

export const notificationKeys = {
  all: ["notifications"] as const,
  unread: ["notifications", "unread"] as const,
  list: ["notifications", "list"] as const,
};

export interface NotificationQuery {
  unreadOnly?: boolean;
  limit?: number;
  cursor?: string | null;
}

function query({ unreadOnly, limit, cursor }: NotificationQuery): string {
  const search = new URLSearchParams();
  if (unreadOnly) search.set("unread_only", "true");
  if (limit) search.set("limit", String(limit));
  if (cursor) search.set("cursor", cursor);
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const notificationsApi = {
  list: (options: NotificationQuery = {}) => request<NotificationPage>("GET", `/notifications${query(options)}`),
  /** Marks these notifications as read; an empty list marks all of them. */
  markRead: (ids: string[]) => request<{ marked: number }>("POST", "/notifications/read", { ids }),
};

/**
 * The unread count for the bell. Polled every minute while the page is visible (react-query pauses the interval in a
 * hidden tab and reads again when it returns). An API without the route leaves it in error: the bell is not shown.
 */
export const useUnreadNotifications = (enabled = true) =>
  useQuery({
    queryKey: notificationKeys.unread,
    queryFn: async () => (await notificationsApi.list({ unreadOnly: true, limit: 1 })).unread,
    enabled,
    retry: false,
    refetchInterval: NOTIFICATIONS_POLL_MS,
    refetchIntervalInBackground: false,
  });

/** The inbox page by page, newest first; read whenever the panel opens. */
export const useNotificationList = (enabled: boolean) =>
  useInfiniteQuery({
    queryKey: notificationKeys.list,
    queryFn: ({ pageParam }) => notificationsApi.list({ limit: NOTIFICATIONS_PAGE, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    enabled,
    retry: false,
    refetchOnMount: "always",
  });

/** A workflow's rules as the editor shows them: the API's default for a workflow without them. */
export function notificationsOf(value: Partial<WorkflowNotifications> | null | undefined): WorkflowNotifications {
  const chosen: unknown = value?.events;
  const events = Array.isArray(chosen)
    ? NOTIFICATION_EVENTS.filter((event) => chosen.includes(event))
    : DEFAULT_WORKFLOW_NOTIFICATIONS.events;
  const recipients = value?.recipients === "starter" ? "starter" : "members";
  return { events, recipients };
}
