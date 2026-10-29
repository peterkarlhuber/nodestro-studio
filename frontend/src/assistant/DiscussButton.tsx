import { MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button, Hint, IconButton } from "../components/ui";
import { type ContextOffer, useAssistant } from "./store";

/**
 * "Discuss with assistant": the user's explicit choice to attach this object to the chat.
 * With unsaved editor changes nothing is attached yet; the panel opens and asks whether the
 * saved version or the current draft should go.
 */
export function discussOffer(offer: ContextOffer, paths: string[] = []): void {
  const store = useAssistant.getState();
  if (offer.dirty && offer.draft) store.reveal(offer);
  else store.discuss({ kind: offer.kind, ref_id: offer.refId, variant: "saved", paths });
}

export function DiscussButton({ offer, size }: { offer: ContextOffer | null; size?: "sm" }) {
  const { t } = useTranslation();
  if (!offer) return null;
  return (
    <Hint id="assistant.discuss">
      <Button icon={MessageSquare} variant="ghost" size={size} onClick={() => discussOffer(offer)} data-testid="discuss-assistant">
        {t("assistant.discuss")}
      </Button>
    </Hint>
  );
}

/** The same action as an icon, for compact toolbars (e.g. the agent inspector). */
export function DiscussIcon({ offer, paths, label }: { offer: ContextOffer | null; paths?: string[]; label?: string }) {
  const { t } = useTranslation();
  if (!offer) return null;
  return <IconButton icon={MessageSquare} label={label ?? t("assistant.discuss")} onClick={() => discussOffer(offer, paths)} data-testid="discuss-assistant" />;
}
