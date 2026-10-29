import { useQuery } from "@tanstack/react-query";
import { Check, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys, useKnowledge, useMemorySpaces, useRuns, useTemplates, useTools, useWorkflows } from "../api/hooks";
import type { AttachRequest, AttachmentKind } from "../api/types";
import { Button, Modal, Segmented, Spinner, TextInput, Toggle } from "../components/ui";
import { fold } from "../docs/search";
import { formatDate } from "../lib/format";
import { KIND_ICON } from "./MessageView";

interface Item {
  id: string;
  label: string;
  hint: string;
}

const KINDS: AttachmentKind[] = ["workflow", "agent", "tool", "memory", "knowledge", "run"];

function useItems(kind: AttachmentKind): { items: Item[]; loading: boolean } {
  const { t } = useTranslation();
  const workflows = useWorkflows();
  const templates = useTemplates();
  const tools = useTools();
  const spaces = useMemorySpaces();
  const knowledge = useKnowledge();
  const runs = useRuns();
  switch (kind) {
    case "workflow":
      return {
        loading: workflows.isLoading,
        items: (workflows.data ?? []).map((item) => ({ id: item.id, label: item.name, hint: t("assistant.picker.agents", { count: item.agents }) })),
      };
    case "agent":
      return {
        loading: templates.isLoading,
        items: (templates.data ?? []).map((item) => ({ id: item.id, label: item.agent.name, hint: item.agent.description })),
      };
    case "tool":
      return {
        loading: tools.isLoading,
        items: (tools.data ?? []).map((item) => ({ id: item.name, label: item.name, hint: t(`tools.kind.${item.kind}`) })),
      };
    case "memory":
      return {
        loading: spaces.isLoading,
        items: (spaces.data ?? []).map((item) => ({ id: item.name, label: item.name, hint: t("assistant.picker.files", { count: item.files }) })),
      };
    case "knowledge":
      return {
        loading: knowledge.isLoading,
        items: (knowledge.data ?? []).map((item) => ({ id: item.id, label: item.name, hint: item.description || item.media_type })),
      };
    case "run":
      return {
        loading: runs.isLoading,
        items: (runs.data ?? []).map((item) => ({
          id: item.id,
          label: item.workflow_name,
          hint: `${t(`status.${item.status}.label`)} · ${formatDate(item.created_at)}`,
        })),
      };
  }
}

/** Memory: the user picks the files whose content may be shared; the list of files always goes. */
function MemoryFiles({ space, selected, onChange }: { space: string; selected: string[]; onChange: (paths: string[]) => void }) {
  const { t } = useTranslation();
  const files = useQuery({ queryKey: keys.memoryFiles(space), queryFn: () => api.memoryFiles(space) });
  if (files.isLoading) return <Spinner />;
  return (
    <fieldset className="picker-files">
      <legend className="small">{t("assistant.picker.memoryFiles")}</legend>
      {(files.data ?? []).map((file) => (
        <label key={file.path} className="picker-file">
          <input
            type="checkbox"
            checked={selected.includes(file.path)}
            onChange={(event) =>
              onChange(event.target.checked ? [...selected, file.path] : selected.filter((path) => path !== file.path))
            }
          />
          <code>{file.path}</code>
        </label>
      ))}
    </fieldset>
  );
}

/** Choose Nodestro objects to attach; each one is attached only on "Attach". */
export function AttachPicker({ open, onClose, onAttach }: { open: boolean; onClose: () => void; onAttach: (request: AttachRequest) => Promise<boolean> }) {
  const { t } = useTranslation();
  const [kind, setKind] = useState<AttachmentKind>("workflow");
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const [content, setContent] = useState(false);
  const [busy, setBusy] = useState(false);
  const { items, loading } = useItems(kind);
  const words = fold(query).split(/\s+/).filter(Boolean);
  const shown = items.filter((item) => words.every((word) => fold(`${item.label} ${item.hint}`).includes(word)));
  const reset = (next: AttachmentKind) => {
    setKind(next);
    setChosen(null);
    setPaths([]);
    setContent(false);
  };
  const attach = async () => {
    if (!chosen) return;
    setBusy(true);
    const ok = await onAttach({ kind, ref_id: chosen, paths: kind === "memory" ? paths : [], include_content: kind === "knowledge" && content });
    setBusy(false);
    if (ok) {
      setChosen(null);
      onClose();
    }
  };
  return (
    <Modal
      title={t("assistant.picker.title")}
      open={open}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" icon={Check} disabled={!chosen} busy={busy} onClick={() => void attach()} data-testid="picker-attach">
            {t("assistant.picker.attach")}
          </Button>
        </>
      }
    >
      <div className="stack-sm">
        <p className="muted small">{t("assistant.picker.text")}</p>
        <Segmented<AttachmentKind>
          label={t("assistant.picker.kind")}
          value={kind}
          onChange={reset}
          options={KINDS.map((value) => ({ value, label: t(`assistant.kinds.${value}`), icon: KIND_ICON[value] }))}
        />
        <div className="picker-search">
          <Search size={14} aria-hidden />
          <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("assistant.picker.search")} aria-label={t("assistant.picker.search")} />
        </div>
        {loading ? <Spinner /> : null}
        {!loading && !shown.length ? <p className="muted small">{t("assistant.picker.empty")}</p> : null}
        {kind === "agent" ? <p className="muted small">{t("assistant.picker.agentNote")}</p> : null}
        <ul className="picker-list" role="listbox" aria-label={t(`assistant.kinds.${kind}`)}>
          {shown.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={chosen === item.id}
                className={`picker-item ${chosen === item.id ? "selected" : ""}`}
                onClick={() => {
                  setChosen(item.id);
                  setPaths([]);
                }}
                data-testid="picker-item"
              >
                <strong>{item.label}</strong>
                <span className="muted small">{item.hint}</span>
              </button>
            </li>
          ))}
        </ul>
        {kind === "memory" && chosen ? <MemoryFiles space={chosen} selected={paths} onChange={setPaths} /> : null}
        {kind === "knowledge" && chosen ? (
          <Toggle checked={content} onChange={setContent} label={t("assistant.picker.includeContent")} description={t("assistant.picker.includeContentHint")} />
        ) : null}
      </div>
    </Modal>
  );
}
