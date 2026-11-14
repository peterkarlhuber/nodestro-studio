// The bell in the top bar (NAL-A3): the unread count of the person's inbox and a panel with the notifications.
//
// Event texts are written here in the interface language from kind, params and workflow name; a server with the
// platform inbox sends subject and text (English), which are shown as given. A message from an agent (tool
// notify_user) is model output: it is rendered as React text nodes only, never as HTML or Markdown, links are not
// made clickable, and it is marked as coming from an agent.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import {
  AlertTriangle,
  Bell,
  Bot,
  Check,
  CheckCheck,
  CheckCircle2,
  CircleDollarSign,
  Hand,
  Info,
  type LucideIcon,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useAccess } from "../api/access";
import { ApiError } from "../api/client";
import {
  type AppNotification,
  NOTIFICATION_EVENTS,
  NOTIFICATION_LEVELS,
  type NotificationEvent,
  type NotificationLevel,
  type NotificationPage,
  notificationKeys,
  notificationsApi,
  useNotificationList,
  useUnreadNotifications,
} from "../api/notifications";
import type { RunStatus } from "../api/types";
import { Button, IconButton, Spinner } from "../components/ui";
import { ErrorText, problemText } from "../lib/errors";
import { formatDate, relativeTime } from "../lib/format";

/** The run states a ``run_finished`` notification can name with a text of its own. */
const FINISHED_STATES = ["succeeded", "failed", "cancelled"] as const satisfies readonly RunStatus[];
type FinishedState = (typeof FINISHED_STATES)[number];

const isEvent = (kind: string): kind is NotificationEvent => (NOTIFICATION_EVENTS as readonly string[]).includes(kind);
const isLevel = (level: unknown): level is NotificationLevel => (NOTIFICATION_LEVELS as readonly unknown[]).includes(level);
const isFinished = (status: unknown): status is FinishedState => (FINISHED_STATES as readonly unknown[]).includes(status);

/** How a notification reads: title, text, the agent mark, and its tone and icon. */
export interface NotificationView {
  title: string;
  text: string | null;
  fromAgent: boolean;
  level: NotificationLevel;
  icon: LucideIcon;
}

const LEVEL_ICON: Record<NotificationLevel, LucideIcon> = { info: Info, success: CheckCircle2, warning: AlertTriangle, error: XCircle };

/** The level an event has when the inbox does not name one. */
function eventLevel(kind: NotificationEvent, params: Record<string, string>): NotificationLevel {
  if (kind === "run_failed") return "error";
  if (kind === "run_finished") return params.status === "succeeded" ? "success" : params.status === "failed" ? "error" : "info";
  return "warning";
}

const EVENT_ICON: Record<NotificationEvent, LucideIcon | null> = {
  run_failed: null,
  approval_pending: Hand,
  budget_pending: CircleDollarSign,
  quality_failed: ShieldAlert,
  run_finished: null,
};

/** The sentence of a failed run's error code, or null when the code needs values the notification does not carry. */
function errorSentence(t: TFunction, code: string | undefined): string | null {
  if (!code) return null;
  const sentence = problemText(t, { code, params: {} });
  return sentence.includes("{{") ? null : sentence;
}

