// Import and export of exchange files (N-14): MCP services, service connections and knowledge collections.
//
// An import is always previewed first (the API's dry run): the entries, why an entry would be refused, what is never
// taken over and which secrets have to be entered again. Only after the person confirmed is it applied, all entries
// or none. Neither the file, the preview nor the result ever holds a secret value: the dialog shows only the labels of
// the secrets to enter again, with a link to the place where each is entered.

import { HelpTip as PlatformHelpTip } from "@nodestro/ui-core";
import { useMutation } from "@tanstack/react-query";
import { Download, FileUp, KeyRound, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { EXCHANGE_FORMATS, type ExchangeKind, type ImportItem, type ImportReport, canApply, exchangeApi, saveFile } from "../api/exchange";
import { ErrorText, problemText } from "../lib/errors";
import { SecretsToReenter } from "../pages/SettingsData";
import { toast } from "./toast";
import { Badge, Button, Callout, Field, Modal, TextInput } from "./ui";

/** The things an import never takes over that have a text of their own (others are named as they come). */
const LEFT_OUT = ["enabled", "tool_approvals", "secrets", "vectors", "provenance"] as const;
type LeftOut = (typeof LEFT_OUT)[number];
const isLeftOut = (value: string): value is LeftOut => (LEFT_OUT as readonly string[]).includes(value);

const STATUS_TONE = { ready: "success", refused: "danger", created: "success", exists: "idle" } as const;

function runImport(kind: ExchangeKind, file: File, dryRun: boolean, collection?: string): Promise<ImportReport> {
  if (kind === "mcp") return exchangeApi.importMcp(file, dryRun);
  if (kind === "connections") return exchangeApi.importConnections(file, dryRun);
  return exchangeApi.importCollection(file, dryRun, collection);
}

function ItemRow({ item }: { item: ImportItem }) {
  const { t } = useTranslation();
  return (
    <li className="list__row stack-xs" data-testid={`exchange-item-${item.status}`}>
      <span className="row-gap">
        <strong>{item.name}</strong>
        <Badge tone={STATUS_TONE[item.status]}>{t(`exchange.status.${item.status}`)}</Badge>
        {item.needs_secret ? (
          <Badge tone="warning" icon={KeyRound}>
            {t("exchange.needsSecret")}
          </Badge>
        ) : null}
      </span>
      {item.status === "refused" && item.code ? (
        <span className="small" data-testid="exchange-refusal">
          {problemText(t, { code: item.code, params: item.params })}
        </span>
      ) : null}
    </li>
  );
}

/** The preview or the result of an import. */
export function ImportReportView({ report }: { report: ImportReport }) {
  const { t } = useTranslation();
  const refused = report.items.filter((item) => item.status === "refused").length;
  return (
    <div className="stack-sm" data-testid="exchange-report">
      <p className="small">
        {report.dry_run
          ? t("exchange.preview.summary", { count: report.items.length, refused })
          : t("exchange.result.summary", { count: report.items.filter((item) => item.status === "created").length })}
      </p>
      {report.items.length ? (
        <ul className="list" aria-label={t("exchange.entries")}>
          {report.items.map((item, index) => (
            <ItemRow key={`${item.kind}:${item.name}:${index}`} item={item} />
          ))}
        </ul>
      ) : (
        <p className="muted small">{t("exchange.preview.empty")}</p>
      )}
      {refused ? <Callout tone="danger">{t("exchange.preview.refused", { count: refused })}</Callout> : null}
      {report.collection_exists && report.dry_run ? (
        <Callout tone="warning">{t("exchange.collection.exists", { name: report.collection ?? "" })}</Callout>
      ) : null}
      {report.embedding ? (
        <p className="muted small" data-testid="exchange-embedding">
          {t(report.embedding.matches ? "exchange.collection.embeddingSame" : "exchange.collection.embeddingOther")}
        </p>
      ) : null}
      {report.left_out.length ? (
        <p className="muted small" data-testid="exchange-left-out">
          {t("exchange.leftOut.title")}{" "}
          {report.left_out.map((item) => (isLeftOut(item) ? t(`exchange.leftOut.${item}`) : item)).join(", ")}
        </p>
      ) : null}
      {report.dry_run && report.items.some((item) => item.needs_secret) ? (
        <p className="small">
          <KeyRound size={13} aria-hidden /> {t("exchange.preview.secrets")}
        </p>
      ) : null}
    </div>
  );
}

/** "Import…": choose a file, see the preview, confirm. ``onImported`` runs after the entries were stored. */
export function ImportButton({
  kind,
  disabled,
  onImported,
}: {
  kind: ExchangeKind;
  disabled?: boolean;
  onImported?: (report: ImportReport) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button icon={Upload} onClick={() => setOpen(true)} disabled={disabled} data-testid={`exchange-import-${kind}`}>
        {t("exchange.import")}
      </Button>
      {open ? <ImportDialog kind={kind} onClose={() => setOpen(false)} onImported={onImported} /> : null}
    </>
  );
}

export function ImportDialog({
  kind,
  onClose,
  onImported,
}: {
  kind: ExchangeKind;
  onClose: () => void;
  onImported?: (report: ImportReport) => void;
}) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [collection, setCollection] = useState("");
  const preview = useMutation({
    mutationFn: ({ chosen, name }: { chosen: File; name?: string }) => runImport(kind, chosen, true, name),
    onSuccess: (report) => {
      if (kind === "collection" && !collection.trim()) setCollection(report.collection ?? "");
    },
  });
  const apply = useMutation({
    mutationFn: () => runImport(kind, file!, false, collection),
    onSuccess: (report) => onImported?.(report),
  });
  const choose = (chosen: File | undefined) => {
    if (!chosen) return;
    setFile(chosen);
    apply.reset();
    preview.mutate({ chosen, name: kind === "collection" ? collection : undefined });
  };
  const report = apply.data ?? preview.data ?? null;
  // A collection previewed under one name and applied under another would skip the check of that name.
  const stale = kind === "collection" && preview.data && (preview.data.collection ?? "") !== collection.trim();
  const done = Boolean(apply.data);
  return (
    <Modal
      title={t(`exchange.title.${kind}`)}
      open
      wide
      onClose={onClose}
      footer={
        done ? (
          <Button variant="primary" onClick={onClose} data-testid="exchange-done">
            {t("exchange.done")}
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            {stale ? (
              <Button busy={preview.isPending} onClick={() => file && preview.mutate({ chosen: file, name: collection })} data-testid="exchange-recheck">
                {t("exchange.recheck")}
              </Button>
            ) : null}
            <Button
              variant="primary"
              icon={FileUp}
              busy={apply.isPending}
              disabled={!canApply(preview.data ?? null) || Boolean(stale) || preview.isPending}
              onClick={() => apply.mutate()}
              data-testid="exchange-apply"
            >
              {t("exchange.apply")}
            </Button>
          </>
        )
      }
    >
      <div className="stack">
        <p className="muted small">
          {t(`exchange.intro.${kind}`, { format: EXCHANGE_FORMATS[kind].format })} <PlatformHelpTip id="studio.exchange" />
        </p>
        {!done ? (
          <div className="row-gap">
            <input
              ref={input}
              type="file"
              hidden
              accept={EXCHANGE_FORMATS[kind].accept}
              data-testid="exchange-file"
              onChange={(event) => {
                const chosen = event.target.files?.[0];
                event.target.value = "";
                choose(chosen);
              }}
            />
            <Button icon={Upload} busy={preview.isPending} onClick={() => input.current?.click()} data-autofocus>
              {t("exchange.choose")}
            </Button>
            {file ? <span className="small">{file.name}</span> : null}
          </div>
        ) : null}
        {kind === "collection" && !done ? (
          <Field label={t("exchange.collection.name")} hint={t("exchange.collection.nameHint")}>
            <TextInput value={collection} maxLength={120} onChange={(event) => setCollection(event.target.value)} />
          </Field>
        ) : null}
        {preview.error ? (
          <Callout tone="danger">
            <ErrorText error={preview.error} />
          </Callout>
        ) : null}
        {apply.error ? (
          <Callout tone="danger">
            <ErrorText error={apply.error} />
          </Callout>
        ) : null}
        {report ? <ImportReportView report={report} /> : null}
        {apply.data ? <SecretsToReenter labels={apply.data.secrets_to_reenter} text={t("exchange.reenter")} /> : null}
      </div>
    </Modal>
  );
}

/** "Export": downloads the exchange file; a refusal (e.g. a secret in the settings) is shown as a message. */
export function ExportButton({ kind, collection, disabled }: { kind: ExchangeKind; collection?: string; disabled?: boolean }) {
  const { t } = useTranslation();
  const run = useMutation({
    mutationFn: () =>
      kind === "mcp" ? exchangeApi.exportMcp() : kind === "connections" ? exchangeApi.exportConnections() : exchangeApi.exportCollection(collection ?? ""),
    onSuccess: saveFile,
    onError: toast.error,
  });
  return (
    <Button
      variant="ghost"
      icon={Download}
      busy={run.isPending}
      disabled={disabled || (kind === "collection" && !collection)}
      onClick={() => run.mutate()}
      data-testid={`exchange-export-${kind}`}
    >
      {t(kind === "collection" ? "exchange.exportCollection" : "exchange.export")}
    </Button>
  );
}
