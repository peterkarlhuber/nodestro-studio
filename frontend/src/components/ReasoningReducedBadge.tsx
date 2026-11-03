// A step whose agent answered without the long thinking phase because of the CPU saving mode (local_reasoning
// "auto" on a computer without a GPU). The run says so; nothing is reduced silently.

import { Gauge } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Tooltip } from "./Tooltip";
import { Badge } from "./ui";

export function ReasoningReducedBadge({ reason }: { reason: string | null | undefined }) {
  const { t } = useTranslation();
  if (!reason) return null;
  return (
    <Tooltip content={t("localModels.reasoning.badgeTip")} doc="einstellungen#lokale-hardware">
      <span className="has-tip" tabIndex={0} data-testid="reasoning-reduced">
        <Badge tone="idle" icon={Gauge}>
          {t("localModels.reasoning.badge")}
        </Badge>
      </span>
    </Tooltip>
  );
}
