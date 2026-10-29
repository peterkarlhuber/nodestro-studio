// A file field of a workflow's input form: drop or choose files (or a folder), see what was
// uploaded and checked, look into ZIP archives, or pick files from knowledge.
//
// Files are uploaded right away and stored for the run (not in knowledge). The field's value is
// the list of file ids; refused files stay visible with the reason and never become part of it.

import { useQuery } from "@tanstack/react-query";
import {
  Archive,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Eye,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderUp,
  Image as ImageIcon,
  Loader2,
  type LucideIcon,
  Upload,
  X,
} from "lucide-react";
import { type DragEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { useInputFormats, useKnowledge } from "../api/hooks";
import type { FormatGroup, InputField, InputFile } from "../api/types";
import { type Coded, codedError, problemText } from "../lib/errors";
import {
  DEFAULT_FIELD_MB,
  acceptAttribute,
  acceptedKeys,
  acceptedLabel,
  archiveTree,
  filesOfDrop,
  precheck,
  remainingSlots,
  type TreeNode,
} from "../lib/files";
import { formatBytes } from "../lib/format";
import { Badge, Button, IconButton, Select } from "./ui";

const GROUP_ICON: Record<FormatGroup, LucideIcon> = {
  text: FileText,
  data: FileSpreadsheet,
  document: FileText,
  image: ImageIcon,
  archive: Archive,
};

interface Pending {
  key: string;
  name: string;
  size: number;
  status: "uploading" | "error";
  problem?: Coded;
}

export type UploadOrigin = "studio" | "test" | "schedule" | "batch";

export function FileInput({
  id,
  field,
  value,
  onChange,
  onPendingChange,
  origin = "studio",
  invalid,
}: {
  id: string;
  field: InputField;
  value: string[];
  onChange: (ids: string[]) => void;
  /** How many uploads are still running (a run should not start before they are done). */
  onPendingChange?: (count: number) => void;
  origin?: UploadOrigin;
  invalid?: boolean;
}) {
  const { t } = useTranslation();
  const formats = useInputFormats();
  const knowledge = useKnowledge();
  const list = useMemo(() => formats.data?.formats ?? [], [formats.data]);
  const keys = useMemo(() => acceptedKeys(field.accept, list), [field.accept, list]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [uploaded, setUploaded] = useState<Record<string, InputFile>>({});
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  // Uploads finish one after another; the latest value and callback keep every finished file.
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;

  const uploading = pending.filter((item) => item.status === "uploading").length;
  const onPendingRef = useRef(onPendingChange);
  onPendingRef.current = onPendingChange;
  useEffect(() => onPendingRef.current?.(uploading), [uploading]);

  const multiple = field.multiple !== false;
  const slots = remainingSlots(field, value.length);
  const full = slots === 0;

  async function add(files: { file: File; name: string }[]) {
    const fresh = files.filter((item) => !(item.name.split("/").pop() ?? "").startsWith("."));
    let free = remainingSlots(field, valueRef.current.length);
    const queue: { file: File; name: string; key: string }[] = [];
    const refused: Pending[] = [];
    for (const item of fresh) {
      const key = `${item.name}-${item.file.size}-${Math.random().toString(36).slice(2, 8)}`;
      if (free !== null && free <= 0) {
        refused.push({
          key,
          name: item.name,
          size: item.file.size,
          status: "error",
          problem: { code: "form.too_many_files", params: { limit: multiple ? field.max_files : 1, count: value.length + fresh.length } },
        });
        continue;
      }
      const check = precheck({ name: item.name, size: item.file.size }, field, list);
      if (!check.ok) {
        refused.push({ key, name: item.name, size: item.file.size, status: "error", problem: { code: check.code, params: check.params } });
        continue;
      }
      if (free !== null) free -= 1;
      queue.push({ ...item, key });
    }
    setPending((current) => [
      ...current.filter((item) => item.status === "uploading"),
      ...refused,
      ...queue.map((item) => ({ key: item.key, name: item.name, size: item.file.size, status: "uploading" as const })),
    ]);
    for (const item of queue) {
      try {
        const [result] = await api.uploadInputs([{ file: item.file, name: item.name }], {
          accept: field.accept,
          maxSizeMb: field.max_size_mb,
          origin,
        });
        if (result?.file) {
          const stored = result.file;
          setUploaded((current) => ({ ...current, [stored.id]: stored }));
          const next = multiple ? [...valueRef.current.filter((fileId) => fileId !== stored.id), stored.id] : [stored.id];
          valueRef.current = next;
          onChangeRef.current(next);
          setPending((current) => current.filter((entry) => entry.key !== item.key));
        } else {
          const problem: Coded = result?.problem ?? { code: "input.damaged", params: { name: item.name } };
          setPending((current) => current.map((entry) => (entry.key === item.key ? { ...entry, status: "error", problem } : entry)));
        }
      } catch (error) {
        setPending((current) =>
          current.map((entry) => (entry.key === item.key ? { ...entry, status: "error", problem: codedError(error) } : entry)),
        );
      }
    }
  }

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (full) return;
    await add(await filesOfDrop(event.dataTransfer.items, event.dataTransfer.files));
  };
  const remove = (fileId: string) => onChange(value.filter((item) => item !== fileId));
  const limit = field.max_size_mb || DEFAULT_FIELD_MB;
  const accepted = acceptedLabel(keys, list);
  const knowledgeOptions = (knowledge.data ?? []).filter((file) => !value.includes(file.id));

  return (
    <div className="upload-field">
      <div
        className={`upload-drop ${dragging ? "upload-drop--active" : ""} ${full ? "upload-drop--full" : ""}`}
        aria-invalid={invalid}
        onDragOver={(event) => {
          event.preventDefault();
          if (!full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => void onDrop(event)}
      >
        <Upload size={18} aria-hidden />
        <div className="upload-drop__text">
          <strong>{full ? t("inputs.drop.full") : multiple ? t("inputs.drop.title") : t("inputs.drop.titleOne")}</strong>
          <small>
            {t("inputs.drop.limits", {
              formats: field.accept?.length ? accepted : t("inputs.drop.allFormats"),
              size: limit,
            })}
            {multiple && field.max_files ? ` · ${t("inputs.drop.maxFiles", { count: field.max_files })}` : ""}
          </small>
        </div>
        <div className="upload-drop__actions">
          <Button size="sm" icon={Upload} disabled={full} onClick={() => fileRef.current?.click()}>
            {multiple ? t("inputs.chooseFiles") : t("inputs.chooseFile")}
          </Button>
          {multiple ? (
            <Button size="sm" variant="ghost" icon={FolderUp} disabled={full} onClick={() => folderRef.current?.click()}>
              {t("inputs.chooseFolder")}
            </Button>
          ) : null}
        </div>
        <input
          id={id}
          ref={fileRef}
          type="file"
          hidden
          multiple={multiple}
          accept={acceptAttribute(keys, list)}
          aria-label={t("inputs.chooseFiles")}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            void add(files.map((file) => ({ file, name: file.name })));
          }}
        />
        <input
          ref={folderRef}
          type="file"
          hidden
          multiple
          aria-label={t("inputs.chooseFolder")}
          {...{ webkitdirectory: "", directory: "" }}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            void add(files.map((file) => ({ file, name: file.webkitRelativePath || file.name })));
          }}
        />
      </div>
      {value.length || pending.length ? (
        <ul className="upload-list" aria-label={t("inputs.listLabel")}>
          {value.map((fileId) => (
            <GivenFile
              key={fileId}
              fileId={fileId}
              known={uploaded[fileId]}
              knowledgeName={knowledge.data?.find((file) => file.id === fileId)?.name}
              onRemove={() => remove(fileId)}
            />
          ))}
          {pending.map((item) => (
            <li key={item.key} className={`upload-row ${item.status === "error" ? "upload-row--error" : ""}`}>
              <span className="upload-row__icon">
                {item.status === "uploading" ? <Loader2 size={14} className="spin" aria-hidden /> : <FileIcon size={14} aria-hidden />}
              </span>
              <span className="upload-row__main">
                <span className="upload-row__name">{item.name}</span>
                <span className="upload-row__meta">
                  {formatBytes(item.size)} ·{" "}
                  {item.status === "uploading" ? (
                    t("inputs.status.uploading")
                  ) : (
                    <span className="output-field__error" role="alert">
                      {problemText(t, item.problem ?? {})}
                    </span>
                  )}
                </span>
              </span>
              {item.status === "error" ? (
                <IconButton
                  icon={X}
                  label={t("common.removeItem", { name: item.name })}
                  onClick={() => setPending((current) => current.filter((entry) => entry.key !== item.key))}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {knowledgeOptions.length && !full ? (
        <Select
          aria-label={t("inputs.fromKnowledge")}
          value=""
          placeholder={t("inputs.fromKnowledge")}
          options={knowledgeOptions.map((file) => ({ value: file.id, label: file.name }))}
          onChange={(fileId) => fileId && onChange(multiple ? [...value, fileId] : [fileId])}
        />
      ) : null}
    </div>
  );
}

/** A file in the field's value: an uploaded file (with its details) or a knowledge file. */
function GivenFile({
  fileId,
  known,
  knowledgeName,
  onRemove,
}: {
  fileId: string;
  known?: InputFile;
  knowledgeName?: string;
  onRemove?: () => void;
}) {
  const { t } = useTranslation();
  const isInput = fileId.startsWith("in_");
  const query = useQuery({
    queryKey: ["input-file", fileId],
    queryFn: () => api.inputFile(fileId),
    enabled: isInput && !known,
    retry: false,
  });
  const file = known ?? query.data;
  const [open, setOpen] = useState(false);
  if (!isInput)
    return (
      <li className="upload-row">
        <span className="upload-row__icon">
          <BookOpen size={14} aria-hidden />
        </span>
        <span className="upload-row__main">
          <span className="upload-row__name">{knowledgeName ?? fileId}</span>
          <span className="upload-row__meta">{t("inputs.fromKnowledgeBadge")}</span>
        </span>
        {onRemove ? <IconButton icon={X} label={t("common.removeItem", { name: knowledgeName ?? fileId })} onClick={onRemove} /> : null}
      </li>
    );
  if (!file)
    return (
      <li className={`upload-row ${query.isError ? "upload-row--error" : ""}`}>
        <span className="upload-row__icon">
          <FileIcon size={14} aria-hidden />
        </span>
        <span className="upload-row__main">
          <span className="upload-row__name">{fileId}</span>
          <span className="upload-row__meta">{query.isError ? t("inputs.status.missing") : t("common.loading")}</span>
        </span>
        {onRemove ? <IconButton icon={X} label={t("common.removeItem", { name: fileId })} onClick={onRemove} /> : null}
      </li>
    );
  return <InputFileRow file={file} open={open} onToggle={() => setOpen(!open)} onRemove={onRemove} />;
}

/** One uploaded file: name, format, size, what Nodestro read, and its contents on demand. */
export function InputFileRow({
  file,
  open,
  onToggle,
  onRemove,
  actions,
}: {
  file: InputFile;
  open: boolean;
  onToggle: () => void;
  onRemove?: () => void;
  actions?: ReactNode;
}) {
  const { t } = useTranslation();
  const Icon = GROUP_ICON[file.group] ?? FileIcon;
  const summary = fileSummary(t, file);
  return (
    <li className="upload-row upload-row--ready">
      <span className="upload-row__icon">
        <Icon size={14} aria-hidden />
      </span>
      <span className="upload-row__main">
        <span className="upload-row__name" title={file.name}>
          {file.name}
        </span>
        <span className="upload-row__meta">
          <Badge tone="idle">{file.format.toUpperCase()}</Badge> {formatBytes(file.size)}
          {summary ? ` · ${summary}` : ""}
          {file.knowledge_ids.length ? ` · ${t("inputs.inKnowledge")}` : ""}
        </span>
        {file.notes.length ? (
          <span className="upload-row__notes">
            {file.notes.map((note) => (
              <span key={note}>{problemText(t, { code: note, params: { name: file.name } })}</span>
            ))}
          </span>
        ) : null}
        {open ? <FilePreview file={file} /> : null}
      </span>
      <span className="upload-row__actions">
        {actions}
        <IconButton
          icon={open ? ChevronDown : Eye}
          label={open ? t("inputs.hidePreview") : file.group === "archive" ? t("inputs.showContents") : t("inputs.showPreview")}
          onClick={onToggle}
        />
        {onRemove ? <IconButton icon={X} label={t("common.removeItem", { name: file.name })} onClick={onRemove} /> : null}
      </span>
    </li>
  );
}

/** A short description of what a file holds (pages, sheets, rows, entries). */
export function fileSummary(t: (key: string, options?: Record<string, unknown>) => string, file: InputFile): string {
  const info = file.info as Record<string, number | string | undefined>;
  if (file.group === "archive") {
    const files = file.entries.filter((entry) => !entry.is_dir);
    const readable = files.filter((entry) => entry.status === "ok").length;
    return t("inputs.summary.archive", { count: files.length, readable });
  }
  if (typeof info.pages === "number") return t("inputs.summary.pages", { count: info.pages });
  if (typeof info.sheets === "number") return t("inputs.summary.sheets", { count: info.sheets });
  if (typeof info.rows === "number") return t("inputs.summary.rows", { count: info.rows });
  if (typeof info.width === "number" && typeof info.height === "number") return `${info.width} × ${info.height} px`;
  return file.chars ? t("inputs.summary.chars", { count: file.chars }) : "";
}

/** What Nodestro read from a file; for an archive its tree, with every readable entry on demand. */
export function FilePreview({ file, onAdoptMember }: { file: InputFile; onAdoptMember?: (path: string) => void }) {
  const { t } = useTranslation();
  const [member, setMember] = useState<string | null>(null);
  if (file.group === "archive")
    return (
      <div className="upload-preview">
        <ArchiveTreeView file={file} selected={member} onSelect={setMember} onAdopt={onAdoptMember} />
        {member ? <FileTextView fileId={file.id} path={member} /> : <p className="field__hint">{t("inputs.archive.pick")}</p>}
      </div>
    );
  if (file.group === "image")
    return (
      <div className="upload-preview">
        <img className="upload-preview__image" src={api.inputUrl(file.id)} alt={file.name} />
        {file.chars ? <FileTextView fileId={file.id} path="" /> : null}
      </div>
    );
  return (
    <div className="upload-preview">
      <FileTextView fileId={file.id} path="" />
    </div>
  );
}

function FileTextView({ fileId, path }: { fileId: string; path: string }) {
  const { t } = useTranslation();
  const text = useQuery({ queryKey: ["input-text", fileId, path], queryFn: () => api.inputText(fileId, path), retry: false });
  if (text.isLoading) return <p className="field__hint">{t("common.loading")}</p>;
  if (text.isError) return <p className="output-field__error">{problemText(t, codedError(text.error))}</p>;
  const data = text.data;
  if (!data) return null;
  return (
    <div className="upload-text">
      {data.tables.length ? (
        <p className="field__hint">
          {data.tables.map((table) => t("inputs.tableSummary", { name: table.name, count: table.rows, columns: table.columns.length })).join(" · ")}
        </p>
      ) : null}
      <pre>{data.text || t("inputs.noText")}</pre>
      {data.truncated ? <p className="field__hint">{t("inputs.previewCut")}</p> : null}
    </div>
  );
}

const REASONS = ["unsafe_path", "link", "special", "encrypted", "duplicate", "too_large", "ratio", "executable"];

interface TreeProps {
  selected: string | null;
  onSelect: (path: string) => void;
  onAdopt?: (path: string) => void;
}

function ArchiveTreeView({ file, ...props }: { file: InputFile } & TreeProps) {
  const { t } = useTranslation();
  const tree = useMemo(() => archiveTree(file.entries), [file.entries]);
  return (
    <div className="archive-tree" aria-label={t("inputs.archive.label", { name: file.name })}>
      <ul>
        {tree.map((node) => (
          <TreeRow key={node.path} node={node} depth={0} {...props} />
        ))}
      </ul>
    </div>
  );
}

function TreeRow({ node, depth, selected, onSelect, onAdopt }: { node: TreeNode; depth: number } & TreeProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(depth < 1);
  if (!node.entry)
    return (
      <li>
        <button
          type="button"
          className="tree-row tree-row--folder"
          style={{ paddingLeft: depth * 14 }}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <ChevronDown size={12} aria-hidden /> : <ChevronRight size={12} aria-hidden />}
          <Folder size={13} aria-hidden /> {node.name}
        </button>
        {open && node.children.length ? (
          <ul>
            {node.children.map((child) => (
              <TreeRow key={child.path} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} onAdopt={onAdopt} />
            ))}
          </ul>
        ) : null}
      </li>
    );
  const entry = node.entry;
  const readable = entry.status === "ok";
  const reason = entry.reason
    ? t(`inputs.archive.reason.${REASONS.includes(entry.reason) ? entry.reason : "other"}`)
    : entry.status === "nested"
      ? t("inputs.archive.nested")
      : entry.status === "unsupported"
        ? t("inputs.archive.unsupported")
        : "";
  return (
    <li className="tree-item">
      <button
        type="button"
        className={`tree-row ${selected === entry.path ? "tree-row--selected" : ""} ${readable ? "" : "tree-row--muted"}`}
        style={{ paddingLeft: depth * 14 + 16 }}
        disabled={!readable}
        onClick={() => onSelect(entry.path)}
        title={reason || entry.path}
      >
        <FileIcon size={12} aria-hidden /> {node.name}
        <small>
          {formatBytes(entry.size)}
          {reason ? ` · ${reason}` : ""}
        </small>
      </button>
      {onAdopt && readable ? (
        <button type="button" className="tree-row__action" onClick={() => onAdopt(entry.path)}>
          <BookOpen size={12} aria-hidden /> {t("inputs.adopt.short")}
        </button>
      ) : null}
    </li>
  );
}
