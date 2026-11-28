// A pending approval: what the person reviews, an optional comment (for people only), an optional note to the agent
// (the only text of the decision later agents read), and approve or reject. The card is the shared one of
// @nodestro/ui-ai (ST-068); the data, the decision and the note to the agent stay here.
// Nothing is ever approved automatically; the run waits until someone decides here.

import { ApprovalCard, type ApprovalDecision } from "@nodestro/ui-ai";
import { HelpTip } from "@nodestro/ui-core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { keys, useApprovals } from "../api/hooks";
import type { PendingApproval, Run } from "../api/types";
import { Output, outputFieldsOf, stepFieldsOf } from "../components/Markdown";
import { Callout, Field, Section, TextArea } from "../components/ui";
import { toast } from "../components/toast";
import { useEditor } from "../editor/store";
import { ErrorText } from "../lib/errors";
import { formatDate, formatNumber } from "../lib/format";
import { type StudioTextMap, StudioTexts } from "../lib/uiTexts";

/** The longest note to the agent the runtime accepts (``approval.agent_note_too_long`` beyond it). */
export const AGENT_NOTE_MAX_CHARS = 2000;

/** When the pages that show a decided run read it again (it continues a moment after the decision). */
const FOLLOW_UP_MS = [700, 2000];

/** Whether a decided approval belongs to the run ``runId`` or to one of its teams or sub-workflows. */
export function belongsTo(runId: string, approval: Pick<PendingApproval, "run_id" | "root_run_id">, answer?: Pick<Run, "id">): boolean {
  return runId === approval.run_id || runId === approval.root_run_id || runId === answer?.id;
}

/** The approval of one node, looked up among the pending ones (also inside a sub-workflow). */
export function NodeApproval({ runId, nodeId }: { runId: string; nodeId: string }) {
  const approvals = useApprovals();
  const pending = approvals.data?.find((item) => item.run_id === runId && item.node_id === nodeId);
  if (!pending) return null;
  return <ApprovalForm approval={pending} />;
}

/** The package texts of the step approval card, in the studio's words (unchanged by the move onto the package). */
export const STEP_APPROVAL_TEXTS: StudioTextMap = {
  "ai.approval.approve": "approvals.approve",
  "ai.approval.reject": "approvals.reject",
  "ai.approval.comment": "approvals.comment",
  "ai.approval.commentRequired": "approvals.commentRequired",
  "ai.approval.commentHint": "approvals.commentHint",
  "ai.approval.commentFirst": "approvals.commentFirst",
  "ai.approval.nothingToReview": "approvals.nothingToShow",
};

