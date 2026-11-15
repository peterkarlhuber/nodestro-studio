// The mark of the draft tools (NAL-A4): they prepare an e-mail or a webhook payload and never send it.

import { MailX } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "./ui";

export function NoSendBadge() {
  const { t } = useTranslation();
  return (
    <span className="no-send-badge" title={t("drafts.noSendHint")}>
      <Badge tone="success" icon={MailX}>
        {t("drafts.noSend")}
      </Badge>
    </span>
  );
}
