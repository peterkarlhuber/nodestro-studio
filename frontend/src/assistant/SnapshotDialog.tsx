import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { Callout, Modal, Spinner } from "../components/ui";
import { ErrorText, ProblemText } from "../lib/errors";
import { formatDate, formatNumber } from "../lib/format";

/** Exactly what the assistant received of an object: the stored snapshot (secrets already masked). */
export function SnapshotDialog({
  conversationId,
  snapshotId,
  onClose,
}: {
  conversationId: string;
  snapshotId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const snapshot = useQuery({
    queryKey: ["assistant", "snapshot", conversationId, snapshotId],
    queryFn: () => api.snapshot(conversationId, snapshotId),
    staleTime: Infinity,
  });
  const data = snapshot.data;
  return (
    <Modal title={t("assistant.snapshot.title", { name: data?.label ?? "" })} open onClose={onClose} wide>
      {snapshot.isLoading ? <Spinner /> : null}
      {snapshot.error ? (
        <Callout tone="danger">
          <ErrorText error={snapshot.error} />
        </Callout>
      ) : null}
      {data ? (
        <div className="stack-sm">
          <p className="muted small">
            {t("assistant.snapshot.meta", {
              kind: t(`assistant.kinds.${data.kind}`),
              version: data.variant === "draft" ? t("assistant.attachments.draftTag") : (data.version ?? "–"),
              time: formatDate(data.captured_at),
              size: formatNumber(data.chars),
            })}
          </p>
          <p className="small">{t("assistant.snapshot.text")}</p>
          {data.notes.map((note, index) => (
            <Callout key={index} tone={note.code === "assistant.secrets_masked" ? "brand" : "warning"}>
              <ProblemText item={note} compact />
            </Callout>
          ))}
          <pre className="code-block snapshot-data">{JSON.stringify(data.data, null, 2)}</pre>
        </div>
      ) : null}
    </Modal>
  );
}
