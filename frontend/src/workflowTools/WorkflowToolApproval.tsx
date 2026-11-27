// The approval card of a workflow tool's start (N-20, S-2): an agent wants to start a saved workflow in its fixed
// version. The card names the workflow and the version, shows the arguments as the model sent them (as a list and as
// the exact JSON), what the workflow may do as a whole (access and reach at every depth, with the workflows inside)
// and the time left. A workflow tool that may change something is asked before every start: the decision holds for
// this start only and is never remembered as a grant or a deny (the runtime refuses pre-grants for it as well).
// The card is the shared package's (@nodestro/ui-ai ApprovalCard); the decision uses the tool approval route.

import { ApprovalCard, type ApprovalDecision } from "@nodestro/ui-ai";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ApiError, api } from "../api/client";
import { keys } from "../api/hooks";
import type { Run, ToolApprovalRequest, WorkflowToolConfig } from "../api/types";
import { HelpTip } from "../components/Tooltip";
import { toast } from "../components/toast";
import { ErrorText } from "../lib/errors";
import { formatDate } from "../lib/format";
import { ToolApprovalContext, useSecondsLeft } from "../runs/ToolApprovalCard";
import { ArgumentList, EffectDetails, FixedVersion } from "./effect";

/** Codes of a decision that came too late or about another call: the list is reloaded to show what is current. */
const CONFLICTS = new Set(["tool.approval_stale", "tool.approval_expired", "tool.approval_decided"]);

/**
 * The workflow tool a request asks about, from the agent's configuration in the run (the request names only the
 * tool): ``null`` when the step has no workflow tool of that name (an ordinary tool). The version must match too.
 */
export function workflowToolOf(run: Run | undefined, request: Pick<ToolApprovalRequest, "node_id" | "tool" | "version">) {
  const node = run?.workflow.nodes.find((item) => item.id === request.node_id);
  const binding = node?.agent?.workflow_tools?.find((item) => item.name === request.tool);
  if (!binding || (request.version != null && request.version !== binding.version)) return null;
  return binding;
}

/** Whether a request may be about a workflow tool: its capability was computed from the workflow's content. */
export function mayBeWorkflowTool(request: Pick<ToolApprovalRequest, "capability">): boolean {
  return request.capability.source === "derived";
}

export function WorkflowToolApprovalForm({
  request,
  binding,
  showContext = false,
}: {
  request: ToolApprovalRequest;
  binding: WorkflowToolConfig;
  showContext?: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const workflow = useQuery({
    queryKey: keys.workflow(binding.workflow_id),
    queryFn: () => api.workflow(binding.workflow_id),
    staleTime: 60_000,
    retry: false,
  });
  const name = workflow.data?.name || binding.workflow_id;
  const secondsLeft = useSecondsLeft(request.deadline);
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: keys.toolApprovals });
    void queryClient.invalidateQueries({ queryKey: keys.run(request.run_id) });
  };
  const decide = useMutation({
    mutationFn: ({ decision, comment }: { decision: "approved" | "rejected"; comment: string }) =>
      api.decideToolApproval(request.run_id, request.id, decision, request.arguments_hash, comment),
    onSuccess: (_answer, { decision }) => {
      toast.success(decision === "approved" ? t("workflowTools.approval.startedToast") : t("approvals.tool.rejectedToast"));
      refresh();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code && CONFLICTS.has(error.code)) refresh();
    },
  });
  const pending = decide.isPending ? (decide.variables?.decision === "approved" ? "approve" : "reject") : null;
  const send = (decision: "approved" | "rejected") => (choice: ApprovalDecision) => decide.mutate({ decision, comment: choice.comment });
  return (
    <div data-testid="workflow-tool-approval" data-workflow={binding.workflow_id} data-version={binding.version}>
      <ApprovalCard
        kind="tool"
        title={t("workflowTools.approval.title", { name })}
        context={
          <>
            {showContext ? (
              <>
                <Link to={`/executions/${request.run_id}`}>
                  <ToolApprovalContext request={request} />
                </Link>
                {" · "}
              </>
            ) : null}
            {t("workflowTools.approval.asTool", { tool: request.tool })}
            {" · "}
            {t("approvals.waitingSince", { time: formatDate(request.requested_at) })}
          </>
        }
        help={<HelpTip id="tools.workflowCall" label={t("workflowTools.approval.help")} />}
        badges={<FixedVersion version={binding.version} />}
        arguments={request.input}
        secondsLeft={secondsLeft}
        allowComment
        rejectHint={t("workflowTools.approval.rejectHint")}
        error={decide.error ? <ErrorText error={decide.error} /> : null}
        pending={pending}
        onApprove={send("approved")}
        onReject={send("rejected")}
      >
        <div className="stack-sm">
          <span className="nd-field-label">{t("workflowTools.approval.argumentsList")}</span>
          <ArgumentList values={request.input} />
          <span className="nd-field-label">{t("workflowTools.effect.title")}</span>
          <EffectDetails effect={binding.effect} current={request.capability} />
          <p className="muted small" data-testid="workflow-tool-approval-once">
            {t("workflowTools.approval.everyStart")}
          </p>
        </div>
      </ApprovalCard>
    </div>
  );
}