/** How one notification reads in the interface language. */
export function notificationView(t: TFunction, item: AppNotification): NotificationView {
  const params = item.params ?? {};
  const kind = item.kind;
  const fromAgent = kind === "message";
  const given = isLevel(item.level) ? item.level : null;
  if (fromAgent || item.subject || item.text || !isEvent(kind)) {
    // Text that came with the notification: an agent's message, or the platform inbox (English).
    const level = given ?? (isEvent(kind) ? eventLevel(kind, params) : "info");
    return {
      title: item.subject?.trim() || (fromAgent ? t("notifications.agentMessage") : isEvent(kind) ? t(`notifications.event.${kind}.title`) : t("notifications.untitled")),
      text: item.text?.trim() ? item.text : null,
      fromAgent,
      level,
      icon: fromAgent ? Bot : (isEvent(kind) && EVENT_ICON[kind]) || LEVEL_ICON[level],
    };
  }
  const level = given ?? eventLevel(kind, params);
  let text: string | null = null;
  if (kind === "run_failed") text = errorSentence(t, params.error_code);
  else if (kind === "approval_pending") text = params.node ? t("notifications.event.approval_pending.step", { node: params.node }) : null;
  else if (kind === "run_finished")
    text = isFinished(params.status) ? t(`notifications.event.run_finished.status.${params.status}`) : null;
  else text = t(`notifications.event.${kind}.text`);
  return { title: t(`notifications.event.${kind}.title`), text, fromAgent: false, level, icon: EVENT_ICON[kind] ?? LEVEL_ICON[level] };
}

/** "9+" above nine: the accessible name keeps the exact count. */
const badgeText = (count: number) => (count > 9 ? "9+" : String(count));

/**
 * A polite announcement when the unread count grows while the app is open (not for the count found at the start).
 * It is cleared after a while, so the same sentence is announced again next time.
 */
function useNewUnreadAnnouncement(count: number | undefined): string {
  const { t } = useTranslation();
  const previous = useRef<number | undefined>(undefined);
  const [text, setText] = useState("");
  useEffect(() => {
    if (count === undefined) return;
    const before = previous.current;
    previous.current = count;
    if (before === undefined || count <= before) return;
    setText(t("notifications.announce", { count: count - before }));
    const timer = window.setTimeout(() => setText(""), 8000);
    return () => window.clearTimeout(timer);
  }, [count, t]);
  return text;
}

/** Whether the API has no notifications at all (an older backend): then the bell is not shown. */
function unsupported(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 405);
}

export function NotificationBell() {
  const { t } = useTranslation();
  const access = useAccess();
  const allowed = access.can("read");
  const unread = useUnreadNotifications(allowed);
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const count = unread.data ?? 0;
  const announcement = useNewUnreadAnnouncement(unread.data);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.(".notify-panel, .notify-bell")) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  if (!allowed || unsupported(unread.error)) return null;
  const label = count ? t("notifications.bellUnread", { count }) : t("notifications.bell");
  return (
    <div className="notify">
      <button
        ref={button}
        type="button"
        className={`notify-bell ${open ? "active" : ""}`}
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-haspopup="dialog"
        onClick={() => setOpen(!open)}
        data-testid="notification-bell"
      >
        <Bell size={17} aria-hidden />
        {count ? (
          <span className="notify-bell__badge" aria-hidden data-testid="notification-count">
            {badgeText(count)}
          </span>
        ) : null}
      </button>
      <span className="sr-only" aria-live="polite" data-testid="notification-live">
        {announcement}
      </span>
      {open ? (
        <NotificationPanel
          id={panelId}
          unread={count}
          onClose={(refocus) => {
            setOpen(false);
            if (refocus) button.current?.focus();
          }}
        />
      ) : null}
    </div>
  );
}

