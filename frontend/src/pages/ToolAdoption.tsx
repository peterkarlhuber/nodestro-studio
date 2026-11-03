// Adopting an AI-created tool as one's own code (ADR-0006, decision R-4), and the warning for pasted code.
//
// AI-created code runs only isolated. On the desktop, the local owner may take over one version of such a tool as
// their own after reading its code and tests and confirming a warning; it then runs like code they wrote, without
// isolation. The confirmation names exactly the content shown (its content_hash), the API checks it again, writes
// the audit trail and refuses everywhere but the desktop. Off the desktop the action is not offered at all.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, UserCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAccess } from "../api/access";
import { api } from "../api/client";
import { keys, useSettings } from "../api/hooks";
import type { SandboxSelection, ToolInfo } from "../api/types";
import { CodeEditor } from "../components/CodeEditor";
import { toast } from "../components/toast";
import { Button, Callout, Field, Modal } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { relativeTime } from "../lib/format";

/** Whether the tool can be adopted here: an AI-created (untrusted) tool with code, on the desktop, by its owner. */
export function canAdopt(tool: ToolInfo, profile: string, admin: boolean): boolean {
  return (
    profile === "desktop" &&
    admin &&
    tool.trust === "untrusted" &&
    (tool.kind === "generated" || tool.kind === "custom") &&
    !!tool.code &&
    !!tool.content_hash
  );
}

/**
 * What adopting changes for this tool on this computer, as two language keys with the sandbox each names: where
 * it runs now (or that it is blocked) and where it runs once adopted. Null for runtimes without the sandbox
 * selection, or where no tool code runs at all.
 */
export function adoptionChange(
  selection: SandboxSelection | null | undefined,
): { now: { key: string; backend: string }; after: { key: string; backend: string } } | null {
  if (!selection || !selection.user_authored) return null;
  return {
    now:
      selection.blocked || !selection.untrusted
        ? { key: "tools.adopt.change.nowBlocked", backend: "" }
        : { key: "tools.adopt.change.nowIsolated", backend: selection.untrusted },
    after: { key: "tools.adopt.change.after", backend: selection.user_authored },
  };
}

/** The "what changes" lines of the dialog. */
function AdoptionChange() {
  const { t } = useTranslation();
  const settings = useSettings();
  const change = adoptionChange(settings.data?.sandbox_selection);
  if (!change) return null;
  const name = (backend: string) => t(`settings.sandbox.backend.${backend}`, { defaultValue: backend });
  return (
    <div className="stack-sm" data-testid="tool-adopt-change">
      <span className="nd-field-label">{t("tools.adopt.change.title")}</span>
      <ul className="plain-list stack-sm small">
        <li data-testid="tool-adopt-now">{t(change.now.key, { backend: name(change.now.backend) })}</li>
        <li data-testid="tool-adopt-after">{t(change.after.key, { backend: name(change.after.backend) })}</li>
      </ul>
    </div>
  );
}

/** The button and the confirmation dialog; renders nothing where adoption is not possible. */
export function AdoptTool({ tool }: { tool: ToolInfo }) {
  const { t } = useTranslation();
  const access = useAccess();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  // The hash of exactly what the dialog shows: taken when it opens, so a refetch cannot change what is confirmed.
  const [shown, setShown] = useState<ToolInfo | null>(null);
  const adopt = useMutation({
    mutationFn: (item: ToolInfo) => api.adoptTool(item.name, item.content_hash ?? ""),
    onSuccess: (adopted) => {
      void queryClient.invalidateQueries({ queryKey: keys.tools });
      toast.success(t("tools.adopt.adopted", { name: adopted.name }));
      setOpen(false);
    },
  });
  if (!canAdopt(tool, access.profile, access.can("admin"))) return null;
  const close = () => {
    setOpen(false);
    setConfirmed(false);
    adopt.reset();
  };
  const item = shown ?? tool;
  return (
    <>
      <div>
        <Button
          icon={UserCheck}
          onClick={() => {
            setShown(tool);
            setConfirmed(false);
            setOpen(true);
          }}
          data-testid="tool-adopt"
        >
          {t("tools.adopt.button")}
        </Button>
      </div>
      <Modal
        title={t("tools.adopt.title", { name: item.name })}
        open={open}
        onClose={close}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={close} data-autofocus>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              icon={UserCheck}
              disabled={!confirmed}
              busy={adopt.isPending}
              onClick={() => adopt.mutate(item)}
              data-testid="tool-adopt-confirm"
            >
              {t("tools.adopt.confirm")}
            </Button>
          </>
        }
      >
        <div className="stack">
          <Callout tone="danger">
            <ShieldAlert size={14} aria-hidden /> {t("tools.adopt.warning")}
          </Callout>
          <AdoptionChange />
          <p>{t("tools.adopt.intro", { version: item.version })}</p>
          <Field label={t("tools.codeOfTool")}>
            <CodeEditor value={item.code ?? ""} readOnly ariaLabel={t("tools.codeOfTool")} />
          </Field>
          <Field label={t("tools.testsOfTool")}>
            <CodeEditor value={item.tests ?? ""} readOnly minHeight="80px" ariaLabel={t("tools.testsOfTool")} />
          </Field>
          <p className="muted small">{t("tools.adopt.revocation")}</p>
          <label className="adopt-confirm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              data-testid="tool-adopt-check"
            />
            <span>{t("tools.adopt.confirmText")}</span>
          </label>
          {adopt.error ? (
            <Callout tone="danger">
              <ErrorText error={adopt.error} />
            </Callout>
          ) : null}
        </div>
      </Modal>
    </>
  );
}

/** The trust note of an adopted tool: who adopted it when, and what ends the adoption. */
export function AdoptedNote({ tool }: { tool: ToolInfo }) {
  const { t } = useTranslation();
  if (!tool.adoption) return null;
  return (
    <p className="muted small" data-testid="tool-trust">
      {t("tools.adopt.adoptedNote", {
        version: tool.adoption.version,
        when: relativeTime(tool.adoption.at),
      })}
    </p>
  );
}

/** Shown in the tool editor once code was pasted: pasted code counts as the person's own (it cannot be told apart). */
export function PastedCodeWarning({ pasted }: { pasted: boolean }) {
  const { t } = useTranslation();
  if (!pasted) return <p className="muted small">{t("tools.write.ownCodeNote")}</p>;
  return (
    <div data-testid="tool-pasted-warning">
      <Callout tone="warning">
        <ShieldAlert size={14} aria-hidden /> {t("tools.write.pastedWarning")}
      </Callout>
    </div>
  );
}
