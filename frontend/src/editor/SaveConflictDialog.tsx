// The workflow changed on the server since this editor loaded it, for example in another tab or by a colleague
// (AD-07). Saving now would silently replace that change, so the user chooses. The API has no precondition yet
// (backend item: a version check with 409); the editor compares the server copy right before it saves.

import { Copy, Download, Save } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Workflow, WorkflowIn } from "../api/types";
import { Button, Modal } from "../components/ui";
import { formatDate } from "../lib/format";

export type ConflictChoice = "reload" | "overwrite" | "copy" | "cancel";

/** The parts of a workflow a save would change (ids and timestamps aside). */
function content(workflow: WorkflowIn): string {
  const { name, description, budget_usd, limits, capabilities, nodes, edges } = workflow;
  return JSON.stringify({ name, description, budget_usd, limits, capabilities: capabilities ?? [], nodes, edges });
}

/**
 * Whether the server copy differs from the one the editor started from: a newer ``updated_at`` with other content.
 * A save that only touched the timestamp (or the same content saved again) is no conflict.
 */
export function changedOnServer(base: Workflow | null, current: Workflow): boolean {
  if (!base || base.id !== current.id) return false;
  if (base.updated_at === current.updated_at) return false;
  return content(base) !== content(current);
}

export function SaveConflictDialog({
  current,
  onChoose,
}: {
  /** The server copy; null closes the dialog. */
  current: Workflow | null;
  onChoose: (choice: ConflictChoice) => void;
}) {
  const { t } = useTranslation();
  return (
    <Modal
      title={t("admin.conflict.title")}
      wide
      open={current !== null}
      onClose={() => onChoose("cancel")}
      footer={
        <>
          <Button variant="ghost" onClick={() => onChoose("cancel")}>
            {t("admin.conflict.keepEditing")}
          </Button>
          <Button icon={Copy} onClick={() => onChoose("copy")} data-testid="conflict-copy">
            {t("admin.conflict.copy")}
          </Button>
          <Button icon={Download} onClick={() => onChoose("reload")} data-testid="conflict-reload">
            {t("admin.conflict.reload")}
          </Button>
          <Button variant="danger" icon={Save} onClick={() => onChoose("overwrite")} data-testid="conflict-overwrite">
            {t("admin.conflict.overwrite")}
          </Button>
        </>
      }
    >
      <div className="stack-sm" data-testid="save-conflict">
        <p>{t("admin.conflict.text", { time: current ? formatDate(current.updated_at) : "" })}</p>
        <ul className="small">
          <li>{t("admin.conflict.reloadHint")}</li>
          <li>{t("admin.conflict.copyHint")}</li>
          <li>{t("admin.conflict.overwriteHint")}</li>
        </ul>
        <p className="muted small">{t("admin.conflict.versions")}</p>
      </div>
    </Modal>
  );
}
