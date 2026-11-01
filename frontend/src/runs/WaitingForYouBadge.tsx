import { Hand } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Tooltip } from "../components/ui";

/** The badge of a step or run that waits for a person to decide one of its tool calls. */
export function WaitingForYouBadge() {
  const { t } = useTranslation();
  return (
    <Tooltip content={t("runs.waitingForYou.description")}>
      <span className="nd-badge nd-badge--warning" data-status="awaiting_tool_approval">
        <Hand size={11} aria-hidden />
        {t("runs.waitingForYou.label")}
      </span>
    </Tooltip>
  );
}
