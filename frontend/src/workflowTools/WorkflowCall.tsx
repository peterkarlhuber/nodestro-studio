// A workflow tool's call in a conversation's answer (N-20; API ``tool_calls[].workflow``): the workflow in its fixed
// version, its run and status, the approval steps and tool approvals its run tree waits for (as cards in the answer,
// decided with the run routes) and its result files. The answer's ``result_files`` are its attachments.

import { ApprovalCard as SharedApprovalCard, type ApprovalDecision } from "@nodestro/ui-ai";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileText, Workflow as WorkflowIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import type { AnswerFile, WorkflowApprovalCard, WorkflowCallView, WorkflowToolApprovalCard } from "../api/conversations";
import { keys, useApprovals, useToolApprovals, useWorkflows } from "../api/hooks";
import type { RunStatus } from "../api/types";
import { StatusBadge } from "../components/ui";
import { toast } from "../components/toast";
import { ApprovalForm } from "../runs/ApprovalCard";
import { ToolApprovalForm } from "../runs/ToolApprovalCard";
import { ErrorText, ProblemText } from "../lib/errors";
import { formatBytes, formatCost } from "../lib/format";
import { FixedVersion, workflowName } from "./effect";

const RUN_STATUSES: ReadonlySet<string> = new Set(["queued", "running", "paused", "succeeded", "failed", "cancelled"]);

/** The files of an answer or a call, each a download of its run. */
export function AnswerFiles({ files, label, testId }: { files: AnswerFile[]; label: string; testId: string }) {
  if (!files.length) return null;
  return (
    <ul className="conversation__attachments" aria-label={label} data-testid={testId}>
      {files.map((item) => (
        <li key={`${item.run_id}/${item.file_id}`} className="chat-context__item">
          <FileText size={13} aria-hidden />
          <a href={api.resultFileUrl(item.run_id, item.file_id)} download={item.name} data-testid="answer-file-link">
            {item.name}
          </a>
          <span className="muted small">
            {item.format ? `${item.format.toUpperCase()} · ` : ""}
            {formatBytes(item.size)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * An approval step inside the workflow's run. The approvals list (``GET /approvals``) has the whole card when it lists
 * the step (results to review, note to the agent); otherwise the conversation's card is decided here with what it
 * carries (label, instructions, comment).
 */
function StepApproval({ card }: { card: WorkflowApprovalCard }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const approvals = useApprovals();
  const listed = approvals.data?.find((item) => item.run_id === card.run_id && item.node_id === card.node_id);
  const decide = useMutation({
    mutationFn: ({ decision, comment }: { decision: "approved" | "rejected"; comment: string }) =>
      api.decideApproval(card.run_id, card.node_id, decision, comment),
    onSuccess: (_run, { decision }) => {
      toast.success(decision === "approved" ? t("approvals.approvedToast") : t("approvals.rejectedToast"));
      void queryClient.invalidateQueries({ queryKey: keys.approvals });
      void queryClient.invalidateQueries({ queryKey: ["agent-conversations"] });
    },
  });
  if (listed) return <ApprovalForm approval={listed} />;
  const send = (decision: "approved" | "rejected") => (choice: ApprovalDecision) => decide.mutate({ decision, comment: choice.comment });
  return (
    <div data-testid="workflow-step-approval">
      <SharedApprovalCard
        kind="step"
        title={card.label || card.node_id}
        instructions={card.instructions || undefined}
        allowComment
        rejectHint={t("workflowTools.call.stepRejectHint")}
        error={decide.error ? <ErrorText error={decide.error} /> : null}
        pending={decide.isPending ? (decide.variables?.decision === "approved" ? "approve" : "reject") : null}
        onApprove={send("approved")}
        onReject={send("rejected")}
      >
        <p className="muted small">{t("workflowTools.call.stepWaiting")}</p>
      </SharedApprovalCard>
    </div>
  );
}

/** A tool call inside the workflow's run that waits: the tool approval card once the open requests list it. */
function InnerToolApproval({ card }: { card: WorkflowToolApprovalCard }) {
  const { t } = useTranslation();
  const requests = useToolApprovals();
  const request = requests.data?.find((item) => item.id === card.request_id && item.status === "pending");
  if (request) return <ToolApprovalForm request={request} />;
  return (
    <p className="small" data-testid="workflow-tool-inner-waiting">
      {t("workflowTools.call.toolWaiting", { tool: card.tool })} <Link to="/approvals">{t("workflowTools.call.openApprovals")}</Link>
    </p>
  );
}

/** The workflow part of one tool call: always visible below the call's row, so its cards can be decided. */
export function WorkflowCallPanel({ call, final, attached }: { call: WorkflowCallView; final: boolean; attached: boolean }) {
  const { t } = useTranslation();
  const workflows = useWorkflows();
  const name = workflowName(workflows.data, call.workflow_id);
  const waiting = !final && (call.approvals.length > 0 || call.tool_approvals.length > 0);
  return (
    <section
      className="workflow-call"
      aria-label={t("workflowTools.call.label", { name, version: call.version })}
      data-testid="workflow-call"
      data-status={call.status}
    >
      <div className="workflow-call__head row-gap">
        <WorkflowIcon size={13} aria-hidden />
        <strong>{name}</strong>
        <FixedVersion version={call.version} />
        {RUN_STATUSES.has(call.status) ? <StatusBadge status={call.status as RunStatus} /> : <span className="small muted">{call.status}</span>}
        {call.cost_usd != null ? <span className="small muted">{t("conversations.cost", { cost: formatCost(call.cost_usd) })}</span> : null}
        <Link className="small" to={`/executions/${encodeURIComponent(call.run_id)}`}>
          {t("workflowTools.call.openRun")} <ExternalLink size={11} aria-hidden />
        </Link>
      </div>
      {call.error ? (
        <p className="small text-danger" role="alert">
          <ProblemText item={call.error} />
        </p>
      ) : null}
      {waiting ? (
        <div className="stack-sm" role="group" aria-label={t("workflowTools.call.waiting")}>
          <strong className="small">{t("workflowTools.call.waiting")}</strong>
          {call.approvals.map((card) => (
            <StepApproval key={`${card.run_id}/${card.node_id}`} card={card} />
          ))}
          {call.tool_approvals.map((card) => (
            <InnerToolApproval key={card.request_id} card={card} />
          ))}
        </div>
      ) : null}
      {/* The answer lists the files as its attachments; the call only names them then (no second download). */}
      {attached && call.files.length ? (
        <p className="small muted" data-testid="workflow-call-files-attached">
          {t("workflowTools.call.filesAttached", { count: call.files.length, names: call.files.map((item) => item.name).join(", ") })}
        </p>
      ) : (
        <AnswerFiles files={call.files} label={t("workflowTools.call.files")} testId="workflow-call-files" />
      )}
    </section>
  );
}
