// The diagnosis' way to the repair of the database's permissions (TABRION MIG-NOD-9). The workspace is open here, so
// nothing is repaired in this process: after a confirmation the backend stops cleanly and the desktop app starts it in
// recovery mode, where RecoveryScreen shows the change and asks for the repair itself. Disabled while runs are active.

import { useMutation } from "@tanstack/react-query";
import { LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { DiagnosticCheck } from "../api/types";
import { Button, Callout, Modal, Spinner } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { recoveryApi, reloadWhenBack } from "./api";
import { ManualCommand } from "./RecoveryScreen";

export function DatabasePermissionsAction({ check }: { check: DiagnosticCheck }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const restart = useMutation({ mutationFn: recoveryApi.restartIntoRecovery });
  useEffect(() => {
    if (restart.isSuccess) return reloadWhenBack("normal");
  }, [restart.isSuccess]);
  const command = typeof check.params.command === "string" ? check.params.command : null;
  if (check.code !== "not_private") return <ManualCommand command={command} />;
  const busy = check.params.busy === true;
  return (
    <div className="stack-sm" data-testid="database-permissions-action">
      {check.params.restart === true ? (
        <div className="row-gap">
          <Button size="sm" icon={LockKeyhole} disabled={busy} onClick={() => setOpen(true)} data-testid="database-permissions-repair">
            {t("diagnostics.databasePermissions.repair")}
          </Button>
          {busy ? <span className="small muted">{t("diagnostics.databasePermissions.busy")}</span> : null}
        </div>
      ) : null}
      <ManualCommand command={command} />
      <Modal
        title={t("diagnostics.databasePermissions.restartTitle")}
        open={open}
        onClose={() => (restart.isPending || restart.isSuccess ? undefined : setOpen(false))}
        footer={
          restart.isSuccess ? null : (
            <>
              <Button variant="ghost" data-autofocus onClick={() => setOpen(false)} disabled={restart.isPending}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                busy={restart.isPending}
                onClick={() => restart.mutate()}
                data-testid="database-permissions-restart"
              >
                {t("diagnostics.databasePermissions.restartNow")}
              </Button>
            </>
          )
        }
      >
        <div className="stack-sm">
          {restart.isSuccess ? (
            <Spinner label={t("diagnostics.databasePermissions.restarting")} />
          ) : (
            <p>{t("diagnostics.databasePermissions.restartText")}</p>
          )}
          {restart.error ? (
            <Callout tone="danger">
              <ErrorText error={restart.error} />
            </Callout>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
