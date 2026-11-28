// A draft an agent prepared with draft_email or draft_webhook (NAL-A4): what it contains, never its body, and the
// download. Nothing was sent; a person opens the file and sends it. "Open in mail program" is the same download of
// the .eml file: the browser hands it to the mail program the person chooses.

import { ConfirmIconButton, HelpTip } from "@nodestro/ui-core";
import { Download, Mail, MailX, Trash2, Webhook } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import type { EmailDraftPreview, ResultFile, WebhookDraftPreview } from "../api/types";
import { Badge } from "../components/ui";
import { formatBytes, formatDate } from "../lib/format";

/** The draft preview of a result file a draft tool wrote, or null for every other file. */
export function draftPreview(file: ResultFile): EmailDraftPreview | WebhookDraftPreview | null {
  if (file.source !== "tool" || file.error_code || !file.preview) return null;
  const kind = file.preview.kind;
  if (kind === "email") return file.preview as unknown as EmailDraftPreview;
  if (kind === "webhook") return file.preview as unknown as WebhookDraftPreview;
  return null;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="draft-card__row">
      <dt className="muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function DraftCard({
  file,
  preview,
  onDelete,
}: {
  file: ResultFile;
  preview: EmailDraftPreview | WebhookDraftPreview;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const href = api.resultFileUrl(file.run_id, file.id);
  const email = preview.kind === "email";
  const yesNo = (value: boolean) => t(value ? "drafts.card.yes" : "drafts.card.no");
  const list = (items: string[]) => (items.length ? items.join(", ") : t("drafts.card.none"));
  return (
    <article className="draft-card stack-sm" aria-label={t(email ? "drafts.card.email" : "drafts.card.webhook") + `: ${file.name}`}>
      <div className="draft-card__head">
        {email ? <Mail size={16} aria-hidden /> : <Webhook size={16} aria-hidden />}
        <strong className="draft-card__name">{file.name}</strong>
        <Badge>{t(email ? "drafts.card.email" : "drafts.card.webhook")}</Badge>
        <Badge tone="warning" icon={MailX}>
          {t("drafts.card.notSent")}
        </Badge>
      </div>
      <p className="small">
        {t(email ? "drafts.card.notSentEmail" : "drafts.card.notSentWebhook")} <HelpTip id="files.drafts" topic={t("drafts.card.help")} />
      </p>
      <dl className="draft-card__facts small">
        {preview.kind === "email" ? (
          <>
            <Row label={t("drafts.card.from")}>{preview.from || t("drafts.card.fromUnset")}</Row>
            <Row label={t("drafts.card.to")}>{list(preview.to)}</Row>
            <Row label={t("drafts.card.cc")}>{list(preview.cc)}</Row>
            <Row label={t("drafts.card.subject")}>{preview.subject}</Row>
            <Row label={t("drafts.card.html")}>{yesNo(preview.html)}</Row>
            <Row label={t("drafts.card.attachments")}>
              {preview.attachments.length ? (
                <ul className="draft-card__attachments">
                  {preview.attachments.map((item) => (
                    <li key={item.name}>
                      {item.name} <span className="muted">({formatBytes(item.size)})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                t("drafts.card.none")
              )}
            </Row>
          </>
        ) : (
          <Row label={t("drafts.card.schema")}>{yesNo(preview.schema)}</Row>
        )}
        <Row label={t("drafts.card.size")}>{formatBytes(preview.size ?? file.size)}</Row>
        <Row label={t("drafts.card.created")}>{formatDate(file.created_at)}</Row>
      </dl>
      {email ? <p className="muted small">{t("drafts.card.bodyHidden")}</p> : null}
      <div className="draft-card__actions">
        <a className="ui-button ui-button--secondary ui-button--sm" href={href} download={file.name}>
          <Download size={14} aria-hidden /> {t(email ? "drafts.card.downloadEml" : "drafts.card.downloadJson")}
        </a>
        {email ? (
          <a
            className="ui-button ui-button--ghost ui-button--sm"
            href={href}
            download={file.name}
            title={t("drafts.card.openInMailHint")}
            aria-describedby={`draft-open-${file.id}`}
          >
            <Mail size={14} aria-hidden /> {t("drafts.card.openInMail")}
          </a>
        ) : null}
        <ConfirmIconButton icon={<Trash2 size={16} />} label={t("flow.files.delete", { name: file.name })} onConfirm={onDelete} />
      </div>
      {email ? (
        <p className="muted small" id={`draft-open-${file.id}`}>
          {t("drafts.card.openInMailHint")}
        </p>
      ) : null}
    </article>
  );
}
