import { useEffect } from "react";

import { type ContextOffer, useAssistant } from "./store";

/**
 * Offer an object of the current view as chat context (shown as a suggestion in the panel).
 * Nothing is sent: the user decides in the panel. The offer disappears with the view.
 */
export function useContextOffer(key: string, offer: ContextOffer | null): void {
  const signature = offer ? `${offer.kind}|${offer.refId}|${offer.label}|${offer.dirty ? 1 : 0}|${offer.draftOnly ? 1 : 0}` : "";
  useEffect(() => {
    useAssistant.getState().offer(key, offer);
    // The draft getter reads the editor when called; only the visible parts decide.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, signature]);
  useEffect(() => () => useAssistant.getState().offer(key, null), [key]);
}
