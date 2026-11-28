// The workflow's notification rules (NAL-A3): which events of its runs notify, and whom. They are saved with the
// workflow like its budget and limits. Notifications stay inside Nodestro (the bell in the top bar); no e-mail.

import { HelpTip } from "@nodestro/ui-core";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import {
  NOTIFICATION_EVENTS,
  NOTIFICATION_RECIPIENTS,
  type NotificationEvent,
  notificationsOf,
} from "../api/notifications";
import { useEditor } from "./store";

export function NotificationSettings() {
  const { t } = useTranslation();
  const stored = useEditor((s) => s.notifications);
  const rules = notificationsOf(stored);
  const { setMeta } = useEditor.getState();
  const titleId = useId();
  const name = useId();
  const toggle = (event: NotificationEvent, on: boolean) => {
    const chosen = new Set(rules.events);
    if (on) chosen.add(event);
    else chosen.delete(event);
    setMeta({ notifications: { ...rules, events: NOTIFICATION_EVENTS.filter((item) => chosen.has(item)) } });
  };
  return (
    <section className="notify-settings stack-sm" aria-labelledby={titleId} data-testid="workflow-notifications">
      <h3 id={titleId} className="notify-settings__title">
        {t("notifications.settings.title")}
        <HelpTip id="workflow.notifications" topic={t("notifications.settings.title")} />
      </h3>
      <fieldset>
        <legend className="nd-field-label">{t("notifications.settings.events")}</legend>
        {NOTIFICATION_EVENTS.map((event) => (
          <label key={event} className="notify-option">
            <input
              type="checkbox"
              checked={rules.events.includes(event)}
              onChange={(e) => toggle(event, e.target.checked)}
              data-testid={`notify-event-${event}`}
            />
            <span className="notify-option__text">
              <span>{t(`notifications.settings.event.${event}.label`)}</span>
              <small className="muted">{t(`notifications.settings.event.${event}.hint`)}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend className="nd-field-label">{t("notifications.settings.recipients")}</legend>
        {NOTIFICATION_RECIPIENTS.map((recipients) => (
          <label key={recipients} className="notify-option">
            <input
              type="radio"
              name={name}
              value={recipients}
              checked={rules.recipients === recipients}
              onChange={() => setMeta({ notifications: { ...rules, recipients } })}
              data-testid={`notify-recipients-${recipients}`}
            />
            <span className="notify-option__text">
              <span>{t(`notifications.settings.recipient.${recipients}.label`)}</span>
              <small className="muted">{t(`notifications.settings.recipient.${recipients}.hint`)}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <p className="field__hint">{t("notifications.settings.insideOnly")}</p>
    </section>
  );
}
