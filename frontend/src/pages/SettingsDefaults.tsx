// "Changed" marks on the settings page (ST-059): a field whose value differs from its default (GET
// /api/settings/defaults, nodestro-api API-061) shows a "Changed" badge and a reset action next to its label.
//
// - The defaults are read once per page visit (useSettingsDefaults). An API without the route answers 404: no marks
//   and no error, the page works as before. A setting the defaults do not name, or a value the settings do not send
//   (an older backend), is never marked.
// - The mark compares what the field shows now: in a section with its own Save button that is the unsaved input, so
//   "Reset" puts the default into the input and the person saves as usual; elsewhere "Reset" saves at once, exactly
//   like changing the control.

import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useSettingsDefaults } from "../api/hooks";
import type { SettingsDefaults } from "../api/types";
import { Badge, Tooltip } from "../components/ui";

export type DefaultSetting = keyof SettingsDefaults;

/** null, undefined, "" and NaN all mean "no value" (an empty budget is no limit, like null). */
function empty(value: unknown): boolean {
  return value === null || value === undefined || value === "" || (typeof value === "number" && Number.isNaN(value));
}

function numeric(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  // A money input shows the language's decimal mark ("2,50", see lib/money.ts moneyInputText).
  if (typeof value === "string" && /^\s*-?\d+([.,]\d+)?\s*$/.test(value)) return Number(value.replace(",", "."));
  return null;
}

/**
 * Whether a shown value equals the default. Numbers compare by value, also as text ("2.00" and 2: a money input
 * keeps its text); a model id or a mode compares as written. ``undefined`` means the backend does not know the
 * setting: it counts as the default, so nothing is marked.
 */
export function isDefault(value: unknown, fallback: unknown): boolean {
  if (value === undefined) return true;
  if (empty(value) || empty(fallback)) return empty(value) && empty(fallback);
  const a = numeric(value);
  const b = numeric(fallback);
  if (a !== null && b !== null) return a === b;
  return value === fallback;
}

/** The default of one setting, or undefined while the defaults are loading or unknown (older API, failed read). */
export function useSettingDefault<K extends DefaultSetting>(setting: K): SettingsDefaults[K] | undefined {
  const defaults = useSettingsDefaults();
  const data = defaults.data;
  return data && setting in data ? data[setting] : undefined;
}

/**
 * The "Changed" badge and the reset action of one setting; nothing while the value is the default or no default is
 * known. ``label`` names the setting for screen readers ("Reset Default model to its default"); ``format`` shows the
 * default in the reset action's tooltip (models by name, money with its currency, a mode by its label).
 */
export function DefaultMark<K extends DefaultSetting>({
  setting,
  value,
  label,
  onReset,
  disabled,
  format,
}: {
  setting: K;
  value: unknown;
  label: string;
  /** Called with the default; without it only the badge is shown. */
  onReset?: (value: SettingsDefaults[K]) => void;
  disabled?: boolean;
  format?: (value: SettingsDefaults[K]) => string;
}) {
  const { t } = useTranslation();
  const fallback = useSettingDefault(setting);
  if (fallback === undefined || isDefault(value, fallback)) return null;
  const shown = format
    ? format(fallback)
    : typeof fallback === "boolean"
      ? t(fallback ? "settingsUi.defaults.on" : "settingsUi.defaults.off")
      : empty(fallback)
        ? t("settingsUi.defaults.none")
        : String(fallback);
  return (
    <span className="settings-changed" data-settings-search="skip" data-testid={`setting-changed-${setting}`}>
      <Tooltip content={t("settingsUi.defaults.changedTip", { value: shown })}>
        <span className="has-tip" tabIndex={0}>
          <Badge tone="running">{t("settingsUi.defaults.changed")}</Badge>
        </span>
      </Tooltip>
      {onReset ? (
        <Tooltip content={t("settingsUi.defaults.resetTip", { value: shown })}>
          <button
            type="button"
            className="settings-changed__reset"
            disabled={disabled}
            aria-label={t("settingsUi.defaults.resetLabel", { setting: label, value: shown })}
            onClick={() => onReset(fallback)}
            data-testid={`setting-reset-${setting}`}
          >
            <RotateCcw size={12} aria-hidden />
            {t("settingsUi.defaults.reset")}
          </button>
        </Tooltip>
      ) : null}
    </span>
  );
}
