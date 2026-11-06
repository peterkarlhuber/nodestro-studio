// What the stream of an agent's model transmits of its reasoning in this workspace, under the agent's thinking
// options: the declaration of GET /api/models/capabilities (``reasoning``), for every provider.

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { ReasoningStreamInfo } from "../api/types";

/** The key of the note for a declaration. */
export function reasoningNoteKey(info: ReasoningStreamInfo): string {
  if (info.text === "summary") {
    const onRequest = info.request_option !== null && info.request_option !== "thinking_display";
    return onRequest && info.requested === false ? "reasoning.model.summaryNotRequested" : "reasoning.model.summary";
  }
  return `reasoning.model.${info.text}`;
}

export function ModelReasoningNote({ model }: { model: string }) {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: keys.modelCapabilities(model),
    queryFn: () => api.modelCapabilities(model),
    enabled: model.includes(":"),
    staleTime: 60_000,
    retry: false,
  });
  const info = query.data?.reasoning;
  if (!info) return null;
  return (
    <p className="field__hint" data-testid="model-reasoning" data-text={info.text}>
      {t(reasoningNoteKey(info))}
    </p>
  );
}
