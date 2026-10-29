// The files a run received: uploaded for it or taken from knowledge. Uploaded files can be
// looked into and taken over into knowledge (also single files of a ZIP archive).

import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronDown, Download, Eye } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { AdoptSource, InputFile, Run, RunInput } from "../api/types";
import { AdoptDialog } from "../components/AdoptDialog";
import { FilePreview, fileSummary } from "../components/FileInput";
import { Badge, Button, HelpTip, IconButton } from "../components/ui";
import { problemText } from "../lib/errors";
import { formatBytes } from "../lib/format";

export function useRunInputs(run: Run | undefined) {
  return useQuery({
    queryKey: keys.runInputs(run?.id ?? ""),
    queryFn: () => api.runInputs(run?.id ?? ""),
    enabled: Boolean(run && run.file_ids.length > 0 && !run.imported_at),
  });
}

export function RunInputs({ run }: { run: Run }) {
  const { t } = useTranslation();
  const inputs = useRunInputs(run);
  const [adopting, setAdopting] = useState<AdoptSource[] | null>(null);
  const list = inputs.data ?? [];
  if (!list.length) return null;
  const fields = run.workflow.nodes.find((node) => node.type === "start")?.start?.fields ?? [];
  const labelOf = (name: string | null) =>
    name ? fields.find((field) => field.name === name)?.label || name : t("inputs.run.extra");
  const uploads = list.filter((item) => item.file && !item.file.knowledge_ids.length && item.file.group !== "archive");
  return (
    <section className="panel stack" aria-labelledby="run-inputs" data-testid="run-inputs">
      <div className="row-between">
        <h2 className="panel__title" id="run-inputs">
          {t("inputs.run.title", { count: list.length })} <HelpTip id="inputs.received" label={t("inputs.run.titleShort")} />
        </h2>
        {uploads.length > 1 ? (
          <Button
            size="sm"
            variant="ghost"
            icon={BookOpen}
            onClick={() => setAdopting(uploads.map((item) => ({ kind: "input", input_id: item.id })))}
          >
            {t("inputs.adopt.all", { count: uploads.length })}
          </Button>
        ) : null}
      </div>
      <p className="muted small">{t("inputs.run.note")}</p>
      <ul className="upload-list">
        {list.map((item) => (
          <RunInputRow key={item.id} item={item} field={labelOf(item.field)} onAdopt={setAdopting} />
        ))}
      </ul>
      <AdoptDialog open={adopting !== null} onClose={() => setAdopting(null)} sources={adopting ?? []} />
    </section>
  );
}

function RunInputRow({ item, field, onAdopt }: { item: RunInput; field: string; onAdopt: (sources: AdoptSource[]) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (item.source === "knowledge")
    return (
      <li className="upload-row">
        <span className="upload-row__icon">
          <BookOpen size={14} aria-hidden />
        </span>
        <span className="upload-row__main">
          <span className="upload-row__name">{item.name ?? t("context.fileMissing")}</span>
          <span className="upload-row__meta">
            {field} · {t("inputs.fromKnowledgeBadge")}
          </span>
        </span>
      </li>
    );
  const file: InputFile | null = item.file;
  if (!file)
    return (
      <li className="upload-row upload-row--muted">
        <span className="upload-row__main">
          <span className="upload-row__name">{item.name ?? item.id}</span>
          <span className="upload-row__meta">
            {field} · {t("inputs.run.removed")}
          </span>
        </span>
      </li>
    );
  const archive = file.group === "archive";
  return (
    <li className="upload-row upload-row--ready">
      <span className="upload-row__main">
        <span className="upload-row__name">{file.name}</span>
        <span className="upload-row__meta">
          {field} · <Badge>{file.format.toUpperCase()}</Badge> {formatBytes(file.size)}
          {fileSummary(t, file) ? ` · ${fileSummary(t, file)}` : ""}
          {file.knowledge_ids.length ? ` · ${t("inputs.inKnowledge")}` : ""}
        </span>
        {file.notes.length ? (
          <span className="upload-row__notes">
            {file.notes.map((note) => (
              <span key={note}>{problemText(t, { code: note, params: { name: file.name } })}</span>
            ))}
          </span>
        ) : null}
        {open ? (
          <FilePreview file={file} onAdoptMember={archive ? (path) => onAdopt([{ kind: "input", input_id: file.id, path }]) : undefined} />
        ) : null}
      </span>
      <span className="upload-row__actions">
        {!archive ? (
          <Button size="sm" variant="ghost" icon={BookOpen} onClick={() => onAdopt([{ kind: "input", input_id: file.id }])}>
            {t("inputs.adopt.short")}
          </Button>
        ) : null}
        <a
          className="nd-button nd-button--ghost nd-button--sm"
          href={api.inputUrl(file.id)}
          download={file.name}
          aria-label={t("inputs.download", { name: file.name })}
        >
          <Download size={14} aria-hidden />
        </a>
        <IconButton
          icon={open ? ChevronDown : Eye}
          label={open ? t("inputs.hidePreview") : archive ? t("inputs.showContents") : t("inputs.showPreview")}
          onClick={() => setOpen(!open)}
        />
      </span>
    </li>
  );
}
