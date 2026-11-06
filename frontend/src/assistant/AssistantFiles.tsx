// The user's own files in the Nodestro Assistant: the chips of the next message in the composer, the drop zone,
// the files of the conversation (use again, download, show what was read, save to knowledge, delete) and the files
// a sent message carried, each with the path it takes to the model (natively, extracted text, overview ...).

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  type LucideIcon,
  Paperclip,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { type ClipboardEvent, type DragEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { AssistantFile, AssistantFileSupport, FileDeliveryMode, FormatGroup, SentFile } from "../api/types";
import { AdoptDialog } from "../components/AdoptDialog";
import { toast } from "../components/toast";
import { Tooltip } from "../components/Tooltip";
import { ProgressBar, formatPercent } from "../components/Progress";
import { Callout, ConfirmIconButton, IconButton, Modal, Spinner } from "../components/ui";
import { ErrorText, problemText } from "../lib/errors";
import { formatBytes, relativeTime } from "../lib/format";
import type { ComposerFiles } from "./useComposerFiles";

const GROUP_ICON: Record<FormatGroup, LucideIcon> = {
  text: FileText,
  data: FileSpreadsheet,
  document: FileText,
  image: ImageIcon,
  archive: Archive,
};

function iconOf(group: FormatGroup | null | undefined): LucideIcon {
  return group ? GROUP_ICON[group] : FileIcon;
}

/** "PDF · 1.2 MB" */
function meta(format: string | null | undefined, size: number): string {
  return [format ? format.toUpperCase() : null, formatBytes(size)].filter(Boolean).join(" · ");
}

/** The path a file takes to the model, as a short tag with its explanation (and the reason when it cannot). */
export function ModeTag({ mode, notes }: { mode: FileDeliveryMode; notes: string[] }) {
  const { t } = useTranslation();
  const reason = notes.length ? notes.map((code) => problemText(t, { code })).join(" ") : "";
  const help = mode === "unavailable" && reason ? reason : `${t(`assistantFiles.modeHelp.${mode}`)}${reason ? ` ${reason}` : ""}`;
  const tone = mode === "unavailable" ? "chat-tag--danger" : mode === "overview" || mode === "ocr_text" ? "chat-tag--warning" : "";
  return (
    <Tooltip content={help}>
      <span className={`chat-tag chat-file__mode ${tone}`} tabIndex={0} data-testid="file-mode" data-mode={mode} aria-label={`${t(`assistantFiles.mode.${mode}`)}: ${help}`}>
        {t(`assistantFiles.mode.${mode}`)}
      </span>
    </Tooltip>
  );
}

/** The drop zone: the whole composer takes files dragged from the computer. */
export function useFileDrop(onFiles: (files: File[]) => void) {
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const carriesFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes("Files");
  return {
    dragging,
    props: {
      onDragEnter: (event: DragEvent<HTMLElement>) => {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        depth.current += 1;
        setDragging(true);
      },
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      },
      onDragLeave: (event: DragEvent<HTMLElement>) => {
        if (!carriesFiles(event)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (!depth.current) setDragging(false);
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        depth.current = 0;
        setDragging(false);
        onFiles(Array.from(event.dataTransfer.files));
      },
    },
  };
}

/** Files pasted into the message field (e.g. a screenshot) are attached like chosen ones. */
export function pastedFiles(event: ClipboardEvent<HTMLElement>): File[] {
  return Array.from(event.clipboardData?.files ?? []);
}

/** The button that opens the computer's file chooser (several files at once). */
export function AttachFilesButton({ files }: { files: ComposerFiles }) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const accept = (files.support?.formats ?? []).flatMap((format) => format.extensions).join(",");
  return (
    <>
      <IconButton icon={Upload} label={t("assistantFiles.attach")} onClick={() => input.current?.click()} data-testid="assistant-attach-files" />
      <input
        ref={input}
        type="file"
        hidden
        multiple
        accept={accept || undefined}
        aria-label={t("assistantFiles.attach")}
        data-testid="assistant-file-input"
        onChange={(event) => {
          const chosen = Array.from(event.target.files ?? []);
          event.target.value = "";
          void files.add(chosen);
        }}
      />
    </>
  );
}

function modelLine(t: ReturnType<typeof useTranslation>["t"], support: AssistantFileSupport): string {
  const model = support.model.split(":").pop() ?? support.model;
  const key = support.pdfs && support.images ? "native" : support.pdfs ? "pdfOnly" : support.images ? "imagesOnly" : "none";
  return t(`assistantFiles.model.${key}`, { model });
}

/**
 * An upload's state: the sent share as a bar and a percentage while the browser sends it, then "reading" while the
 * server checks and reads it (ST-055). The live region names only the phase, not every percent.
 */
