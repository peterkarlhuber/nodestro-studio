// Version history of a workflow: every save is kept as a numbered version with date and an
// optional description. Restoring a version saves it as a new version, so no version is lost.
// Undo/redo in the editor is independent of this and unchanged.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { History, Pencil, RotateCcw, Save } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { VersionSummary, Workflow } from "../api/types";
import { WorkflowTestStatus } from "../automation/WorkflowTestStatus";
import { toast } from "../components/toast";
import { Badge, Button, Callout, Field, IconButton, Modal, Spinner, TextInput } from "../components/ui";
import { ErrorText, LocalError } from "../lib/errors";
import { formatDate } from "../lib/format";
import { hasChanges, versionChanges } from "../lib/versionDiff";
import { useEditor } from "./store";

function Changes({ workflowId, version }: { workflowId: string; version: VersionSummary }) {
  const { t } = useTranslation();
  const full = useQuery({
    queryKey: [...keys.versions(workflowId), version.number],
    queryFn: () => api.version(workflowId, version.number),
  });
  if (full.isLoading) return <Spinner />;
  if (!full.data) return null;
  // What restoring this version would change compared with the editor.
  const changes = versionChanges(useEditor.getState().toWorkflow(), full.data.snapshot);
  if (!hasChanges(changes)) return <p className="muted small">{t("versions.sameAsEditor")}</p>;
  return (
    <ul className="version-changes small">
      {changes.renamed ? <li>{t("versions.changes.renamed", { name: full.data.snapshot.name })}</li> : null}
      {changes.added.length ? <li>{t("versions.changes.added", { names: changes.added.join(", ") })}</li> : null}
      {changes.removed.length ? <li>{t("versions.changes.removed", { names: changes.removed.join(", ") })}</li> : null}
      {changes.changed.length ? <li>{t("versions.changes.changed", { names: changes.changed.join(", ") })}</li> : null}
      {changes.connectionsAdded + changes.connectionsRemoved ? (
        <li>
          {t("versions.changes.connections", { added: changes.connectionsAdded, removed: changes.connectionsRemoved })}
        </li>
      ) : null}
      {changes.settingsChanged ? <li>{t("versions.changes.settings")}</li> : null}
    </ul>
  );
}

