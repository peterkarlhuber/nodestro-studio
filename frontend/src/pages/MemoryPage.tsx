import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, FilePlus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import { api } from "../api/client";
import { keys, useMemorySpaces } from "../api/hooks";
import { DiscussIcon } from "../assistant/DiscussButton";
import type { ContextOffer } from "../assistant/store";
import { useContextOffer } from "../assistant/useContextOffer";
import { toast } from "../components/toast";
import { Button, Callout, EmptyState, Field, HelpTip, Hint, IconButton, Modal, PageHeader, Spinner, TextArea, TextInput } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { formatBytes } from "../lib/format";

/** Persistent memory spaces: what agents remember across runs, readable and editable. */
export function MemoryPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const spaces = useMemorySpaces();
  const space = params.get("space") ?? spaces.data?.[0]?.name ?? null;
  const [newOpen, setNewOpen] = useState(false);
  const [newSpace, setNewSpace] = useState("");
  const queryClient = useQueryClient();

  const createSpace = useMutation({
    mutationFn: () => api.writeMemory(newSpace.trim(), "/memories/notes.md", `# ${t("memory.notesTitle")}\n`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.memorySpaces });
      setParams({ space: newSpace.trim() });
      setNewOpen(false);
      setNewSpace("");
    },
    onError: toast.error,
  });

  return (
    <div className="page">
      <PageHeader
        title={t("nav.memory")}
        doc="memory"
        description={t("memory.description")}
        actions={
          <Button icon={FilePlus} onClick={() => setNewOpen(true)}>
            {t("memory.new")}
          </Button>
        }
      />
      <div className="page__body">
        {spaces.isLoading ? <Spinner /> : null}
        {spaces.error ? <Callout tone="danger">
            <ErrorText error={spaces.error} />
          </Callout> : null}
        {spaces.data && !spaces.data.length ? (
          <EmptyState icon={Brain} title={t("memory.empty")}>
            {t("memory.emptyText")}
          </EmptyState>
        ) : null}
        {spaces.data?.length ? (
          <div className="master-detail">
            <ul className="list" aria-label={t("memory.spaces")}>
              {spaces.data.map((item) => (
                <li key={item.name}>
                  <button
                    type="button"
                    className={`list__item ${item.name === space ? "selected" : ""}`}
                    onClick={() => setParams({ space: item.name })}
                    aria-current={item.name === space || undefined}
                  >
                    <span className="list__title">
                      <Brain size={14} aria-hidden /> {item.name}
                    </span>
                    <span className="list__text">
                      {t("agent.knowledge.files", { count: item.files })} · {formatBytes(item.size)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {space ? <SpaceDetail key={space} space={space} onCleared={() => setParams({})} /> : null}
          </div>
        ) : null}
      </div>
      <Modal
        title={t("memory.new")}
        open={newOpen}
        onClose={() => setNewOpen(false)}
        footer={
          <Button variant="primary" busy={createSpace.isPending} disabled={!newSpace.trim()} onClick={() => createSpace.mutate()}>
            {t("common.create")}
          </Button>
        }
      >
        <Field label={t("common.name")} hint={t("memory.nameHint")}>
          <TextInput autoFocus value={newSpace} onChange={(e) => setNewSpace(e.target.value)} placeholder={t("memory.namePlaceholder")} />
        </Field>
      </Modal>
    </div>
  );
}

function SpaceDetail({ space, onCleared }: { space: string; onCleared: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const files = useQuery({ queryKey: keys.memoryFiles(space), queryFn: () => api.memoryFiles(space) });
  const [path, setPath] = useState<string | null>(null);
  const [newPath, setNewPath] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const current = path ?? files.data?.[0]?.path ?? null;
  // Suggested: only the list of files. "Discuss" also shares the file the user has open.
  const offer: ContextOffer = { kind: "memory", refId: space, label: space };
  useContextOffer("memory", offer);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: keys.memoryFiles(space) });
    void queryClient.invalidateQueries({ queryKey: keys.memorySpaces });
  };
  const clear = useMutation({
    mutationFn: () => api.clearMemory(space),
    onSuccess: () => {
      refresh();
      setConfirmClear(false);
      onCleared();
      toast.success(t("memory.cleared", { name: space }));
    },
    onError: toast.error,
  });
  const create = useMutation({
    mutationFn: () => {
      const clean = newPath.trim().replace(/^\/+/, "");
      const full = clean.startsWith("memories/") ? `/${clean}` : `/memories/${clean}`;
      return api.writeMemory(space, full, "");
    },
    onSuccess: (file) => {
      refresh();
      setPath(file.path);
      setNewPath("");
    },
    onError: toast.error,
  });

  return (
    <section className="panel stack" aria-label={t("memory.space", { name: space })}>
      <div className="row-between">
        <h2 className="panel__title">
          {space} <HelpTip id="memory.space" label={t("agent.memory.space")} />
        </h2>
        <span className="row-gap">
          <DiscussIcon offer={offer} paths={current ? [current] : []} label={current ? t("assistant.discussFile", { name: current }) : undefined} />
        <Hint id="memory.clear">
          <Button size="sm" variant="danger" icon={Trash2} onClick={() => setConfirmClear(true)}>
            {t("memory.clear")}
          </Button>
        </Hint>
        </span>
      </div>
      <div className="memory-files">
        <div className="stack-sm">
          {files.data?.map((file) => (
            <button
              key={file.path}
              type="button"
              className={`list__item list__item--compact ${file.path === current ? "selected" : ""}`}
              onClick={() => setPath(file.path)}
            >
              <code>{file.path}</code>
              <span className="muted small">{formatBytes(file.size)}</span>
            </button>
          ))}
          <form
            className="row-gap"
            onSubmit={(event) => {
              event.preventDefault();
              if (newPath.trim()) create.mutate();
            }}
          >
            <TextInput value={newPath} onChange={(e) => setNewPath(e.target.value)} placeholder={t("memory.newFilePlaceholder")} aria-label={t("memory.newFile")} />
            <IconButton icon={FilePlus} label={t("memory.createFile")} type="submit" />
          </form>
        </div>
        {current ? <MemoryFileEditor key={current} space={space} path={current} onChanged={refresh} onDeleted={() => setPath(null)} /> : null}
      </div>
      <Modal
        title={t("memory.clearTitle")}
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" busy={clear.isPending} onClick={() => clear.mutate()}>
              {t("memory.deleteAll")}
            </Button>
          </>
        }
      >
        <p>{t("memory.clearText", { name: space })}</p>
      </Modal>
    </section>
  );
}

