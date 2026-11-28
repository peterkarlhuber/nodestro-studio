// The mark of content from a granted source (N-08, content provenance): a run that read a granted folder, knowledge,
// memory or an attached file (`Run.granted_content`), and a conversation that holds such content
// (`provenance: "granted_content"`). From then on every request to a cloud model and every tool that reaches outside
// this computer needs a permission; the runtime asks or refuses (`access.missing_grant`). The studio only shows the
// mark: in words and with a symbol, never by colour alone. The mark is never set while the feature is off.

import { Tooltip } from "@nodestro/ui-core";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useAccess } from "../api/access";
import { Badge, Callout } from "./ui";

export type MarkedKind = "run" | "conversation";

/** A short badge for headers; hovering or focusing it explains the mark. */
export function GrantedContentBadge({ kind }: { kind: MarkedKind }) {
  const { t } = useTranslation();
  return (
    <Tooltip content={t(`runs.grantedContent.${kind}`)}>
      <span className="has-tip granted-content-badge" tabIndex={0} data-testid={`granted-content-badge-${kind}`}>
        <Badge tone="warning" icon={ShieldAlert}>
          {t("runs.grantedContent.badge")}
        </Badge>
      </span>
    </Tooltip>
  );
}

/** The notice under a header: what the mark means and where permissions are given. */
export function GrantedContentNotice({ kind }: { kind: MarkedKind }) {
  const { t } = useTranslation();
  const admin = useAccess().can("admin");
  return (
    <Callout tone="warning">
      <span data-testid={`granted-content-notice-${kind}`}>
        <strong>{t("runs.grantedContent.title")}</strong> {t(`runs.grantedContent.${kind}`)} {t("runs.grantedContent.egress")}
        {admin ? (
          <>
            {" "}
            <Link to="/approvals/access">{t("runs.grantedContent.permissions")}</Link>
          </>
        ) : null}
      </span>
    </Callout>
  );
}
