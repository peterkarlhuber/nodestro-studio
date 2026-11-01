// A pending approval: what the person reviews, an optional comment, and approve or reject.
// Nothing is ever approved automatically; the run waits until someone decides here.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Hand, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { keys, useApprovals } from "../api/hooks";
import type { PendingApproval, Run } from "../api/types";
import { Output, outputFieldsOf } from "../components/Markdown";
import { Button, Callout, DisabledReason, Field, HelpTip, Section, TextArea } from "../components/ui";
import { toast } from "../components/toast";
import { useEditor } from "../editor/store";
import { ErrorText } from "../lib/errors";
import { formatDate } from "../lib/format";

/** When the pages that show a decided run read it again (it continues a moment after the decision). */
const FOLLOW_UP_MS = [700, 2000];

/** Whether a decided approval belongs to the run ``runId`` or to one of its teams or sub-workflows. */
export function belongsTo(runId: string, approval: Pick<PendingApproval, "run_id" | "root_run_id">, answer?: Pick<Run, "id">): boolean {
  return runId === approval.run_id || runId === approval.root_run_id || runId === answer?.id;
}

/** The approval of one node, looked up among the pending ones (also inside a sub-workflow). */
export function ApprovalCard({ runId, nodeId }: { runId: string; nodeId: string }) {
  const approvals = useApprovals();
  const pending = approvals.data?.find((item) => item.run_id === runId && item.node_id === nodeId);
  if (!pending) return null;
  return <ApprovalForm approval={pending} />;
}

export function ApprovalForm({ approval, showContext = false }: { approval: PendingApproval; showContext?: boolean }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  // The run's workflow names the fields of a structured result; the card works without it as well.
  const waitingRun = useQuery({ queryKey: keys.run(approval.run_id), queryFn: () => api.run(approval.run_id), staleTime: 60_000 });
  const decide = useMutation({
    mutationFn: (decision: "approved" | "rejected") =>
      api.decideApproval(approval.run_id, approval.node_id, decision, comment),
    onSuccess: (run: Run, decision) => {
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
  const commentMissing = approval.require_comment_on_reject && !comment.trim();
  const rejectHint =
    approval.on_reject === "stop"
      ? t("approvals.rejectStops")
      : approval.has_rejected_branch
        ? t("approvals.rejectBranch")
        : t("approvals.rejectEnds");
  return (
    // An article, not a region landmark: the approvals page lists many of them, possibly with equal names (AX-09).
    // The name carries where each one waits, so they can be told apart.
    <article
      className="approval-card"
      aria-label={t("approvals.cardLabel", {
        name: showContext
          ? [approval.label, approval.path.join(" › ") || approval.workflow_name, approval.waiting_since ? formatDate(approval.waiting_since) : ""]
              .filter(Boolean)
              .join(" · ")
          : approval.label,
      })}
    >
      <header className="approval-card__head">
        <Hand size={15} aria-hidden />
        <div>
          <strong>{approval.label}</strong>
          {showContext ? (
            <div className="muted small">
              <Link to={`/executions/${approval.root_run_id}`}>{approval.path.join(" › ") || approval.workflow_name}</Link>
              {approval.waiting_since ? ` · ${t("approvals.waitingSince", { time: formatDate(approval.waiting_since) })}` : ""}
              {approval.trigger !== "manual" ? ` · ${t(`approvals.trigger.${approval.trigger}`)}` : ""}
            </div>
          ) : null}
        </div>
        <HelpTip id="flow.approval" label={t("editor.nodes.approval")} />
      </header>
      {approval.instructions ? <p className="approval-card__instructions">{approval.instructions}</p> : null}
      {approval.items.length ? (
        <div className="stack-sm">
          {approval.items.map((item) => (
            <Section key={item.node_id} title={item.label} className="approval-card__item" defaultOpen={approval.items.length === 1}>
              <Output value={item.value} fields={outputFieldsOf(waitingRun.data?.workflow.nodes, item.node_id, item.value)} />
            </Section>
          ))}
        </div>
      ) : (
        <p className="muted small">{t("approvals.nothingToShow")}</p>
      )}
      {approval.allow_comment ? (
        <Field
          label={approval.require_comment_on_reject ? t("approvals.commentRequired") : t("approvals.comment")}
          hint={t("approvals.commentHint")}
        >
          <TextArea rows={3} value={comment} maxLength={4000} onChange={(e) => setComment(e.target.value)} />
        </Field>
      ) : null}
      <p className="muted small">{rejectHint}</p>
      {decide.error ? (
        <Callout tone="danger">
          <ErrorText error={decide.error} />
        </Callout>
      ) : null}
      <div className="row-gap approval-card__actions">
        <Button variant="primary" icon={Check} busy={decide.isPending && decide.variables === "approved"} disabled={decide.isPending} onClick={() => decide.mutate("approved")}>
          {t("approvals.approve")}
        </Button>
        {/* TX-10: the reason sits next to the button, not only in a native tooltip touch and keyboard users never see. */}
        <DisabledReason reason={commentMissing ? t("approvals.commentFirst") : undefined} placement="below">
          <Button
            variant="danger"
            icon={X}
            busy={decide.isPending && decide.variables === "rejected"}
            disabled={decide.isPending}
            onClick={() => decide.mutate("rejected")}
          >
            {t("approvals.reject")}
          </Button>
        </DisabledReason>
      </div>
    </article>
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
