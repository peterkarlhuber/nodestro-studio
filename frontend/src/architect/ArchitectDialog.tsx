import { useQueryClient } from "@tanstack/react-query";
import { Ban, Check, FilePlus2, PencilRuler, RotateCcw, Send, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { keys, useSettings } from "../api/hooks";
import type { ArchitectJob, ArchitectMode, ToolDraft, WorkflowIn } from "../api/types";
import { toast } from "../components/toast";
import { Button, Callout, Field, Hint, Modal, Segmented, TextArea, Toggle } from "../components/ui";
import { currentLanguage } from "../i18n";
import { ErrorText, ProblemText } from "../lib/errors";
import { formatCost } from "../lib/format";
import { ArchitectProgress, CostMeter } from "./ArchitectProgress";
import { ArchitectReview } from "./ArchitectReview";
import { graphDiffers } from "./draftDiff";
import { useArchitectJob } from "./useArchitectJob";

/** The editor's workflow at this moment, for revising it (unsaved changes included). */
export interface EditorWorkflow {
  workflow: WorkflowIn;
  workflowId: string;
  dirty: boolean;
}

export interface ArchitectStart {
  mode?: ArchitectMode;
  description?: string;
  name?: string;
  generateTools?: boolean;
  /** Start at once (the description was written in another dialog). */
  autoStart?: boolean;
}

/** Shared options of a job: tool drafts on/off, and the cost limit from the settings. */
export function ArchitectOptions({
  generateTools,
  onGenerateTools,
}: {
  generateTools: boolean;
  onGenerateTools: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  const settings = useSettings();
  const limit = settings.data?.architect_budget_usd;
  return (
    <div className="stack-sm">
      <Toggle
        checked={generateTools}
        onChange={onGenerateTools}
        label={t("architect.form.generateTools")}
        description={t("architect.form.generateToolsHint")}
        tip="architect.generateTools"
      />
      <p className="muted small">
        <Trans
          i18nKey={limit === null || limit === undefined ? "architect.form.noLimit" : "architect.form.limit"}
          values={{ limit: formatCost(limit ?? 0) }}
          components={{ a: <Link to="/settings" /> }}
        />
      </p>
    </div>
  );
}

/**
 * The Workflow Architect: describe → watch it work → review → accept or discard.
 * The same dialog serves "create with AI" on the workflow page and both modes in the editor.
 */
export function ArchitectDialog({
  open,
  onClose,
  modes,
  start,
  current,
  onCreated,
  onRevision,
}: {
  open: boolean;
  onClose: () => void;
  modes: ArchitectMode[];
  start?: ArchitectStart;
  current?: () => EditorWorkflow;
  onCreated: (workflowId: string) => void;
  onRevision?: (job: ArchitectJob, saveFirst: boolean) => Promise<boolean>;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<ArchitectMode>(modes[0]);
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [generateTools, setGenerateTools] = useState(true);
  const [answer, setAnswer] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useArchitectJob(jobId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [draftName, setDraftName] = useState("");
  const [saveFirst, setSaveFirst] = useState(true);
  const [confirmClose, setConfirmClose] = useState(false);

  const launch = async (
    overrides: {
      clarification?: { question: string; answer: string };
      skip?: boolean;
      text?: string;
      jobMode?: ArchitectMode;
      workflowName?: string;
      tools?: boolean;
    } = {},
  ) => {
    const jobMode = overrides.jobMode ?? mode;
    const text = (overrides.text ?? description).trim();
    if (!text) return;
    const editor = jobMode === "revise" ? current?.() : undefined;
    setBusy(true);
    setError(null);
    try {
      const started = await api.startArchitect({
        mode: jobMode,
        description: text,
        name: (overrides.workflowName ?? name).trim(),
        workflow: editor?.workflow ?? null,
        workflow_id: editor?.workflowId ?? null,
        language: currentLanguage(),
        clarifications: overrides.clarification ? [overrides.clarification] : [],
        skip_questions: overrides.skip ?? false,
        generate_tools: overrides.tools ?? generateTools,
      });
      setJob(started);
      setJobId(started.id);
      setConfirmClose(false);
      setAnswer("");
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  };

  // Every opening starts fresh; an opening with autoStart begins at once.
  useEffect(() => {
    if (!open) return;
    const initialMode = start?.mode && modes.includes(start.mode) ? start.mode : modes[0];
    setMode(initialMode);
    setDescription(start?.description ?? "");
    setName(start?.name ?? "");
    setGenerateTools(start?.generateTools ?? true);
    setJobId(null);
    setJob(null);
    setError(null);
    setConfirmClose(false);
    setSaveFirst(true);
    if (start?.autoStart && start.description?.trim())
      void launch({
        text: start.description,
        jobMode: initialMode,
        workflowName: start.name ?? "",
        tools: start.generateTools ?? true,
      });
    // Only on opening; ``launch`` reads the values set here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (job?.status === "ready" && job.draft) setDraftName((value) => value || job.draft!.name);
  }, [job?.status, job?.draft]);

  const status = job?.status ?? null;
  const stage = !job
    ? "form"
    : status === "running"
      ? "progress"
      : status === "needs_input"
        ? "question"
        : status === "ready"
          ? "review"
          : "ended";

  const cancel = async () => {
    if (!jobId) return;
    try {
      setJob(await api.cancelArchitect(jobId));
    } catch (failure) {
      toast.error(failure);
    }
  };

  const discard = async () => {
    if (jobId && job && status !== "accepted") await api.discardArchitect(jobId).catch(() => undefined);
    void queryClient.invalidateQueries({ queryKey: keys.toolDrafts });
  };

  const close = () => {
    if (stage === "progress") {
      void cancel();
      onClose();
      return;
    }
    if (stage === "review" && !confirmClose) {
      setConfirmClose(true);
      return;
    }
    void discard();
    onClose();
  };

  const backToForm = () => {
    void discard();
    setJobId(null);
    setJob(null);
  };

  const accept = async () => {
    if (!job || !jobId) return;
    setBusy(true);
    try {
      if (job.mode === "create") {
        const accepted = await api.acceptArchitect(jobId, draftName.trim());
        void queryClient.invalidateQueries({ queryKey: keys.workflows });
        toast.success(
          t("architect.accept.created", {
            name: draftName.trim() || job.draft?.name || "",
          }),
        );
        onClose();
        onCreated(accepted.result_workflow_id!);
      } else if (onRevision) {
        const applied = await onRevision(job, saveFirst);
        if (!applied) return;
        await api.acceptArchitect(jobId).catch(() => undefined);
        onClose();
      }
    } catch (failure) {
      toast.error(failure);
    } finally {
      setBusy(false);
    }
  };

  const onTool = (toolName: string, draft: ToolDraft | null) =>
    setJob((value) =>
      value
        ? {
            ...value,
            tool_drafts: draft
              ? value.tool_drafts.map((item) => (item.name === toolName ? draft : item))
              : value.tool_drafts.filter((item) => item.name !== toolName),
          }
        : value,
    );

  const editorNow = current?.();
  const changedMeanwhile = Boolean(job?.mode === "revise" && job.base && editorNow && graphDiffers(job.base, editorNow.workflow));

  const footer = (() => {
    switch (stage) {
      case "form":
        return (
          <>
            <Button variant="ghost" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" icon={Sparkles} busy={busy} disabled={!description.trim()} onClick={() => void launch()}>
              {mode === "create" ? t("architect.form.startCreate") : t("architect.form.startRevise")}
            </Button>
          </>
        );
      case "progress":
        return (
          <Hint id="architect.cancel">
            <Button variant="danger" icon={Ban} onClick={() => void cancel()}>
              {t("architect.progress.cancel")}
            </Button>
          </Hint>
        );
      case "question":
        return (
          <>
            <Button variant="ghost" onClick={close}>
              {t("common.cancel")}
            </Button>
            <Button busy={busy} onClick={() => void launch({ skip: true })}>
              {t("architect.question.skip")}
            </Button>
            <Button
              variant="primary"
              icon={Send}
              busy={busy}
              disabled={!answer.trim()}
              onClick={() =>
                void launch({
                  clarification: {
                    question: job?.question ?? "",
                    answer: answer.trim(),
                  },
                })
              }
            >
              {t("architect.question.answer")}
            </Button>
          </>
        );
      case "review":
        return confirmClose ? (
          <>
            <span className="modal__foot-text">{t("architect.review.confirmDiscard")}</span>
            <Button variant="ghost" onClick={() => setConfirmClose(false)}>
              {t("architect.review.keepReviewing")}
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => {
                void discard();
                onClose();
              }}
            >
              {t("architect.review.discard")}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" icon={Trash2} onClick={() => setConfirmClose(true)}>
              {t("architect.review.discard")}
            </Button>
            <Button variant="ghost" icon={RotateCcw} onClick={backToForm}>
              {t("architect.review.refine")}
            </Button>
            <Hint id={job?.mode === "revise" ? "architect.applyRevision" : "architect.acceptCreate"}>
              <Button variant="primary" icon={Check} busy={busy} onClick={() => void accept()}>
                {job?.mode === "revise" ? t("architect.accept.apply") : t("architect.accept.create")}
              </Button>
            </Hint>
          </>
        );
      default:
        return (
          <>
            <Button variant="ghost" onClick={close}>
              {t("common.close")}
            </Button>
            <Button variant="primary" icon={RotateCcw} onClick={backToForm}>
              {t("architect.ended.retry")}
            </Button>
          </>
        );
    }
  })();

  return (
    <Modal title={t("architect.title")} open={open} onClose={close} xl footer={footer}>
      <div className="architect" data-testid="architect-dialog" data-stage={stage}>
        {stage === "form" ? (
          <div className="stack">
            {modes.length > 1 ? (
              <div className="architect-modes">
                <Segmented
                  value={mode}
                  onChange={setMode}
                  label={t("architect.form.mode")}
                  options={modes.map((item) => ({
                    value: item,
                    label: t(`architect.mode.${item}`),
                    icon: item === "create" ? FilePlus2 : PencilRuler,
                  }))}
                />
                <p className="muted small">{t(`architect.form.modeHint.${mode}`)}</p>
              </div>
            ) : (
              <p className="muted">{t("architect.form.intro")}</p>
            )}
            <Field
              label={mode === "create" ? t("architect.form.describe") : t("architect.form.instruction")}
              hint={t(`architect.form.hint.${mode}`)}
              htmlFor="architect-description"
            >
              <TextArea
                id="architect-description"
                rows={6}
                autoFocus
                value={description}
                placeholder={t(`architect.form.placeholder.${mode}`)}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
            {mode === "revise" && current?.().dirty ? <Callout tone="info">{t("architect.form.unsavedIncluded")}</Callout> : null}
            <ArchitectOptions generateTools={generateTools} onGenerateTools={setGenerateTools} />
            <Callout tone="brand">{t("architect.form.safety")}</Callout>
            {error ? (
              <Callout tone="danger">
                <ErrorText error={error} />
              </Callout>
            ) : null}
          </div>
        ) : null}
        {stage === "progress" && job ? <ArchitectProgress job={job} /> : null}
        {stage === "question" && job ? (
          <div className="stack">
            <Callout tone="warning">
              <strong>{t("architect.question.title")}</strong> {job.question}
            </Callout>
            <p className="muted small">{t("architect.question.hint")}</p>
            <Field label={t("architect.question.yourAnswer")} htmlFor="architect-answer">
              <TextArea id="architect-answer" rows={4} autoFocus value={answer} onChange={(event) => setAnswer(event.target.value)} />
            </Field>
            <CostMeter job={job} />
            {error ? (
              <Callout tone="danger">
                <ErrorText error={error} />
              </Callout>
            ) : null}
          </div>
        ) : null}
        {stage === "review" && job?.draft ? (
          <ArchitectReview
            job={job}
            name={draftName}
            onName={setDraftName}
            onTool={onTool}
            extra={
              job.mode === "revise" ? (
                <div className="stack-sm">
                  <Callout tone="info">{t("architect.review.reviseNote")}</Callout>
                  {changedMeanwhile ? <Callout tone="warning">{t("architect.review.changedMeanwhile")}</Callout> : null}
                  {editorNow?.dirty ? (
                    <Toggle
                      checked={saveFirst}
                      onChange={setSaveFirst}
                      label={t("architect.review.saveFirst")}
                      description={t("architect.review.saveFirstHint")}
                      tip="architect.saveFirst"
                    />
                  ) : null}
                </div>
              ) : (
                <Callout tone="info">{t("architect.review.createNote")}</Callout>
              )
            }
          />
        ) : null}
        {stage === "ended" && job ? (
          <div className="stack">
            {job.status === "cancelled" ? (
              <Callout tone="info">{t("architect.ended.cancelled")}</Callout>
            ) : (
              <Callout tone="danger">
                {t("architect.ended.failed")} {job.error ? <ProblemText item={job.error} /> : null}
              </Callout>
            )}
            <p className="muted small">
              {t("architect.ended.cost", {
                cost: formatCost(job.usage.estimated_cost_usd),
              })}
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
