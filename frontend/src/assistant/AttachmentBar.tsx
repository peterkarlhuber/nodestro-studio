import { AlertTriangle, Lightbulb, Plus, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { AttachRequest, Attachment, Conversation } from "../api/types";
import { Button, Hint, IconButton } from "../components/ui";
import { KIND_ICON } from "./MessageView";
import { SnapshotDialog } from "./SnapshotDialog";
import { type ContextOffer, draftFingerprint, offerKey, useAssistant } from "./store";

/** The request for an offer; ``draft`` takes the editor's unsaved state. */
export function offerRequest(offer: ContextOffer, draft: boolean): AttachRequest {
  return {
    kind: offer.kind,
    ref_id: offer.refId,
    variant: draft ? "draft" : "saved",
    workflow: draft && offer.draft ? offer.draft() : null,
  };
}

/** Suggestions of the current view: nothing is sent until the user adds one. */
function Suggestions({
  attachments,
  onAttach,
  busy,
}: {
  attachments: Attachment[];
  onAttach: (request: AttachRequest) => void;
  busy: boolean;
}) {
  const { t } = useTranslation();
  const offers = useAssistant((state) => state.offers);
  const dismissed = useAssistant((state) => state.dismissed);
  const attached = new Map(attachments.map((item) => [offerKey({ kind: item.kind, refId: item.ref_id }), item]));
  // An attached saved version is offered again while the editor has unsaved changes, so the
  // user can switch to the draft; everything else that is attached is not suggested.
  const draftOnly = (offer: ContextOffer) =>
    Boolean(offer.dirty && offer.draft) && (Boolean(offer.draftOnly) || attached.get(offerKey(offer))?.variant === "saved");
  const shown = Object.values(offers).filter(
    (offer, index, all) =>
      (!attached.has(offerKey(offer)) || draftOnly(offer)) &&
      !dismissed.includes(offerKey(offer)) &&
      all.findIndex((other) => offerKey(other) === offerKey(offer)) === index,
  );
  if (!shown.length) return null;
  return (
    <div className="chat-suggestions">
      {shown.map((offer) => {
        const Icon = KIND_ICON[offer.kind];
        return (
          <div key={offerKey(offer)} className="chat-suggestion" data-testid="assistant-suggestion">
            <span className="chat-suggestion__tag">
              <Lightbulb size={11} aria-hidden /> {t("assistant.suggest.tag")}
            </span>
            <span className="chat-suggestion__text">
              <Icon size={12} aria-hidden /> {t(`assistant.suggest.current.${offer.kind}`)}: <strong>{offer.label}</strong>
              {offer.dirty ? <span className="chat-tag chat-tag--warning">{t("assistant.suggest.unsaved")}</span> : null}
            </span>
            <span className="chat-suggestion__actions">
              {draftOnly(offer) ? null : (
                <Hint id="assistant.suggestion">
                  <Button size="sm" icon={Plus} busy={busy} onClick={() => onAttach(offerRequest(offer, false))} data-testid="suggestion-add">
                    {offer.dirty ? t("assistant.suggest.addSaved") : t("assistant.suggest.add")}
                  </Button>
                </Hint>
              )}
              {offer.dirty && offer.draft ? (
                <Hint id="assistant.draft">
                  <Button size="sm" icon={Plus} busy={busy} onClick={() => onAttach(offerRequest(offer, true))} data-testid="suggestion-add-draft">
                    {t("assistant.suggest.addDraft")}
                  </Button>
                </Hint>
              ) : null}
              <IconButton icon={X} label={t("assistant.suggest.ignore")} onClick={() => useAssistant.getState().dismiss(offer)} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

function AttachmentChip({
  attachment,
  conversationId,
  onRefresh,
  onDetach,
}: {
  attachment: Attachment;
  conversationId: string;
  onRefresh: (attachment: Attachment, draft: boolean) => void;
  onDetach: (attachment: Attachment) => void;
}) {
  const { t } = useTranslation();
  const [details, setDetails] = useState(false);
  const offers = useAssistant((state) => state.offers);
  const remembered = useAssistant((state) => state.drafts[attachment.id]);
  const editor = Object.values(offers).find((offer) => offer.kind === attachment.kind && offer.refId === attachment.ref_id && offer.draft);
  const Icon = KIND_ICON[attachment.kind];
  // A draft is compared with the editor here; saved objects are compared by the server.
  const draftChanged =
    attachment.variant === "draft" && editor?.draft && remembered !== undefined && draftFingerprint(editor.draft()) !== remembered;
  const changed = attachment.state === "changed" || draftChanged;
  const missing = attachment.state === "missing";
  return (
    <span className={`chat-attachment ${changed ? "chat-attachment--changed" : ""} ${missing ? "chat-attachment--missing" : ""}`} data-testid="assistant-attachment" data-state={attachment.state}>
      <button type="button" className="chat-attachment__label" onClick={() => setDetails(true)} title={t("assistant.message.showSent")}>
        <Icon size={12} aria-hidden /> {attachment.label}
        {attachment.version && attachment.variant === "saved" ? <span className="muted"> {attachment.version}</span> : null}
        {attachment.variant === "draft" ? <span className="chat-tag">{t("assistant.attachments.draftTag")}</span> : null}
        {attachment.truncated ? <span className="chat-tag chat-tag--warning">{t("assistant.attachments.partialTag")}</span> : null}
      </button>
      {changed ? (
        <span className="chat-tag chat-tag--warning">
          <AlertTriangle size={10} aria-hidden /> {t("assistant.attachments.changed")}
        </span>
      ) : null}
      {missing ? <span className="chat-tag chat-tag--danger">{t("assistant.attachments.missing")}</span> : null}
      {(changed || attachment.variant === "draft") && !missing ? (
        <Hint id="assistant.refresh">
          <button
            type="button"
            className="chat-attachment__action"
            aria-label={t("assistant.attachments.refresh")}
            onClick={() => onRefresh(attachment, Boolean(editor?.dirty && attachment.variant === "draft"))}
            data-testid="attachment-refresh"
          >
            <RefreshCw size={11} aria-hidden />
          </button>
        </Hint>
      ) : null}
      <button
        type="button"
        className="chat-attachment__action"
        aria-label={t("assistant.attachments.remove", { name: attachment.label })}
        onClick={() => onDetach(attachment)}
        data-testid="attachment-remove"
      >
        <X size={11} aria-hidden />
      </button>
      {details ? <SnapshotDialog conversationId={conversationId} snapshotId={attachment.snapshot_id} onClose={() => setDetails(false)} /> : null}
    </span>
  );
}

/** Suggested objects (dashed, not sent) above the attached ones (sent with the next message). */
export function AttachmentBar({
  conversation,
  busy,
  onAttach,
  onRefresh,
  onDetach,
}: {
  conversation: Conversation | undefined;
  busy: boolean;
  onAttach: (request: AttachRequest) => void;
  onRefresh: (attachment: Attachment, draft: boolean) => void;
  onDetach: (attachment: Attachment) => void;
}) {
  const { t } = useTranslation();
  const attachments = conversation?.attachment_states ?? [];
  return (
    <div className="chat-attachments">
      <Suggestions attachments={attachments} onAttach={onAttach} busy={busy} />
      {attachments.length && conversation ? (
        <div className="chat-attachments__list" aria-label={t("assistant.attachments.label")}>
          <span className="muted small">{t("assistant.attachments.label")}</span>
          {attachments.map((attachment) => (
            <AttachmentChip
              key={attachment.id}
              attachment={attachment}
              conversationId={conversation.id}
              onRefresh={onRefresh}
              onDetach={onDetach}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