function UploadState({ progress }: { progress?: number }) {
  const { t } = useTranslation();
  if (progress === undefined) return <span role="status">{t("assistantFiles.status.uploading")}</span>;
  const reading = progress >= 1;
  return (
    <>
      <span role="status">{reading ? t("assistantFiles.status.reading") : t("assistantFiles.status.sending")}</span>
      {reading ? null : (
        <span data-testid="composer-file-percent" aria-hidden>
          {" "}
          {formatPercent(progress)}
        </span>
      )}
    </>
  );
}

/** The files of the next message: uploading, refused (with the reason) and ready (with their path to the model). */
export function ComposerFileChips({ files }: { files: ComposerFiles }) {
  const { t } = useTranslation();
  if (!files.selected.length && !files.uploads.length) return null;
  const remove = async (file: AssistantFile) => {
    try {
      await files.remove(file);
    } catch (error) {
      toast.error(error);
    }
  };
  return (
    <div className="chat-files" data-testid="composer-files">
      <ul className="chat-files__list" aria-label={t("assistantFiles.composerLabel")}>
        {files.selected.map((file) => {
          const Icon = iconOf(file.group);
          return (
            <li key={file.id} className="chat-file" data-testid="composer-file" data-state="ready">
              <Icon size={14} aria-hidden className="chat-file__icon" />
              <span className="chat-file__main">
                <span className="chat-file__name" title={file.name}>
                  {file.name}
                </span>
                <span className="chat-file__meta">
                  {meta(file.format, file.size)}
                  {file.sent_at ? <span className="chat-tag">{t("assistantFiles.again")}</span> : null}
                  <ModeTag mode={file.mode} notes={file.mode_notes} />
                </span>
              </span>
              <IconButton icon={X} label={t("assistantFiles.remove", { name: file.name })} onClick={() => void remove(file)} data-testid="composer-file-remove" />
            </li>
          );
        })}
        {files.uploads.map((item) => (
          <li key={item.key} className={`chat-file ${item.status === "error" ? "chat-file--error" : ""}`} data-testid="composer-file" data-state={item.status}>
            {item.status === "uploading" ? <Loader2 size={14} className="spin chat-file__icon" aria-hidden /> : <FileIcon size={14} aria-hidden className="chat-file__icon" />}
            <span className="chat-file__main">
              <span className="chat-file__name" title={item.name}>
                {item.name}
              </span>
              <span className="chat-file__meta">
                {formatBytes(item.size)} ·{" "}
                {item.status === "uploading" ? (
                  <UploadState progress={item.progress} />
                ) : (
                  <span className="chat-file__error" role="alert" data-testid="composer-file-error">
                    {problemText(t, item.problem ?? {})}
                  </span>
                )}
              </span>
              {item.status === "uploading" && item.progress !== undefined && item.progress < 1 ? (
                <ProgressBar
                  share={item.progress}
                  label={t("assistantFiles.status.progress", { name: item.name })}
                  testId="composer-file-progress"
                />
              ) : null}
            </span>
            {item.status === "error" ? (
              <IconButton icon={X} label={t("assistantFiles.dismiss", { name: item.name })} onClick={() => files.dismiss(item.key)} />
            ) : null}
          </li>
        ))}
      </ul>
      {files.support && files.selected.length ? (
        <p className="muted small chat-files__model" data-testid="composer-files-model">
          {modelLine(t, files.support)}
        </p>
      ) : null}
    </div>
  );
}

/** What Nodestro read from a file: the text a model without native support receives. */
function FilePreview({ conversationId, file, onClose }: { conversationId: string; file: AssistantFile; onClose: () => void }) {
  const { t } = useTranslation();
  const text = useQuery({ queryKey: ["assistant", "file-text", conversationId, file.id], queryFn: () => api.assistantFileText(conversationId, file.id) });
  return (
    <Modal open title={t("assistantFiles.preview.title", { name: file.name })} onClose={onClose} wide>
      {text.isLoading ? <Spinner /> : null}
      {text.error ? (
        <Callout tone="danger">
          <ErrorText error={text.error} />
        </Callout>
      ) : null}
      {text.data ? (
        <>
          {file.notes.length ? (
            <ul className="small chat-file-preview__notes">
              {file.notes.map((code) => (
                <li key={code}>{problemText(t, { code })}</li>
              ))}
            </ul>
          ) : null}
          {text.data.text ? <pre className="chat-file-preview" data-testid="file-preview-text">{text.data.text}</pre> : <p className="muted small">{t("assistantFiles.preview.empty")}</p>}
          {text.data.truncated ? <p className="muted small">{t("assistantFiles.preview.truncated")}</p> : null}
        </>
      ) : null}
    </Modal>
  );
}

/** The files of the conversation: they stay until removed; each can be sent again, downloaded, inspected, saved
 * to knowledge (an explicit, confirmed step) or deleted. */