function MemoryFileEditor({
  space,
  path,
  onChanged,
  onDeleted,
}: {
  space: string;
  path: string;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const { t } = useTranslation();
  const file = useQuery({ queryKey: ["memory", space, path], queryFn: () => api.memoryFile(space, path) });
  const [content, setContent] = useState<string | null>(null);
  useEffect(() => {
    if (file.data) setContent(file.data.content);
  }, [file.data]);
  const save = useMutation({
    mutationFn: () => api.writeMemory(space, path, content ?? ""),
    onSuccess: () => {
      onChanged();
      void file.refetch();
      toast.success(t("common.saved"));
    },
    onError: toast.error,
  });
  const remove = useMutation({
    mutationFn: () => api.deleteMemoryFile(space, path),
    onSuccess: () => {
      onChanged();
      onDeleted();
    },
    onError: toast.error,
  });
  if (file.isLoading || content === null) return <Spinner />;
  return (
    <div className="stack-sm">
      <div className="row-between">
        <code>{path}</code>
        <div className="row-gap">
          <IconButton icon={Trash2} label={t("memory.deleteFile")} onClick={() => remove.mutate()} />
          <Button size="sm" variant="primary" icon={Save} disabled={content === file.data?.content} busy={save.isPending} onClick={() => save.mutate()}>
            {t("common.save")}
          </Button>
        </div>
      </div>
      <TextArea className="mono" rows={18} value={content} onChange={(e) => setContent(e.target.value)} aria-label={t("memory.contentOf", { path })} />
    </div>
  );
}