function NotificationPanel({ id, unread, onClose }: { id: string; unread: number; onClose: (refocus: boolean) => void }) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const list = useNotificationList(true);
  const heading = useRef<HTMLHeadingElement>(null);
  const titleId = `${id}-title`;
  useEffect(() => heading.current?.focus(), []);

  const markRead = useMutation({
    mutationFn: (ids: string[]) => notificationsApi.markRead(ids),
    onSuccess: (_answer, ids) => {
      // Shown as read at once; the next read of the inbox brings the server's state.
      const now = new Date().toISOString();
      client.setQueryData<{ pages: NotificationPage[]; pageParams: unknown[] }>(notificationKeys.list, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                items: page.items.map((item) => (!item.read_at && (!ids.length || ids.includes(item.id)) ? { ...item, read_at: now } : item)),
              })),
            }
          : data,
      );
      void client.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
  const read = (item: AppNotification) => {
    if (!item.read_at) markRead.mutate([item.id]);
  };

  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const pageUnread = list.data?.pages[0]?.unread;
  const anyUnread = (pageUnread ?? unread) > 0 || items.some((item) => !item.read_at);
  return (
    <div id={id} className="notify-panel" role="dialog" aria-modal="false" aria-labelledby={titleId} data-testid="notification-panel">
      <div className="notify-panel__head">
        <h2 id={titleId} ref={heading} tabIndex={-1} className="notify-panel__title">
          {t("notifications.title")}
        </h2>
        <Button
          size="sm"
          variant="ghost"
          icon={CheckCheck}
          disabled={!anyUnread}
          busy={markRead.isPending && markRead.variables?.length === 0}
          onClick={() => markRead.mutate([])}
          data-testid="notification-read-all"
        >
          {t("notifications.markAllRead")}
        </Button>
      </div>
      {list.isPending ? (
        <Spinner />
      ) : list.isError ? (
        <div className="notify-panel__error">
          <ErrorText error={list.error} compact />
        </div>
      ) : items.length === 0 ? (
        <div className="notify-panel__empty" data-testid="notification-empty">
          <Bell size={20} aria-hidden />
          <strong>{t("notifications.empty")}</strong>
          <p className="muted small">{t("notifications.emptyText")}</p>
        </div>
      ) : (
        <ul className="notify-list" aria-label={t("notifications.title")}>
          {items.map((item) => (
            <NotificationItem key={item.id} item={item} onRead={() => read(item)} onOpen={() => onClose(false)} />
          ))}
        </ul>
      )}
      {list.hasNextPage ? (
        <div className="notify-panel__more">
          <Button size="sm" busy={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()} data-testid="notification-more">
            {t("notifications.loadMore")}
          </Button>
        </div>
      ) : null}
      {markRead.isError ? (
        <div className="notify-panel__error">
          <ErrorText error={markRead.error} compact />
        </div>
      ) : null}
      <p className="notify-panel__foot muted small">{t("notifications.insideOnly")}</p>
    </div>
  );
}

function NotificationItem({ item, onRead, onOpen }: { item: AppNotification; onRead: () => void; onOpen: () => void }) {
  const { t } = useTranslation();
  const view = notificationView(t, item);
  const Icon = view.icon;
  const unread = !item.read_at;
  return (
    <li
      className={`notify-item notify-item--${view.level} ${unread ? "notify-item--unread" : ""}`}
      data-testid="notification-item"
      data-kind={item.kind}
    >
      <span className="notify-item__icon" aria-hidden>
        <Icon size={15} />
      </span>
      <div className="notify-item__body">
        {view.fromAgent ? (
          <span className="notify-item__agent" data-testid="notification-agent">
            <Bot size={11} aria-hidden /> {t("notifications.fromAgent")}
          </span>
        ) : null}
        {/* Plain text only: an agent's title and message are model output (no HTML, no Markdown, no links). */}
        <strong className="notify-item__title">
          {unread ? <span className="sr-only">{t("notifications.unread")} </span> : null}
          {view.title}
        </strong>
        {view.text ? (
          <p className="notify-item__text" data-testid="notification-text">
            {view.text}
          </p>
        ) : null}
        <span className="notify-item__meta muted small">
          {item.workflow_name ? <span className="notify-item__workflow">{item.workflow_name}</span> : null}
          <time dateTime={item.created_at} title={formatDate(item.created_at)}>
            {relativeTime(item.created_at)}
          </time>
        </span>
        {item.run_id ? (
          <Link
            to={`/executions/${encodeURIComponent(item.run_id)}`}
            className="notify-item__link small"
            onClick={() => {
              onRead();
              onOpen();
            }}
            data-testid="notification-run"
          >
            {t("notifications.openRun")}
          </Link>
        ) : null}
      </div>
      {unread ? (
        <IconButton icon={Check} label={t("notifications.markRead")} onClick={onRead} data-testid="notification-read" />
      ) : null}
    </li>
  );
}
