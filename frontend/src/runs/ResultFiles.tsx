// The result files of a run: written by its result nodes, or created here afterwards.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Download, Eye, FilePlus2, FileText, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { AdoptSource, ReportFormat, ResultFile, Run } from "../api/types";
import { AdoptDialog } from "../components/AdoptDialog";
import { toast } from "../components/toast";
import { Badge, Button, Callout, ConfirmIconButton, Field, HelpTip, IconButton, Modal, Select, TextInput, Toggle } from "../components/ui";
import { ErrorText, ProblemText } from "../lib/errors";
import { formatBytes, formatDate } from "../lib/format";

const FORMATS: ReportFormat[] = ["md", "json", "csv", "html", "pdf", "docx", "xlsx"];

export function ResultFiles({ run }: { run: Run }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const finished = !["queued", "running", "paused"].includes(run.status);
  const files = useQuery({ queryKey: keys.resultFiles(run.id), queryFn: () => api.resultFiles(run.id), enabled: !run.imported_at });
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<ResultFile | null>(null);
  const [adopting, setAdopting] = useState<AdoptSource[] | null>(null);
  const remove = useMutation({
    mutationFn: (file: ResultFile) => api.deleteResultFile(run.id, file.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.resultFiles(run.id) }),
    onError: toast.error,
  });
  if (run.imported_at) return null;
  const list = files.data ?? [];
  return (
    <section className="panel stack" aria-label={t("flow.files.runTitle")}>
      <div className="row-between">
        <h2 className="panel__title">
          {t("flow.files.runTitle")} <HelpTip id="files.run" label={t("flow.files.runTitle")} />
        </h2>
        <Button size="sm" icon={FilePlus2} disabled={!finished} onClick={() => setCreating(true)}>
          {t("flow.files.create")}
        </Button>
      </div>
      {!list.length ? <p className="muted small">{finished ? t("flow.files.none") : t("flow.files.afterRun")}</p> : null}
      <ul className="file-list">
        {list.map((file) => (
          <li key={file.id}>
            <span className="row-gap">
              <FileText size={14} aria-hidden />
              <strong>{file.name}</strong>
              <Badge>{file.format.toUpperCase()}</Badge>
              {file.sanitized ? <Badge tone="success">{t("flow.files.sanitized")}</Badge> : null}
              <span className="muted small">
                {file.error_code ? null : `${formatBytes(file.size)} · `}
                {formatDate(file.created_at)} · {t(`flow.files.source.${file.source}`)}
              </span>
            </span>
            {file.error_code ? (
              <span className="text-warning small">
                <ProblemText item={{ code: file.error_code, params: file.error_params, message: file.error }} compact />
              </span>
            ) : (
              <span className="row-gap">
                {["html", "pdf", "md"].includes(file.format) ? (
                  <IconButton icon={Eye} label={t("flow.files.view", { name: file.name })} onClick={() => setPreview(file)} />
                ) : null}
                <a
                  className="nd-button nd-button--ghost nd-button--sm"
                  href={api.resultFileUrl(run.id, file.id)}
                  download={file.name}
                  aria-label={t("flow.files.download", { name: file.name })}
                >
                  <Download size={14} aria-hidden />
                </a>
                <IconButton
                  icon={BookOpen}
                  label={t("inputs.adopt.resultFile", { name: file.name })}
                  onClick={() => setAdopting([{ kind: "result_file", run_id: run.id, file_id: file.id }])}
                />
                <ConfirmIconButton icon={Trash2} label={t("flow.files.delete", { name: file.name })} onConfirm={() => remove.mutate(file)} />
              </span>
            )}
          </li>
        ))}
      </ul>
      <CreateFileDialog run={run} open={creating} onClose={() => setCreating(false)} />
      <AdoptDialog open={adopting !== null} onClose={() => setAdopting(null)} sources={adopting ?? []} />
      <Modal title={preview?.name ?? ""} open={preview !== null} onClose={() => setPreview(null)} xl>
        {preview ? (
          <iframe
            className="file-preview"
            title={preview.name}
            sandbox={preview.format === "html" ? "" : undefined}
            src={api.resultFileUrl(run.id, preview.id, true)}
          />
        ) : null}
      </Modal>
    </section>
  );
}

function CreateFileDialog({ run, open, onClose }: { run: Run; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [format, setFormat] = useState<ReportFormat>("md");
  const [name, setName] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [sanitize, setSanitize] = useState(false);
  const create = useMutation({
    mutationFn: () => api.createResultFile(run.id, { format, name, node_id: nodeId || null, sanitize }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.resultFiles(run.id) });
      toast.success(t("flow.files.created"));
      onClose();
    },
  });
  const steps = run.workflow.nodes.filter(
    (node) => (node.type === "agent" || node.type === "output" || node.type === "subworkflow") && run.nodes[node.id]?.status === "succeeded",
  );
  return (
    <Modal
      title={t("flow.files.create")}
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" busy={create.isPending} onClick={() => create.mutate()}>
            {t("flow.files.createButton")}
          </Button>
        </>
      }
    >
      <Field label={t("flow.files.format")} tip="files.output">
        <Select
          value={format}
          onChange={(value) => setFormat(value as ReportFormat)}
          options={FORMATS.map((value) => ({ value, label: t(`flow.files.formats.${value}`) }))}
        />
      </Field>
      <Field label={t("flow.files.content")}>
        <Select
          value={nodeId}
          placeholder={t("flow.files.wholeResult")}
          onChange={setNodeId}
          options={steps.map((node) => ({ value: node.id, label: node.label }))}
        />
      </Field>
      <Field label={t("flow.files.name")}>
        <TextInput value={name} placeholder={run.workflow_name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Toggle checked={sanitize} onChange={setSanitize} label={t("flow.files.sanitize")} tip="files.sanitize" />
      {format === "csv" ? <p className="field__hint">{t("flow.files.csvHint")}</p> : null}
      {create.error ? (
        <Callout tone="danger">
          <ErrorText error={create.error} />
        </Callout>
      ) : null}
    </Modal>
  );
}