function VersionRow({
  workflowId,
  version,
  onRestore,
}: {
  workflowId: string;
  version: VersionSummary;
  onRestore: (version: VersionSummary) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(version.description);
  const [open, setOpen] = useState(false);
  const describe = useMutation({
    mutationFn: () => api.describeVersion(workflowId, version.number, description),
    onSuccess: () => {
      setEditing(false);
      void queryClient.invalidateQueries({ queryKey: keys.versions(workflowId) });
    },
    onError: (error) => toast.error(error),
  });
  return (
    <li className="version-row" data-testid="version-row">
      <div className="version-row__head">
        <strong>{t("versions.number", { number: version.number })}</strong>
        <span className="muted small">{formatDate(version.created_at)}</span>
        {version.current ? <Badge tone="success">{t("versions.current")}</Badge> : null}
        {version.restored_from ? <Badge>{t("versions.restoredFrom", { number: version.restored_from })}</Badge> : null}
        <span className="muted small">{t("versions.size", { count: version.agents })}</span>
        <span className="version-row__actions">
          <IconButton icon={Pencil} label={t("versions.describe")} onClick={() => setEditing(!editing)} />
          <Button size="sm" variant="ghost" onClick={() => setOpen(!open)} aria-expanded={open}>
            {open ? t("versions.hideChanges") : t("versions.showChanges")}
          </Button>
          {!version.current ? (
            <Button size="sm" icon={RotateCcw} onClick={() => onRestore(version)}>
              {t("versions.restore")}
            </Button>
          ) : null}
        </span>
      </div>
      {editing ? (
        <div className="row-gap">
          <TextInput
            aria-label={t("versions.description")}
            value={description}
            maxLength={200}
            onChange={(event) => setDescription(event.target.value)}
          />
          <Button size="sm" variant="primary" busy={describe.isPending} onClick={() => describe.mutate()}>
            {t("common.save")}
          </Button>
        </div>
      ) : version.description ? (
        <p className="version-row__description">{version.description}</p>
      ) : null}
      {open ? <Changes workflowId={workflowId} version={version} /> : null}
    </li>
  );
}

export function VersionsDialog({
  open,
  onClose,
  save,
  onRestored,
}: {
  open: boolean;
  onClose: () => void;
  save: (note?: string) => Promise<string | null>;
  onRestored: (workflow: Workflow) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const workflowId = useEditor((s) => s.workflowId) ?? "";
  const dirty = useEditor((s) => s.dirty);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<VersionSummary | null>(null);
  const versions = useQuery({ queryKey: keys.versions(workflowId), queryFn: () => api.versions(workflowId), enabled: open && Boolean(workflowId) });
  // The saved version the editor holds; its test status shows above the list (Q-1).
  const current = open ? versions.data?.find((item) => item.current)?.number ?? null : null;
  const saveNow = useMutation({
    mutationFn: () => save(note.trim() || undefined),
    onSuccess: (id) => {
      if (!id) return;
      setNote("");
      toast.success(t("versions.saved"));
      void queryClient.invalidateQueries({ queryKey: keys.versions(workflowId) });
    },
  });
  const restore = useMutation({
    // With ``saveFirst`` the unsaved changes become a version of their own before the restore, so nothing is lost.
    mutationFn: async ({ version, saveFirst }: { version: VersionSummary; saveFirst?: boolean }) => {
      if (saveFirst) {
        const saved = await save(t("versions.beforeRestoreNote", { number: version.number }));
        if (!saved) throw new LocalError("workflow.save_failed");
      }
      return api.restoreVersion(workflowId, version.number);
    },
    onSuccess: (workflow, { version }) => {
      setPending(null);
      onRestored(workflow);
      toast.success(t("versions.restored", { number: version.number }));
      void queryClient.invalidateQueries({ queryKey: keys.versions(workflowId) });
    },
    onError: (error) => toast.error(error),
  });
  return (
    <Modal title={t("versions.title")} open={open} onClose={onClose} wide>
      <p className="muted small">
        <History size={13} aria-hidden /> {t("versions.intro")}
      </p>
      <Field label={t("versions.note")} htmlFor="version-note" hint={t("versions.noteHint")}>
        <div className="row-gap">
          <TextInput
            id="version-note"
            value={note}
            maxLength={200}
            placeholder={t("versions.notePlaceholder")}
            onChange={(event) => setNote(event.target.value)}
          />
          <Button icon={Save} variant="primary" busy={saveNow.isPending} disabled={!dirty} onClick={() => saveNow.mutate()}>
            {t("versions.saveVersion")}
          </Button>
        </div>
      </Field>
      {current ? <WorkflowTestStatus workflowId={workflowId} version={current} /> : null}
      {versions.isLoading ? <Spinner /> : null}
      {versions.error ? (
        <Callout tone="danger">
          <ErrorText error={versions.error} />
        </Callout>
      ) : null}
      {versions.data && !versions.data.length ? <p className="muted">{t("versions.empty")}</p> : null}
      <ul className="version-list">
        {versions.data?.map((version) => (
          <VersionRow key={version.number} workflowId={workflowId} version={version} onRestore={setPending} />
        ))}
      </ul>
      <Modal
        title={t("versions.restoreTitle", { number: pending?.number ?? 0 })}
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>
              {t("common.cancel")}
            </Button>
            {dirty ? (
              <Button
                icon={Save}
                busy={restore.isPending && restore.variables?.saveFirst}
                onClick={() => pending && restore.mutate({ version: pending, saveFirst: true })}
                data-testid="restore-save-first"
              >
                {t("versions.saveAndRestore")}
              </Button>
            ) : null}
            <Button
              variant={dirty ? "danger" : "primary"}
              icon={RotateCcw}
              busy={restore.isPending && !restore.variables?.saveFirst}
              onClick={() => pending && restore.mutate({ version: pending })}
            >
              {dirty ? t("versions.restoreDiscard") : t("versions.restore")}
            </Button>
          </>
        }
      >
        <p>{t("versions.restoreText", { number: pending?.number ?? 0 })}</p>
        {dirty ? <Callout tone="warning">{t("versions.restoreDirty")}</Callout> : null}
      </Modal>
    </Modal>
  );
}
