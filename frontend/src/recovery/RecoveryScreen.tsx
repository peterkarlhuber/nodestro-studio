// The repair dialog of recovery mode (TABRION MIG-NOD-9): which database files other users of this computer may
// access, what the repair changes (the old and new mode as the runtime reports them), and the explicit confirmation.
// Nothing changes before the user confirms; on cancel or error nothing else of Nodestro opens.

import { Check, Copy, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { ApiError } from "../api/client";
import { BrandLogo } from "../components/BrandLogo";
import { Button, Callout, Spinner } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { type RecoveryFile, type RepairPlan, type RepairResult, recoveryApi, reloadWhenBack, symbolicMode } from "./api";

type Phase =
  | { kind: "loading" }
  | { kind: "load_failed"; error: unknown }
  | { kind: "plan"; plan: RepairPlan; error?: unknown; changed?: boolean }
  | { kind: "cancelled"; plan: RepairPlan }
  | { kind: "repaired"; result: RepairResult };

/** Why the runtime left a file alone, in the interface language. */
function leftAlone(t: TFunction, reason: string | null): string {
  switch (reason) {
    case "symlink":
      return t("recovery.skipped.symlink");
    case "hard_link":
      return t("recovery.skipped.hard_link");
    case "other_owner":
      return t("recovery.skipped.other_owner");
    case "not_a_file":
      return t("recovery.skipped.not_a_file");
    case "changed_during_repair":
      return t("recovery.skipped.changed_during_repair");
    default:
      return t("recovery.skipped.other");
  }
}

function Mode({ mode }: { mode: string | null }) {
  if (!mode) return <span className="muted">–</span>;
  return (
    <span className="recovery__mode">
      <code>{symbolicMode(mode)}</code> <span className="muted small">({mode})</span>
    </span>
  );
}

function FileRow({ file }: { file: RecoveryFile }) {
  const { t } = useTranslation();
  let after: ReactNode;
  if (file.status === "not_confirmed" || file.status === "changed") after = <Mode mode={file.new_mode} />;
  else if (file.status === "unchanged") after = <span className="muted">{t("recovery.unchanged")}</span>;
  else if (file.status === "skipped")
    after = (
      <span className="recovery__left-alone">{leftAlone(t, file.reason)}</span>
    );
  else after = <span className="recovery__left-alone">{t("recovery.failed", { reason: file.reason ?? "" })}</span>;
  return (
    <tr data-status={file.status} data-file={file.name}>
      <td>
        <code title={file.path}>{file.name}</code>
      </td>
      <td>
        <Mode mode={file.old_mode} />
      </td>
      <td>{after}</td>
    </tr>
  );
}

function FileTable({ files }: { files: RecoveryFile[] }) {
  const { t } = useTranslation();
  return (
    <table className="recovery__files" data-testid="recovery-files">
      <thead>
        <tr>
          <th scope="col">{t("recovery.colFile")}</th>
          <th scope="col">{t("recovery.colNow")}</th>
          <th scope="col">{t("recovery.colAfter")}</th>
        </tr>
      </thead>
      <tbody>
        {files.map((file) => (
          <FileRow key={file.name} file={file} />
        ))}
      </tbody>
    </table>
  );
}

/** The manual alternative: the runtime's chmod command for these files, quoted for a shell. */
export function ManualCommand({ command }: { command: string | null | undefined }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  if (!command) return null;
  const copy = () => {
    void navigator.clipboard?.writeText(command).then(
      () => setCopied(true),
      () => undefined,
    );
  };
  return (
    <div className="recovery__manual stack-sm" data-testid="recovery-manual">
      <span className="small muted">{t("recovery.manual")}</span>
      <div className="recovery__command">
        <code>{command}</code>
        <Button size="sm" variant="ghost" icon={copied ? Check : Copy} onClick={copy}>
          {t("recovery.copy")}
        </Button>
      </div>
    </div>
  );
}

function problemFiles(error: unknown): RecoveryFile[] {
  if (!(error instanceof ApiError) || !Array.isArray(error.params.files)) return [];
  return error.params.files as RecoveryFile[];
}

function problemCommand(error: unknown): string | null {
  return error instanceof ApiError && typeof error.params.command === "string" && error.params.command
    ? error.params.command
    : null;
}

export function RecoveryScreen() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (changed = false) => {
    setConfirmed(false);
    try {
      setPhase({ kind: "plan", plan: await recoveryApi.plan(), changed });
    } catch (error) {
      setPhase({ kind: "load_failed", error });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (phase.kind === "repaired") return reloadWhenBack("recovery");
  }, [phase.kind]);

  const repair = async (plan: RepairPlan) => {
    setBusy(true);
    try {
      setPhase({ kind: "repaired", result: await recoveryApi.repair(plan.plan) });
    } catch (error) {
      if (error instanceof ApiError && error.code === "recovery.plan_changed") await load(true);
      else setPhase({ kind: "plan", plan, error });
    } finally {
      setBusy(false);
    }
  };

  let body: ReactNode;
  if (phase.kind === "loading") body = <Spinner label={t("recovery.loading")} />;
  else if (phase.kind === "load_failed")
    body = (
      <>
        <Callout tone="danger">
          {t("recovery.loadFailed")} <ErrorText error={phase.error} compact />
        </Callout>
        <div className="recovery__actions">
          <Button icon={RefreshCw} onClick={() => void load()}>
            {t("recovery.retry")}
          </Button>
        </div>
      </>
    );
  else if (phase.kind === "repaired")
    body = (
      <>
        <Callout tone="brand">
          <span data-testid="recovery-done">{t("recovery.repaired")}</span>
        </Callout>
        <FileTable files={phase.result.files} />
        <Spinner label={t("recovery.restarting")} />
      </>
    );
  else if (phase.kind === "cancelled")
    body = (
      <>
        <Callout tone="warning">
          <span data-testid="recovery-cancelled">
            {t(phase.plan.origin === "requested" ? "recovery.cancelledRequested" : "recovery.cancelled")}
          </span>
        </Callout>
        <ManualCommand command={phase.plan.command} />
        <div className="recovery__actions">
          <Button icon={ShieldCheck} onClick={() => void load()}>
            {t("recovery.showAgain")}
          </Button>
        </div>
      </>
    );
  else {
    const { plan, error, changed } = phase;
    const failedFiles = problemFiles(error);
    body = (
      <>
        <p className="recovery__lead">{t(plan.origin === "requested" ? "recovery.requested" : "recovery.refused")}</p>
        {changed ? <Callout tone="warning">{t("recovery.planChanged")}</Callout> : null}
        <FileTable files={failedFiles.length ? failedFiles : plan.files} />
        {error ? (
          <Callout tone="danger">
            <span data-testid="recovery-error">
              {error instanceof ApiError && error.code === "recovery.repair_failed" ? (
                t("recovery.failedTitle")
              ) : (
                <ErrorText error={error} compact />
              )}
            </span>
          </Callout>
        ) : null}
        {plan.repairable && !error ? (
          <>
            <p className="small">{t("recovery.what")}</p>
            <label className="checkbox recovery__confirm">
              <input
                type="checkbox"
                checked={confirmed}
                data-testid="recovery-confirm"
                onChange={(event) => setConfirmed(event.target.checked)}
              />{" "}
              {t("recovery.confirm")}
            </label>
          </>
        ) : !plan.repairable ? (
          <Callout tone="warning">{t("recovery.notRepairable")}</Callout>
        ) : null}
        <ManualCommand command={problemCommand(error) ?? plan.command} />
        <div className="recovery__actions">
          <Button variant="ghost" onClick={() => setPhase({ kind: "cancelled", plan })} disabled={busy}>
            {t("recovery.cancel")}
          </Button>
          {error ? (
            <Button icon={RefreshCw} onClick={() => void load()} disabled={busy}>
              {t("recovery.retry")}
            </Button>
          ) : plan.repairable ? (
            <Button
              variant="primary"
              icon={LockKeyhole}
              busy={busy}
              disabled={!confirmed}
              data-testid="recovery-repair"
              onClick={() => void repair(plan)}
            >
              {t("recovery.repair")}
            </Button>
          ) : null}
        </div>
      </>
    );
  }

  return (
    <main className="recovery" data-testid="recovery">
      <section className="recovery__card stack" role="dialog" aria-modal="true" aria-labelledby="recovery-title">
        <BrandLogo height={26} />
        <h1 id="recovery-title" className="recovery__title">
          <ShieldCheck size={20} aria-hidden /> {t("recovery.title")}
        </h1>
        {body}
      </section>
    </main>
  );
}
