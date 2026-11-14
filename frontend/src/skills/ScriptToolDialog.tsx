// Turning a script of a skill into a tool (NAL-B4). Nothing runs the script: a tool job starts in which the Coding
// Agent writes a tool from it, its tests run only in the isolating sandbox, and a person reviews and approves the
// tool on the Tools page before any agent can use it.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { keys } from "../api/hooks";
import { skillsApi } from "../api/skills";
import { Button, Callout, Field, Modal, TextArea } from "../components/ui";
import { ErrorText, SandboxSetupLink, codedError } from "../lib/errors";

/** Where the tool jobs are followed and approved. */
export const TOOL_JOBS_PATH = "/tools?tab=generate";

export function ScriptToolDialog({
  skillId,
  version,
  path,
  onClose,
}: {
  skillId: string;
  version: number;
  path: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const draft = useMutation({
    mutationFn: () => skillsApi.scriptDraft(skillId, version, path, note.trim()),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.toolJobs }),
  });
  const job = draft.data;
  return (
    <Modal
      open
      title={t("skills.scriptTool.title", { path })}
      onClose={onClose}
      footer={
        job ? (
          <Button variant="primary" onClick={onClose}>
            {t("common.close")}
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" icon={Sparkles} busy={draft.isPending} onClick={() => draft.mutate()}>
              {t("skills.scriptTool.submit")}
            </Button>
          </>
        )
      }
    >
      <div className="stack">
        <p>{t("skills.scriptTool.intro")}</p>
        <ol className="stack-sm" data-testid="script-tool-steps">
          <li>{t("skills.scriptTool.stepWrite")}</li>
          <li>{t("skills.scriptTool.stepTest")}</li>
          <li>{t("skills.scriptTool.stepReview")}</li>
        </ol>
        <Callout tone="info">{t("skills.scriptTool.neverRun")}</Callout>
        {job ? (
          <Callout tone="brand">
            <span className="stack-sm" data-testid="script-tool-started">
              <span>{t("skills.scriptTool.started")}</span>
              <Link to={TOOL_JOBS_PATH} onClick={onClose}>
                {t("skills.scriptTool.openJob")} <ExternalLink size={11} aria-hidden />
              </Link>
            </span>
          </Callout>
        ) : (
          <Field label={t("skills.scriptTool.note")} hint={t("skills.scriptTool.noteHint")}>
            <TextArea value={note} rows={3} onChange={(event) => setNote(event.target.value)} autoFocus />
          </Field>
        )}
        {draft.error ? (
          <Callout tone="danger">
            <span className="stack-sm" data-testid="script-tool-error">
              <ErrorText error={draft.error} />
              <SandboxSetupLink item={codedError(draft.error)} />
            </span>
          </Callout>
        ) : null}
      </div>
    </Modal>
  );
}
