import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, ExternalLink, FileImage, FileText, Search, Trash2, Upload } from "lucide-react";
import { type DragEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import { api } from "../api/client";
import { useCollections, useKnowledge, useSettings } from "../api/hooks";
import type { KnowledgeFile, SearchHit } from "../api/types";
import { DiscussIcon } from "../assistant/DiscussButton";
import { toast } from "../components/toast";
import { Badge, Button, Callout, ConfirmIconButton, EmptyState, Field, HelpTip, Hint, PageHeader, Spinner, TextInput, Tooltip } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { formatBytes, formatNumber, relativeTime } from "../lib/format";
import { helpEntry } from "../lib/help";
import { KNOWLEDGE_ACCEPT } from "../lib/knowledge";

const NONE = "\u0000none";


export function KnowledgePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");
  const files = useKnowledge(filter.trim() || undefined);
  const collections = useCollections();
  // "" all files, NONE files without a collection, otherwise the collection's name.
  const [collection, setCollection] = useState("");
  const [target, setTarget] = useState("");
  const shown = (files.data ?? []).filter((file) =>
    collection === "" ? true : collection === NONE ? !file.collection : file.collection === collection,
  );
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  // ?file=<id> (from the global search) highlights that file.
  const [params] = useSearchParams();
  const focused = params.get("file");
  useEffect(() => {
    if (!focused || !files.data) return;
    document.getElementById(`file-${focused}`)?.scrollIntoView({ block: "center" });
  }, [focused, files.data]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["knowledge-collections"] });
    return queryClient.invalidateQueries({ queryKey: ["knowledge"] });
  };
  const upload = useMutation({
    mutationFn: (list: File[]) => api.uploadKnowledge(list, "", target.trim()),
    onSuccess: (added) => {
      void refresh();
      toast.success(added.length === 1 ? t("knowledge.addedOne", { name: added[0].name }) : t("knowledge.added", { count: added.length }));
    },
    onError: toast.error,
  });
  const search = useMutation({ mutationFn: () => api.searchKnowledge(query), onSuccess: setHits, onError: toast.error });

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const list = [...event.dataTransfer.files];
    if (list.length) upload.mutate(list);
  };

  return (
    <div className="page">
      <PageHeader
        title={t("nav.knowledge")}
        doc="wissen"
        description={t("knowledge.description")}
        actions={
          <Hint id="knowledge.upload">
            <Button variant="primary" icon={Upload} busy={upload.isPending} onClick={() => input.current?.click()}>
              {t("knowledge.upload")}
            </Button>
          </Hint>
        }
      />
      <div className="page__body stack">
        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept={KNOWLEDGE_ACCEPT}
          onChange={(event) => {
            const list = [...(event.target.files ?? [])];
            event.target.value = "";
            if (list.length) upload.mutate(list);
          }}
        />
        <div
          className={`dropzone ${dragging ? "dropzone--active" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <Upload size={18} aria-hidden />
          <span>
            {t("knowledge.dropBefore")}{" "}
            <button type="button" className="link-button" onClick={() => input.current?.click()}>
              {t("knowledge.choose")}
            </button>{" "}
            · {t("knowledge.formats")}
          </span>
          <HelpTip id="knowledge.upload" label={t("knowledge.formatsLabel")} />
        </div>
        <div className="row-gap small">
          <label htmlFor="knowledge-target">{t("inputs.collections.uploadTo")}</label>
          <TextInput
            id="knowledge-target"
            className="nd-input--narrow"
            list="knowledge-collections"
            value={target}
            maxLength={120}
            placeholder={t("inputs.collections.none")}
            onChange={(e) => setTarget(e.target.value)}
          />
          <datalist id="knowledge-collections">
            {(collections.data ?? []).map((item) => (
              <option key={item.name} value={item.name} />
            ))}
          </datalist>
          <HelpTip id="knowledge.collections" label={t("inputs.collections.title")} />
        </div>

        <div className="two-column two-column--wide-left">
          <section className="stack" aria-label={t("knowledge.files")}>
            <TextInput
              type="search"
              placeholder={t("knowledge.filterPlaceholder")}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label={t("knowledge.filter")}
            />
            {collections.data?.length ? (
              <div className="chip-row" role="group" aria-label={t("inputs.collections.title")}>
                {[
                  { value: "", label: t("inputs.collections.all") },
                  ...collections.data.map((item) => ({ value: item.name, label: `${item.name} (${item.files})` })),
                  { value: NONE, label: t("inputs.collections.none") },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`chip chip--button ${collection === item.value ? "chip--on" : ""}`}
                    aria-pressed={collection === item.value}
                    onClick={() => setCollection(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
            {files.isLoading ? <Spinner /> : null}
            {files.error ? <Callout tone="danger">
                <ErrorText error={files.error} />
              </Callout> : null}
            {files.data && !files.data.length ? (
              <EmptyState icon={BookOpen} title={filter ? t("knowledge.noMatches") : t("knowledge.empty")}>
                {filter ? t("knowledge.noMatchesText") : t("knowledge.emptyText")}
              </EmptyState>
            ) : null}
            <ul className="file-list">
              {shown.map((file) => (
                <KnowledgeRow key={file.id} file={file} onChanged={refresh} focused={file.id === focused} />
              ))}
            </ul>
          </section>
          <section className="panel stack" aria-label={t("knowledge.searchTitle")}>
            <h2 className="panel__title">
              {t("knowledge.searchTitle")} <HelpTip id="knowledge.search" label={t("knowledge.searchTitle")} />
            </h2>
            <p className="muted small">{t("knowledge.searchText")}</p>
            <form
              className="row-gap"
              onSubmit={(event) => {
                event.preventDefault();
                if (query.trim()) search.mutate();
              }}
            >
              <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("knowledge.searchTerm")} aria-label={t("knowledge.searchTerm")} />
              <Button type="submit" icon={Search} busy={search.isPending}>
                {t("knowledge.search")}
              </Button>
            </form>
            {hits && !hits.length ? <p className="muted small">{t("knowledge.noHits")}</p> : null}
            <ol className="hits">
              {hits?.map((hit, index) => (
                <li key={`${hit.source}-${index}`}>
                  <div className="small">
                    <strong>{hit.title ?? hit.source}</strong> <Tooltip content={t("knowledge.scoreTip")}>
                      <span className="muted has-tip" tabIndex={0}>
                        · {t("knowledge.score", { value: formatNumber(hit.score, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })}
                      </span>
                    </Tooltip>
                  </div>
                  <p className="small">{hit.text}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function KnowledgeRow({ file, onChanged, focused = false }: { file: KnowledgeFile; onChanged: () => void; focused?: boolean }) {
  const { t } = useTranslation();
  const chunksHelp = helpEntry(t, "knowledge.chunks");
  const [description, setDescription] = useState(file.description);
  const [collection, setCollection] = useState(file.collection ?? "");
  const save = useMutation({
    mutationFn: () => api.updateKnowledge(file.id, description, collection.trim()),
    onSuccess: onChanged,
    onError: toast.error,
  });
  const remove = useMutation({
    mutationFn: () => api.deleteKnowledge(file.id),
    onSuccess: () => {
      onChanged();
      toast.success(t("knowledge.removed", { name: file.name }));
    },
    onError: toast.error,
  });
  const Icon = file.kind === "image" ? FileImage : FileText;
  return (
    <li className={`file-row ${focused ? "file-row--focused" : ""}`} id={`file-${file.id}`}>
      <span className="card__avatar">
        <Icon size={16} aria-hidden />
      </span>
      <div className="file-row__main">
        <div className="row-between">
          {/* HTML and SVG would run inside Nodestro's own address when opened, so they download instead. */}
          <a
            href={api.knowledgeUrl(file.id)}
            target="_blank"
            rel="noreferrer"
            className="file-row__name"
            download={/html|svg|xml/.test(file.media_type) ? file.name : undefined}
          >
            {file.name} <ExternalLink size={11} aria-hidden />
          </a>
          <span className="row-gap">
            <DiscussIcon offer={{ kind: "knowledge", refId: file.id, label: file.name }} />
            <ConfirmIconButton icon={Trash2} label={t("knowledge.deleteFile", { name: file.name })} busy={remove.isPending} onConfirm={() => remove.mutate()} />
          </span>
        </div>
        <span className="muted small">
          {formatBytes(file.size)} · {file.media_type}
          {" · "}
          <Tooltip content={chunksHelp.text} doc={chunksHelp.doc}>
            <span className="has-tip" tabIndex={0}>
              {file.chunks
                ? t("knowledge.chunksIndexed", { count: file.chunks })
                : file.kind === "image"
                  ? t("knowledge.imageNotSearchable")
                  : t("knowledge.notIndexed")}
            </span>
          </Tooltip>{" "}
          · {relativeTime(file.created_at)}
          {file.collection ? (
            <>
              {" · "}
              <Badge tone="idle">{file.collection}</Badge>
            </>
          ) : null}
        </span>
        {file.provenance && Object.keys(file.provenance).length ? (
          <details className="small">
            <summary>{t("inputs.provenance.title", { origin: t(`inputs.origins.${file.origin ?? "upload"}`, { defaultValue: file.origin }) })}</summary>
            <dl className="adopt-provenance">
              {Object.entries(file.provenance).map(([key, value]) => (
                <div key={key}>
                  <dt>{t(`inputs.provenance.${key}`, { defaultValue: key })}</dt>
                  <dd>{key === "content_kind" ? t(`inputs.adopt.kinds.${value}`, { defaultValue: value }) : value}</dd>
                </div>
              ))}
            </dl>
          </details>
        ) : null}
        <DocumentInfo file={file} onChanged={onChanged} />
        <Field label={t("common.description")} hint={t("knowledge.descriptionHint")} tip="knowledge.description">
          <TextInput
            value={description}
            placeholder={t("knowledge.descriptionPlaceholder")}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => description !== file.description && save.mutate()}
          />
        </Field>
        <Field label={t("inputs.collections.label")} tip="knowledge.collections">
          <TextInput
            value={collection}
            list="knowledge-collections"
            maxLength={120}
            placeholder={t("inputs.collections.none")}
            onChange={(e) => setCollection(e.target.value)}
            onBlur={() => collection.trim() !== (file.collection ?? "") && save.mutate()}
          />
        </Field>
      </div>
    </li>
  );
}

/** Where the text of a file came from: converted from Word/Excel, or recognised in a scan (OCR). */
function DocumentInfo({ file, onChanged }: { file: KnowledgeFile; onChanged: () => void }) {
  const { t } = useTranslation();
  const settings = useSettings();
  const recognise = useMutation({
    mutationFn: () => api.recognizeText(file.id),
    onSuccess: (result) => {
      onChanged();
      if (result.ocr === "done") toast.success(t("knowledge.ocr.done", { count: result.ocr_words ?? 0 }));
    },
    onError: toast.error,
  });
  const notes = Object.entries(file.notes ?? {});
  if (!file.source_format && !file.scanned && !notes.length) return null;
  return (
    <div className="row-gap small">
      {file.source_format ? (
        <Hint id="files.formats">
          <span tabIndex={0}>
            <Badge tone="running">{t("knowledge.converted", { format: file.source_format.toUpperCase() })}</Badge>
          </span>
        </Hint>
      ) : null}
      {file.scanned ? (
        <>
          <Hint id="files.ocr">
            <span tabIndex={0}>
              <Badge tone={file.ocr === "done" ? (file.ocr_uncertain ? "warning" : "success") : "warning"}>
                {file.ocr === "done"
                  ? t("knowledge.ocr.recognised", { words: file.ocr_words ?? 0, uncertain: file.ocr_uncertain ?? 0 })
                  : file.ocr === "failed"
                    ? t("knowledge.ocr.failed")
                    : t("knowledge.ocr.scan")}
              </Badge>
            </span>
          </Hint>
          {file.ocr !== "done" ? (
            settings.data?.ocr_enabled && settings.data.ocr_available ? (
              <Button size="sm" busy={recognise.isPending} onClick={() => recognise.mutate()}>
                {t("knowledge.ocr.run")}
              </Button>
            ) : (
              <span className="muted">{settings.data?.ocr_available ? t("knowledge.ocr.enableFirst") : t("knowledge.ocr.unavailable")}</span>
            )
          ) : null}
        </>
      ) : null}
      {notes.map(([key, value]) => (
        <span key={key} className="muted">
          {t(`knowledge.notes.${key}`, { value, defaultValue: value })}
        </span>
      ))}
    </div>
  );
}
