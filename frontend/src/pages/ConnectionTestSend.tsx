// The test send of a mail server or webhook connection (NAL-A4). An administrator sends one fixed test message, to
// the mail connection's own test address or to the webhook's address, after a confirmation that names exactly where
// it goes. The runtime allows five per connection and hour and records each attempt with the person who sent it.

import { Button, HelpTip } from "@nodestro/ui-core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { type Connection, connectionKeys, connectionsApi } from "../api/connections";
import { Callout, Modal } from "../components/ui";
import { ErrorText, ProblemText } from "../lib/errors";

/** Where a test of this connection goes: the smtp test address or the webhook address (null: none set). */
export function testTarget(connection: Connection): string | null {
  const value = connection.type === "smtp" ? connection.settings.test_address : connection.settings.url;
  return typeof value === "string" && value.trim() ? value : null;
}

export function TestSendButton({ connection }: { connection: Connection }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <span className="row-gap">
        <Button icon={<Send size={15} />} onClick={() => setOpen(true)}>
          {t("drafts.testSend.button")}
        </Button>
        <HelpTip id="tools.testSend" topic={t("drafts.testSend.button")} />
      </span>
      {open ? <TestSendDialog connection={connection} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function TestSendDialog({ connection, onClose }: { connection: Connection; onClose: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const target = testTarget(connection);
  const mail = connection.type === "smtp";
  const send = useMutation({
    mutationFn: () => connectionsApi.testSend(connection.id),
    // Each attempt is recorded in the connection's changes, sent or not.
    onSettled: () => void queryClient.invalidateQueries({ queryKey: connectionKeys.all }),
  });
  const result = send.data;
  return (
    <Modal
      title={t("drafts.testSend.title", { name: connection.name })}
      open
      onClose={onClose}
      footer={
        result ? (
          <Button onClick={onClose}>{t("drafts.testSend.close")}</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" icon={<Send size={15} />} busy={send.isPending} disabled={!target} onClick={() => send.mutate()}>
              {t("drafts.testSend.confirm")}
            </Button>
          </>
        )
      }
    >
      <div className="stack test-send" data-testid="test-send">
        {target ? (
          <>
            <p>
              {mail
                ? t("drafts.testSend.toAddress")
                : t("drafts.testSend.toUrl", { method: String(connection.settings.method ?? "POST") })}
            </p>
            <p className="test-send__target">
              <strong>{target}</strong>
            </p>
          </>
        ) : (
          <Callout tone="warning">{t("drafts.testSend.noAddress")}</Callout>
        )}
        <p>{t("drafts.testSend.byYou")}</p>
        <p className="muted small">{t("drafts.testSend.limit")}</p>
        {result && !result.ok ? (
          <Callout tone="danger">
            <ProblemText item={{ code: "connection.send_failed", params: {} }} compact />
          </Callout>
        ) : null}
        {result?.ok ? (
          <Callout tone="info">
            {typeof result.status === "number" ? t("drafts.testSend.sentStatus", { status: result.status }) : t("drafts.testSend.sent")}
          </Callout>
        ) : null}
        {send.error ? (
          <Callout tone="danger">
            <ErrorText error={send.error} />
          </Callout>
        ) : null}
      </div>
    </Modal>
  );
}
