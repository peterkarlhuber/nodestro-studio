// Settings panels for the data of this installation (N-15): export everything as readable files, delete everything,
// and the secrets a restore could not bring along (they are never part of a backup). Only for the "install"
// permission, like backup and restore; the API checks it again.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, KeyRound, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import type { DeleteResult } from "../api/types";
import { Button, Callout, Field, HelpTip, Modal, TextInput } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { settingsHref } from "../lib/settingsLink";

/** The exact confirmation POST /api/data/delete-all requires, in every interface language. */
export const DELETE_ALL_CONFIRMATION = "delete all data";

/** A secret to enter again, from its label (`provider:<name>`, `mcp:<id>`, `connection:<id>`); null for others. */
export interface SecretToReenter {
  kind: "provider" | "mcp" | "connection";
  id: string;
  /** Where the secret is entered again. */
  href: string;
}

export function secretToReenter(label: string): SecretToReenter | null {
  const match = /^(provider|mcp|connection):(.+)$/.exec(label);
  if (!match) return null;
  const [, kind, id] = match;
  if (kind === "provider") return { kind, id, href: settingsHref(`provider-${id}`) };
  if (kind === "mcp") return { kind, id, href: `/tools?tab=services&server=${encodeURIComponent(id)}` };
  return { kind: "connection", id, href: `/tools?tab=connections&connection=${encodeURIComponent(id)}` };
}

/** Where the list survives the reload after a restore (this tab only; labels, never secret values). */
const REENTER_KEY = "nodestro.secretsToReenter";

export function rememberSecretsToReenter(labels: string[]): void {
  try {
    if (labels.length) sessionStorage.setItem(REENTER_KEY, JSON.stringify(labels));
    else sessionStorage.removeItem(REENTER_KEY);
  } catch {
    // Without storage the list is shown only before the reload.
  }
}

export function rememberedSecretsToReenter(): string[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(REENTER_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

/** The secrets to enter again, each with a link to the place where it is entered. Never shows a secret value. */
export function SecretsToReenter({ labels, onDone }: { labels: string[]; onDone?: () => void }) {
  const { t } = useTranslation();
  const items = labels.map(secretToReenter).filter((item): item is SecretToReenter => item !== null);
  if (!items.length) return null;
  return (
    <Callout tone="warning">
      <div className="stack-sm" data-testid="secrets-to-reenter">
        <strong>
          <KeyRound size={14} aria-hidden /> {t("backup.reenter.title", { count: items.length })}
        </strong>
        <span>{t("backup.reenter.text")}</span>
        <ul className="stack-sm">
          {items.map((item) => (
            <li key={`${item.kind}:${item.id}`} data-testid={`reenter-${item.kind}-${item.id}`}>
              {t(`backup.reenter.kinds.${item.kind}`)} <code>{item.id}</code> · <Link to={item.href}>{t("backup.reenter.open")}</Link>
            </li>
          ))}
        </ul>
        {onDone ? (
          <div>
            <Button size="sm" variant="ghost" onClick={onDone} data-testid="secrets-to-reenter-done">
              {t("backup.reenter.done")}
            </Button>
          </div>
        ) : null}
      </div>
    </Callout>
  );
}

/** Export everything (readable files without secrets) and delete everything (typed confirmation). */
export function DataPanel() {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);
  return (
    <section className="panel stack" aria-labelledby="settings-data" data-testid="data">
      <h2 className="panel__title" id="settings-data">
        <Download size={15} aria-hidden /> {t("backup.data.title")} <HelpTip id="settings.data" label={t("backup.data.title")} />
      </h2>
      <p className="muted small">{t("backup.data.intro")}</p>
      <div className="row-gap">
        <a className="nd-button nd-button--default nd-button--md" href={api.dataExportUrl} download data-testid="data-export">
          <Download size={15} aria-hidden /> {t("backup.data.export")}
        </a>
        <Button variant="danger" icon={Trash2} onClick={() => setDeleting(true)} data-testid="data-delete-open">
          {t("backup.data.delete")}
        </Button>
      </div>
      <p className="muted small">{t("backup.data.exportNote")}</p>
      {deleting ? <DeleteAllDialog onClose={() => setDeleting(false)} /> : null}
    </section>
  );
}

function DeleteAllDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<DeleteResult | null>(null);
  const remove = useMutation({
    mutationFn: () => api.deleteAllData(typed.trim()),
    onSuccess: (data) => {
      setResult(data);
      queryClient.clear();
    },
  });
  const restart = () => window.location.assign("/");
  if (result)
    return (
      <Modal
        title={t("backup.data.deletedTitle")}
        open
        onClose={restart}
        footer={
          <Button variant="primary" data-autofocus onClick={restart} data-testid="data-deleted-restart">
            {t("backup.data.restart")}
          </Button>
        }
      >
        <div className="stack-sm" data-testid="data-deleted">
          {result.complete ? (
            <Callout tone="brand">{t("backup.data.deleted")}</Callout>
          ) : (
            <Callout tone="warning">
              {t("backup.data.deletedPartly", { count: result.left?.length ?? 0 })}
              {result.left?.length ? (
                <ul className="small">
                  {result.left.map((entry) => (
                    <li key={entry}>
                      <code>{entry}</code>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Callout>
          )}
        </div>
      </Modal>
    );
  const confirmed = typed.trim() === DELETE_ALL_CONFIRMATION;
  return (
    <Modal
      title={t("backup.data.deleteTitle")}
      open
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" data-autofocus onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="danger"
            icon={Trash2}
            busy={remove.isPending}
            disabled={!confirmed}
            onClick={() => remove.mutate()}
            data-testid="data-delete-submit"
          >
            {t("backup.data.deleteNow")}
          </Button>
        </>
      }
    >
      <div className="stack-sm">
        <Callout tone="danger">{t("backup.data.deleteWarning")}</Callout>
        <ul className="small stack-sm">
          <li>{t("backup.data.deleteNoUndo")}</li>
          <li>{t("backup.data.deleteNoBackup")}</li>
          <li>{t("backup.data.deleteRuns")}</li>
        </ul>
        <p className="small">
          <a href={api.backupUrl} download>
            {t("backup.data.backupFirst")}
          </a>
        </p>
        <Field label={t("backup.data.typeLabel")} hint={t("backup.data.typeHint", { phrase: DELETE_ALL_CONFIRMATION })}>
          <TextInput
            value={typed}
            autoComplete="off"
            spellCheck={false}
            placeholder={DELETE_ALL_CONFIRMATION}
            onChange={(event) => setTyped(event.target.value)}
            data-testid="data-delete-confirm"
          />
        </Field>
        {remove.error ? (
          <Callout tone="danger">
            <span data-testid="data-delete-error">
              <ErrorText error={remove.error} />
            </span>
          </Callout>
        ) : null}
      </div>
    </Modal>
  );
}
