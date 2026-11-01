// The question before unsaved changes would be lost (leaving the page, opening another item).
// Shared by the workflow editor and the agent library, so both ask the same way.

import { RotateCcw, Save } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Button, Modal } from "./ui";

export function UnsavedChangesModal({
  open,
  text,
  onStay,
  onDiscard,
  onSave,
  saving,
}: {
  open: boolean;
  /** What would be lost; a general sentence by default. */
  text?: string;
  /** Keep editing: nothing happens, the dialog closes. */
  onStay: () => void;
  onDiscard: () => void;
  /** Save, then continue; leave it out where saving first is not possible. */
  onSave?: () => void;
  saving?: boolean;
}) {
  const { t } = useTranslation();
  const stayRef = useRef<HTMLButtonElement | null>(null);
  // Staying is the safe default: Enter or a stray key press keeps every change.
  useEffect(() => {
    if (open) window.setTimeout(() => stayRef.current?.focus(), 0);
  }, [open]);
  return (
    <Modal
      title={t("editor.canvas.unsaved")}
      open={open}
      onClose={onStay}
      footer={
        <>
          <Button ref={stayRef} variant="ghost" onClick={onStay} data-testid="unsaved-stay">
            {t("common.keepEditing")}
          </Button>
          <Button variant="danger" icon={RotateCcw} onClick={onDiscard} data-testid="unsaved-discard">
            {t("common.discard")}
          </Button>
          {onSave ? (
            <Button variant="primary" icon={Save} busy={saving} onClick={onSave} data-testid="unsaved-save">
              {t("editor.page.saveAndContinue")}
            </Button>
          ) : null}
        </>
      }
    >
      <p>{text ?? t("editor.page.unsavedText")}</p>
    </Modal>
  );
}
