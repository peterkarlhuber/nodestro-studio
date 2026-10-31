// A pending approval: what the person reviews, an optional comment, and approve or reject.
// Nothing is ever approved automatically; the run waits until someone decides here.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Hand, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { keys, useApprovals } from "../api/hooks";
import type { PendingApproval, Run } from "../api/types";
import { Output } from "../components/Markdown";
import { Button, Callout, Field, HelpTip, Section, TextArea } from "../components/ui";
import { toast } from "../components/toast";
import { useEditor } from "../editor/store";
import { ErrorText } from "../lib/errors";
import { formatDate } from "../lib/format";

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
  const decide = useMutation({
    mutationFn: (decision: "approved" | "rejected") =>
      api.decideApproval(approval.run_id, approval.node_id, decision, comment),
    onSuccess: (run: Run, decision) => {
      toast.success(decision === "approved" ? t("approvals.approvedToast") : t("approvals.rejectedToast"));
      // The editor follows the run again once it continues.
      const editor = useEditor.getState();
      if (editor.run?.id === run.id) editor.setRun(run);
      void queryClient.invalidateQueries({ queryKey: keys.approvals });
      void queryClient.invalidateQueries({ queryKey: ["runs"] });
      void queryClient.invalidateQueries({ queryKey: keys.run(run.id) });
      void queryClient.invalidateQueries({ queryKey: keys.run(approval.run_id) });
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
    <section className="approval-card" aria-label={t("approvals.cardLabel", { name: approval.label })}>
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
              <Output value={item.value} />
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
      <div className="row-gap">
        <Button variant="primary" icon={Check} busy={decide.isPending && decide.variables === "approved"} disabled={decide.isPending} onClick={() => decide.mutate("approved")}>
          {t("approvals.approve")}
        </Button>
        <Button
          variant="danger"
          icon={X}
          busy={decide.isPending && decide.variables === "rejected"}
          disabled={decide.isPending || commentMissing}
          title={commentMissing ? t("approvals.commentFirst") : undefined}
          onClick={() => decide.mutate("rejected")}
        >
          {t("approvals.reject")}
        </Button>
      </div>
    </section>
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
