// A tool call that waits for a person (per-call approvals): the tool, what it may do, the exact arguments it
// will be sent, the time left, an optional comment, and approve or reject. Nothing is approved automatically;
// a question nobody answers in time counts as rejected, and a decision about a changed call is refused.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ShieldQuestion, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ApiError, api } from "../api/client";
import { keys, useToolApprovals } from "../api/hooks";
import type { Run, ToolApprovalRequest, ToolCallApproval } from "../api/types";
import { Badge, Button, Callout, Field, HelpTip, TextArea } from "../components/ui";
import { toast } from "../components/toast";
import { ErrorText, problemText } from "../lib/errors";
import { formatDate } from "../lib/format";

/** Seconds until ``deadline`` (negative once it passed), updated every second. */
export function useSecondsLeft(deadline: string): number {
  const [at, setAt] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setAt(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return Math.floor((new Date(deadline).getTime() - at) / 1000);
}

export function formatCountdown(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, "0")}`;
}

/** Codes of a decision that came too late or about another call: the list is reloaded to show what is current. */
const CONFLICTS = new Set(["tool.approval_stale", "tool.approval_expired", "tool.approval_decided"]);

export function ToolApprovalForm({ request, showContext = false }: { request: ToolApprovalRequest; showContext?: boolean }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const secondsLeft = useSecondsLeft(request.deadline);
  const expired = secondsLeft <= 0;
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: keys.toolApprovals });
    void queryClient.invalidateQueries({ queryKey: keys.run(request.run_id) });
  };
  const decide = useMutation({
    mutationFn: (decision: "approved" | "rejected") =>
      api.decideToolApproval(request.run_id, request.id, decision, request.arguments_hash, comment),
    onSuccess: (_answer, decision) => {
      toast.success(decision === "approved" ? t("approvals.tool.approvedToast") : t("approvals.tool.rejectedToast"));
      refresh();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code && CONFLICTS.has(error.code)) refresh();
    },
  });
  const { access, reach } = request.capability;
  return (
    <section className="approval-card" aria-label={t("approvals.tool.cardLabel", { name: request.tool })} data-testid="tool-approval">
      <header className="approval-card__head">
        <ShieldQuestion size={15} aria-hidden />
        <div>
          <strong>{t("approvals.tool.title", { name: request.tool })}</strong>
          <div className="muted small">
            {showContext ? (
              <>
                <Link to={`/executions/${request.run_id}`}>{t("approvals.tool.inRun", { node: request.node_id })}</Link>
                {" · "}
              </>
            ) : null}
            {t("approvals.waitingSince", { time: formatDate(request.requested_at) })}
          </div>
        </div>
        <HelpTip id="tools.callApproval" label={t("approvals.tool.help")} />
      </header>
      <div className="row-gap">
        <Badge tone={access === "destructive" ? "danger" : access === "write" ? "warning" : "idle"}>
          {t(`approvals.tool.access.${access}`, { defaultValue: access })}
        </Badge>
        <Badge tone={reach === "external" ? "warning" : "idle"}>{t(`approvals.tool.reach.${reach}`, { defaultValue: reach })}</Badge>
        {request.capability.source === "default" ? <Badge tone="idle">{t("approvals.tool.capabilityUnknown")}</Badge> : null}
      </div>
      <span className="nd-field-label">{t("approvals.tool.arguments")}</span>
      <pre className="code-block" data-testid="tool-approval-arguments">
        {JSON.stringify(request.input, null, 2)}
      </pre>
      <p className={`small ${expired ? "text-danger" : "muted"}`} data-testid="tool-approval-deadline">
        {expired ? t("approvals.tool.expired") : t("approvals.tool.timeLeft", { time: formatCountdown(secondsLeft) })}
      </p>
      <Field label={t("approvals.comment")} hint={t("approvals.tool.commentHint")}>
        <TextArea rows={2} value={comment} maxLength={4000} onChange={(e) => setComment(e.target.value)} />
      </Field>
      <p className="muted small">{t("approvals.tool.rejectHint")}</p>
      {decide.error ? (
        <Callout tone="danger">
          <ErrorText error={decide.error} />
        </Callout>
      ) : null}
      <div className="row-gap">
        <Button
          variant="primary"
          icon={Check}
          busy={decide.isPending && decide.variables === "approved"}
          disabled={decide.isPending || expired}
          onClick={() => decide.mutate("approved")}
        >
          {t("approvals.tool.approve")}
        </Button>
        <Button
          variant="danger"
          icon={X}
          busy={decide.isPending && decide.variables === "rejected"}
          disabled={decide.isPending || expired}
          onClick={() => decide.mutate("rejected")}
        >
          {t("approvals.reject")}
        </Button>
      </div>
    </section>
  );
}

/** The open tool approvals of a running run (shown while it waits; the run itself stays "running"). */
export function RunToolApprovals({ run }: { run: Run }) {
  const { t } = useTranslation();
  const approvals = useToolApprovals();
  const waiting = (approvals.data ?? []).filter((item) => item.run_id === run.id && item.status === "pending");
  if (!waiting.length) return null;
  return (
    <Callout tone="warning">
      <strong>{t("approvals.tool.runWaiting")}</strong>
      {waiting.map((item) => (
        <ToolApprovalForm key={item.id} request={item} />
      ))}
    </Callout>
  );
}

/** The open tool approvals of one running step. */
export function NodeToolApprovals({ runId, nodeId }: { runId: string; nodeId: string }) {
  const approvals = useToolApprovals();
  const waiting = (approvals.data ?? []).filter((item) => item.run_id === runId && item.node_id === nodeId && item.status === "pending");
  return (
    <>
      {waiting.map((item) => (
        <ToolApprovalForm key={item.id} request={item} />
      ))}
    </>
  );
}

/** One line on what the approval rules did with a recorded call. */
export function ToolCallApprovalNote({ approval }: { approval: ToolCallApproval }) {
  const { t } = useTranslation();
  if (approval.status === "allowed" && !approval.pre_grant_id) return null;
  const parts = [t(`approvals.tool.status.${approval.status}`)];
  if (approval.pre_grant_id) parts.push(t("approvals.tool.preGranted"));
  if (approval.decided_by) parts.push(t("approvals.tool.decidedBy", { name: approval.decided_by, time: formatDate(approval.decided_at) }));
  if (approval.status === "denied" && approval.code) parts.push(problemText(t, { code: approval.code }));
  return (
    <p className="muted small" data-testid="tool-call-approval">
      {[...parts, ...(approval.comment ? [t("approvals.tool.comment", { comment: approval.comment })] : [])].join(" · ")}
    </p>
  );
}
