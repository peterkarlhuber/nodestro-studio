// Settings panels for keeping an installation healthy: system diagnosis and backup/restore.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Archive, CheckCircle2, Download, Plug, RefreshCw, Upload, XCircle, AlertTriangle } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import type { BackupContents, BackupInfo, DiagnosticCheck, DiagnosticStatus } from "../api/types";
import { toast } from "../components/toast";
import { Badge, Button, Callout, HelpTip, Hint, Modal, Spinner } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { formatBytes, formatDate, formatNumber } from "../lib/format";

const STATUS_ICON = { ok: CheckCircle2, warning: AlertTriangle, error: XCircle };
const STATUS_TONE = { ok: "success", warning: "warning", error: "danger" } as const;

/** Parameters as display values: sizes in bytes become readable sizes. */
function displayParams(params: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...params };
  for (const key of ["size", "free"])
    if (typeof result[key] === "number") result[key] = formatBytes(result[key] as number);
  return result;
}

export function CheckRow({ check }: { check: DiagnosticCheck }) {
  const { t, i18n } = useTranslation();
  const Icon = STATUS_ICON[check.status];
  const params = displayParams(check.params);
  const fixKey = `diagnostics.checks.${check.id}.fix.${check.code}`;
  const fix = i18n.exists(fixKey) ? t(fixKey, params) : "";
  return (
    <li className={`diagnostic diagnostic--${check.status}`} data-check={check.id} data-status={check.status}>
      <Icon size={15} aria-hidden className="diagnostic__icon" />
      <div className="diagnostic__body">
        <strong>{t(`diagnostics.checks.${check.id}.title`)}</strong>{" "}
        <span className="sr-only">{t(`diagnostics.status.${check.status}`)}</span>
        <span>{t(`diagnostics.checks.${check.id}.${check.code}`, params)}</span>
        {fix ? <div className="small diagnostic__fix">{fix}</div> : null}
        {check.status !== "ok" && check.message ? (
          <details className="small">
            <summary>{t("diagnostics.details")}</summary>
            <code className="diagnostic__message">{check.message}</code>
          </details>
        ) : null}
      </div>
    </li>
  );
}

export function DiagnosticsPanel() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const diagnostics = useQuery({ queryKey: ["diagnostics"], queryFn: api.diagnostics, enabled, staleTime: 0 });
  const connection = useMutation({ mutationFn: () => api.checkConnection() });
  const data = diagnostics.data;
  const overall: DiagnosticStatus | null = data?.status ?? null;
  return (
    <section className="panel stack" aria-labelledby="settings-diagnostics" data-testid="diagnostics">
      <h2 className="panel__title" id="settings-diagnostics">
        <Activity size={15} aria-hidden /> {t("diagnostics.title")}{" "}
        <HelpTip id="settings.diagnostics" label={t("diagnostics.title")} />
      </h2>
      <p className="muted small">{t("diagnostics.intro")}</p>
      <div className="row-gap">
        <Button
          icon={RefreshCw}
          busy={diagnostics.isFetching}
          onClick={() => (enabled ? void diagnostics.refetch() : setEnabled(true))}
        >
          {data ? t("diagnostics.again") : t("diagnostics.run")}
        </Button>
        <Hint id="settings.connection">
          <Button icon={Plug} busy={connection.isPending} onClick={() => connection.mutate()}>
            {t("diagnostics.connection")}
          </Button>
        </Hint>
        {overall ? (
          <Badge tone={STATUS_TONE[overall]}>{t(`diagnostics.overall.${overall}`)}</Badge>
        ) : null}
      </div>
      <p className="muted small">{t("diagnostics.connectionNote")}</p>
      {diagnostics.error ? (
        <Callout tone="danger">
          <ErrorText error={diagnostics.error} />
        </Callout>
      ) : null}
      {connection.data ? (
        <ul className="diagnostics">
          <CheckRow check={connection.data} />
        </ul>
      ) : null}
      {connection.error ? (
        <Callout tone="danger">
          <ErrorText error={connection.error} />
        </Callout>
      ) : null}
      {diagnostics.isFetching && !data ? <Spinner /> : null}
      {data ? (
        <>
          <ul className="diagnostics">
            {data.checks.map((check) => (
              <CheckRow key={`${check.id}`} check={check} />
            ))}
          </ul>
          <details className="small">
            <summary>{t("diagnostics.versions")}</summary>
            <dl className="key-values">
              {Object.entries(data.versions).map(([name, version]) => (
                <div key={name}>
                  <dt>{t(`diagnostics.version.${name}`)}</dt>
                  <dd>
                    <code>{version}</code>
                  </dd>
                </div>
              ))}
            </dl>
          </details>
          <p className="muted small">{t("diagnostics.noSecrets")}</p>
        </>
      ) : null}
    </section>
  );
}