export function ConversationFiles({ conversationId, files }: { conversationId: string; files: ComposerFiles }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<AssistantFile | null>(null);
  const [adopting, setAdopting] = useState<AssistantFile | null>(null);
  const list = files.files;
  if (!list.length) return null;
  const chosen = new Set(files.selected.map((item) => item.id));
  const remove = async (file: AssistantFile) => {
    try {
      files.store(await api.removeAssistantFile(conversationId, file.id));
    } catch (error) {
      toast.error(error);
    }
  };
  return (
    <div className="chat-file-shelf" data-testid="conversation-files">
      <button type="button" className="chat-file-shelf__toggle" aria-expanded={open} onClick={() => setOpen(!open)} data-testid="conversation-files-toggle">
        {open ? <ChevronDown size={13} aria-hidden /> : <ChevronRight size={13} aria-hidden />}
        <Paperclip size={12} aria-hidden /> {t("assistantFiles.list.toggle", { count: list.length })}
      </button>
      {open ? (
        <div className="chat-file-shelf__body">
          <p className="muted small">{t("assistantFiles.list.hint")}</p>
          <ul className="chat-file-shelf__list" aria-label={t("assistantFiles.list.label")}>
            {list.map((file) => {
              const Icon = iconOf(file.group);
              return (
                <li key={file.id} className="chat-file chat-file--row" data-testid="conversation-file">
                  <Icon size={14} aria-hidden className="chat-file__icon" />
                  <span className="chat-file__main">
                    <span className="chat-file__name" title={file.name}>
                      {file.name}
                    </span>
                    <span className="chat-file__meta">
                      {meta(file.format, file.size)} · {t("assistantFiles.list.added", { time: relativeTime(file.added_at) })}
                      <ModeTag mode={file.mode} notes={file.mode_notes} />
                      {file.sent_at === null ? <span className="chat-tag">{t("assistantFiles.list.waiting")}</span> : null}
                      {file.knowledge_ids.length ? (
                        <span className="chat-tag">
                          <BookOpen size={10} aria-hidden /> {t("assistantFiles.list.inKnowledge")}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span className="chat-file__actions">
                    {file.sent_at !== null ? (
                      <IconButton
                        icon={RotateCcw}
                        label={chosen.has(file.id) ? t("assistantFiles.list.reused") : t("assistantFiles.list.reuseName", { name: file.name })}
                        disabled={chosen.has(file.id) || files.selected.length >= files.limit}
                        onClick={() => files.reuse(file)}
                        data-testid="conversation-file-reuse"
                      />
                    ) : null}
                    <IconButton icon={Eye} label={t("assistantFiles.list.preview", { name: file.name })} onClick={() => setPreview(file)} data-testid="conversation-file-preview" />
                    <a className="icon-button" href={api.assistantFileUrl(conversationId, file.id)} download={file.name} aria-label={t("assistantFiles.list.download", { name: file.name })} title={t("assistantFiles.list.download", { name: file.name })}>
                      <Download size={16} aria-hidden />
                    </a>
                    <IconButton icon={BookOpen} label={t("assistantFiles.list.saveKnowledge", { name: file.name })} onClick={() => setAdopting(file)} data-testid="conversation-file-adopt" />
                    <ConfirmIconButton icon={Trash2} label={t("assistantFiles.list.delete", { name: file.name })} onConfirm={() => void remove(file)} data-testid="conversation-file-delete" />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {preview ? <FilePreview conversationId={conversationId} file={preview} onClose={() => setPreview(null)} /> : null}
      <AdoptDialog
        open={adopting !== null}
        onClose={() => setAdopting(null)}
        sources={adopting ? [{ kind: "input", input_id: adopting.id, title: adopting.name }] : []}
        onAdopted={() => void queryClient.invalidateQueries({ queryKey: keys.conversation(conversationId) })}
      />
    </div>
  );
}

/** The files a sent message carried, with the path each took to the model. */
export function SentFileChips({ files }: { files: SentFile[] }) {
  const { t } = useTranslation();
  if (!files.length) return null;
  return (
    <ul className="chat-files__list chat-files__list--sent" aria-label={t("assistantFiles.sent")} data-testid="sent-files">
      {files.map((file) => {
        const Icon = iconOf(file.group);
        return (
          <li key={file.file_id} className="chat-file chat-file--sent" data-testid="sent-file">
            <Icon size={13} aria-hidden className="chat-file__icon" />
            <span className="chat-file__main">
              <span className="chat-file__name" title={file.name}>
                {file.name}
              </span>
              <span className="chat-file__meta">
                {meta(file.format, file.size)}
                {file.mode ? <ModeTag mode={file.mode} notes={file.notes} /> : null}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
