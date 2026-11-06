// "Reasoning display": how the reasoning of models is shown while they work (a preference of this browser) and
// whether the workspace asks OpenAI and Gemini for reasoning summaries (a workspace setting, administrators only).
// Showing and enabling are separate: whether a model reasons is the agent's effort and thinking options.

import { Brain } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Settings, SettingsUpdate } from "../api/types";
import { ThinkingDisplayPicker } from "../components/ReasoningView";
import { DocLink, Toggle } from "../components/ui";
import { useThinkingDisplay } from "../lib/thinkingDisplay";
import { DefaultMark } from "./SettingsDefaults";

export function ReasoningDisplayPanel({
  settings,
  admin,
  onSave,
}: {
  settings: Settings;
  admin: boolean;
  onSave: (change: SettingsUpdate) => void;
}) {
  const { t } = useTranslation();
  const { global, setChoice } = useThinkingDisplay();
  return (
    <section className="panel stack" aria-labelledby="settings-reasoning" data-testid="settings-reasoning">
      <h2 className="panel__title" id="settings-reasoning">
        <Brain size={15} aria-hidden /> {t("reasoning.settings.title")}
      </h2>
      <p className="muted small">
        {t("reasoning.settings.intro")} <DocLink to="einstellungen#denken-anzeige" />
      </p>
      <div className="stack-sm">
        <ThinkingDisplayPicker value={global} onChange={setChoice} withDefault={false} label={t("reasoning.settings.display")} testId="settings-thinking-display" />
        <p className="muted small">{t("reasoning.settings.displayHint")}</p>
      </div>
      <Toggle
        checked={Boolean(settings.reasoning_summaries)}
        disabled={!admin}
        onChange={(reasoning_summaries) => onSave({ reasoning_summaries })}
        label={t("reasoning.settings.summaries")}
        action={
          <DefaultMark
            setting="reasoning_summaries"
            value={settings.reasoning_summaries}
            label={t("reasoning.settings.summaries")}
            disabled={!admin}
            onReset={(reasoning_summaries) => onSave({ reasoning_summaries })}
          />
        }
        description={admin ? t("reasoning.settings.summariesHint") : `${t("reasoning.settings.summariesHint")} ${t("reasoning.settings.adminOnly")}`}
      />
    </section>
  );
}
