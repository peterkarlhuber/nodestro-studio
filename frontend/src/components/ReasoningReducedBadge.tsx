// A step whose agent answered with less than it was configured for, said openly on the run: without the long
// thinking phase because of the CPU saving mode (local_reasoning "auto" on a computer without a GPU) or because its
// thinking filled the whole answer limit ("output_limit": the runtime asked once more without thinking), and an
// answer written at the tool-round limit (limits_handled "tool_rounds"). Nothing is reduced silently.

import { Gauge, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Tooltip } from "./Tooltip";
import { Badge } from "./ui";

export function ReasoningReducedBadge({ reason }: { reason: string | null | undefined }) {
  const { t } = useTranslation();
  if (!reason) return null;
  const outputLimit = reason === "output_limit";
  return (
    <Tooltip
      content={t(outputLimit ? "localModels.reasoning.badgeOutputLimitTip" : "localModels.reasoning.badgeTip")}
      doc={outputLimit ? "agenten#limits" : "einstellungen#lokale-hardware"}
    >
      <span className="has-tip" tabIndex={0} data-testid="reasoning-reduced" data-reason={reason}>
        <Badge tone="idle" icon={Gauge}>
          {t(outputLimit ? "localModels.reasoning.badgeOutputLimit" : "localModels.reasoning.badge")}
        </Badge>
      </span>
    </Tooltip>
  );
}

/** The agent answered at its tool-round limit instead of calling more tools (limits_handled "tool_rounds"). */
export function ToolRoundsBadge({ limits }: { limits: string[] | null | undefined }) {
  const { t } = useTranslation();
  if (!limits?.includes("tool_rounds")) return null;
  return (
    <Tooltip content={t("localModels.reasoning.badgeToolRoundsTip")} doc="agenten#limits">
      <span className="has-tip" tabIndex={0} data-testid="tool-rounds-limit">
        <Badge tone="idle" icon={Wrench}>
          {t("localModels.reasoning.badgeToolRounds")}
        </Badge>
      </span>
    </Tooltip>
  );
}