const CONTENT_KEYS: (keyof BackupContents)[] = [
  "workflows",
  "versions",
  "templates",
  "tools",
  "knowledge_files",
  "memory_spaces",
  "memory_files",
  "runs",
  "usage_entries",
  "conversations",
  "input_files",
];

function ContentsTable({ info }: { info: BackupInfo }) {
  const { t } = useTranslation();
  return (
    <table className="table table--compact" data-testid="backup-contents">
      <thead>
        <tr>
          <th />
          <th className="num">{t("backup.inBackup")}</th>
          <th className="num">{t("backup.current")}</th>
        </tr>
      </thead>
      <tbody>
        {CONTENT_KEYS.map((key) => (
          <tr key={key} className={info.contents[key] < info.current[key] ? "compare__row--differs" : undefined}>
            <th scope="row">{t(`backup.contents.${key}`)}</th>
            <td className="num">{formatNumber(info.contents[key])}</td>
            <td className="num">{formatNumber(info.current[key])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function BackupPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [info, setInfo] = useState<BackupInfo | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const local = useQuery({ queryKey: ["backups"], queryFn: api.localBackups });
  const inspect = useMutation({
    mutationFn: (source: File | string) => (typeof source === "string" ? api.inspectLocalBackup(source) : api.inspectBackup(source)),
    onSuccess: (result) => {
      setConfirmed(false);
      setInfo(result);
    },
    onError: toast.error,
  });
  const restore = useMutation({
    mutationFn: (id: string) => api.restoreBackup(id),
    onSuccess: (result) => {
      setInfo(null);
      toast.success(t("backup.restored", { name: result.safety_backup }));
      queryClient.clear();
      // Every page shows restored data after a fresh start of the interface.
      window.setTimeout(() => window.location.reload(), 800);
    },
  });
  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) inspect.mutate(file);
  };
  return (
    <section className="panel stack" aria-labelledby="settings-backup" data-testid="backup">
      <h2 className="panel__title" id="settings-backup">
        <Archive size={15} aria-hidden /> {t("backup.title")} <HelpTip id="settings.backup" label={t("backup.title")} />
      </h2>
      <p className="muted small">{t("backup.intro")}</p>
      <Callout tone="info">{t("backup.noKey")}</Callout>
      <div className="row-gap">
        <a className="nd-button nd-button--primary nd-button--md" href={api.backupUrl} download data-testid="backup-download">
          <Download size={15} aria-hidden /> {t("backup.download")}
        </a>
        <input ref={fileInput} type="file" accept=".zip,application/zip" hidden data-testid="backup-file" onChange={onFile} />
        <Hint id="settings.restore">
          <Button icon={Upload} busy={inspect.isPending} onClick={() => fileInput.current?.click()}>
            {t("backup.restoreFromFile")}
          </Button>
        </Hint>
      </div>
      {local.data?.length ? (
        <details className="small">
          <summary>{t("backup.local", { count: local.data.length })}</summary>
          <p className="muted">{t("backup.localText")}</p>
          <ul className="backup-list">
            {local.data.map((item) => (
              <li key={item.name} className="row-gap">
                <code>{item.name}</code>
                <span className="muted">
                  {formatDate(item.created_at)} · {formatBytes(item.size)}
                </span>
                <a href={api.localBackupUrl(item.name)} download>
                  {t("backup.downloadLocal")}
                </a>
                <Button size="sm" variant="ghost" onClick={() => inspect.mutate(item.name)}>
                  {t("backup.restoreThis")}
                </Button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <Modal
        title={t("backup.restoreTitle")}
        open={Boolean(info)}
        onClose={() => setInfo(null)}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setInfo(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              busy={restore.isPending}
              disabled={!confirmed}
              onClick={() => info && restore.mutate(info.id)}
            >
              {t("backup.restoreNow")}
            </Button>
          </>
        }
      >
        {info ? (
          <div className="stack-sm">
            <Callout tone="brand">{t("backup.valid", { name: info.file_name, date: formatDate(info.created_at) })}</Callout>
            <p className="small muted">
              {t("backup.versions", { nodestro: info.nodestro_version, library: info.library_version })}
            </p>
            {info.notes.map((note) => (
              <Callout key={note} tone="warning">
                {t(`backup.notes.${note.replace("backup.", "")}`)}
              </Callout>
            ))}
            <ContentsTable info={info} />
            <Callout tone="warning">{t("backup.replaceWarning")}</Callout>
            <p className="small">{t("backup.safetyNote")}</p>
            <label className="checkbox">
              <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{" "}
              {t("backup.confirm")}
            </label>
            {restore.error ? (
              <Callout tone="danger">
                <ErrorText error={restore.error} />
              </Callout>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </section>
  );
}

/** Files uploaded as workflow inputs: how much they take, and removing those no run needs any more. */
export function InputStoragePanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const storage = useQuery({ queryKey: ["input-storage"], queryFn: api.inputStorage });
  const [days, setDays] = useState("30");
  const cleanup = useMutation({
    mutationFn: (olderThan: number | null) => api.cleanupInputs(olderThan),
    onSuccess: (result) => {
      toast.success(t("inputs.storage.cleaned", { count: result.removed, size: formatBytes(result.freed_bytes) }));
      void queryClient.invalidateQueries({ queryKey: ["input-storage"] });
    },
    onError: toast.error,
  });
  const data = storage.data;
  const age = Number(days);
  return (
    <section className="panel stack" aria-labelledby="settings-inputs" data-testid="input-storage">
      <h2 className="panel__title" id="settings-inputs">
        <Upload size={15} aria-hidden /> {t("inputs.storage.title")} <HelpTip id="inputs.storage" label={t("inputs.storage.title")} />
      </h2>
      <p className="muted small">{t("inputs.storage.intro")}</p>
      {data ? (
        <p data-testid="input-storage-summary">
          {t("inputs.storage.summary", {
            count: data.files,
            size: formatBytes(data.bytes),
            unused: data.unreferenced,
            inUse: data.in_use,
          })}
        </p>
      ) : (
        <Spinner />
      )}
      <div className="row-gap">
        <Button icon={RefreshCw} busy={cleanup.isPending && cleanup.variables === null} onClick={() => cleanup.mutate(null)}>
          {t("inputs.storage.cleanUnused")}
        </Button>
        <label className="row-gap small">
          {t("inputs.storage.olderThan")}
          <input
            className="nd-input nd-input--narrow"
            type="number"
            min={1}
            max={3650}
            value={days}
            onChange={(event) => setDays(event.target.value)}
            aria-label={t("inputs.storage.days")}
          />
          {t("inputs.storage.days")}
        </label>
        <Button
          variant="danger"
          disabled={!(age >= 1)}
          busy={cleanup.isPending && cleanup.variables !== null}
          onClick={() => cleanup.mutate(age)}
        >
          {t("inputs.storage.cleanOld")}
        </Button>
      </div>
      <p className="muted small">{t("inputs.storage.safe")}</p>
    </section>
  );
}
