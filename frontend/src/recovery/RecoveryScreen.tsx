// The repair dialog of recovery mode (TABRION MIG-NOD-9): which database files other users of this computer may
// access, what the repair changes (the old and new mode as the runtime reports them), and the explicit confirmation.
// Nothing changes before the user confirms; on cancel or error nothing else of Nodestro opens (except a cancel when
// the user asked for the repair in the diagnosis: then the regular studio starts again, unchanged).

import { Check, Copy, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { ApiError } from "../api/client";
import { BrandLogo } from "../components/BrandLogo";
import { Button, Callout, Spinner } from "../components/ui";
import { ErrorText } from "../lib/errors";
import {
  GENERIC_COMMAND,
  type RecoveryFile,
  type RepairPlan,
  type RepairResult,
  recoveryApi,
  reloadWhenBack,
  symbolicMode,
} from "./api";

type Phase =
  | { kind: "loading" }
  | { kind: "load_failed"; error: unknown }
  | { kind: "plan"; plan: RepairPlan; error?: unknown; changed?: boolean }
  | { kind: "cancelled"; plan: RepairPlan }
  | { kind: "done"; result: RepairResult; plan: RepairPlan };

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
    case "other_file_refused":
      return t("recovery.skipped.other_file_refused");
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
  switch (file.status) {
    case "not_confirmed":
    case "changed":
      after = <Mode mode={file.new_mode} />;
      break;
    case "unchanged":
      after = <span className="muted">{t("recovery.unchanged")}</span>;
      break;
    case "rolled_back":
    case "restored":
      after = <span className="muted">{t("recovery.setBack")}</span>;
      break;
    case "rollback_failed":
      after = (
        <span className="recovery__left-alone">
          {t("recovery.notSetBack", { mode: file.new_mode ?? "", reason: file.reason ?? "" })}
        </span>
      );
      break;
    case "skipped":
      after = <span className="recovery__left-alone">{leftAlone(t, file.reason)}</span>;
      break;
    default:
      after = <span className="recovery__left-alone">{t("recovery.failed", { reason: file.reason ?? "" })}</span>;
  }
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
export function ManualCommand({ command, label }: { command: string | null | undefined; label?: string }) {
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
      <span className="small muted">{label ?? t("recovery.manual")}</span>
      <div className="recovery__command">
        <code>{command}</code>
        <Button size="sm" variant="ghost" icon={copied ? Check : Copy} onClick={copy}>
          {t("recovery.copy")}
        </Button>
      </div>
    </div>
  );
}

/** A status that screen readers announce when it appears. */
function Status({ tone, children }: { tone: "info" | "warning" | "brand"; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite">
      <Callout tone={tone}>{children}</Callout>
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

/** What a failed repair did: always "nothing was changed", unless a mode could not be set back (named). */
function FailedRepair({ error }: { error: ApiError }) {
  const { t } = useTranslation();
  const notRestored = Array.isArray(error.params.not_restored) ? (error.params.not_restored as string[]) : [];
  if (notRestored.length) return <>{t("recovery.failedNotRestored", { files: notRestored.join(", ") })}</>;
  if (error.params.reason === "does_not_open")
    return <>{t("recovery.failedDoesNotOpen", { cause: String(error.params.cause ?? "") })}</>;
  return <>{t("recovery.failedTitle")}</>;
}

export function RecoveryScreen() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

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
    if (phase.kind === "done") return reloadWhenBack("recovery");
  }, [phase.kind]);

  const repair = async (plan: RepairPlan) => {
    setBusy(true);
    try {
      setPhase({ kind: "done", result: await recoveryApi.repair(plan.plan), plan });
    } catch (error) {
      if (error instanceof ApiError && error.code === "recovery.plan_changed") await load(true);
      else setPhase({ kind: "plan", plan, error });
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (plan: RepairPlan) => {
    if (plan.origin !== "requested") {
      setPhase({ kind: "cancelled", plan });
      return;
    }
    setBusy(true);
    try {
      setPhase({ kind: "done", result: await recoveryApi.leave(), plan });
    } catch (error) {
      setPhase({ kind: "plan", plan, error });
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
        <ManualCommand command={GENERIC_COMMAND} label={t("recovery.genericManual")} />
        <div className="recovery__actions">
          <Button icon={RefreshCw} onClick={() => void load()}>
            {t("recovery.retry")}
          </Button>
        </div>
      </>
    );
  else if (phase.kind === "done") {
    const { outcome, files } = phase.result;
    body = (
      <>
        <Status tone={outcome === "returned" ? "info" : "brand"}>
          <span data-testid="recovery-done">
            {outcome === "returned"
              ? t("recovery.returning")
              : outcome === "already_private"
                ? t("recovery.alreadyPrivateRestarting")
                : t("recovery.repaired")}
          </span>
        </Status>
        {outcome === "repaired" ? <FileTable files={files} /> : null}
        <Spinner label={t("recovery.restarting")} />
      </>
    );
  } else if (phase.kind === "cancelled")
    body = (
      <>
        <Status tone="warning">
          <span data-testid="recovery-cancelled">{t("recovery.cancelled")}</span>
        </Status>
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
    const isPrivate = Boolean(plan.private);
    body = (
      <>
        <p className="recovery__lead">{t(plan.origin === "requested" ? "recovery.requested" : "recovery.refused")}</p>
        {changed ? <Status tone="warning">{t("recovery.planChanged")}</Status> : null}
        <FileTable files={failedFiles.length ? failedFiles : plan.files} />
        {error ? (
          <Callout tone="danger">
            <span data-testid="recovery-error">
              {error instanceof ApiError && error.code === "recovery.repair_failed" ? (
                <FailedRepair error={error} />
              ) : (
                <ErrorText error={error} compact />
              )}
            </span>
          </Callout>
        ) : null}
        {error ? null : isPrivate ? (
          <Status tone="info">
            <span data-testid="recovery-private">{t("recovery.alreadyPrivate")}</span>
          </Status>
        ) : plan.repairable ? (
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
        ) : (
          <Status tone="warning">{t("recovery.notRepairable")}</Status>
        )}
        {isPrivate && !error ? null : <ManualCommand command={problemCommand(error) ?? plan.command} />}
        <div className="recovery__actions">
          <Button
            variant="ghost"
            onClick={() => void cancel(plan)}
            disabled={busy}
            data-testid="recovery-cancel"
          >
            {t("recovery.cancel")}
          </Button>
          {error ? (
            <Button icon={RefreshCw} onClick={() => void load()} disabled={busy}>
              {t("recovery.retry")}
            </Button>
          ) : isPrivate ? (
            <Button
              variant="primary"
              icon={ShieldCheck}
              busy={busy}
              data-testid="recovery-continue"
              onClick={() => void repair(plan)}
            >
              {t("recovery.continue")}
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
      <section className="recovery__card stack" aria-labelledby="recovery-title">
        <BrandLogo height={26} />
        <h1 id="recovery-title" className="recovery__title" tabIndex={-1} ref={heading}>
          <ShieldCheck size={20} aria-hidden /> {t("recovery.title")}
        </h1>
        {body}
      </section>
    </main>
  );
}
