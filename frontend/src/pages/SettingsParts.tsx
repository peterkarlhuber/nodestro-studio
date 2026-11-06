// Building blocks for the inside of a settings section (see docs/design/SETTINGS_PAGE.md for the page's conventions):
//
// - SettingsGroup: a titled group of related settings (h3). With `columns` its fields stand side by side where the
//   section is wide enough, which saves scrolling on large screens and stacks again on narrow ones.
// - SettingsAdvanced: progressive disclosure for expert settings: a collapsible part, closed by default, that says
//   how many of its values differ from the standard, so a changed value is never hidden without a trace.
//
// Both are found by the settings search (an h3 and a <details> are part of its convention), and a hit inside a
// closed advanced part opens it.

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { HelpId } from "../lib/help";
import { Badge, HelpTip } from "../components/ui";

export function SettingsGroup({
  title,
  tip,
  columns,
  children,
}: {
  title: string;
  tip?: HelpId;
  /** Fields side by side on wide sections (two or more columns of at least ~18rem). */
  columns?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="settings-group">
      <h3 className="settings-group__title">
        {title}
        {tip ? <HelpTip id={tip} label={title} /> : null}
      </h3>
      <div className={columns ? "settings-columns" : "stack"}>{children}</div>
    </div>
  );
}

export function SettingsAdvanced({
  title,
  hint,
  changed = 0,
  defaultOpen = false,
  testId,
  children,
}: {
  title: string;
  /** One sentence on when these settings matter, shown when the part is open. */
  hint?: ReactNode;
  /** How many values inside differ from the standard (shown on the closed part). */
  changed?: number;
  defaultOpen?: boolean;
  testId?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <details className="settings-advanced" open={defaultOpen || undefined} data-testid={testId}>
      <summary>
        <ChevronRight size={14} className="section__chevron" aria-hidden />
        <span className="settings-advanced__title">{title}</span>
        <Badge tone="idle">{t("settingsUi.advanced.badge")}</Badge>
        {changed > 0 ? <Badge tone="running">{t("settingsUi.advanced.changed", { count: changed })}</Badge> : null}
      </summary>
      <div className="settings-advanced__body stack">
        {hint ? <p className="muted small">{hint}</p> : null}
        {children}
      </div>
    </details>
  );
}