export function ApprovalForm({ approval, showContext = false }: { approval: PendingApproval; showContext?: boolean }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [agentNote, setAgentNote] = useState("");
  // The run's workflow names the fields of a structured result; the card works without it as well.
  const waitingRun = useQuery({ queryKey: keys.run(approval.run_id), queryFn: () => api.run(approval.run_id), staleTime: 60_000 });
  const decide = useMutation({
    mutationFn: ({ decision, comment }: { decision: "approved" | "rejected"; comment: string }) =>
      api.decideApproval(approval.run_id, approval.node_id, decision, comment, approval.allow_agent_note ? agentNote : ""),
    onSuccess: (run: Run, { decision }) => {
      toast.success(decision === "approved" ? t("approvals.approvedToast") : t("approvals.rejectedToast"));
      // The answer is the run as it was when the decision was taken (still paused: it continues right after).
      // The editor reads its run again until it continues, also when the approval belongs to a team or a
      // sub-workflow of that run (approval.run_id is then the child run).
      const editor = useEditor.getState();
      if (editor.run && belongsTo(editor.run.id, approval, run)) editor.nudgeRun();
      const refresh = () => {
        void queryClient.invalidateQueries({ queryKey: keys.approvals });
        void queryClient.invalidateQueries({ queryKey: ["runs"] });
        void queryClient.invalidateQueries({ queryKey: keys.run(run.id) });
        void queryClient.invalidateQueries({ queryKey: keys.run(approval.root_run_id) });
        void queryClient.invalidateQueries({ queryKey: keys.run(approval.run_id) });
      };
      refresh();
      // The run continues a moment after the answer; pages that show it read it once more then.
      for (const delay of FOLLOW_UP_MS) window.setTimeout(refresh, delay);
    },
  });
  const rejectHint =
    approval.on_reject === "stop"
      ? t("approvals.rejectStops")
      : approval.has_rejected_branch
        ? t("approvals.rejectBranch")
        : t("approvals.rejectEnds");
  const pending = decide.isPending ? (decide.variables?.decision === "approved" ? "approve" : "reject") : null;
  const send = (decision: "approved" | "rejected") => (choice: ApprovalDecision) => decide.mutate({ decision, comment: choice.comment });
  return (
    <StudioTexts texts={STEP_APPROVAL_TEXTS}>
      {/* The shared card (@nodestro/ui-ai), like the tool and workflow tool cards: an article, not a region landmark,
          since the approvals page lists many of them, possibly with equal names (AX-09). The name carries where each
          one waits, so they can be told apart. The person decides with the comment the card holds. */}
      <ApprovalCard
        kind="step"
        data-testid="step-approval"
        title={approval.label}
        label={t("approvals.cardLabel", {
          name: showContext
            ? [approval.label, approval.path.join(" › ") || approval.workflow_name, approval.waiting_since ? formatDate(approval.waiting_since) : ""]
                .filter(Boolean)
                .join(" · ")
            : approval.label,
        })}
        context={
          showContext ? (
            <>
              <Link to={`/executions/${approval.root_run_id}`}>{approval.path.join(" › ") || approval.workflow_name}</Link>
              {approval.waiting_since ? ` · ${t("approvals.waitingSince", { time: formatDate(approval.waiting_since) })}` : ""}
              {approval.trigger !== "manual" ? ` · ${t(`approvals.trigger.${approval.trigger}`)}` : ""}
            </>
          ) : undefined
        }
        help={<HelpTip id="flow.approval" topic={t("editor.nodes.approval")} />}
        instructions={approval.instructions || undefined}
        allowComment={approval.allow_comment}
        requireCommentOnReject={approval.require_comment_on_reject}
        extra={
          approval.allow_agent_note ? (
            <div className="approval-card__note">
              <Field label={t("approvals.agentNote")} hint={t("approvals.agentNoteHint")}>
                <TextArea
                  rows={3}
                  value={agentNote}
                  maxLength={AGENT_NOTE_MAX_CHARS}
                  onChange={(e) => setAgentNote(e.target.value)}
                  data-testid="approval-agent-note"
                />
              </Field>
              <span
                className={`small approval-card__count ${agentNote.length >= AGENT_NOTE_MAX_CHARS ? "text-warning" : "muted"}`}
                aria-live="polite"
              >
                {t("approvals.agentNoteCount", { used: formatNumber(agentNote.length), max: formatNumber(AGENT_NOTE_MAX_CHARS) })}
              </span>
            </div>
          ) : null
        }
        rejectHint={rejectHint}
        error={decide.error ? <ErrorText error={decide.error} /> : null}
        pending={pending}
        onApprove={send("approved")}
        onReject={send("rejected")}
      >
        {approval.items.length ? (
          <div className="stack-sm">
            {approval.items.map((item) => (
              <Section key={item.node_id} title={item.label} className="approval-card__item" defaultOpen={approval.items.length === 1}>
                <Output
                  value={item.value}
                  fields={outputFieldsOf(waitingRun.data?.workflow.nodes, item.node_id, item.value)}
                  steps={stepFieldsOf(waitingRun.data?.workflow.nodes, item.value)}
                />
              </Section>
            ))}
          </div>
        ) : null}
      </ApprovalCard>
    </StudioTexts>
  );
}

/** The approvals a paused run waits for, also those inside its sub-workflows. */
export function RunApprovals({ run }: { run: Run }) {
  const { t } = useTranslation();
  const approvals = useApprovals();
  const waiting = (approvals.data ?? []).filter((item) => item.root_run_id === run.id);
  return (
    <Callout tone="warning">
      <strong>{t("runs.panel.paused")}</strong>
      {waiting.map((item) => (
        <ApprovalForm key={`${item.run_id}:${item.node_id}`} approval={item} showContext={item.run_id !== run.id} />
      ))}
    </Callout>
  );
}
