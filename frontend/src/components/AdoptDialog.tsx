// Taking content over into knowledge: uploaded files (or files of a ZIP), result files, step
// results and agent proposals.
//
// Nothing is stored before the person has seen what will be stored and confirmed it. The
// confirmation belongs to the checked content: editing the text or choosing another collection
// needs a new check, and the backend refuses a confirmation for content it did not show.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Check, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { useCollections } from "../api/hooks";
import type { AdoptCheck, AdoptSource, ContentKind } from "../api/types";
import { ErrorText, ProblemText } from "../lib/errors";
import { formatBytes } from "../lib/format";
import { toast } from "./toast";
import { Badge, Button, Callout, Field, HelpTip, Modal, Select, TextArea, TextInput } from "./ui";

const NEW = "__new__";
const KINDS: ContentKind[] = ["extracted", "generated", "assumption"];

export function AdoptDialog({
  open,
  onClose,
  sources,
  collection: suggested = "",
  onAdopted,
}: {
  open: boolean;
  onClose: () => void;
  sources: AdoptSource[];
  /** The collection proposed first (e.g. from the agent's settings). */
  collection?: string;
  onAdopted?: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const collections = useCollections();
  const known = collections.data ?? [];
  const [choice, setChoice] = useState<string>(NEW);
  const [newName, setNewName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<AdoptSource[]>(sources);
  const [checked, setChecked] = useState<AdoptCheck[] | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const collection = (choice === NEW ? newName : choice).trim();

  useEffect(() => {
    if (!open) return;
    setItems(sources);
    setChecked(null);
    setDirty(false);
    setConfirmed(false);
    setDescription("");
    const existing = known.find((item) => item.name === suggested);
    setChoice(existing ? existing.name : known.length && !suggested ? known[0].name : NEW);
    setNewName(existing ? "" : suggested);
    // Only when the dialog opens: later changes of the collections must not reset the choices.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const check = useMutation({
    mutationFn: () => api.checkAdoption({ items, collection, description }),
    onSuccess: (result) => {
      setChecked(result);
      setDirty(false);
      setConfirmed(false);
      // Editable content starts from what Nodestro read, so the person edits the real text.
      setItems((current) =>
        current.map((item, index) =>
          result[index]?.editable && item.text == null
            ? { ...item, text: result[index].text, content_kind: result[index].content_kind, title: item.title || stem(result[index].name) }
            : item,
        ),
      );
    },
  });
  const adopt = useMutation({
    mutationFn: () => {
      const ready = (checked ?? []).map((item, index) => ({ item, source: items[index] })).filter(({ item }) => !item.problem);
      return api.adopt({
        items: ready.map(({ source }) => source),
        tokens: ready.map(({ item }) => item.token),
        collection,
        description,
        confirmed,
      });
    },
    onSuccess: (outcome) => {
      const duplicates = outcome.skipped.filter((item) => item.reason === "duplicate").length;
      toast.success(t("inputs.adopt.done", { count: outcome.added.length, duplicates }));
      void queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      void queryClient.invalidateQueries({ queryKey: ["knowledge-collections"] });
      void queryClient.invalidateQueries({ queryKey: ["run-inputs"] });
      void queryClient.invalidateQueries({ queryKey: ["run"] });
      onAdopted?.();
      onClose();
    },
  });

  const change = (index: number, patch: Partial<AdoptSource>) => {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    setDirty(true);
    setConfirmed(false);
  };
  const ready = (checked ?? []).filter((item) => !item.problem);
  const canAdopt = checked !== null && !dirty && confirmed && collection !== "" && ready.length > 0;

  return (
    <Modal
      title={t("inputs.adopt.title")}
      open={open}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          {checked === null || dirty ? (
            <Button variant="primary" icon={RefreshCw} busy={check.isPending} disabled={!collection} onClick={() => check.mutate()}>
              {checked === null ? t("inputs.adopt.check") : t("inputs.adopt.recheck")}
            </Button>
          ) : (
            <Button variant="primary" icon={Check} busy={adopt.isPending} disabled={!canAdopt} onClick={() => adopt.mutate()}>
              {t("inputs.adopt.confirm", { count: ready.length })}
            </Button>
          )}
        </>
      }
    >
      <p className="field__hint">
        {t("inputs.adopt.intro")} <HelpTip id="inputs.adopt" label={t("inputs.adopt.title")} />
      </p>
      <div className="grid-2">
        <Field label={t("inputs.adopt.collection")} tip="knowledge.collections">
          <Select
            value={choice}
            onChange={(value) => {
              setChoice(value);
              setDirty(checked !== null);
              setConfirmed(false);
            }}
            options={[
              ...known.map((item) => ({ value: item.name, label: t("inputs.adopt.collectionOption", { name: item.name, count: item.files }) })),
              { value: NEW, label: t("inputs.adopt.newCollection") },
            ]}
          />
        </Field>
        {choice === NEW ? (
          <Field label={t("inputs.adopt.newCollectionName")}>
            <TextInput
              value={newName}
              maxLength={120}
              placeholder={t("inputs.adopt.newCollectionPlaceholder")}
              onChange={(e) => {
                setNewName(e.target.value);
                setDirty(checked !== null);
                setConfirmed(false);
              }}
            />
          </Field>
        ) : null}
      </div>
      <Field label={t("inputs.adopt.description")}>
        <TextInput value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      {checked === null ? (
        <p className="muted small">{t("inputs.adopt.checkFirst", { count: sources.length })}</p>
      ) : (
        <ul className="adopt-list" aria-label={t("inputs.adopt.items")}>
          {checked.map((item, index) => (
            <li key={index} className={`adopt-item ${item.problem ? "adopt-item--problem" : ""}`}>
              <div className="row-between">
                <strong>{item.name}</strong>
                <span className="row-gap">
                  {item.format ? <Badge>{item.format.toUpperCase()}</Badge> : null}
                  {item.size ? <span className="muted small">{formatBytes(item.size)}</span> : null}
                  {!item.problem ? (
                    <Badge tone={item.indexable ? "success" : "idle"}>
                      {item.indexable ? t("inputs.adopt.searchable") : t("inputs.adopt.storedOnly")}
                    </Badge>
                  ) : null}
                </span>
              </div>
              {item.problem ? (
                <p className="output-field__error">
                  <ProblemText item={item.problem} compact />
                </p>
              ) : null}
              {item.duplicate ? (
                <Callout tone="info">{t("inputs.adopt.duplicate", { name: item.duplicate.name })}</Callout>
              ) : null}
              {item.similar.length ? (
                <Callout tone="warning">
                  {t("inputs.adopt.similar", { names: item.similar.map((entry) => entry.name).join(", ") })}
                </Callout>
              ) : null}
              {item.editable && !item.problem ? (
                <>
                  <div className="grid-2">
                    <Field label={t("inputs.adopt.itemTitle")}>
                      <TextInput value={items[index]?.title ?? ""} maxLength={120} onChange={(e) => change(index, { title: e.target.value })} />
                    </Field>
                    <Field label={t("inputs.adopt.kind")}>
                      <Select
                        value={items[index]?.content_kind ?? item.content_kind ?? "generated"}
                        onChange={(value) => change(index, { content_kind: value as ContentKind })}
                        options={KINDS.map((kind) => ({ value: kind, label: t(`inputs.adopt.kinds.${kind}`) }))}
                      />
                    </Field>
                  </div>
                  <Field label={t("inputs.adopt.content")} hint={t("inputs.adopt.contentHint")}>
                    <TextArea rows={8} value={items[index]?.text ?? ""} onChange={(e) => change(index, { text: e.target.value })} />
                  </Field>
                </>
              ) : !item.problem && item.preview ? (
                <details>
                  <summary>{t("inputs.adopt.preview")}</summary>
                  <pre className="adopt-preview">{item.preview}</pre>
                </details>
              ) : null}
              {Object.keys(item.provenance).length ? (
                <details>
                  <summary>{t("inputs.adopt.provenance")}</summary>
                  <dl className="adopt-provenance">
                    {Object.entries(item.provenance).map(([key, value]) => (
                      <div key={key}>
                        <dt>{t(`inputs.provenance.${key}`, { defaultValue: key })}</dt>
                        <dd>{key === "content_kind" ? t(`inputs.adopt.kinds.${value}`, { defaultValue: value }) : value}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {checked !== null && !dirty && ready.length ? (
        <label className="adopt-confirm">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
          <span>{t("inputs.adopt.confirmText", { count: ready.length, collection: collection || "–" })}</span>
        </label>
      ) : null}
      {dirty ? <Callout tone="info">{t("inputs.adopt.changed")}</Callout> : null}
      {check.error || adopt.error ? (
        <Callout tone="danger">
          <ErrorText error={check.error ?? adopt.error} />
        </Callout>
      ) : null}
      <p className="muted small">
        <BookOpen size={12} aria-hidden /> {t("inputs.adopt.notMemory")}
      </p>
    </Modal>
  );
}

function stem(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}
